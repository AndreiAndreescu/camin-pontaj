import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysInMonth, LUNI_RO } from "@/lib/pontaj-calc";
import { TimesheetEditor } from "./editor";

export default async function EmployeeTimesheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ center?: string; an?: string; luna?: string }>;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const { employeeId } = await params;
  const sp = await searchParams;

  const centerId = sp.center;
  const now = new Date();
  const an = Number(sp.an) || now.getFullYear();
  const luna = Number(sp.luna) || now.getMonth() + 1;

  if (!centerId) notFound();
  if (user.role === "center_head" && !user.centerIds.includes(centerId)) notFound();

  const [{ data: employee }, { data: center }, { data: absenceCodes }] = await Promise.all([
    supabase.from("employees").select("id, nume, functie").eq("id", employeeId).single(),
    supabase.from("centers").select("id, nume").eq("id", centerId).single(),
    supabase.from("absence_codes").select("code, label").order("sort_order"),
  ]);

  if (!employee || !center) notFound();

  const { data: timesheet } = await supabase
    .from("timesheets")
    .select("id, status, updated_at, updated_by, timesheet_days(*)")
    .eq("center_id", centerId)
    .eq("employee_id", employeeId)
    .eq("an", an)
    .eq("luna", luna)
    .maybeSingle();

  // Numele ultimului editor: profiles nu e vizibil pentru alți utilizatori prin RLS
  // (fiecare își vede doar propriul profil, în afară de admin), așa că folosim clientul
  // cu drepturi depline doar pentru acest lookup punctual — utilizatorul curent e deja
  // verificat mai sus că are acces la acest pontaj.
  let updatedByName: string | null = null;
  if (timesheet?.updated_by) {
    try {
      const admin = createAdminClient();
      const { data: editorProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", timesheet.updated_by)
        .single();
      updatedByName = editorProfile?.full_name ?? null;
    } catch {
      // SUPABASE_SERVICE_ROLE_KEY lipsă din mediu — pur și simplu nu afișăm numele editorului.
      updatedByName = null;
    }
  }

  const totalZile = daysInMonth(an, luna);
  const existingDays = new Map(
    (timesheet?.timesheet_days ?? []).map((d: any) => [d.ziua, d])
  );

  const days = Array.from({ length: totalZile }, (_, i) => {
    const ziua = i + 1;
    const d: any = existingDays.get(ziua);
    return {
      ziua,
      oraInceput: d?.ora_inceput ?? null,
      oraSfarsit: d?.ora_sfarsit ?? null,
      oreLucrate: d?.ore_lucrate ?? null,
      oreSuplimentare: d?.ore_suplimentare ?? 0,
      oreNoapte: d?.ore_noapte ?? 0,
      oreSambata: d?.ore_sambata ?? 0,
      oreDuminica: d?.ore_duminica ?? 0,
      codAbsenta: d?.cod_absenta ?? null,
    };
  });

  return (
    <div>
      <div className="mb-4">
        <a href={`/pontaj?center=${centerId}&an=${an}&luna=${luna}`} className="text-sm text-indigo-600 hover:text-indigo-500">
          ← Înapoi la listă
        </a>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          {employee.nume} <span className="font-normal text-slate-500">— {employee.functie}</span>
        </h1>
        <p className="text-sm text-slate-500">
          {center.nume} · {LUNI_RO[luna - 1]} {an}
        </p>
      </div>

      <TimesheetEditor
        centerId={centerId}
        employeeId={employeeId}
        an={an}
        luna={luna}
        initialDays={days}
        absenceCodes={absenceCodes ?? []}
        status={(timesheet?.status as "in_lucru" | "finalizat") ?? "in_lucru"}
        canFinalize={true}
        updatedByName={updatedByName}
        updatedAt={timesheet?.updated_at ?? null}
      />
    </div>
  );
}
