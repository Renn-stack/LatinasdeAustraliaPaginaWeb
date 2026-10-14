"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) redirect("/");
  return supabase;
}

export async function setBanned(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const banned = formData.get("banned") === "true";
  await supabase.from("profiles").update({ is_banned: banned }).eq("id", id);
  revalidatePath("/admin");
}

export async function setBusinessHidden(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const hidden = formData.get("hidden") === "true";
  await supabase.from("businesses").update({ is_hidden: hidden }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/directorio");
}

export async function setPostHidden(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const hidden = formData.get("hidden") === "true";
  await supabase.from("posts").update({ is_hidden: hidden }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/muro");
}
