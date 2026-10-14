import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BusinessCard from "@/components/BusinessCard";
import type { Business } from "@/lib/constants";

const FEATURES = [
  { title: "Comunidad", text: "Un muro para compartir recomendaciones, preguntas y oportunidades con otras latinas." },
  { title: "Directorio de negocios", text: "Descubre emprendimientos locales liderados por mujeres latinas, por categoría y ciudad." },
  { title: "Visibilidad para tu negocio", text: "Registra tu emprendimiento gratis y destácalo con la membresía Pro." },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("is_hidden", false)
    .order("plan", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);
  const featured = (data ?? []) as Business[];

  return (
    <>
      <section className="bg-gradient-to-b from-[#ffe9d6] to-background">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Tu comunidad latina,
            <br />
            <span className="text-brand">al otro lado del mundo</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Conecta con otras mujeres latinas en Australia, descubre negocios locales y haz crecer tu emprendimiento.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <Link href="/muro" className="btn">
                Ir al muro
              </Link>
            ) : (
              <Link href="/registro" className="btn">
                Unirme gratis
              </Link>
            )}
            <Link href="/directorio" className="btn-ghost">
              Explorar el directorio
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="font-bold text-accent">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Negocios de la comunidad</h2>
            <Link href="/directorio" className="text-sm font-semibold text-brand">
              Ver todos
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {featured.map((b) => (
              <BusinessCard key={b.id} b={b} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
