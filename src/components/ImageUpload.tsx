"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { publicUrl } from "@/lib/constants";

type Props = {
  bucket: "avatars" | "business-images" | "post-images";
  userId: string;
  value: string | null;
  onChange: (path: string | null) => void;
  label: string;
  round?: boolean;
};

const MAX_MB = 5;

export default function ImageUpload({ bucket, userId, value, onChange, label, round }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Elige un archivo de imagen.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`La imagen debe pesar menos de ${MAX_MB} MB.`);

    setError("");
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await createClient().storage.from(bucket).upload(path, file, { contentType: file.type });
    setBusy(false);
    if (upErr) return setError("No se pudo subir la imagen. Intenta de nuevo.");
    onChange(path);
  }

  const src = publicUrl(bucket, value);

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-background text-xs text-muted ${
          round ? "rounded-full" : "rounded-xl"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : "Sin foto"}
      </div>
      <div>
        <label className="btn-ghost cursor-pointer">
          {busy ? "Subiendo..." : label}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="ml-2 text-xs text-muted underline">
            Quitar
          </button>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
