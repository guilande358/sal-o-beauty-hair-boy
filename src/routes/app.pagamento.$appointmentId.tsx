import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Building2, Copy, Check, Calendar, Clock, ArrowLeft } from "lucide-react";
import { formatPtDate } from "@/lib/slots";
import { toast } from "sonner";

export const Route = createFileRoute("/app/pagamento/$appointmentId")({
  component: PagamentoPage,
});

interface AppointmentDetail {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  services: { nome: string; preco_mzn: number } | null;
}

interface PaymentMethod {
  id: string;
  tipo: "mpesa" | "emola" | "transferencia_bancaria";
  titular: string;
  numero: string;
  instrucoes: string | null;
}

const METODO_INFO: Record<PaymentMethod["tipo"], { label: string; icon: typeof Smartphone; color: string }> = {
  mpesa: { label: "M-Pesa (Vodacom)", icon: Smartphone, color: "text-red-500" },
  emola: { label: "e-Mola (Movitel)", icon: Smartphone, color: "text-yellow-500" },
  transferencia_bancaria: { label: "Transferência Bancária", icon: Building2, color: "text-blue-400" },
};

function PagamentoPage() {
  const { appointmentId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod["tipo"]>("mpesa");
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");
  const [comprovativo, setComprovativo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("appointments")
      .select("id, data, hora_inicio, hora_fim, services(nome, preco_mzn)")
      .eq("id", appointmentId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setAppointment(data as unknown as AppointmentDetail | null));

    supabase
      .from("payment_methods")
      .select("id, tipo, titular, numero, instrucoes")
      .eq("ativo", true)
      .then(({ data }) => setMethods((data as PaymentMethod[]) ?? []));

    supabase
      .from("payments")
      .select("status")
      .eq("appointment_id", appointmentId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setExistingStatus((data as { status: string } | null)?.status ?? null));
  }, [appointmentId, user]);

  const copy = (txt: string, key: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const submit = async () => {
    if (!user || !appointment?.services) return;
    if (!referencia.trim()) {
      toast.error("Indique a referência da transação");
      return;
    }
    setSubmitting(true);

    let comprovativoUrl: string | null = null;
    if (comprovativo) {
      const ext = comprovativo.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${appointmentId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("comprovativos")
        .upload(path, comprovativo);
      if (upErr) {
        toast.error("Erro ao carregar comprovativo", { description: upErr.message });
        setSubmitting(false);
        return;
      }
      comprovativoUrl = path;
    }

    const { error } = await supabase.from("payments").insert({
      appointment_id: appointmentId,
      user_id: user.id,
      metodo: selectedMethod,
      valor_mzn: appointment.services.preco_mzn,
      referencia: referencia.trim(),
      comprovativo_url: comprovativoUrl,
      notas: notas.trim() || null,
      status: "pendente",
    });
    setSubmitting(false);

    if (error) {
      toast.error("Não foi possível registar o pagamento", { description: error.message });
      return;
    }
    toast.success("Pagamento enviado!", { description: "A barbearia irá confirmar em breve." });
    navigate({ to: "/app/pagamentos" });
  };

  if (!appointment) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  const total = appointment.services?.preco_mzn ?? 0;
  const selected = methods.find((m) => m.tipo === selectedMethod);

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/app/meus-agendamentos">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="font-serif text-4xl">Pagamento</h1>
        <p className="mt-2 text-muted-foreground">Pague e envie o comprovativo para confirmar.</p>
      </div>

      {/* Resumo */}
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-serif text-xl">{appointment.services?.nome}</p>
            <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {formatPtDate(new Date(appointment.data + "T00:00:00"))}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {appointment.hora_inicio.slice(0, 5)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="font-display text-3xl text-primary">{total} MZN</p>
          </div>
        </CardContent>
      </Card>

      {existingStatus && (
        <Card className="mb-6 border-accent/40 bg-accent/5">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm">Já existe um pagamento registado para este agendamento.</p>
            <Badge variant={existingStatus === "confirmado" ? "default" : "secondary"}>
              {existingStatus}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Métodos */}
      <h2 className="font-serif text-2xl mb-3">1. Escolha o método</h2>
      <RadioGroup value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as PaymentMethod["tipo"])} className="grid gap-3 sm:grid-cols-3 mb-6">
        {(["mpesa", "emola", "transferencia_bancaria"] as const).map((tipo) => {
          const info = METODO_INFO[tipo];
          const Icon = info.icon;
          return (
            <Label
              key={tipo}
              htmlFor={tipo}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-md border p-4 text-center transition-all ${
                selectedMethod === tipo
                  ? "border-primary bg-primary/10 shadow-gold"
                  : "border-border/60 hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value={tipo} id={tipo} className="sr-only" />
              <Icon className={`h-7 w-7 ${info.color}`} />
              <span className="font-display text-sm">{info.label}</span>
            </Label>
          );
        })}
      </RadioGroup>

      {/* Detalhes do método */}
      {selected && (
        <Card className="mb-6 border-border/60">
          <CardContent className="p-5">
            <h3 className="font-display text-lg text-primary">Dados para pagamento</h3>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-sm bg-secondary/50 p-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Titular</p>
                  <p className="font-medium">{selected.titular}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-sm bg-secondary/50 p-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    {selected.tipo === "transferencia_bancaria" ? "Conta / NIB" : "Número"}
                  </p>
                  <p className="font-mono text-base font-medium">{selected.numero}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => copy(selected.numero, "num")}>
                  {copied === "num" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-sm bg-secondary/50 p-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Valor</p>
                  <p className="font-mono text-base font-medium">{total} MZN</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => copy(String(total), "val")}>
                  {copied === "val" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {selected.instrucoes && (
                <p className="rounded-sm border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                  {selected.instrucoes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmação */}
      <h2 className="font-serif text-2xl mb-3">2. Confirme o seu pagamento</h2>
      <Card className="border-border/60">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="ref">Referência da transação *</Label>
            <Input
              id="ref"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ex: ID da transação M-Pesa, nº comprovativo..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp">Comprovativo (opcional)</Label>
            <Input
              id="comp"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setComprovativo(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">Imagem ou PDF do recibo da transação.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="not">Notas (opcional)</Label>
            <Textarea
              id="not"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Algo que devamos saber?"
              maxLength={500}
            />
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
            {submitting ? "A enviar..." : "Enviar comprovativo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}