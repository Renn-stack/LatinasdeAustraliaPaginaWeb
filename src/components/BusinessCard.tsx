import Link from "next/link";
import { publicUrl, type Business } from "@/lib/constants";

export default function BusinessCard({ b }: { b: Business }) {
  const logo = publicUrl("business-images", b.logo_url);
  const pro = b.plan === "pro";

  return (
    <Link
      href={`/negocios/${b.slug}`}
      className={`card block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md ${
        pro ? "!border-gold ring-1 ring-gold/40" : ""
      }`}
    >
      <div className="relative aspect-[16/9] bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo ? <img src={logo} alt={b.name} className="h-full w-full object-cover" /> : (
          <div className="flex h-full items-center justify-center text-3xl font-bold text-brand/40">{b.name.slice(0, 1)}</div>
        )}
        {pro && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-white shadow">
            Negocio Destacado
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold leading-tight">{b.name}</h3>
        <p className="mt-0.5 text-xs text-accent">{b.category}</p>
        <p className="mt-1 text-xs text-muted">
          {b.city}
          {b.state ? `, ${b.state}` : ""}
        </p>
        {b.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{b.description}</p>}
      </div>
    </Link>
  );
}
