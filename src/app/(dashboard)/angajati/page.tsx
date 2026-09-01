import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AddEmployeeForm } from "./add-employee-form";
import { EmployeeRow } from "./employee-row";
import { CenterFilter } from "./center-filter";

export default async function AngajatiPage({
  searchParams,
}: {
  searchParams: Promise<{ center?: string }>;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const sp = await searchParams;

  const centersQuery =
    user.role === "admin"
      ? supabase.from("centers").select("id, nume").eq("activ", true).order("nume")
      : supabase
          .from("centers")
          .select("id, nume")
          .in("id", user.centerIds.length ? user.centerIds : ["00000000-0000-0000-0000-000000000000"])
          .order("nume");

  const { data: centers } = await centersQuery;
  const centerId = sp.center || centers?.[0]?.id;

  let employees: any[] = [];
  if (centerId) {
    const { data } = await supabase
      .from("employee_centers")
      .select("employees!inner(id, nume, functie, email, telefon, activ)")
      .eq("center_id", centerId);

    employees = (data ?? [])
      .map((r: any) => r.employees)
      .filter((e: any) => e?.activ)
      .sort((a: any, b: any) => a.nume.localeCompare(b.nume));
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Angajați</h1>

      <div className="mt-4">
        <CenterFilter centers={centers ?? []} selectedCenterId={centerId} />
      </div>

      {centerId && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-medium text-slate-700">Adaugă angajat în acest centru</h2>
          <AddEmployeeForm centerId={centerId} />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nume</th>
              <th className="px-4 py-2 font-medium">Funcție</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Telefon</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((e) => (
              <EmployeeRow key={e.id} employee={e} centerId={centerId!} />
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Niciun angajat în acest centru încă.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
