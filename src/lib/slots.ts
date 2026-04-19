/**
 * Slot generation & helpers for the salon Agenda.
 *
 * Default schedule: Mon (1) – Sat (6), 09:00 → 18:00, 30-minute slots.
 */

export const SLOT_MINUTES = 30;
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 18;

export type SlotStatus = "free" | "booked" | "occupied";

export interface Slot {
  start: string; // "HH:MM"
  end: string;
  status: SlotStatus;
  isOwn?: boolean;
  ownAppointmentId?: string;
}

export function isSalonOpen(date: Date): boolean {
  const day = date.getDay();
  // 0 = Sunday closed
  return day >= 1 && day <= 6;
}

export function generateDailySlots(): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const total = (CLOSE_HOUR - OPEN_HOUR) * (60 / SLOT_MINUTES);
  for (let i = 0; i < total; i++) {
    const startMin = OPEN_HOUR * 60 + i * SLOT_MINUTES;
    const endMin = startMin + SLOT_MINUTES;
    slots.push({ start: toHHMM(startMin), end: toHHMM(endMin) });
  }
  return slots;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  return toHHMM(min);
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Combine generated slots with appointments to produce a status per slot.
 * `appointments` is the list of all rows for that date (no user_id needed for status).
 */
export interface AppointmentSlotRow {
  id: string;
  hora_inicio: string;
  hora_fim: string;
  status: "booked" | "occupied";
}

export interface OwnAppointmentRow extends AppointmentSlotRow {
  user_id: string;
}

export function computeSlots(
  appointments: AppointmentSlotRow[],
  ownAppointmentIds: Set<string>,
): Slot[] {
  const base = generateDailySlots();
  return base.map((s) => {
    const startMin = timeToMinutes(s.start);
    const endMin = timeToMinutes(s.end);

    let status: SlotStatus = "free";
    let isOwn = false;
    let ownAppointmentId: string | undefined;

    for (const a of appointments) {
      const aStart = timeToMinutes(a.hora_inicio);
      const aEnd = timeToMinutes(a.hora_fim);
      // overlap
      if (aStart < endMin && aEnd > startMin) {
        if (a.status === "occupied") {
          status = "occupied";
        } else if (status !== "occupied") {
          status = "booked";
        }
        if (ownAppointmentIds.has(a.id)) {
          isOwn = true;
          ownAppointmentId = a.id;
        }
      }
    }
    return { ...s, status, isOwn, ownAppointmentId };
  });
}

export const PT_MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const PT_WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function formatPtDate(d: Date): string {
  return `${d.getDate()} de ${PT_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}
