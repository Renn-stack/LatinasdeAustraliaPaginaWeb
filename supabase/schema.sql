-- Latinas en Australia: esquema del MVP
-- Ejecutar completo en Supabase > SQL Editor

create extension if not exists "pgcrypto";

-- ============ PERFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  city text,
  state text,
  bio text,
  instagram text,
  facebook text,
  website text,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Crea el perfil automaticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ NEGOCIOS ============
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  category text not null,
  description text,
  logo_url text,
  gallery text[] not null default '{}',
  city text not null,
  state text,
  email text,
  phone text,
  website text,
  instagram text,
  facebook text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  is_featured boolean not null default false,
  is_hidden boolean not null default false,
  views integer not null default 0,
  created_at timestamptz not null default now()
);
create index businesses_category_idx on public.businesses (category);
create index businesses_city_idx on public.businesses (city);
create index businesses_name_idx on public.businesses using gin (to_tsvector('spanish', name));

-- ============ PUBLICACIONES ============
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  image_url text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);

create table public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

-- ============ SUSCRIPCIONES ============
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- ============ FUNCIONES AUXILIARES ============
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.increment_business_views(b_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.businesses set views = views + 1 where id = b_id;
$$;

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.subscriptions enable row level security;

-- Perfiles: visibles para usuarias registradas; cada una edita el suyo
create policy "perfiles visibles" on public.profiles for select to authenticated using (true);
create policy "editar mi perfil" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and is_admin = (select is_admin from public.profiles where id = auth.uid()));
create policy "admin edita perfiles" on public.profiles for update to authenticated using (public.is_admin());

-- Negocios: el directorio es publico para descubrir; dueña y admin gestionan
create policy "negocios publicos" on public.businesses for select using (not is_hidden or owner_id = auth.uid() or public.is_admin());
create policy "crear mi negocio" on public.businesses for insert to authenticated
  with check (owner_id = auth.uid() and plan = 'free' and is_featured = false and views = 0 and is_hidden = false);
create policy "editar mi negocio" on public.businesses for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy "borrar mi negocio" on public.businesses for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- Publicaciones
create policy "ver publicaciones" on public.posts for select to authenticated using (not is_hidden or author_id = auth.uid() or public.is_admin());
create policy "crear publicacion" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and not exists (select 1 from public.profiles where id = auth.uid() and is_banned));
create policy "editar publicacion" on public.posts for update to authenticated using (author_id = auth.uid() or public.is_admin());
create policy "borrar publicacion" on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- Me gusta
create policy "ver likes" on public.likes for select to authenticated using (true);
create policy "dar like" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "quitar like" on public.likes for delete to authenticated using (user_id = auth.uid());

-- Comentarios
create policy "ver comentarios" on public.comments for select to authenticated using (true);
create policy "crear comentario" on public.comments for insert to authenticated
  with check (author_id = auth.uid() and not exists (select 1 from public.profiles where id = auth.uid() and is_banned));
create policy "borrar comentario" on public.comments for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- Suscripciones: solo lectura para la dueña; las escribe el webhook (service role)
create policy "ver mi suscripcion" on public.subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Evita que una usuaria se auto-asigne plan pro o destacado desde el cliente
create or replace function public.protect_business_billing()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    new.plan := old.plan;
    new.is_featured := old.is_featured;
    new.views := old.views;
    new.owner_id := old.owner_id;
  end if;
  return new;
end; $$;

create trigger businesses_protect_billing
  before update on public.businesses
  for each row execute function public.protect_business_billing();

-- ============ STORAGE ============
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('business-images', 'business-images', true),
  ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "imagenes publicas" on storage.objects for select
  using (bucket_id in ('avatars', 'business-images', 'post-images'));
create policy "subir a mi carpeta" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'business-images', 'post-images') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "borrar de mi carpeta" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'business-images', 'post-images') and (storage.foldername(name))[1] = auth.uid()::text);

-- Para dar permisos de admin a una socia (reemplaza el correo):
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'tu@correo.com');
