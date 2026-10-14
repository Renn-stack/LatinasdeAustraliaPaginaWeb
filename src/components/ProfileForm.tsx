"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AU_STATES, type Profile } from "@/lib/constants";
import ImageUpload from "./ImageUpload";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    city: profile.city ?? "",
    state: profile.state ?? "",
    bio: profile.bio ?? "",
    instagram: profile.instagram ?? "",
    facebook: profile.facebook ?? "",
    website: profile.website ?? "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const { error } = await createClient()
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        avatar_url: form.avatar_url,
        city: form.city.trim() || null,
        state: form.state || null,
        bio: form.bio.trim() || null,
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
        website: form.website.trim() || null,
      })
      .eq("id", profile.id);
    setStatus(error ? "error" : "saved");
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <ImageUpload
        bucket="avatars"
        userId={profile.id}
        value={form.avatar_url}
        onChange={(v) => setForm((f) => ({ ...f, avatar_url: v }))}
        label="Cambiar foto"
        round
      />
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre</label>
        <input required value={form.full_name} onChange={set("full_name")} className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Ciudad</label>
          <input value={form.city} onChange={set("city")} placeholder="Sydney" className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Estado</label>
          <select value={form.state} onChange={set("state")} className="input">
            <option value="">Selecciona</option>
            {AU_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Sobre ti</label>
        <textarea value={form.bio} onChange={set("bio")} rows={3} maxLength={300} className="input" placeholder="Cuéntanos un poco de ti (máx. 300 caracteres)" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <input value={form.instagram} onChange={set("instagram")} placeholder="Instagram (usuario)" className="input" />
        <input value={form.facebook} onChange={set("facebook")} placeholder="Facebook (enlace)" className="input" />
        <input value={form.website} onChange={set("website")} placeholder="Sitio web" className="input" />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn" disabled={status === "saving"}>
          {status === "saving" ? "Guardando..." : "Guardar cambios"}
        </button>
        {status === "saved" && <span className="text-sm text-accent">Guardado</span>}
        {status === "error" && <span className="text-sm text-red-600">No se pudo guardar</span>}
      </div>
    </form>
  );
}
