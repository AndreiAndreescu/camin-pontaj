-- Cămin Romantic — Pontaj: schema inițială
-- Rulează acest script în Supabase SQL Editor (Database > SQL Editor > New query).
-- Sigur de rulat de mai multe ori (foloseste IF NOT EXISTS / DROP ... IF EXISTS unde e cazul).

-- ============================================================
-- 1. EXTENSII
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- 2. TABELE DE BAZĂ
-- ============================================================

-- Profilul fiecărui cont (extinde auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'center_head')),
  created_at timestamptz not null default now()
);

-- Centre / apartamente
create table if not exists public.centers (
  id uuid primary key default gen_random_uuid(),
  nume text not null unique,
  cod text,
  tip text not null default 'centru' check (tip in ('centru', 'apartament')),
  cladire text,
  adresa text,
  localitate text,
  judet text,
  capacitate int,
  activ boolean not null default true,
  created_at timestamptz not null default now()
);

-- Ce centre poate gestiona un cont (un admin de centru poate fi asignat la mai multe)
create table if not exists public.profile_centers (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  center_id uuid not null references public.centers (id) on delete cascade,
  primary key (profile_id, center_id)
);

-- Angajați
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  nume text not null unique,
  functie text not null,
  email text,
  telefon text,
  este_salariat boolean not null default true,
  activ boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pe ce centre lucrează un angajat (un angajat poate fi în mai multe centre)
create table if not exists public.employee_centers (
  employee_id uuid not null references public.employees (id) on delete cascade,
  center_id uuid not null references public.centers (id) on delete cascade,
  primary key (employee_id, center_id)
);

