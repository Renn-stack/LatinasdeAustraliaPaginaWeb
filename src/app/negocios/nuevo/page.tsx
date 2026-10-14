import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessForm from "@/components/BusinessForm";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar?next=/negocios/nuevo");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Registra tu negocio</h1>
      <p className="mb-6 text-sm text-muted">Aparecerás en el directorio para que la comunidad te descubra. Es gratis.</p>
      <BusinessForm userId={user.id} />
    </div>
  );
}
