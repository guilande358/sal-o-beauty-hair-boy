import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Clock, X } from "lucide-react";
import { formatDateISO, formatPtDate } from "@/lib/slots";
import { toast } from "sonner";

export const Route = createFileRoute("/app/meus-agendamentos")({
  component: MyAppointmentsPage,
});

interface Booking {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  status: "booked" | "occupied";
  notas: string | null;
  services: { nome: string; preco_mzn: number } | null;
}

const CANCEL_HOURS_BEFORE = 2;

function MyAppointmentsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);

  const reload = () => {
    if (!user) return;
    supabase
      .from("appointments")
      .select("id, data, hora_inicio, hora_fim, status, notas, services(nome, preco_mzn)")
      .eq("user_id", user.id)
      .order("data", { ascending: false })
      .order("hora_inicio", { ascending: false })
      .then(({ data }) => setItems((data as Booking[]) ?? []));
  };

  useEffect(reload, [user]);

  const today = formatDateISO(new Date());
  const upcoming = items.filter((i) => i.data >= today);
  const past = items.filter((i) => i.data < today);

  const canCancel = (b: Booking) => {
    const dt = new Date(`${b.data}T${b.hora_inicio}`);
    return dt.getTime() - Date.now() > CANCEL_HOURS_BEFORE * 3600 * 1000;
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível cancelar", { description: error.message });
      return;
    }
    toast.success("Agendamento cancelado");
    reload();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl">Meus Agendamentos</h1>
          <p className="mt-2 text-muted-foreground">Histórico e próximas reservas</p>
        </div>
        <Button asChild>
          <Link to="/app/agenda">+ Novo</Link>
        </Button>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 font-serif text-2xl text-primary">Próximos</h2>
        {upcoming.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="p-8 text-center text-muted-foreground">
              Sem agendamentos futuros.{" "}
              <Link to="/app/agenda" className="text-primary hover:underline">Agendar agora</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <BookingCard key={b.id} b={b} onCancel={canCancel(b) ? cancel : undefined} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl text-muted-foreground">Passados</h2>
          <div className="space-y-3">
            {past.map((b) => <BookingCard key={b.id} b={b} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function BookingCard({ b, onCancel }: { b: Booking; onCancel?: (id: string) => void }) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-xl">{b.services?.nome ?? "Serviço removido"}</p>
          <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatPtDate(new Date(b.data + "T00:00:00"))}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {b.hora_inicio.slice(0, 5)}–{b.hora_fim.slice(0, 5)}</span>
          </p>
          {b.notas && <p className="mt-2 text-sm italic text-muted-foreground">"{b.notas}"</p>}
        </div>
        <div className="flex items-center gap-3">
          {b.services && <span className="font-serif text-lg text-primary">{b.services.preco_mzn} MZN</span>}
          {onCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O horário voltará a ficar disponível.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onCancel(b.id)}>Confirmar cancelamento</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
