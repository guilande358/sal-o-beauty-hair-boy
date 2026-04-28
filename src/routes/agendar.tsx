import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import {
  formatDateISO,
  formatPtDate,
  generateDailySlots,
  isSalonOpen,
  minutesToTime,
  timeToMinutes,
} from "@/lib/slots";
import { notifyNewAppointment } from "@/lib/notify";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar Online — Barbearia" },
      {
        name: "description",
        content:
          "Reserve o seu corte sem criar conta. Escolha serviço, data e hora em segundos.",
      },
    ],
  }),
  component: PublicBookingPage,
});

interface Service {
  id: string;
  nome: string;
  preco_mzn: number;
  duracao_min: number;
}

const formSchema = z.object({
  nome: z.string().trim().min(2, "Nome demasiado curto").max(120),
  telefone: z
    .string()
    .trim()
    .min(7, "Telefone inválido")
    .max(20)
    .regex(/^[0-9+\s-]+$/, "Apenas números, espaços, + e -"),
  service_id: z.string().uuid("Escolha um serviço"),
  data: z.string().min(1, "Escolha uma data"),
  hora_inicio: z.string().min(1, "Escolha um horário"),
});

function genCodigo(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function PublicBookingPage() {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [services, setServices] = useState<Service[]>([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [dataISO, setDataISO] = useState(formatDateISO(today));
  const [hora, setHora] = useState("");
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ codigo: string; quando: string } | null>(null);

  useEffect(() => {
    supabase
      .from("services")
      .select("id, nome, preco_mzn, duracao_min")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => setServices(data ?? []));
  }, []);

  // Reload busy times when date changes
  useEffect(() => {
    if (!dataISO) return;
    supabase
      .from("appointments")
      .select("hora_inicio, hora_fim")
      .eq("data", dataISO)
      .then(({ data }) => {
        const taken = new Set<string>();
        for (const a of data ?? []) {
          const start = timeToMinutes(a.hora_inicio);
          const end = timeToMinutes(a.hora_fim);
          for (let m = start; m < end; m += 30) {
            taken.add(minutesToTime(m));
          }
        }
        setBusy(taken);
      });
  }, [dataISO]);

  const dateObj = useMemo(() => {
    const [y, m, d] = dataISO.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [dataISO]);
  const open = isSalonOpen(dateObj);
  const slots = useMemo(() => generateDailySlots(), []);
  const minDate = formatDateISO(today);

  const submit = async () => {
    const parsed = formSchema.safeParse({
      nome,
      telefone,
      service_id: serviceId,
      data: dataISO,
      hora_inicio: hora,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    if (!open) {
      toast.error("Salão fechado neste dia (Seg–Sáb).");
      return;
    }
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;

    const startMin = timeToMinutes(hora);
    const endMin = startMin + svc.duracao_min;
    if (endMin > 18 * 60) {
      toast.error("Este serviço não cabe no horário. Escolha outro.");
      return;
    }
    // Check overlap
    for (let m = startMin; m < endMin; m += 30) {
      if (busy.has(minutesToTime(m))) {
        toast.error("Horário indisponível. Escolha outro.");
        return;
      }
    }

    setSubmitting(true);
    const codigo = genCodigo();
    const { error } = await supabase.from("appointments").insert({
      user_id: null,
      service_id: svc.id,
      data: dataISO,
      hora_inicio: hora + ":00",
      hora_fim: minutesToTime(endMin) + ":00",
      status: "booked",
      nome_cliente: nome.trim(),
      telefone: telefone.trim(),
      codigo,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Não foi possível agendar", { description: error.message });
      return;
    }

    const quando = `${formatPtDate(dateObj)} às ${hora}`;
    // Fire-and-forget notification to the owner
    void notifyNewAppointment({
      nome_cliente: nome.trim(),
      servico: svc.nome,
      data_hora: quando,
    });
    setSuccess({ codigo, quando });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border/60">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-status-free" />
            <h1 className="mt-4 font-serif text-3xl">Agendamento confirmado</h1>
            <p className="mt-2 text-muted-foreground">{success.quando}</p>
            <div className="mt-6 rounded-md border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Código de confirmação</p>
              <p className="mt-1 font-mono text-2xl tracking-widest">{success.codigo}</p>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Guarde este código. Apresente-o no balcão à chegada.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/"><Logo /></Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Já tenho conta
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-serif text-4xl">Agendar online</h1>
        <p className="mt-2 text-muted-foreground">
          Sem necessidade de criar conta. Receba o código de confirmação em segundos.
        </p>

        <Card className="mt-8 border-border/60">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (M-Pesa / e-Mola)</Label>
              <Input
                id="telefone"
                inputMode="tel"
                placeholder="84 123 4567"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger><SelectValue placeholder="Escolha um serviço" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome} — {s.preco_mzn} MZN ({s.duracao_min} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  min={minDate}
                  value={dataISO}
                  onChange={(e) => { setDataISO(e.target.value); setHora(""); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={hora} onValueChange={setHora} disabled={!open}>
                  <SelectTrigger>
                    <SelectValue placeholder={open ? "Escolha horário" : "Salão fechado"} />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((s) => {
                      const taken = busy.has(s.start);
                      return (
                        <SelectItem key={s.start} value={s.start} disabled={taken}>
                          {s.start} {taken ? "— ocupado" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={submit} disabled={submitting} className="w-full">
              {submitting ? "A confirmar..." : "Confirmar agendamento"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Pagamento feito no salão ou via M-Pesa / e-Mola após a confirmação.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}