"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addEmployee(formData: FormData) {
  const supabase = await createClient();

  const nume = String(formData.get("nume") ?? "").trim();
  const functie = String(formData.get("functie") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const telefon = String(formData.get("telefon") ?? "").trim() || null;
  const centerId = String(formData.get("centerId") ?? "");

  if (!nume || !functie || !centerId) {
    return { error: "Nume, funcție și centru sunt obligatorii." };
  }

  const { data: employee, error } = await supabase
    .from("employees")
    .insert({ nume, functie, email, telefon })
    .select("id")
    .single();

  if (error || !employee) {
    return { error: "Nu am putut adăuga angajatul: " + error?.message };
  }

  const { error: linkError } = await supabase
    .from("employee_centers")
    .insert({ employee_id: employee.id, center_id: centerId });

  if (linkError) {
    return { error: "Angajatul a fost creat, dar nu am putut face legătura cu centrul: " + linkError.message };
  }

  revalidatePath("/angajati");
  revalidatePath("/pontaj");
  return { error: null };
}

export async function updateEmployee(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const nume = String(formData.get("nume") ?? "").trim();
  const functie = String(formData.get("functie") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const telefon = String(formData.get("telefon") ?? "").trim() || null;

  if (!id || !nume || !functie) {
    return { error: "Date lipsă." };
  }

  const { error } = await supabase
    .from("employees")
    .update({ nume, functie, email, telefon })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/angajati");
  revalidatePath("/pontaj");
  return { error: null };
}

export async function archiveEmployee(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Date lipsă." };

  const { error } = await supabase.from("employees").update({ activ: false }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/angajati");
  revalidatePath("/pontaj");
  return { error: null };
}

export async function addEmployeeToCenter(formData: FormData) {
  const supabase = await createClient();
  const employeeId = String(formData.get("employeeId") ?? "");
  const centerId = String(formData.get("centerId") ?? "");
  if (!employeeId || !centerId) return { error: "Date lipsă." };

  const { error } = await supabase
    .from("employee_centers")
    .insert({ employee_id: employeeId, center_id: centerId });

  if (error) return { error: error.message };

  revalidatePath("/angajati");
  revalidatePath("/pontaj");
  return { error: null };
}

export async function removeEmployeeFromCenter(formData: FormData) {
  const supabase = await createClient();
  const employeeId = String(formData.get("employeeId") ?? "");
  const centerId = String(formData.get("centerId") ?? "");
  if (!employeeId || !centerId) return { error: "Date lipsă." };

  const { error } = await supabase
    .from("employee_centers")
    .delete()
    .eq("employee_id", employeeId)
    .eq("center_id", centerId);

  if (error) return { error: error.message };

  revalidatePath("/angajati");
  revalidatePath("/pontaj");
  return { error: null };
}
