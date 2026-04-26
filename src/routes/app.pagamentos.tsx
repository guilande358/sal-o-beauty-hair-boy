import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Calendar, Hash } from "lucide-react";
import { formatPtDate } from "@/lib/slots";

export const Route = createFileRoute("/app/pagamentos")({
  component: PagamentosPage,
});

interface PaymentRow {
  id: string;
  metodo: "mpesa" | "emola" | "transferencia_bancaria";
  valor_mzn: number;
  referencia: string;
  status: "pendente" | "confirmado" | "rejeitado";
  created_at: string;
  appointment_id: string;
  appointments: {
    data: string;
    hora_inicio: string;
    services: { nome: string } | null;
  } | null;
}

const METODO_LABEL: Record<PaymentRow["metodo"], string> = {
  mpesa: "M-Pesa",
  emola: "e-Mola",
  transferencia_bancaria: "Transferência",
};

const STATUS_VARIANT: Record<PaymentRow["status"], "default" | "secondary" | "destructive"> = {
  pendente: "secondary",
  confirmado: "default",
  rejeitado: "destructive",
};

const STATUS_LABEL: Record<PaymentRow["status"], string> = {
  pendente: "Aguarda confirmação",
  confirmado: "Confirmado",
  rejeitado: "Rejeitado",
};

function PagamentosPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<PaymentRow[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("payments")
      .select("id, metodo, valor_mzn, referencia, status, created_at, appointment_id, appointments(data, hora_inicio, services(nome))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as unknown as PaymentRow[]) ?? []));
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl">Pagamentos</h1>
          <p className="mt-2 text-muted-foreground">Histórico dos seus pagamentos</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/app/meus-agendamentos">Ver agendamentos</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-10 text-center text-muted-foreground">
            <Wallet className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Ainda não enviou nenhum pagamento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <Card key={p.id} className="border-border/60">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-serif text-xl">
                    {p.appointments?.services?.nome ?? "Serviço"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {p.appointments && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatPtDate(new Date(p.appointments.data + "T00:00:00"))} · {p.appointments.hora_inicio.slice(0, 5)}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5" /> {METODO_LABEL[p.metodo]}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5" /> {p.referencia}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-primary">{p.valor_mzn} MZN</span>
                  <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}