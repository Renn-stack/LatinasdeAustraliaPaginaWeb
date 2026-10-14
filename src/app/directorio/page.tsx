import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BusinessCard from "@/components/BusinessCard";
import { CATEGORIES, type Business } from "@/lib/constants";

type Search = { q?: string; categoria?: string; ciudad?: string };

// Quita caracteres que tienen significado especial en los filtros de PostgREST
const clean = (s: string) => s.replace(/[%,()*\\]/g, " ").trim();

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const q = clean(sp.q ?? "");
  const ciudad = clean(sp.ciudad ?? "");
  const categoria = sp.categoria ?? "";

  const supabase = await createClient();
  let query = supabase.from("businesses").select("*").eq("is_hidden", false);
  if (q) query = query.ilike("name", `%${q}%`);
  if (ciudad) query = query.ilike("city", `%${ciudad}%`);
  if (categoria) query = query.eq("category", categoria);

  // Pro primero (prioridad en resultados), luego los más recientes
  const { data } = await query.order("plan", { ascending: false }).order("created_at", { ascending: false }).limit(60);
  const businesses = (data ?? []) as Business[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Directorio de negocios</h1>
          <p className="text-sm text-muted">Emprendimientos de mujeres latinas en Australia.</p>
        </div>
        <Link href="/negocios/nuevo" className="btn">
          Registrar mi negocio
        </Link>
      </div>

      <form className="card mb-8 grid gap-3 p-4 sm:grid-cols-4">
        <input name="q" defaultValue={q} placeholder="Nombre del negocio" className="input" />
        <select name="categoria" defaultValue={categoria} className="input">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input name="ciudad" defaultValue={ciudad} placeholder="Ciudad" className="input" />
        <button className="btn">Buscar</button>
      </form>

      {businesses.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No encontramos negocios con esos filtros.{" "}
          <Link href="/negocios/nuevo" className="font-semibold text-brand">
            Sé la primera en registrar uno
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <BusinessCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </div>
  );
}
