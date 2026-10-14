"use client";

import { useState, useTransition } from "react";
import { createPost } from "@/app/actions/posts";
import ImageUpload from "./ImageUpload";

export default function PostComposer({ userId }: { userId: string }) {
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await createPost(body, image);
      if (res.error) return setError(res.error);
      setBody("");
      setImage(null);
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Comparte una recomendación, una pregunta o una novedad con la comunidad..."
        className="input"
      />
      <ImageUpload bucket="post-images" userId={userId} value={image} onChange={setImage} label="Agregar imagen" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button className="btn" disabled={pending || !body.trim()}>
          {pending ? "Publicando..." : "Publicar"}
        </button>
      </div>
    </form>
  );
}
