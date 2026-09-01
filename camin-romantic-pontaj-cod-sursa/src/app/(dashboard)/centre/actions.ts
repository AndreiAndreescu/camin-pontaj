"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addCenter(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const nume = String(formData.get("nume") ?? "").trim();
  const cod = String(formData.get("cod") ?? "").trim() || null;
  const tip = String(formData.get("tip") ?? "centru");
  const adresa = String(formData.get("adresa") ?? "").trim() || null;
  const localitate = String(formData.get("localitate") ?? "").trim() || null;
  const judet = String(formData.get("judet") ?? "").trim() || null;
  const capacitateRaw = String(formData.get("capacitate") ?? "").trim();
  const capacitate = capacitateRaw ? Number(capacitateRaw) : null;

  if (!nume) return { error: "Numele centrului e obligatoriu." };

  const { error } = await supabase.from("centers").insert({
    nume,
    cod,
    tip: tip as "centru" | "apartament",
    adresa,
    localitate,
    judet,
    capacitate,
  });

  if (error) return { error: "Nu am putut adăuga centrul: " + error.message };

  revalidatePath("/centre");
  return { error: null };
}

export async function updateCenter(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const nume = String(formData.get("nume") ?? "").trim();
  const cod = String(formData.get("cod") ?? "").trim() || null;
  const adresa = String(formData.get("adresa") ?? "").trim() || null;
  const localitate = String(formData.get("localitate") ?? "").trim() || null;
  const judet = String(formData.get("judet") ?? "").trim() || null;
  const capacitateRaw = String(formData.get("capacitate") ?? "").trim();
  const capacitate = capacitateRaw ? Number(capacitateRaw) : null;

  if (!id || !nume) return { error: "Date lipsă." };

  const { error } = await supabase
    .from("centers")
    .update({ nume, cod, adresa, localitate, judet, capacitate })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/centre");
  return { error: null };
}

export async function archiveCenter(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Date lipsă." };

  const { error } = await supabase.from("centers").update({ activ: false }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/centre");
  return { error: null };
}
