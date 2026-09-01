# Instrucțiuni lansare — Pontaj Cămin Romantic

Aplicația e gata (build-ul local trece fără erori). Mai sunt trei pași de făcut din partea ta: **GitHub Desktop**, **Supabase SQL Editor** și **Vercel** (variabile de mediu + primul cont de admin).

## 1. GitHub Desktop — urcă codul

1. Deschide GitHub Desktop și clonează (sau deschide, dacă e deja clonat) repository-ul gol `camin-romantic-pontaj`.
2. Dezarhivează fișierul **`camin-romantic-pontaj-cod-sursa.zip`** direct în folderul local al acelui repo (peste orice e deja acolo — repo-ul e gol, deci pur și simplu copiază tot conținutul arhivei în folder).
3. În GitHub Desktop ar trebui să vezi toate fișierele noi (peste 70). Scrie un mesaj de commit (ex: "Aplicație pontaj — versiune inițială") și apasă **Commit to main**, apoi **Push origin**.

Nu au fost incluse în arhivă (nu trebuie urcate pe GitHub):
- `node_modules/` — se instalează automat de Vercel din `package.json`.
- `.env.local` — conține cheile Supabase; acestea se pun separat, direct în Vercel (pasul 3), nu în cod.

## 2. Supabase — creează tabelele și datele

Mergi la proiectul tău Supabase → **SQL Editor** → rulează, **în ordine**, cele trei fișiere atașate mai jos (fiecare într-un query nou, "Run"):

1. `0001_init.sql` — creează toate tabelele, regulile de securitate (RLS) și codurile de absență standard (In, CO, BO, BP, AM, M, CFP, N, PRM, PRB).
2. `0002_seed_centers.sql` — cele 30 de centre/apartamente.
3. `0003_seed_employees.sql` — cei 181 de angajați + alocarea lor pe centre.

Toate migrațiile sunt sigure de rulat de mai multe ori (folosesc `ON CONFLICT ... DO NOTHING`), deci dacă din greșeală rulezi una de două ori nu se dublează nimic.

**Notă despre cei 8 angajați marcați "Nu este salariat"** din platforma veche: i-am inclus în baza de date (cu flagul `este_salariat = false` păstrat, pentru referință), dar deocamdată aplicația nu îi tratează diferit față de restul — apar la fel în lista de angajați. Spune-mi dacă vrei să-i exclud din pontaj sau să-i marchez altfel, și ajustez.

## 3. Vercel — variabile de mediu + deploy

1. În Vercel, **Add New Project** → alege repo-ul `camin-romantic-pontaj` de pe GitHub.
2. La **Environment Variables**, adaugă:

| Nume | Valoare |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://czexisqwralbzynuammg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cheia anon pe care mi-ai trimis-o |
| `SUPABASE_SERVICE_ROLE_KEY` | **îmi trebuie de la tine** — vezi mai jos |

3. Apasă **Deploy**.

### Îmi lipsește cheia "service role"

Pentru funcția de **Utilizatori** (crearea/alocarea conturilor pentru șefii de centru de către admin) am nevoie de cheia **service role** din Supabase: **Settings → API → Project API keys → `service_role` (secret)**. E diferită de cheia `anon` pe care mi-ai dat-o deja — aceasta din urmă e publică, cea de service role e secretă și nu trebuie pusă niciodată în cod, doar în Vercel ca variabilă de mediu server-side (așa am și construit-o).

Până o primesc, tot restul aplicației funcționează normal (pontaj, angajați, centre, export) — doar pagina „Utilizatori" (creare conturi noi) va da eroare.

## 4. Primul cont de admin

Momentan nu există niciun cont — trebuie creat manual, o singură dată, direct din Supabase (după aceea, adminul creează restul conturilor din aplicație, la pagina „Utilizatori"):

1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Completează email + parolă (contul tău, de exemplu).
3. La **User Metadata**, adaugă acest JSON:
   ```json
   { "full_name": "Andrei Andreescu", "role": "admin" }
   ```
4. Salvează. Contul de `profiles` cu rol de admin se creează automat (printr-un trigger).
5. Intră pe aplicație (adresa de pe Vercel) și autentifică-te cu acel email/parolă → vei avea acces la tot, inclusiv la „Utilizatori" ca să creezi conturile șefilor de centru.

## Ce mai poți face din aplicație, ca admin

- **Pontaj** — alegi centrul + luna, vezi lista de angajați, intri pe fiecare pentru pontajul zilnic.
- **Angajați** — adaugi/editezi/arhivezi angajați, îi asociezi la centre.
- **Centre** — adaugi/editezi/arhivezi centre.
- **Utilizatori** — creezi conturi pentru șefii de centru, le aloci unul sau mai multe centre.
- **Export** — generează pontajul în formatul exact al foii colective de prezență (pe centru sau pentru toată asociația), gata de printat/salvat ca PDF.

## Ce ar mai fi de rafinat, dacă vrei să continuăm

- Export-ul folosește momentan `window.print()` din browser (deschizi pagina de print și salvezi ca PDF din dialogul de printare) — funcționează, dar nu e un PDF generat automat pe server. Pot trece la generare server-side dacă preferi un buton „Descarcă PDF" direct.
- Tipurile TypeScript pentru Supabase sunt scrise manual momentan; după ce leg proiectul cu Supabase CLI pot genera tipurile automat din baza de date (`supabase gen types typescript --linked`) pentru verificări mai stricte la compilare — nu afectează funcționarea aplicației, doar confortul de dezvoltare pe viitor.
