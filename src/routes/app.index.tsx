import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Scissors, Clock } from "lucide-react";
import { formatDateISO, formatPtDate } from "@/lib/slots";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

interface NextAppointment {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  services: { nome: string } | null;
}

function AppHome() {
  const { user } = useAuth();
  const [nome, setNome] = useState<string>("");
  const [next, setNext] = useState<NextAppointment | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nome")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setNome(data?.nome || ""));

    const today = formatDateISO(new Date());
    supabase
      .from("appointments")
      .select("id, data, hora_inicio, hora_fim, services(nome)")
      .eq("user_id", user.id)
      .eq("status", "booked")
      .gte("data", today)
      .order("data", { ascending: true })
      .order("hora_inicio", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setNext(data as NextAppointment | null));
  }, [user]);

  const greeting = nome ? `Olá, ${nome.split(" ")[0]}!` : "Bem-vindo!";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-4xl">{greeting}</h1>
        <p className="mt-2 text-muted-foreground">Pronto para o próximo corte?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Próximo agendamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {next ? (
              <div>
                <p className="font-serif text-2xl text-primary">{next.services?.nome ?? "Reserva"}</p>
                <p className="mt-1 text-muted-foreground">
                  {formatPtDate(new Date(next.data + "T00:00:00"))}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" /> {next.hora_inicio.slice(0, 5)} – {next.hora_fim.slice(0, 5)}
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/app/meus-agendamentos">Ver todos</Link>
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">Ainda não tem agendamentos futuros.</p>
                <Button asChild className="mt-4">
                  <Link to="/app/agenda">Agendar agora</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-gold">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Scissors className="h-5 w-5" /> Marcar novo corte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="opacity-90">Escolhe o teu horário e estilo em poucos cliques.</p>
            <div className="flex gap-2">
              <Button asChild variant="secondary">
                <Link to="/app/agenda">Abrir Agenda</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <Link to="/app/servicos">Ver Cortes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
