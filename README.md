# Latinas en Australia

MVP (Fase 1) de la plataforma: registro, perfiles, directorio de negocios, muro, planes Gratuito y Pro con Stripe, y panel de administración.

Stack: Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Supabase (Postgres, Auth, Storage), Stripe, Vercel.

## Puesta en marcha

1. Instala dependencias: `npm install`
2. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql` completo en SQL Editor.
3. Copia `.env.example` a `.env.local` y llena los valores (Supabase: Project Settings > API).
4. En Supabase > Authentication > URL Configuration, agrega `http://localhost:3000/auth/callback` y la URL de producción como Redirect URLs.
5. Para Google: Authentication > Providers > Google (necesita un Client ID de Google Cloud).
6. Corre `npm run dev` y abre http://localhost:3000

## Primera administradora

Regístrate en la app y luego ejecuta en SQL Editor (con tu correo):

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'tu@correo.com');
```

Haz lo mismo con la otra socia. Después verás el enlace "Admin" en la barra superior.

## Pagos con Stripe

1. En Stripe crea un producto "Membresía Pro" con precio recurrente (mensual). Copia el `price_...` a `STRIPE_PRO_PRICE_ID`.
2. Copia tu clave secreta a `STRIPE_SECRET_KEY`.
3. Crea un webhook apuntando a `https://TU-DOMINIO/api/stripe/webhook` con los eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` y `customer.subscription.deleted`. Copia el signing secret a `STRIPE_WEBHOOK_SECRET`.
4. En local puedes probar con `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
5. Activa el Customer Portal en Stripe (Settings > Billing > Customer portal) para que las usuarias administren su suscripción.

El plan Pro se activa solo desde el webhook. Una usuaria no puede darse el plan Pro desde el navegador (lo impiden las políticas RLS y un trigger en la base de datos).

## Despliegue

1. Sube el repositorio a GitHub e impórtalo en Vercel.
2. Agrega las mismas variables de entorno (con `NEXT_PUBLIC_SITE_URL` apuntando a tu dominio).
3. Conecta el dominio propio.

## Estructura

- `src/app`: rutas (`/directorio`, `/muro`, `/perfil`, `/membresia`, `/admin`, `/negocios/...`)
- `src/app/actions`: acciones del servidor (auth, publicaciones, pagos, administración)
- `src/components`: componentes de interfaz
- `src/lib`: clientes de Supabase y Stripe, constantes
- `src/proxy.ts`: refresca la sesión y protege rutas privadas
- `supabase/schema.sql`: tablas, políticas de seguridad (RLS) y buckets de imágenes

## Pendiente para la Fase 2

Reseñas, favoritos, reporte de publicaciones, notificaciones por correo, eventos y calendario, y estadísticas más completas para negocios.
