import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components ("use client").
 * Safe to call multiple times — @supabase/ssr reuses the browser session.
 *
 * Not generic-typed against Database: the hand-written types in
 * lib/types/database.ts are kept for documentation/reference, but the
 * installed @supabase/ssr + @supabase/supabase-js versions expect an exact
 * shape (produced by `supabase gen types typescript`) that hand-written
 * types don't reliably satisfy. Once the project is linked with the
 * Supabase CLI, run `supabase gen types typescript --linked > src/lib/types/database.ts`
 * and re-add `<Database>` here for full autocomplete + compile-time checks.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
