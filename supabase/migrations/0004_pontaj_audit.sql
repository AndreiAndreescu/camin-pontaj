-- Cămin Romantic — Pontaj: audit „cine a editat" pe pontaje
-- Rulează în Supabase SQL Editor, după 0001/0002/0003.
-- Sigur de rulat de mai multe ori (foloseste IF NOT EXISTS).

alter table public.timesheets
  add column if not exists updated_by uuid references public.profiles (id) on delete set null;

-- Notă: coloana e nullable, deci pontajele salvate înainte de această migrație
-- rămân fără „editat de" — normal, nu exista informația.
