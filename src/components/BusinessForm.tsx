"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AU_STATES, CATEGORIES, slugify, type Business } from "@/lib/constants";
import ImageUpload from "./ImageUpload";

export default function BusinessForm({ userId, business }: { userId: string; business?: Business }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: business?.name ?? "",
    category: business?.category ?? "",
    description: business?.description ?? "",
    logo_url: business?.logo_url ?? null,
    city: business?.city ?? "",
    state: business?.state ?? "",
    email: business?.email ?? "",
    phone: business?.phone ?? "",
    website: business?.website ?? "",
    instagram: business?.instagram ?? "",
    facebook: business?.facebook ?? "",
  });
  const [gallery, setGallery] = useState<string[]>(business?.gallery ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Plan gratuito: 3 fotos. Plan Pro: 12 fotos.
  const maxPhotos = business?.plan === "pro" ? 12 : 3;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category) return setError("Elige una categoría.");
    if (!form.email.trim() && !form.phone.trim() && !form.instagram.trim() && !form.website.trim())
      return setError("Agrega al menos una forma de contacto (correo, teléfono, Instagram o sitio web).");
    setError("");
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || null,
      logo_url: form.logo_url,
      gallery,
      city: form.city.trim(),
      state: form.state || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      instagram: form.instagram.trim().replace(/^@/, "") || null,
      facebook: form.facebook.trim() || null,
    };

    const supabase = createClient();
    if (business) {
      const { error } = await supabase.from("businesses").update(payload).eq("id", business.id);
      setSaving(false);
      if (error) return setError("No se pudo guardar. Intenta de nuevo.");
      router.push(`/negocios/${business.slug}`);
    } else {
      const slug = slugify(form.name);
      const { error } = await supabase.from("businesses").insert({ ...payload, slug, owner_id: userId });
      setSaving(false);
      if (error) return setError("No se pudo registrar el negocio. Intenta de nuevo.");
      router.push(`/negocios/${slug}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <ImageUpload
        bucket="business-images"
        userId={userId}
        value={form.logo_url}
        onChange={(v) => setForm((f) => ({ ...f, logo_url: v }))}
        label="Subir logo o foto principal"
      />
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre del negocio</label>
        <input required value={form.name} onChange={set("name")} className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <select required value={form.category} onChange={set("category")} className="input">
            <option value="">Selecciona</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Ciudad</label>
          <input required value={form.city} onChange={set("city")} placeholder="Melbourne" className="input" />
        </div>
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
      <div>
        <label className="mb-1 block text-sm font-medium">Descripción</label>
        <textarea value={form.description} onChange={set("description")} rows={4} maxLength={1200} className="input" placeholder="¿Qué ofreces? ¿Qué te hace especial?" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Galería ({gallery.length}/{maxPhotos})
        </label>
        <div className="flex flex-wrap gap-3">
          {gallery.map((g, i) => (
            <div key={g} className="relative">
              <ImageUpload
                bucket="business-images"
                userId={userId}
                value={g}
                onChange={(v) => setGallery((arr) => (v ? arr.map((x, j) => (j === i ? v : x)) : arr.filter((_, j) => j !== i)))}
                label="Cambiar"
              />
            </div>
          ))}
        </div>
        {gallery.length < maxPhotos ? (
          <div className="mt-3">
            <ImageUpload
              bucket="business-images"
              userId={userId}
              value={null}
              onChange={(v) => v && setGallery((arr) => [...arr, v])}
              label="Agregar foto"
            />
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted">
            {business?.plan === "pro" ? "Llegaste al máximo de fotos." : "El plan Pro te permite subir hasta 12 fotos."}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input type="email" value={form.email} onChange={set("email")} placeholder="Correo de contacto" className="input" />
        <input value={form.phone} onChange={set("phone")} placeholder="Teléfono / WhatsApp" className="input" />
        <input value={form.website} onChange={set("website")} placeholder="Sitio web (opcional)" className="input" />
        <input value={form.instagram} onChange={set("instagram")} placeholder="Instagram (usuario)" className="input" />
        <input value={form.facebook} onChange={set("facebook")} placeholder="Facebook (enlace)" className="input sm:col-span-2" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn" disabled={saving}>
        {saving ? "Guardando..." : business ? "Guardar cambios" : "Registrar negocio"}
      </button>
    </form>
  );
}
