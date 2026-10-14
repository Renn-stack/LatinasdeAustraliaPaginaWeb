import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    isAdmin = !!data?.is_admin;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand">
          Latinas en Australia
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium sm:gap-3">
          <Link href="/directorio" className="px-2 py-1 hover:text-brand">
            Directorio
          </Link>
          {user ? (
            <>
              <Link href="/muro" className="px-2 py-1 hover:text-brand">
                Muro
              </Link>
              <Link href="/perfil" className="px-2 py-1 hover:text-brand">
                Mi perfil
              </Link>
              {isAdmin && (
                <Link href="/admin" className="px-2 py-1 hover:text-brand">
                  Admin
                </Link>
              )}
              <form action={signOut}>
                <button className="btn-ghost !px-3 !py-1.5">Salir</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/ingresar" className="px-2 py-1 hover:text-brand">
                Ingresar
              </Link>
              <Link href="/registro" className="btn !px-4 !py-1.5">
                Unirme
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
