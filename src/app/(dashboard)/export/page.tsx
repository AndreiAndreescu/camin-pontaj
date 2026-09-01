import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ExportForm } from "./export-form";

export default async function ExportPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: centers } = await supabase
    .from("centers")
    .select("id, nume")
    .eq("activ", true)
    .order("nume");

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Export — Foaie colectivă de prezență</h1>
      <p className="mt-1 text-sm text-slate-500">
        Generați foaia colectivă de prezență pentru un centru sau pentru toată asociația, gata de printat.
      </p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <ExportForm centers={centers ?? []} />
      </div>
    </div>
  );
}
