import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-serif text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que procura não existe.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Salão [Nome do Salão] — Beleza & Elegância em Moçambique" },
      {
        name: "description",
        content:
          "Salão de beleza em Moçambique. Tranças, cortes, manicure, alisamento e mais. Agende online em segundos.",
      },
      { property: "og:title", content: "Salão [Nome do Salão] — Beleza & Elegância em Moçambique" },
      { property: "og:description", content: "Salão [Nome do Salão] is a booking website for a hair salon, allowing clients to view services, book appointments, and manage their schedule." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Salão [Nome do Salão] — Beleza & Elegância em Moçambique" },
      { name: "description", content: "Salão [Nome do Salão] is a booking website for a hair salon, allowing clients to view services, book appointments, and manage their schedule." },
      { name: "twitter:description", content: "Salão [Nome do Salão] is a booking website for a hair salon, allowing clients to view services, book appointments, and manage their schedule." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c5fdb90b-9c41-4386-8597-54f4f6a321af/id-preview-a001f399--285d510b-7dca-49f1-8b50-4554daa009f5.lovable.app-1776614041899.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c5fdb90b-9c41-4386-8597-54f4f6a321af/id-preview-a001f399--285d510b-7dca-49f1-8b50-4554daa009f5.lovable.app-1776614041899.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
