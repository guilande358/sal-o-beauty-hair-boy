import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { OneSignalLoader } from "@/components/OneSignalLoader";
import { CalendarDays, Phone, User as UserIcon, Bell } from "lucide-react";
import { formatPtDate } from "@/lib/slots";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Painel do Proprietário" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

interface AdminAppointment {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  nome_cliente: string | null;
  telefone: string | null;
  codigo: string | null;
  notas: string | null;
  service_id: string | null;
  user_id: string | null;
  created_at: string;
}

function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [services, setServices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Auth + role gate
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/admin" } as never });
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, authLoading, navigate]);

  // Load services map
  useEffect(() => {
    supabase
      .from("services")
      .select("id, nome")
      .then(({ data }) => {
        const map: Record<string, string> = {};
        for (const s of data ?? []) map[s.id] = s.nome;
        setServices(map);
      });
  }, []);

  // Load + subscribe to realtime appointments
  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .gte("data", new Date().toISOString().slice(0, 10))
        .order("data", { ascending: true })
        .order("hora_inicio", { ascending: true })
        .limit(200);
      setAppointments((data as AdminAppointment[]) ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("admin-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => { load(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (authLoading || isAdmin === null) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md border-border/60">
          <CardContent className="p-8 text-center">
            <h1 className="font-serif text-3xl">Acesso restrito</h1>
            <p className="mt-2 text-muted-foreground">
              Esta área é exclusiva ao proprietário.
            </p>
            <Button asChild className="mt-6"><Link to="/">Voltar ao início</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayCount = appointments.filter((a) => a.data === todayISO).length;

  return (
    <>
      <OneSignalLoader />
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link to="/"><Logo /></Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={signOut}>Sair</Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl">Painel do Proprietário</h1>
              <p className="mt-2 text-muted-foreground">
                Atualizações em tempo real. Clique no sino do OneSignal (canto inferior) para ativar notificações push.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-border/60 px-4 py-3">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Hoje</p>
                <p className="font-serif text-2xl">{todayCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {loading ? (
              <p className="text-muted-foreground">A carregar agendamentos…</p>
            ) : appointments.length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Sem agendamentos futuros.
                </CardContent>
              </Card>
            ) : (
              appointments.map((a) => {
                const dateObj = (() => {
                  const [y, m, d] = a.data.split("-").map(Number);
                  return new Date(y, m - 1, d);
                })();
                return (
                  <Card key={a.id} className="border-border/60">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-md bg-secondary p-3">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {a.nome_cliente ?? "Cliente registado"}{" "}
                            {a.codigo && (
                              <span className="ml-2 rounded bg-secondary px-2 py-0.5 font-mono text-xs">
                                {a.codigo}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {services[a.service_id ?? ""] ?? "Serviço"} · {formatPtDate(dateObj)} ·{" "}
                            {a.hora_inicio.slice(0, 5)}–{a.hora_fim.slice(0, 5)}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {a.telefone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {a.telefone}
                              </span>
                            )}
                            {a.user_id && (
                              <span className="inline-flex items-center gap-1">
                                <UserIcon className="h-3 w-3" /> Conta registada
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-status-booked/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-status-booked">
                        {a.status}
                      </span>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </main>
      </div>
    </>
  );
}