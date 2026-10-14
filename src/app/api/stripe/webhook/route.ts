import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

const ACTIVE = new Set(["active", "trialing"]);

function periodEnd(sub: Stripe.Subscription): string | null {
  // Segun la version de la API, el campo vive en la suscripcion o en sus items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ts = (sub as any).current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const businessId = sub.metadata?.business_id;
  const userId = sub.metadata?.user_id;
  if (!businessId || !userId) return;

  const admin = createServiceClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const isPro = ACTIVE.has(sub.status);

  await admin.from("subscriptions").upsert(
    {
      business_id: businessId,
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_end: periodEnd(sub),
    },
    { onConflict: "stripe_subscription_id" }
  );

  await admin
    .from("businesses")
    .update({ plan: isPro ? "pro" : "free", is_featured: isPro })
    .eq("id", businessId);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Falta configuración" }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && typeof session.subscription === "string") {
          const sub = await getStripe().subscriptions.retrieve(session.subscription);
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (err) {
    console.error("Error procesando webhook de Stripe", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
