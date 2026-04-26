import { Outlet, createFileRoute, redirect, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Home, Scissors, Calendar, ListChecks, User, LogOut, Menu, X, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

const navItems: { to: "/app" | "/app/servicos" | "/app/agenda" | "/app/meus-agendamentos" | "/app/pagamentos" | "/app/perfil"; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/servicos", label: "Cortes", icon: Scissors },
  { to: "/app/agenda", label: "Agenda", icon: Calendar },
  { to: "/app/meus-agendamentos", label: "Meus Agendamentos", icon: ListChecks },
  { to: "/app/pagamentos", label: "Pagamentos", icon: Wallet },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2">
              <LogOut className="h-4 w-4" />
              <span className="ml-1">Sair</span>
            </Button>
          </nav>
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <nav className="border-t border-border/60 bg-background lg:hidden">
            <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-secondary"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <button onClick={handleSignOut} className="mt-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </nav>
        )}
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
