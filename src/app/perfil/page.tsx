import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import type { Business, Profile } from "@/lib/constants";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar?next=/perfil");

  const [{ data: profile }, { data: businesses }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase.from("businesses").select("*").eq("owner_id", user.id).returns<Business[]>(),
  ]);
  if (!profile) redirect("/");

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-sm text-muted">Así te verán las demás integrantes de la comunidad.</p>
      </div>
      <ProfileForm profile={profile} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Mis negocios</h2>
          <Link href="/negocios/nuevo" className="btn !py-1.5">
            Registrar negocio
          </Link>
        </div>
        {businesses && businesses.length > 0 ? (
          <ul className="space-y-2">
            {businesses.map((b) => (
              <li key={b.id} className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <Link href={`/negocios/${b.slug}`} className="font-semibold hover:text-brand">
                    {b.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {b.category} · {b.city} · Plan {b.plan === "pro" ? "Pro" : "Gratuito"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {b.plan !== "pro" && (
                    <Link href={`/membresia?negocio=${b.id}`} className="btn-ghost !py-1 text-xs">
                      Pasar a Pro
                    </Link>
                  )}
                  <Link href={`/negocios/editar/${b.id}`} className="btn-ghost !py-1 text-xs">
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-4 text-sm text-muted">Aún no has registrado ningún negocio.</p>
        )}
      </section>
    </div>
  );
}
