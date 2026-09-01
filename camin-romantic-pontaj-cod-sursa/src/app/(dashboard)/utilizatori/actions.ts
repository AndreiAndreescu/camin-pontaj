"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createUser(formData: FormData) {
  await requireAdmin();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "center_head") as "admin" | "center_head";
  const centerIds = formData.getAll("centerIds").map(String);

  if (!fullName || !email || password.length < 6) {
    return { error: "Nume, email și o parolă de minim 6 caractere sunt obligatorii." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e: any) {
    return { error: e.message };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error || !created.user) {
    return { error: "Nu am putut crea contul: " + error?.message };
  }

  // Triggerul on_auth_user_created creează profilul automat; ne asigurăm totuși
  // că rolul e cel ales (dacă profilul a fost deja creat cu valoarea implicită).
  await admin.from("profiles").update({ role, full_name: fullName }).eq("id", created.user.id);

  if (role === "center_head" && centerIds.length > 0) {
    await admin
      .from("profile_centers")
      .insert(centerIds.map((centerId) => ({ profile_id: created.user!.id, center_id: centerId })));
  }

  revalidatePath("/utilizatori");
  return { error: null };
}

export async function updateUserCenters(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const profileId = String(formData.get("profileId") ?? "");
  const centerIds = formData.getAll("centerIds").map(String);

  if (!profileId) return { error: "Date lipsă." };

  await supabase.from("profile_centers").delete().eq("profile_id", profileId);

  if (centerIds.length > 0) {
    const { error } = await supabase
      .from("profile_centers")
      .insert(centerIds.map((centerId) => ({ profile_id: profileId, center_id: centerId })));
    if (error) return { error: error.message };
  }

  revalidatePath("/utilizatori");
  return { error: null };
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!userId || newPassword.length < 6) {
    return { error: "Parola trebuie să aibă minim 6 caractere." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e: any) {
    return { error: e.message };
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return { error: error.message };

  return { error: null };
}
