import { supabase } from "@/integrations/supabase/client";

export interface NewAppointmentPushPayload {
  nome_cliente: string;
  servico: string;
  data_hora: string; // human-readable, e.g. "12 de Maio de 2026 às 14:30"
}

/**
 * Fire-and-forget push notification trigger. Never throws — failure must not
 * block the booking flow.
 */
export async function notifyNewAppointment(payload: NewAppointmentPushPayload): Promise<void> {
  try {
    await fetch("/api/send-push-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Silent — do not interrupt the booking UX
    console.warn("Push notification failed", err);
  }
  // Keep import for typing parity / possible future use
  void supabase;
}