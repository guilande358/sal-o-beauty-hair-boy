import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const ONESIGNAL_APP_ID = "2706bd51-0eee-427c-a1b4-3dfcc95d8f78";
const ONESIGNAL_API = "https://onesignal.com/api/v1/notifications";

const schema = z.object({
  nome_cliente: z.string().min(1).max(200),
  servico: z.string().min(1).max(200),
  data_hora: z.string().min(1).max(200),
});

export const Route = createFileRoute("/api/send-push-notification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ONESIGNAL_REST_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "ONESIGNAL_REST_API_KEY not configured" },
            { status: 500 },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Invalid payload", details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const { nome_cliente, servico, data_hora } = parsed.data;

        try {
          const res = await fetch(ONESIGNAL_API, {
            method: "POST",
            headers: {
              Authorization: `Basic ${apiKey}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              app_id: ONESIGNAL_APP_ID,
              headings: { en: "📅 Novo Agendamento!", pt: "📅 Novo Agendamento!" },
              contents: {
                en: `${nome_cliente} agendou ${servico} para ${data_hora}`,
                pt: `${nome_cliente} agendou ${servico} para ${data_hora}`,
              },
              included_segments: ["Subscribed Users"],
            }),
          });

          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.error("OneSignal error", res.status, json);
            return Response.json(
              { error: "OneSignal request failed", status: res.status, details: json },
              { status: 502 },
            );
          }
          return Response.json({ ok: true, onesignal: json });
        } catch (err) {
          console.error("OneSignal fetch failed", err);
          return Response.json({ error: "OneSignal fetch failed" }, { status: 502 });
        }
      },
    },
  },
});