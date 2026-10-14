"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createPost(body: string, imagePath: string | null) {
  const text = body.trim();
  if (!text || text.length > 2000) return { error: "Escribe algo (máximo 2000 caracteres)." };
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Inicia sesión para publicar." };
  // La carpeta de la imagen debe ser la de la usuaria
  if (imagePath && !imagePath.startsWith(`${user.id}/`)) return { error: "Imagen no válida." };

  const { error } = await supabase.from("posts").insert({ author_id: user.id, body: text, image_url: imagePath });
  if (error) return { error: "No se pudo publicar. Intenta de nuevo." };
  revalidatePath("/muro");
  return {};
}

export async function toggleLike(postId: string) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
  else await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
  revalidatePath("/muro");
}

export async function addComment(postId: string, body: string) {
  const text = body.trim();
  if (!text || text.length > 1000) return { error: "Comentario no válido." };
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Inicia sesión para comentar." };
  const { error } = await supabase.from("comments").insert({ post_id: postId, author_id: user.id, body: text });
  if (error) return { error: "No se pudo comentar." };
  revalidatePath("/muro");
  return {};
}

export async function deletePost(postId: string) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase.from("posts").delete().eq("id", postId); // RLS: autora o admin
  revalidatePath("/muro");
}

export async function deleteComment(commentId: string) {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase.from("comments").delete().eq("id", commentId); // RLS: autora o admin
  revalidatePath("/muro");
}
