import { createClient } from "@/lib/supabase/server";
import { daysInMonth } from "@/lib/pontaj-calc";

export interface ExportEmployeeRow {
  nume: string;
  functie: string;
  days: {
    ziua: number;
    oraInceput: string | null;
    oraSfarsit: string | null;
    oreLucrate: number | null;
    oreSuplimentare: number;
    oreNoapte: number;
    oreSambata: number;
    oreDuminica: number;
    codAbsenta: string | null;
  }[];
  totalOreLucrate: number;
  totalOreNelucrate: number;
}

export interface ExportCenterSection {
  centerName: string;
  employees: ExportEmployeeRow[];
}

export async function loadExportData({
  centerIds,
  an,
  luna,
}: {
  centerIds: string[];
  an: number;
  luna: number;
}): Promise<{ sections: ExportCenterSection[]; totalLucrate: number; totalNelucrate: number }> {
  const supabase = await createClient();
  const totalZile = daysInMonth(an, luna);

  const { data: centers } = await supabase
    .from("centers")
    .select("id, nume")
    .in("id", centerIds)
    .order("nume");

  const sections: ExportCenterSection[] = [];
  let totalLucrate = 0;
  let totalNelucrate = 0;

  for (const center of centers ?? []) {
    const { data: links } = await supabase
      .from("employee_centers")
      .select("employees!inner(id, nume, functie, activ)")
      .eq("center_id", center.id);

    const employees = (links ?? [])
      .map((l: any) => l.employees)
      .filter((e: any) => e?.activ)
      .sort((a: any, b: any) => a.nume.localeCompare(b.nume));

    const employeeRows: ExportEmployeeRow[] = [];

    for (const emp of employees) {
      const { data: timesheet } = await supabase
        .from("timesheets")
        .select("timesheet_days(*)")
        .eq("center_id", center.id)
        .eq("employee_id", emp.id)
        .eq("an", an)
        .eq("luna", luna)
        .maybeSingle();

      const existing = new Map((timesheet?.timesheet_days ?? []).map((d: any) => [d.ziua, d]));

      const days = Array.from({ length: totalZile }, (_, i) => {
        const ziua = i + 1;
        const d: any = existing.get(ziua);
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

      const totalOreLucrate = days.reduce(
        (sum, d) => sum + (d.oreLucrate ?? 0) + d.oreSuplimentare,
        0
      );
      const totalOreNelucrate = days.filter((d) => d.codAbsenta).length;

      totalLucrate += totalOreLucrate;
      totalNelucrate += totalOreNelucrate;

      employeeRows.push({
        nume: emp.nume,
        functie: emp.functie,
        days,
        totalOreLucrate,
        totalOreNelucrate,
      });
    }

    sections.push({ centerName: center.nume, employees: employeeRows });
  }

  return { sections, totalLucrate, totalNelucrate };
}

export const ASOCIATIE = {
  nume: "Asociatia Caminului de Batrani Romantic Club",
  cif: "31950973",
  capitalSocial: "1000",
  adresa: "MIHAILESTI str. DACIA nr. 154 jud. GIURGIU",
};

export const ABSENCE_LEGEND: [string, string][] = [
  ["OS", "ore suplimentare"],
  ["ON", "ore de noapte"],
  ["SA", "ore sambata"],
  ["DU", "ore duminica"],
  ["In", "intreruperi"],
  ["CO", "concediu de odihna"],
  ["BO", "boala obisnuita"],
  ["BP", "boala profesionala"],
  ["AM", "accident de munca"],
  ["M", "maternitate"],
  ["CFP", "concediu fara plata / suspendare"],
  ["N", "absente nemotivate"],
  ["PRM", "program redus de maternitate"],
  ["PRB", "program redus de boala"],
];