-- Codurile legale de absență (fixe, ca în Foaia colectivă de prezență)
create table if not exists public.absence_codes (
  code text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into public.absence_codes (code, label, sort_order) values
  ('In', 'Întreruperi', 1),
  ('CO', 'Concediu de odihnă', 2),
  ('BO', 'Boală obișnuită', 3),
  ('BP', 'Boală profesională', 4),
  ('AM', 'Accident de muncă', 5),
  ('M', 'Maternitate', 6),
  ('CFP', 'Concediu fără plată / suspendare', 7),
  ('N', 'Absențe nemotivate', 8),
  ('PRM', 'Program redus de maternitate', 9),
  ('PRB', 'Program redus de boală', 10)
on conflict (code) do nothing;

-- Un pontaj = un angajat, într-un centru, într-o lună
create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers (id) on delete restrict,
  employee_id uuid not null references public.employees (id) on delete restrict,
  an int not null,
  luna int not null check (luna between 1 and 12),
  status text not null default 'in_lucru' check (status in ('in_lucru', 'finalizat')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (center_id, employee_id, an, luna)
);

-- Zilele unui pontaj
create table if not exists public.timesheet_days (
  id uuid primary key default gen_random_uuid(),
  timesheet_id uuid not null references public.timesheets (id) on delete cascade,
  ziua int not null check (ziua between 1 and 31),
  ora_inceput time,
  ora_sfarsit time,
  ore_lucrate numeric(4, 1),
  ore_suplimentare numeric(4, 1) not null default 0,
  ore_noapte numeric(4, 1) not null default 0,
  ore_sambata numeric(4, 1) not null default 0,
  ore_duminica numeric(4, 1) not null default 0,
  cod_absenta text references public.absence_codes (code),
  unique (timesheet_id, ziua)
);

-- ============================================================
-- 3. FUNCȚII AJUTĂTOARE (pentru RLS)
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.my_center_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select center_id from public.profile_centers where profile_id = auth.uid();
$$;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.centers enable row level security;
alter table public.profile_centers enable row level security;
alter table public.employees enable row level security;
alter table public.employee_centers enable row level security;
alter table public.absence_codes enable row level security;
alter table public.timesheets enable row level security;
alter table public.timesheet_days enable row level security;

-- absence_codes: oricine autentificat poate citi (e un catalog fix)
drop policy if exists "absence_codes_read" on public.absence_codes;
create policy "absence_codes_read" on public.absence_codes
  for select using (auth.role() = 'authenticated');

-- profiles: fiecare își vede propriul profil; admin le vede pe toate
drop policy if exists "profiles_read_own_or_admin" on public.profiles;
create policy "profiles_read_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- centers: admin are acces total; șeful de centru vede doar centrele lui
drop policy if exists "centers_admin_all" on public.centers;
create policy "centers_admin_all" on public.centers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "centers_read_own" on public.centers;
create policy "centers_read_own" on public.centers
  for select using (id in (select public.my_center_ids()));

-- profile_centers: doar admin editează asignările; fiecare își vede propriile asignări
drop policy if exists "profile_centers_admin_all" on public.profile_centers;
create policy "profile_centers_admin_all" on public.profile_centers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profile_centers_read_own" on public.profile_centers;
create policy "profile_centers_read_own" on public.profile_centers
  for select using (profile_id = auth.uid());

-- employees: admin acces total; șeful de centru vede/editează angajații din centrele lui
drop policy if exists "employees_admin_all" on public.employees;
create policy "employees_admin_all" on public.employees
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "employees_center_head_read" on public.employees;
create policy "employees_center_head_read" on public.employees
  for select using (
    id in (
      select employee_id from public.employee_centers
      where center_id in (select public.my_center_ids())
    )
  );

drop policy if exists "employees_center_head_insert" on public.employees;
create policy "employees_center_head_insert" on public.employees
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "employees_center_head_update" on public.employees;
create policy "employees_center_head_update" on public.employees
  for update using (
    id in (
      select employee_id from public.employee_centers
      where center_id in (select public.my_center_ids())
    )
  );

-- employee_centers: admin acces total; șeful de centru vede/adaugă legături pentru centrele lui
drop policy if exists "employee_centers_admin_all" on public.employee_centers;
create policy "employee_centers_admin_all" on public.employee_centers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "employee_centers_center_head_read" on public.employee_centers;
create policy "employee_centers_center_head_read" on public.employee_centers
  for select using (center_id in (select public.my_center_ids()));

drop policy if exists "employee_centers_center_head_insert" on public.employee_centers;
create policy "employee_centers_center_head_insert" on public.employee_centers
  for insert with check (center_id in (select public.my_center_ids()));

-- timesheets: admin acces total; șeful de centru CRUD pe pontajele centrelor lui (doar cât nu sunt finalizate, pentru update)
drop policy if exists "timesheets_admin_all" on public.timesheets;
create policy "timesheets_admin_all" on public.timesheets
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "timesheets_center_head_read" on public.timesheets;
create policy "timesheets_center_head_read" on public.timesheets
  for select using (center_id in (select public.my_center_ids()));

drop policy if exists "timesheets_center_head_insert" on public.timesheets;
create policy "timesheets_center_head_insert" on public.timesheets
  for insert with check (center_id in (select public.my_center_ids()));

drop policy if exists "timesheets_center_head_update" on public.timesheets;
create policy "timesheets_center_head_update" on public.timesheets
  for update using (
    center_id in (select public.my_center_ids()) and status = 'in_lucru'
  );

-- timesheet_days: aceleași reguli, prin părintele timesheets
drop policy if exists "timesheet_days_admin_all" on public.timesheet_days;
create policy "timesheet_days_admin_all" on public.timesheet_days
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "timesheet_days_center_head_read" on public.timesheet_days;
create policy "timesheet_days_center_head_read" on public.timesheet_days
  for select using (
    timesheet_id in (
      select id from public.timesheets where center_id in (select public.my_center_ids())
    )
  );

drop policy if exists "timesheet_days_center_head_write" on public.timesheet_days;
create policy "timesheet_days_center_head_write" on public.timesheet_days
  for all using (
    timesheet_id in (
      select id from public.timesheets
      where center_id in (select public.my_center_ids()) and status = 'in_lucru'
    )
  ) with check (
    timesheet_id in (
      select id from public.timesheets
      where center_id in (select public.my_center_ids()) and status = 'in_lucru'
    )
  );

-- ============================================================
-- 5. TRIGGER: creează automat un profil când e creat un utilizator în Auth
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'center_head')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
