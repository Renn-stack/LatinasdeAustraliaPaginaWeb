import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Latinas en Australia",
  description:
    "Comunidad, emprendimiento y networking para mujeres latinas en Australia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} Latinas en Australia. Hecho con cariño por y para la comunidad.
        </footer>
      </body>
    </html>
  );
}
