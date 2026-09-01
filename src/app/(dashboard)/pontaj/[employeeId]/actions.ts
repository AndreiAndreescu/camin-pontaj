"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export interface DayInput {
  ziua: number;
  oraInceput: string | null;
  oraSfarsit: string | null;
  oreLucrate: number | null;
  oreSuplimentare: number;
  oreNoapte: number;
  oreSambata: number;
  oreDuminica: number;
  codAbsenta: string | null;
}

export async function saveTimesheet({
  centerId,
  employeeId,
  an,
  luna,
  days,
}: {
  centerId: string;
  employeeId: string;
  an: number;
  luna: number;
  days: DayInput[];
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("timesheets")
    .select("id, status")
    .eq("center_id", centerId)
    .eq("employee_id", employeeId)
    .eq("an", an)
    .eq("luna", luna)
    .maybeSingle();

  if (existing?.status === "finalizat") {
    return { error: "Pontajul e finalizat și nu mai poate fi editat." };
  }

  let timesheetId = existing?.id;

  if (!timesheetId) {
    const { data: created, error } = await supabase
      .from("timesheets")
      .insert({ center_id: centerId, employee_id: employeeId, an, luna, updated_by: user.id })
      .select("id")
      .single();

    if (error || !created) {
      return { error: "Nu am putut crea pontajul: " + error?.message };
    }
    timesheetId = created.id;
  } else {
    await supabase
      .from("timesheets")
      .update({ updated_at: new Date().toISOString(), updated_by: user.id })
      .eq("id", timesheetId);
  }

  const rows = days.map((d) => ({
    timesheet_id: timesheetId,
    ziua: d.ziua,
    ora_inceput: d.oraInceput,
    ora_sfarsit: d.oraSfarsit,
    ore_lucrate: d.oreLucrate,
    ore_suplimentare: d.oreSuplimentare,
    ore_noapte: d.oreNoapte,
    ore_sambata: d.oreSambata,
    ore_duminica: d.oreDuminica,
    cod_absenta: d.codAbsenta,
  }));

  const { error: upsertError } = await supabase
    .from("timesheet_days")
    .upsert(rows, { onConflict: "timesheet_id,ziua" });

  if (upsertError) {
    return { error: "Nu am putut salva zilele: " + upsertError.message };
  }

  revalidatePath("/pontaj");
  revalidatePath(`/pontaj/${employeeId}`);
  return { error: null };
}

export async function setTimesheetStatus({
  centerId,
  employeeId,
  an,
  luna,
  status,
}: {
  centerId: string;
  employeeId: string;
  an: number;
  luna: number;
  status: "in_lucru" | "finalizat";
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("timesheets")
    .update({ status, updated_by: user.id })
    .eq("center_id", centerId)
    .eq("employee_id", employeeId)
    .eq("an", an)
    .eq("luna", luna);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/pontaj");
  revalidatePath(`/pontaj/${employeeId}`);
  return { error: null };
}
