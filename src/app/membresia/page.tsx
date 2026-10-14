import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { openBillingPortal, startProCheckout } from "@/app/actions/billing";

const FREE = [
  "Perfil personal y publicaciones en el muro",
  "Registro de un negocio en el directorio",
  "Hasta 3 fotos en la galería",
  "Acceso al buscador",
];
const PRO = [
  "Todo lo del plan Gratuito",
  "Perfil de negocio destacado",
  "Prioridad en los resultados de búsqueda",
  "Insignia de “Negocio Destacado”",
  "Hasta 12 fotos en la galería",
  "Estadísticas básicas de visitas",
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ negocio?: string; ok?: string; error?: string }>;
}) {
  const { negocio, ok, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar?next=/membresia");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, plan")
    .eq("owner_id", user.id)
    .order("created_at");

  const selected = businesses?.find((b) => b.id === negocio) ?? businesses?.[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-center text-3xl font-bold">Haz crecer tu negocio</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-muted">
        Elige el plan que mejor se adapte a tu emprendimiento. La membresía Pro se paga por negocio y puedes cancelarla cuando quieras.
      </p>

      {ok && (
        <p className="mx-auto mt-6 max-w-xl rounded-xl bg-accent/10 p-3 text-center text-sm text-accent">
          ¡Gracias! En unos segundos tu negocio aparecerá como destacado.
        </p>
      )}
      {error && (
        <p className="mx-auto mt-6 max-w-xl rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
          Los pagos aún no están configurados. Avísale a las administradoras.
        </p>
      )}

      {!selected ? (
        <div className="card mx-auto mt-8 max-w-md p-6 text-center">
          <p className="text-muted">Primero registra tu negocio para poder activar el plan Pro.</p>
          <Link href="/negocios/nuevo" className="btn mt-4">
            Registrar negocio
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="card p-6">
              <h2 className="text-lg font-bold">Gratuito</h2>
              <p className="mt-1 text-3xl font-bold">$0</p>
              <ul className="mt-4 space-y-2 text-sm">
                {FREE.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </div>
            <div className="card !border-gold p-6 ring-1 ring-gold/40">
              <h2 className="text-lg font-bold">
                Pro <span className="ml-1 rounded-full bg-gold px-2 py-0.5 text-xs text-white">Recomendado</span>
              </h2>
              <p className="mt-1 text-sm text-muted">El precio lo define el equipo en Stripe.</p>
              <ul className="mt-4 space-y-2 text-sm">
                {PRO.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>

              <div className="mt-6 space-y-3">
                {businesses && businesses.length > 1 && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {businesses.map((b) => (
                      <Link
                        key={b.id}
                        href={`/membresia?negocio=${b.id}`}
                        className={`rounded-full border px-3 py-1 ${b.id === selected.id ? "border-brand text-brand" : "border-border"}`}
                      >
                        {b.name}
                      </Link>
                    ))}
                  </div>
                )}
                {selected.plan === "pro" ? (
                  <form action={openBillingPortal}>
                    <input type="hidden" name="business_id" value={selected.id} />
                    <p className="mb-2 text-sm text-accent">{selected.name} ya tiene el plan Pro.</p>
                    <button className="btn-ghost w-full">Administrar suscripción</button>
                  </form>
                ) : (
                  <form action={startProCheckout}>
                    <input type="hidden" name="business_id" value={selected.id} />
                    <button className="btn w-full">Activar Pro para {selected.name}</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
