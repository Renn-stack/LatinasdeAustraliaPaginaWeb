"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithGoogle, signInWithPassword, signUp, type AuthState } from "@/app/actions/auth";

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? signInWithPassword : signUp,
    {}
  );
  const isLogin = mode === "login";

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{isLogin ? "Bienvenida de vuelta" : "Únete a la comunidad"}</h1>
        <p className="mt-1 text-sm text-muted">
          {isLogin ? "Ingresa para ver el muro y el directorio." : "Crea tu cuenta gratis en un minuto."}
        </p>

        <form action={signInWithGoogle} className="mt-6">
          <button className="btn-ghost w-full">Continuar con Google</button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />o con tu correo<span className="h-px flex-1 bg-border" />
        </div>

        <form action={action} className="space-y-3">
          {next && <input type="hidden" name="next" value={next} />}
          {!isLogin && (
            <input name="full_name" required placeholder="Tu nombre" className="input" autoComplete="name" />
          )}
          <input name="email" type="email" required placeholder="Correo electrónico" className="input" autoComplete="email" />
          <input
            name="password"
            type="password"
            required
            minLength={isLogin ? undefined : 8}
            placeholder={isLogin ? "Contraseña" : "Contraseña (mínimo 8 caracteres)"}
            className="input"
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.message && <p className="text-sm text-accent">{state.message}</p>}
          <button className="btn w-full" disabled={pending}>
            {pending ? "Un momento..." : isLogin ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {isLogin ? "¿Aún no tienes cuenta? " : "¿Ya tienes cuenta? "}
          <Link href={isLogin ? "/registro" : "/ingresar"} className="font-semibold text-brand">
            {isLogin ? "Regístrate" : "Ingresa"}
          </Link>
        </p>
      </div>
    </div>
  );
}
