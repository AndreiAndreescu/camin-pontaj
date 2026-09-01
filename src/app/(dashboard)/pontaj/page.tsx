import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LUNI_RO } from "@/lib/pontaj-calc";
import { CenterMonthPicker } from "./center-month-picker";

export default async function PontajPage({
  searchParams,
}: {
  searchParams: Promise<{ center?: string; an?: string; luna?: string }>;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;

  const now = new Date();
  const an = Number(params.an) || now.getFullYear();
  const luna = Number(params.luna) || now.getMonth() + 1;

  // Ce centre poate vedea utilizatorul
  const centersQuery =
    user.role === "admin"
      ? supabase.from("centers").select("id, nume").eq("activ", true).order("nume")
      : supabase
          .from("centers")
          .select("id, nume")
          .in("id", user.centerIds.length ? user.centerIds : ["00000000-0000-0000-0000-000000000000"])
          .order("nume");

  const { data: centers } = await centersQuery;
  const centerId = params.center || centers?.[0]?.id;

  const selectedCenter = centers?.find((c) => c.id === centerId);

  let rows: {
    employeeId: string;
    nume: string;
    functie: string;
    timesheetId: string | null;
    status: string | null;
    oreLucrate: number;
    oreNelucrate: number;
  }[] = [];

  if (centerId) {
    const { data: employees } = await supabase
      .from("employee_centers")
      .select("employee_id, employees!inner(id, nume, functie, activ)")
      .eq("center_id", centerId);

    const activeEmployees = (employees ?? [])
      .map((e: any) => e.employees)
      .filter((e: any) => e?.activ);

    const { data: timesheets } = await supabase
      .from("timesheets")
      .select("id, employee_id, status, timesheet_days(ore_lucrate, ore_suplimentare, ore_noapte, cod_absenta)")
      .eq("center_id", centerId)
      .eq("an", an)
      .eq("luna", luna);

    const byEmployee = new Map((timesheets ?? []).map((t: any) => [t.employee_id, t]));

    rows = activeEmployees
      .sort((a: any, b: any) => a.nume.localeCompare(b.nume))
      .map((e: any) => {
        const ts = byEmployee.get(e.id);
        const days = ts?.timesheet_days ?? [];
        const oreLucrate = days.reduce(
          (sum: number, d: any) => sum + (d.ore_lucrate ?? 0) + (d.ore_suplimentare ?? 0),
          0
        );
        const oreNelucrate = days.filter((d: any) => d.cod_absenta).length;
        return {
          employeeId: e.id,
          nume: e.nume,
          functie: e.functie,
          timesheetId: ts?.id ?? null,
          status: ts?.status ?? null,
          oreLucrate,
          oreNelucrate,
        };
      });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Pontaj</h1>
      </div>

      <CenterMonthPicker
        centers={centers ?? []}
        selectedCenterId={centerId}
        an={an}
        luna={luna}
      />

      {!selectedCenter ? (
        <p className="mt-6 text-sm text-slate-500">
          {user.role === "center_head"
            ? "Nu aveți niciun centru asignat. Contactați administratorul."
            : "Nu există centre active."}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nume</th>
                <th className="px-4 py-2 font-medium">Funcție</th>
                <th className="px-4 py-2 font-medium">Ore lucrate</th>
                <th className="px-4 py-2 font-medium">Zile absență</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.employeeId}>
                  <td className="px-4 py-2 text-slate-900">{r.nume}</td>
                  <td className="px-4 py-2 text-slate-600">{r.functie}</td>
                  <td className="px-4 py-2 text-slate-600">{r.oreLucrate || "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{r.oreNelucrate || "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "finalizat"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.status === "finalizat" ? "Finalizat" : "În lucru"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/pontaj/${r.employeeId}?center=${centerId}&an=${an}&luna=${luna}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Editează →
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Niciun angajat în acest centru. Adăugați angajați din pagina Angajați.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        {LUNI_RO[luna - 1]} {an}
      </p>
    </div>
  );
}
