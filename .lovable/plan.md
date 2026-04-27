## Visão geral

Adicionar **três blocos novos** ao site, mantendo todo o sistema atual de clientes (`/app/*`, agendamento autenticado, pagamentos M-Pesa/e-Mola) intacto:

1. **Formulário público** `/agendar` — qualquer pessoa marca somente com conta. 
2. **Painel do propriet­ário `/admin**` — vê todos os agendamentos (autenticados + públicos) em tempo real, com calendário, contadores e geração de PDF de comprovativo por agendamento.
3. **PWA + Web Push completo** — instalável, com notificação push nativa quando chega novo agendamento (também quando a app está fechada).

Email de aviso ao proprietário usa **Lovable Emails como principal** e **Resend como fallback** automático se Lovable falhar.

---

## 1. Base de dados (migration)

Em vez de criar tabelas paralelas (`agendamentos`, `proprietario`) que duplicariam o sistema, **estende o esquema existente** para suportar reservas públicas anónimas e push:

- `appointments`:
  - `user_id` continua a permitir NULL (já permite). Adicionar colunas:
    - `nome_cliente TEXT` — preenchido por reservas anónimas
    - `telefone TEXT` — idem
    - `comprovativo_url TEXT` — link para PDF/imagem opcional submetida no formulário público
    - `codigo TEXT` — código curto único (ex.: `BBR-7F3K`) para o PDF de comprovativo
  - Política RLS nova: `INSERT` público (anon) permitido **apenas** se `user_id IS NULL` e `nome_cliente IS NOT NULL` e `status = 'booked'`.
  - `REPLICA IDENTITY FULL` + `ALTER PUBLICATION supabase_realtime ADD TABLE appointments` para Realtime.
- `push_subscriptions` — nova tabela:
  - `id, user_id (FK auth.users), endpoint UNIQUE, p256dh, auth, created_at`
  - RLS: o próprio user faz INSERT/SELECT/DELETE das suas; admins veem todas.
- `notification_settings` — nova tabela single-row para guardar email do proprietário (destinatário dos avisos), editável no /admin.
- Bucket Storage **público** novo: `comprovativos-publicos` (separado do `comprovativos` privado existente, porque o formulário anónimo precisa de upload sem autenticação). Política: INSERT anon permitido, SELECT público.

A conta admin é criada **manualmente** pelo utilizador via registo normal + INSERT em `user_roles` (instruções no fim).

---

## 2. Formulário público `/agendar`

Nova rota `src/routes/agendar.tsx` (não autenticada):

- Campos: `nome_cliente*`, `telefone*`, `servico` (select de `services` ativos), `data` (date picker, Mon-Sat), `hora` (slots de 30min livres, lê do view `appointment_slots`), `comprovativo` (upload opcional para `comprovativos-publicos`).
- Validação Zod no client.
- Submissão: `INSERT` em `appointments` com `user_id=null`, gera `codigo` aleatório, depois chama server function `notify-new-appointment` (envia email + push ao admin).
- Página de sucesso mostra resumo + código de referência + botão "Agendar outro".
- Ligação do header da landing: novo botão "Agendar sem conta".

---

## 3. Painel `/admin`

Nova área protegida (role admin obrigatória). Estrutura de rotas:

- `src/routes/admin.tsx` — layout + guard (`beforeLoad` valida sessão **e** `has_role(uid, 'admin')`; redirect para `/login` ou `/` se falhar).
- `src/routes/admin.index.tsx` — dashboard com:
  - Cards: **Total hoje**, **Pendentes de pagamento**, **Próximas 7 dias**, **Total do mês**.
  - Lista de agendamentos em tempo real (subscrição `postgres_changes` em `appointments` e `payments`), ordenada por data/hora.
  - Cada linha mostra: cliente (nome do profile OU `nome_cliente`), telefone, serviço, data/hora, status pagamento, badge "Anónimo" se `user_id IS NULL`.
  - Ações por linha: **Gerar comprovativo (PDF)**, **Ver comprovativo de pagamento** (se houver), **Cancelar**, **Marcar pago**.
  - Toast + som ao chegar novo agendamento via Realtime.
- `src/routes/admin.calendario.tsx` — vista calendário usando **react-big-calendar** (mês/semana/dia), eventos clicáveis abrem o detalhe.
- `src/routes/admin.definicoes.tsx` — gere `notification_settings` (email destinatário) + ativar/desativar push neste dispositivo + lista de subscrições push ativas.

PDF de comprovativo gerado client-side com **@react-pdf/renderer**: cabeçalho com logo + "Barbearia [Nome]", dados do agendamento, código, QR opcional, rodapé com contactos. Botões de **Download** e **Imprimir**.

