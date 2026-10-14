import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setBanned, setBusinessHidden, setPostHidden } from "@/app/actions/admin";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar?next=/admin");
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) notFound();

  const [users, businesses, posts, counts] = await Promise.all([
    supabase.from("profiles").select("id, full_name, city, is_banned, is_admin, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("businesses").select("id, name, slug, category, city, plan, is_hidden, views").order("created_at", { ascending: false }).limit(50),
    supabase.from("posts").select("id, body, is_hidden, created_at, author:profiles!posts_author_id_fkey(full_name)").order("created_at", { ascending: false }).limit(30),
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("businesses").select("id", { count: "exact", head: true }),
      supabase.from("businesses").select("id", { count: "exact", head: true }).eq("plan", "pro"),
      supabase.from("posts").select("id", { count: "exact", head: true }),
    ]),
  ]);
  const [cu, cb, cp, cpo] = counts;

  const stats = [
    ["Usuarias", cu.count ?? 0],
    ["Negocios", cb.count ?? 0],
    ["Negocios Pro", cp.count ?? 0],
    ["Publicaciones", cpo.count ?? 0],
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <h1 className="text-2xl font-bold">Panel de administración</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, n]) => (
          <div key={label as string} className="card p-4">
            <p className="text-2xl font-bold text-brand">{n}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Usuarias</h2>
        <div className="card divide-y divide-border">
          {users.data?.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div>
                <p className="font-medium">
                  {u.full_name || "Sin nombre"} {u.is_admin && <span className="ml-1 text-xs text-accent">admin</span>}
                  {u.is_banned && <span className="ml-1 text-xs text-red-600">suspendida</span>}
                </p>
                <p className="text-xs text-muted">{u.city ?? "Sin ciudad"}</p>
              </div>
              {!u.is_admin && (
                <form action={setBanned}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="banned" value={String(!u.is_banned)} />
                  <button className="btn-ghost !py-1 text-xs">{u.is_banned ? "Reactivar" : "Suspender"}</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Negocios</h2>
        <div className="card divide-y divide-border">
          {businesses.data?.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div>
                <Link href={`/negocios/${b.slug}`} className="font-medium hover:text-brand">
                  {b.name}
                </Link>
                {b.is_hidden && <span className="ml-2 text-xs text-red-600">oculto</span>}
                <p className="text-xs text-muted">
                  {b.category} · {b.city} · {b.plan === "pro" ? "Pro" : "Gratuito"} · {b.views} visitas
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/negocios/editar/${b.id}`} className="btn-ghost !py-1 text-xs">
                  Editar
                </Link>
                <form action={setBusinessHidden}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="hidden" value={String(!b.is_hidden)} />
                  <button className="btn-ghost !py-1 text-xs">{b.is_hidden ? "Mostrar" : "Ocultar"}</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Moderación de publicaciones</h2>
        <div className="card divide-y divide-border">
          {posts.data?.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="text-xs text-muted">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(p.author as any)?.full_name || "Integrante"} {p.is_hidden && <span className="text-red-600">· oculta</span>}
                </p>
                <p className="line-clamp-2">{p.body}</p>
              </div>
              <form action={setPostHidden}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="hidden" value={String(!p.is_hidden)} />
                <button className="btn-ghost !py-1 text-xs">{p.is_hidden ? "Mostrar" : "Ocultar"}</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
