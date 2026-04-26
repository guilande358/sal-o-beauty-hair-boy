
# Barbearia [Nome] — Rebrand Masculino + Pagamentos

Transformar o salão feminino numa **barbearia masculina** moçambicana, com catálogo de cortes africanos, novo estilo visual e secção de pagamentos via carteira móvel e transferência bancária.

## 1. Rebrand visual (estilo masculino)

Atualizar `src/styles.css`:
- **Paleta nova**: preto profundo (#0E0E0E) como background, branco osso (#F5F5F4), dourado/âmbar (#C9A24A) como acento, vermelho-tijolo (#8B2E1F) secundário.
- **Tipografia**: manter `Playfair Display` para títulos mas trocar acentos para `Bebas Neue` ou `Oswald` (condensada, masculina) nos labels/CTAs. Body continua `Inter`.
- Cantos menos arredondados (`--radius: 0.375rem`), sombras mais duras, texturas escuras.
- Status colors mantêm-se (livre/marcado/ocupado).

Actualizar `src/components/Logo.tsx` para um wordmark mais robusto (ex.: ícone de tesoura/navalha + "BARBEARIA").

## 2. Landing page (`src/routes/index.tsx`)

- Hero novo: imagem de barbearia, headline **"Estilo. Atitude. Tradição."**, subheadline sobre cortes africanos e moçambicanos, CTA **"Marcar Corte"**.
- "Sobre" reescrito no masculino: barbearia em Maputo, especialistas em cortes africanos, fade, dreads, taper, designs.
- Stats: "+5 Anos", "+2000 Cortes", "+15 Estilos".
- Testemunhos substituídos por nomes masculinos moçambicanos (ex.: Ivandro Sitoe, Helton Macamo, Délcio Nhantumbo).
- Footer: "Barbearia [Nome do Salão]".
- Remover linguagem feminina ("clientes satisfeitas" → "clientes satisfeitos", "suas unhas" removido, etc.).

## 3. Galeria — catálogo de cortes africanos e moçambicanos

Gerar **10–12 imagens novas** de cortes masculinos para `src/assets/`:
- Low fade, High fade, Taper fade
- Afro natural definido
- Dreadlocks (locs curtos e médios)
- Cornrows / tranças masculinas
- Box braids masculinas
- Mohawk africano / South-cut
- Design com riscas (hair tattoo / line-up)
- Mini twists
- Bald fade com barba

Cada item da galeria mostra **nome do corte** em overlay e abre lightbox. Substitui as 6 fotos atuais.

## 4. Serviços — repor catálogo masculino

Migração SQL para limpar `services` actual e inserir serviços de barbearia (preços MZN realistas para Maputo):

| Serviço | Preço | Duração |
|---|---|---|
| Corte Simples (máquina) | 200 | 30 min |
| Corte + Barba | 350 | 45 min |
| Fade (Low/Mid/High) | 300 | 45 min |
| Taper Fade | 350 | 45 min |
| Bald Fade + Line-up | 400 | 60 min |
| Dreadlocks (manutenção) | 600 | 90 min |
| Tranças Masculinas / Cornrows | 500 | 90 min |
| Design / Hair Tattoo | 250 | 30 min |
| Aparar Barba | 150 | 20 min |
| Lavagem + Hidratação | 200 | 30 min |
| Pacote Pai & Filho | 450 | 60 min |

Página `/app/servicos` e secção da landing puxam dinamicamente — só precisam atualizar copy ("Os Nossos Serviços" → "Os Nossos Cortes").

## 5. Pagamentos (M-Pesa, e-Mola, Transferência bancária)

Esta é uma barbearia local — **não há gateway de pagamento online integrado** (não há Stripe/Paddle em MZN para mobile money local). A solução é um **fluxo manual de comprovativo de pagamento**: o cliente paga via carteira/transferência e envia o comprovativo, o salão confirma.

### Base de dados (nova migração)

Tabela `payments`:
```
id uuid pk
appointment_id uuid → appointments.id (cascade)
user_id uuid
metodo enum('mpesa','emola','transferencia_bancaria')
valor_mzn integer
referencia text  -- número de transação ou referência bancária
comprovativo_url text  -- upload opcional
status enum('pendente','confirmado','rejeitado') default 'pendente'
notas text
created_at, updated_at
```
+ RLS: utilizador vê/insere os seus; admins gerem todos.
+ Storage bucket `comprovativos` (privado, signed URLs).

Tabela `payment_methods` (configuração da barbearia, gerida pelo admin):
```
id, tipo, titular, numero, instrucoes, ativo
```
Pré-populada com dados placeholder:
- **M-Pesa (Vodacom)** — 84 XXX XXXX — Nome do Titular
- **e-Mola (Movitel)** — 86 XXX XXXX — Nome do Titular
- **Transferência Bancária** — BCI / Millennium BIM — IBAN MZ00 0000 ... — Nome do Titular

### Fluxo no app

**Após confirmar agendamento** em `/app/agenda`, redirecionar para nova página `/app/pagamento/$appointmentId`:
1. Mostra resumo do agendamento (serviço, data, hora, total MZN).
2. Mostra os 3 métodos disponíveis em cards (logo + número + instruções + botão "copiar").
3. Formulário: escolher método, inserir referência da transação, opcional carregar screenshot do comprovativo.
4. Submeter → cria registo `payments` com status `pendente` → toast "Aguardando confirmação do salão".

**Página `/app/meus-agendamentos`**: cada agendamento ganha badge do estado de pagamento (`Pendente` / `Confirmado` / `Sem pagamento`) e link "Pagar agora" se aplicável.

**Nova página `/app/pagamentos`** na navegação: histórico de pagamentos do utilizador.

### Landing — secção "Pagamento"

Nova secção entre Serviços e Galeria:
- Título **"Como pagar"**, três cards lado a lado (M-Pesa, e-Mola, Transferência) com ícones e instruções.
- Texto: "Pague com a sua carteira móvel ou por transferência. Confirma após o agendamento."

## 6. Navegação

Atualizar `src/routes/app.tsx` para incluir **Pagamentos** entre "Meus Agendamentos" e "Perfil". Renomear copy genérica para tom masculino.

## 7. Detalhes técnicos

- Migração SQL única: criar enums `payment_method` e `payment_status`, tabelas `payments` e `payment_methods`, RLS, bucket de storage e seed dos métodos placeholder + reset+seed de `services`.
- Novas rotas: `src/routes/app.pagamento.$appointmentId.tsx`, `src/routes/app.pagamentos.tsx`.
- Imagens geradas para galeria (substituir `gallery-1..6.jpg` e adicionar `gallery-7..12.jpg`) + nova `hero-barbearia.jpg` + `about-barbearia.jpg`.
- Componente reutilizável `PaymentMethodCard` em `src/components/PaymentMethodCard.tsx`.
- `package.json`: adicionar `@fontsource/bebas-neue` (ou Oswald) e importar em `styles.css`.
- Sem alterações em `client.ts` / `types.ts` (auto-gerados).

## Fora de scope

- Integração API real do M-Pesa/e-Mola (requer contas business + KYC; podemos adicionar depois).
- Painel admin para confirmar pagamentos (estrutura RLS já preparada — UI fica para próxima iteração).
- Notificações WhatsApp/SMS automáticas.
