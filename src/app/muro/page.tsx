import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard, { type PostView } from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar?next=/muro");

  const [{ data: me }, { data: posts }] = await Promise.all([
    supabase.from("profiles").select("is_admin, is_banned").eq("id", user.id).single(),
    supabase
      .from("posts")
      .select(
        "id, body, image_url, created_at, author_id, author:profiles!posts_author_id_fkey(full_name, avatar_url), likes(user_id), comments(id, body, author_id, created_at, author:profiles!comments_author_id_fkey(full_name))"
      )
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const views: PostView[] = (posts ?? []).map((p: any) => ({
    id: p.id,
    body: p.body,
    image_url: p.image_url,
    created_at: p.created_at,
    author_id: p.author_id,
    author_name: p.author?.full_name ?? "",
    author_avatar: p.author?.avatar_url ?? null,
    likes: p.likes.length,
    liked: p.likes.some((l: { user_id: string }) => l.user_id === user.id),
    comments: [...p.comments]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({
        id: c.id,
        body: c.body,
        author_id: c.author_id,
        author_name: c.author?.full_name ?? "",
        created_at: c.created_at,
      })),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Muro de la comunidad</h1>
        <p className="text-sm text-muted">Comparte, pregunta y recomienda. Cuidémonos entre todas.</p>
      </div>

      {me?.is_banned ? (
        <p className="card p-4 text-sm text-muted">Tu cuenta no puede publicar en este momento.</p>
      ) : (
        <PostComposer userId={user.id} />
      )}

      {views.length === 0 ? (
        <p className="card p-8 text-center text-muted">Aún no hay publicaciones. ¡Escribe la primera!</p>
      ) : (
        views.map((p) => <PostCard key={p.id} post={p} userId={user.id} isAdmin={!!me?.is_admin} />)
      )}
    </div>
  );
}
