"use client";

import { useState, useTransition } from "react";
import { addComment, deleteComment, deletePost, toggleLike } from "@/app/actions/posts";
import { publicUrl } from "@/lib/constants";

export type PostView = {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  likes: number;
  liked: boolean;
  comments: { id: string; body: string; author_id: string; author_name: string; created_at: string }[];
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

export default function PostCard({ post, userId, isAdmin }: { post: PostView; userId: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const avatar = publicUrl("avatars", post.author_avatar);
  const canDelete = post.author_id === userId || isAdmin;

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    start(async () => {
      const res = await addComment(post.id, text);
      if (res.error) return setError(res.error);
      setText("");
    });
  }

  return (
    <article className="card p-4">
      <header className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (
            <div className="flex h-full items-center justify-center font-bold text-brand">{post.author_name.slice(0, 1) || "?"}</div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">{post.author_name || "Integrante"}</p>
          <p className="text-xs text-muted">{fmt(post.created_at)}</p>
        </div>
        {canDelete && (
          <button
            onClick={() => confirm("¿Eliminar esta publicación?") && start(() => deletePost(post.id))}
            className="text-xs text-muted hover:text-red-600"
          >
            Eliminar
          </button>
        )}
      </header>

      <p className="mt-3 whitespace-pre-line leading-relaxed">{post.body}</p>
      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={publicUrl("post-images", post.image_url)!} alt="" className="mt-3 max-h-[28rem] w-full rounded-xl object-cover" />
      )}

      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-sm">
        <button
          onClick={() => start(() => toggleLike(post.id))}
          className={`font-medium ${post.liked ? "text-brand" : "text-muted hover:text-brand"}`}
          aria-pressed={post.liked}
        >
          {post.liked ? "♥" : "♡"} Me gusta · {post.likes}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="font-medium text-muted hover:text-brand">
          Comentarios · {post.comments.length}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          {post.comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-background px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{c.author_name || "Integrante"}</span>
                {(c.author_id === userId || isAdmin) && (
                  <button onClick={() => start(() => deleteComment(c.id))} className="text-xs text-muted hover:text-red-600">
                    Eliminar
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line">{c.body}</p>
            </div>
          ))}
          <form onSubmit={send} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              placeholder="Escribe un comentario"
              className="input"
            />
            <button className="btn !px-4" disabled={pending || !text.trim()}>
              Enviar
            </button>
          </form>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </article>
  );
}
