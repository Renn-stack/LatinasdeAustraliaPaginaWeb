"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

async function origin() {
  const h = await headers();
  return h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function startProCheckout(formData: FormData) {
  const businessId = String(formData.get("business_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar?next=/membresia");

  // RLS + filtro explícito: solo la dueña puede pagar por su negocio
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, plan, owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/perfil");
  if (business.plan === "pro") redirect("/membresia?ok=1");

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) redirect(`/membresia?negocio=${business.id}&error=config`);

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  const base = await origin();
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(existing?.stripe_customer_id
      ? { customer: existing.stripe_customer_id }
      : { customer_email: user.email ?? undefined }),
    client_reference_id: business.id,
    metadata: { business_id: business.id, user_id: user.id },
    subscription_data: { metadata: { business_id: business.id, user_id: user.id } },
    success_url: `${base}/membresia?ok=1`,
    cancel_url: `${base}/membresia?negocio=${business.id}`,
  });

  redirect(session.url!);
}

export async function openBillingPortal(formData: FormData) {
  const businessId = String(formData.get("business_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (!sub?.stripe_customer_id) redirect("/perfil");

  const portal = await getStripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${await origin()}/perfil`,
  });
  redirect(portal.url);
}
