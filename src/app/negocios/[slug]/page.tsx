import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicUrl, type Business } from "@/lib/constants";

const safeUrl = (u: string | null) => {
  if (!u) return null;
  const withProto = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  try {
    const parsed = new URL(withProto);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: b } = await supabase.from("businesses").select("*").eq("slug", slug).single<Business>();
  if (!b) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === b.owner_id;

  // Cuenta una visita (solo si no es la dueña)
  if (!isOwner) await supabase.rpc("increment_business_views", { b_id: b.id });

  const logo = publicUrl("business-images", b.logo_url);
  const pro = b.plan === "pro";
  const website = safeUrl(b.website);
  const facebook = safeUrl(b.facebook);
  const phoneDigits = b.phone?.replace(/[^\d+]/g, "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/directorio" className="text-sm text-muted hover:text-brand">
        ← Volver al directorio
      </Link>

      <article className={`card mt-4 overflow-hidden ${pro ? "!border-gold ring-1 ring-gold/40" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo} alt={b.name} className="aspect-[16/8] w-full object-cover" />}
        <div className="space-y-5 p-6">
          <header>
            {pro && (
              <span className="mb-2 inline-block rounded-full bg-gold px-3 py-0.5 text-xs font-bold text-white">
                Negocio Destacado
              </span>
            )}
            <h1 className="text-2xl font-bold">{b.name}</h1>
            <p className="text-sm text-accent">{b.category}</p>
            <p className="text-sm text-muted">
              {b.city}
              {b.state ? `, ${b.state}` : ""}
            </p>
          </header>

          {b.description && <p className="whitespace-pre-line leading-relaxed">{b.description}</p>}

          {b.gallery.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {b.gallery.map((g) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={g} src={publicUrl("business-images", g)!} alt="" className="aspect-square w-full rounded-xl object-cover" />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-5">
            {b.email && (
              <a href={`mailto:${b.email}`} className="btn">
                Contactar
              </a>
            )}
            {phoneDigits && (
              <a href={`https://wa.me/${phoneDigits.replace("+", "")}`} className="btn-ghost" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            )}
            {website && (
              <a href={website} className="btn-ghost" target="_blank" rel="noopener noreferrer nofollow">
                Sitio web
              </a>
            )}
            {b.instagram && (
              <a
                href={`https://instagram.com/${encodeURIComponent(b.instagram)}`}
                className="btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            )}
            {facebook && (
              <a href={facebook} className="btn-ghost" target="_blank" rel="noopener noreferrer nofollow">
                Facebook
              </a>
            )}
          </div>

          {isOwner && (
            <div className="rounded-xl bg-background p-4 text-sm">
              <p className="font-semibold">Estadísticas básicas</p>
              <p className="text-muted">{b.views} visitas a tu perfil</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/negocios/editar/${b.id}`} className="btn-ghost !py-1 text-xs">
                  Editar
                </Link>
                {!pro && (
                  <Link href={`/membresia?negocio=${b.id}`} className="btn !py-1 text-xs">
                    Destacar mi negocio
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
