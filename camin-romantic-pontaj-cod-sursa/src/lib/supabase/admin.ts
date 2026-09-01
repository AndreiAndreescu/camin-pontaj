import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client cu drepturi depline (service role), folosit DOAR în server actions,
 * DOAR pentru operații care nu pot trece prin RLS normal (ex: crearea de conturi noi).
 * Cheia SUPABASE_SERVICE_ROLE_KEY nu trebuie NICIODATĂ expusă către browser
 * (nu are prefixul NEXT_PUBLIC_ tocmai din acest motiv).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY lipsește din variabilele de mediu — necesară pentru crearea conturilor de utilizator."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
