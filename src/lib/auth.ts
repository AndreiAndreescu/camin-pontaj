import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/lib/types/database";

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string;
  role: ProfileRole;
  centerIds: string[];
}

/**
 * Loads the signed-in user's profile + assigned centers.
 * Redirects to /login if there is no session.
 */
export async function requireUser(): Promise<CurrentUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  let centerIds: string[] = [];
  if (profile.role === "center_head") {
    const { data: links } = await supabase
      .from("profile_centers")
      .select("center_id")
      .eq("profile_id", user.id);
    centerIds = (links ?? []).map((l) => l.center_id);
  }

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile.full_name,
    role: profile.role,
    centerIds,
  };
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/pontaj");
  }
  return user;
}
