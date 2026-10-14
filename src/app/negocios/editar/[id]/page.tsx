import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessForm from "@/components/BusinessForm";
import type { Business } from "@/lib/constants";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: business } = await supabase.from("businesses").select("*").eq("id", id).single<Business>();
  if (!business) notFound();

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (business.owner_id !== user.id && !me?.is_admin) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Editar negocio</h1>
      <BusinessForm userId={business.owner_id} business={business} />
    </div>
  );
}
