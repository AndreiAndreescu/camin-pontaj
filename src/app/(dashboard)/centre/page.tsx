import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AddCenterForm } from "./add-center-form";
import { CenterRow } from "./center-row";

export default async function CentrePage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: centers } = await supabase
    .from("centers")
    .select("*")
    .eq("activ", true)
    .order("tip")
    .order("nume");

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Centre</h1>
      <p className="mt-1 text-sm text-slate-500">{centers?.length ?? 0} locații active.</p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-700">Centru / apartament nou</h2>
        <AddCenterForm />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nume</th>
              <th className="px-4 py-2 font-medium">Cod</th>
              <th className="px-4 py-2 font-medium">Tip</th>
              <th className="px-4 py-2 font-medium">Localitate</th>
              <th className="px-4 py-2 font-medium">Capacitate</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(centers ?? []).map((c) => (
              <CenterRow key={c.id} center={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