---

## 4. Notificação ao proprietário (email + push)

Server function `notify-new-appointment` (`src/utils/notifications.functions.ts`):

1. Busca destinatário em `notification_settings`.
2. Tenta enviar via **Lovable Emails** (queue `transactional_emails`, template React Email com detalhes do agendamento + link para `/admin`).
3. Se falhar (timeout, erro ou domínio não configurado), faz **fallback para Resend** via gateway de connectors (`/resend/emails`) usando `LOVABLE_API_KEY` + `RESEND_API_KEY`.
4. Envia **Web Push** para todas as subscrições em `push_subscriptions` de utilizadores admin, em paralelo. Subscrições inválidas (410 Gone) são apagadas automaticamente.

Uma única chamada do formulário público (e do `/app/agenda` autenticado) dispara este server function.

**Setup necessário:**

- Configurar email domain Lovable (botão abaixo).
- Conectar Resend para fallback (peço a `RESEND_API_KEY` quando chegarmos a essa fase, depois do email principal).
- Gerar par de chaves VAPID e guardar como secrets `VAPID_PUBLIC_KEY` (também exposta como `VITE_VAPID_PUBLIC_KEY`) e `VAPID_PRIVATE_KEY`.

---

## 5. PWA + Web Push

- `public/manifest.webmanifest`: nome "Barbearia [Nome] — Admin", `start_url: "/admin"`, `display: "standalone"`, `theme_color` âmbar/preto, ícones 192/512.
- `public/sw.js` — service worker mínimo:
  - Cache do shell estático (network-first para HTML, cache-first para assets).
  - Listener `push` → `self.registration.showNotification(...)` com título "Novo agendamento" e dados do payload.
  - Listener `notificationclick` → abre `/admin`.
- `src/components/PWARegister.tsx` — regista o SW **apenas em produção e fora de iframe** (segue regra anti-iframe do preview Lovable). Em iframe, desinscreve SWs existentes.
- `src/components/InstallPrompt.tsx` — banner "Instalar app" no `/admin` quando o evento `beforeinstallprompt` dispara.
- `src/lib/push.ts` — função `subscribeToPush()`: pede permissão, regista subscrição com a `VITE_VAPID_PUBLIC_KEY`, guarda em `push_subscriptions`. Botão "Ativar notificações neste dispositivo" em `/admin/definicoes`.
- Server route `/api/public/send-push` é interno e protegido por header secreto; o envio real usa a biblioteca `web-push` dentro de `notify-new-appointment`.

**Aviso ao utilizador**: Web Push **não funciona no preview do Lovable** (iframe + dev mode). Só funciona depois de **publicar** e instalar a PWA no telemóvel/desktop.

---

## 6. Como criar a tua conta admin (a fazeres tu, depois do build)

1. Vai a `/registar` e cria conta normal com o teu email.
2. Em **Backend → SQL Editor** (vou abrir para ti depois com o botão "Ver Backend"), corre:
  ```sql
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin' FROM auth.users WHERE email = 'TEU_EMAIL_AQUI'
   ON CONFLICT DO NOTHING;
  ```
3. Faz logout/login. `/admin` fica acessível.

---

## 7. Fora de âmbito

- Substituir o sistema atual de clientes — fica intacto e a coexistir.
- Calendário no formulário público — usa um simples date+time picker; o calendário rico fica só no /admin.
- Templates de email para clientes (só o admin recebe aviso).

---

## Detalhes técnicos (para o agente)

- **Migrations**: uma para schema (colunas + tabelas + bucket + RLS + realtime publication), outra fica como seed via INSERT tool.
- **Bibliotecas a instalar**: `react-big-calendar`, `@react-pdf/renderer`, `web-push`, `date-fns` (já presente provavelmente), `zod` (provavelmente já presente). Verificar antes de instalar.
- **Bucket público**: `comprovativos-publicos` distinto do existente `comprovativos` para não relaxar políticas do bucket privado.
- **Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE appointments` + `ADD TABLE payments`.
- **Server functions** novas em `src/utils/notifications.functions.ts`: `notifyNewAppointment(appointmentId)`, `sendOwnerEmail(...)` (Lovable→Resend fallback), `sendPushToAdmins(payload)`.
- **PWA**: NÃO usar `vite-plugin-pwa`; manifest + SW manuais conforme regra anti-iframe.
- **Auth-email-hook**: não tocar; só transactional emails para admin.
- Antes de construir, peço para configurar email domain Lovable (botão na próxima resposta).