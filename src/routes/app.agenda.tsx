import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import {
  computeSlots,
  formatDateISO,
  formatPtDate,
  isSalonOpen,
  minutesToTime,
  PT_MONTHS,
  PT_WEEKDAYS_SHORT,
  timeToMinutes,
  type AppointmentSlotRow,
  type Slot,
} from "@/lib/slots";

const searchSchema = z.object({
  service: z.string().optional(),
});

export const Route = createFileRoute("/app/agenda")({
  validateSearch: (s) => searchSchema.parse(s),
  component: AgendaPage,
});

interface Service {
  id: string;
  nome: string;
  preco_mzn: number;
  duracao_min: number;
}

function AgendaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [appointments, setAppointments] = useState<AppointmentSlotRow[]>([]);
  const [ownIds, setOwnIds] = useState<Set<string>>(new Set());
  const [services, setServices] = useState<Service[]>([]);
  const [bookingSlot, setBookingSlot] = useState<Slot | null>(null);
  const [selectedService, setSelectedService] = useState<string>(search.service ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch services
  useEffect(() => {
    supabase
      .from("services")
      .select("id, nome, preco_mzn, duracao_min")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => setServices(data ?? []));
  }, []);

  // Fetch appointments for selected date
  const reload = () => {
    if (!user) return;
    const iso = formatDateISO(selectedDate);
    supabase
      .from("appointments")
      .select("id, hora_inicio, hora_fim, status")
      .eq("data", iso)
      .then(({ data }) => setAppointments((data as AppointmentSlotRow[]) ?? []));
    supabase
      .from("appointments")
      .select("id")
      .eq("data", iso)
      .eq("user_id", user.id)
      .then(({ data }) => setOwnIds(new Set((data ?? []).map((r) => r.id))));
  };

  useEffect(reload, [selectedDate, user]);

  const slots = useMemo(() => computeSlots(appointments, ownIds), [appointments, ownIds]);
  const open = isSalonOpen(selectedDate);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const cells: ({ d: Date; inMonth: boolean; isPast: boolean })[] = [];

    // Leading
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), -startWeekday + i + 1);
      cells.push({ d, inMonth: false, isPast: d < today });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
      cells.push({ d, inMonth: true, isPast: d < today });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].d;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      cells.push({ d, inMonth: false, isPast: false });
    }
    return cells;
  }, [viewMonth, today]);

  const openBooking = (slot: Slot) => {
    if (slot.status !== "free") return;
    setBookingSlot(slot);
    setNotes("");
  };

  const confirmBooking = async () => {
    if (!user || !bookingSlot) return;
    if (!selectedService) {
      toast.error("Escolha um serviço");
      return;
    }
    const svc = services.find((s) => s.id === selectedService);
    if (!svc) return;

    const startMin = timeToMinutes(bookingSlot.start);
    const endMin = startMin + svc.duracao_min;
    const horaFim = minutesToTime(endMin);
    const closeMin = 18 * 60;
    if (endMin > closeMin) {
      toast.error("Este serviço não cabe no horário restante. Escolha outro horário.");
      return;
    }

    // Check overlap with current slots within service duration
    const hasConflict = appointments.some((a) => {
      const aStart = timeToMinutes(a.hora_inicio);
      const aEnd = timeToMinutes(a.hora_fim);
      return aStart < endMin && aEnd > startMin;
    });
    if (hasConflict) {
      toast.error("Conflito com outro agendamento. Escolha outro horário.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      service_id: svc.id,
      data: formatDateISO(selectedDate),
      hora_inicio: bookingSlot.start + ":00",
      hora_fim: horaFim + ":00",
      status: "booked",
      notas: notes.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Não foi possível agendar", { description: error.message });
      return;
    }
    toast.success("Agendamento confirmado!", {
      description: `${svc.nome} · ${formatPtDate(selectedDate)} às ${bookingSlot.start}`,
    });
    setBookingSlot(null);
    if (search.service) {
      navigate({ to: "/app/agenda", search: {} });
    }
    reload();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="font-serif text-4xl">Agenda</h1>
        <p className="mt-2 text-muted-foreground">Escolha um dia e clique num horário livre para agendar.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Calendar */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                className="rounded-md p-2 hover:bg-secondary"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="font-serif text-xl">
                {PT_MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </h2>
              <button
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                className="rounded-md p-2 hover:bg-secondary"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {PT_WEEKDAYS_SHORT.map((d) => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarDays.map((c, i) => {
                const isSelected = formatDateISO(c.d) === formatDateISO(selectedDate);
                const disabled = c.isPast || !isSalonOpen(c.d);
                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => setSelectedDate(c.d)}
                    className={`aspect-square rounded-md text-sm transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : c.inMonth
                          ? disabled
                            ? "text-muted-foreground/40 cursor-not-allowed"
                            : "hover:bg-secondary"
                          : "text-muted-foreground/30"
                    }`}
                  >
                    {c.d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-2 border-t border-border/60 pt-4 text-xs">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-free" /> Livre</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-booked" /> Marcado</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-occupied" /> Ocupado pelo salão</div>
            </div>
          </CardContent>
        </Card>

        {/* Slots */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <h2 className="font-serif text-2xl">{formatPtDate(selectedDate)}</h2>
            {!open ? (
              <p className="mt-6 text-muted-foreground">O salão está fechado neste dia (Seg–Sáb 09:00–18:00).</p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {slots.map((slot) => {
                  const colorClasses =
                    slot.status === "free"
                      ? "bg-status-free/10 border-status-free/40 text-foreground hover:bg-status-free/20"
                      : slot.status === "booked"
                        ? slot.isOwn
                          ? "bg-primary/10 border-primary/40 text-primary cursor-default"
                          : "bg-status-booked/10 border-status-booked/40 text-muted-foreground cursor-not-allowed"
                        : "bg-status-occupied/10 border-status-occupied/40 text-muted-foreground cursor-not-allowed";
                  const label =
                    slot.status === "free"
                      ? "Livre"
                      : slot.status === "booked"
                        ? slot.isOwn ? "O seu" : "Marcado"
                        : "Ocupado";
                  return (
                    <button
                      key={slot.start}
                      disabled={slot.status !== "free"}
                      onClick={() => openBooking(slot)}
                      className={`flex flex-col items-center rounded-md border p-2 text-center transition-colors ${colorClasses}`}
                    >
                      <span className="flex items-center gap-1 font-medium text-sm">
                        <Clock className="h-3 w-3" />
                        {slot.start}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!bookingSlot} onOpenChange={(o) => !o && setBookingSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Confirmar Agendamento</DialogTitle>
            <DialogDescription>
              {formatPtDate(selectedDate)} · {bookingSlot?.start}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
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
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Algum pedido especial?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingSlot(null)}>Cancelar</Button>
            <Button onClick={confirmBooking} disabled={submitting}>
              {submitting ? "A confirmar..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
