import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "./create-user-form";
import { UserRow } from "./user-row";

export default async function UtilizatoriPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: centers }, { data: assignments }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").order("full_name"),
    supabase.from("centers").select("id, nume").eq("activ", true).order("nume"),
    supabase.from("profile_centers").select("profile_id, center_id"),
  ]);

  const centersByProfile = new Map<string, string[]>();
  for (const a of assignments ?? []) {
    const list = centersByProfile.get(a.profile_id) ?? [];
    list.push(a.center_id);
    centersByProfile.set(a.profile_id, list);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Utilizatori</h1>
      <p className="mt-1 text-sm text-slate-500">
        Creați conturi și alocați șefii de centru pe centrele pe care le gestionează.
      </p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-700">Cont nou</h2>
        <CreateUserForm centers={centers ?? []} />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nume</th>
              <th className="px-4 py-2 font-medium">Rol</th>
              <th className="px-4 py-2 font-medium">Centre</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(profiles ?? []).map((p) => (
              <UserRow
                key={p.id}
                profile={p}
                centers={centers ?? []}
                assignedCenterIds={centersByProfile.get(p.id) ?? []}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
