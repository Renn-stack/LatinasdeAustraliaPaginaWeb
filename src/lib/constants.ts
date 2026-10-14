export const CATEGORIES = [
  "Belleza y bienestar",
  "Comida y repostería",
  "Restaurantes y cafés",
  "Salud y terapias",
  "Educación y clases",
  "Servicios legales y migración",
  "Contabilidad y finanzas",
  "Bienes raíces",
  "Diseño y marketing",
  "Tecnología",
  "Moda y accesorios",
  "Eventos y fotografía",
  "Limpieza y hogar",
  "Cuidado de niños",
  "Traducción",
  "Otros",
] as const;

export const AU_STATES = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",
] as const;

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  is_admin: boolean;
  is_banned: boolean;
};

export type Business = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  logo_url: string | null;
  gallery: string[];
  city: string;
  state: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  plan: "free" | "pro";
  is_featured: boolean;
  is_hidden: boolean;
  views: number;
  created_at: string;
};

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export function publicUrl(bucket: string, path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
