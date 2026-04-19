
# Salão [Nome do Salão] — Booking Website

A modern, elegant booking site in Portuguese (PT) for a hair salon in Mozambique. Mobile-first, feminine palette (rose gold, black, beige, white).

## 1. Public Landing Page (`/`)
- **Hero**: full-bleed salon photo, headline "Realce a sua beleza natural", subheadline, CTA **"Agendar Agora"** → `/login`.
- **Sobre o Salão**: short story + image side-by-side.
- **Nossos Serviços**: card grid with name, descrição curta, **duração** and **preço em MZN**.
- **Trabalhos Realizados**: responsive photo gallery (lightbox on click).
- **Testemunhos**: 3 fake quote cards with names + ratings.
- **Footer**: contacto, horário, redes sociais.
- Smooth scroll anchors within landing only; auth pages are separate routes.

## 2. Authentication
- Lovable Cloud auth: email + password (Registar / Entrar / Recuperar palavra-passe).
- `profiles` table auto-created on signup (trigger): `nome`, `telefone`, `foto_url`.
- `/perfil` page to edit profile + upload photo to storage.

## 3. Customer Area (protected `/app/*`)
Top navigation (mobile: hamburger): **Início · Serviços · Agenda · Meus Agendamentos · Perfil**
- **Início**: greeting, próximo agendamento, quick "Agendar".
- **Serviços**: same service catalog, "Agendar este serviço" jumps to Agenda pre-selected.
- **Agenda**:
  - Monthly calendar + selected-day list of slots.
  - Slot colors: 🟢 **Livre** · 🟡 **Marcado** · 🔴 **Ocupado pelo salão**.
  - **Privacy**: only color + label shown; never the customer name/contact of other bookings.
  - Click a Livre slot → modal: choose serviço, confirma data/hora, notas opcionais → confirma.
- **Meus Agendamentos**: list of own bookings (próximos / passados), cancel option (until X hours before).
- **Perfil**: edit nome/telefone/foto, logout.

## 4. Slot Generation (combining all three approaches)
- **Default schedule**: Seg–Sáb, 09:00–18:00, slots de 30 min — auto-generated on demand for any visited date.
- **Admin overrides** (data structure ready now, admin UI later): rows in `appointments` with status `occupied` block specific slots; admin can also block whole days.
- **Customer flexibility**: when booking, customer can pick any free slot; service duration auto-blocks consecutive slots.

## 5. Database (Lovable Cloud)
- `profiles` (id → auth.users, nome, telefone, foto_url)
- `services` (id, nome, descricao, preco_mzn, duracao_min, imagem_url, ativo) — pre-seeded with realistic Mozambique salon services (corte feminino, tranças box, tranças nagô, manicure, pedicure, alisamento, hidratação, etc.) with MZN prices.
- `appointments` (id, user_id, service_id nullable, data, hora_inicio, hora_fim, status: `booked` | `occupied`, notas) — `free` is implicit (no row).
- `user_roles` table + `app_role` enum (`customer`, `admin`) + `has_role()` security definer function — ready for the future admin login.
- **RLS**:
  - `appointments`: customers SELECT all rows but only see `status` + time (via a public view `appointment_slots` exposing only date/time/status, no user_id). They INSERT only their own bookings. They SELECT full details only for their own (`user_id = auth.uid()`).
  - `profiles`: each user reads/updates own row; admins read all.
  - `services`: public read; only admins write.

## 6. Design
- Palette: **rose gold** (#B76E79 accents), **black** (#1A1A1A text), **beige** (#F5EDE4 surfaces), **white** background.
- Typography: elegant serif for headings (Playfair Display), clean sans for body (Inter).
- Generous whitespace, soft shadows, rounded corners, subtle hover transitions, high-quality stock salon imagery from Unsplash.
- Fully responsive, mobile-first.

## 7. Out of scope (this build)
- Admin dashboard UI (data model + roles already prepared so it slots in later).
- Payments, SMS reminders, multi-language toggle.
