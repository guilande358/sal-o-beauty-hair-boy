
-- Enums
CREATE TYPE public.payment_method AS ENUM ('mpesa', 'emola', 'transferencia_bancaria');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'confirmado', 'rejeitado');

-- payment_methods (config da barbearia)
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo public.payment_method NOT NULL,
  titular TEXT NOT NULL,
  numero TEXT NOT NULL,
  instrucoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active payment methods"
  ON public.payment_methods FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admins manage payment methods"
  ON public.payment_methods FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  metodo public.payment_method NOT NULL,
  valor_mzn INTEGER NOT NULL,
  referencia TEXT NOT NULL,
  comprovativo_url TEXT,
  status public.payment_status NOT NULL DEFAULT 'pendente',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_appointment ON public.payments(appointment_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pendente');

CREATE POLICY "Admins view all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para comprovativos (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovativos', 'comprovativos', false);

CREATE POLICY "Users upload own comprovativos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'comprovativos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own comprovativos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'comprovativos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read all comprovativos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'comprovativos'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Seed métodos de pagamento placeholder
INSERT INTO public.payment_methods (tipo, titular, numero, instrucoes) VALUES
  ('mpesa', 'Barbearia [Nome] Lda', '84 000 0000', 'Marque *150# → Enviar Dinheiro → digite o número e o valor. Use o seu nome como referência.'),
  ('emola', 'Barbearia [Nome] Lda', '86 000 0000', 'Marque *898# → Transferir → digite o número e o valor. Use o seu nome como referência.'),
  ('transferencia_bancaria', 'Barbearia [Nome] Lda · BCI', 'NIB: 0008 0000 0000 0000 0000 0', 'Faça transferência via app/balcão BCI. Envie o comprovativo abaixo após a transferência.');

-- Reset serviços para catálogo masculino
DELETE FROM public.services;
INSERT INTO public.services (nome, descricao, preco_mzn, duracao_min) VALUES
  ('Corte Simples', 'Corte à máquina, rápido e limpo. Ideal para o dia-a-dia.', 200, 30),
  ('Corte + Barba', 'Corte completo com aparar e desenhar a barba.', 350, 45),
  ('Fade (Low/Mid/High)', 'Degradê profissional, esfumado perfeito do pescoço ao topo.', 300, 45),
  ('Taper Fade', 'Degradê discreto nas têmporas e nuca, mantendo volume no topo.', 350, 45),
  ('Bald Fade + Line-up', 'Degradê até à pele com contorno geométrico definido.', 400, 60),
  ('Dreadlocks (manutenção)', 'Aperto de raízes, retoque e cuidado dos seus locs.', 600, 90),
  ('Tranças Masculinas / Cornrows', 'Tranças nagô apertadas, padrões à sua escolha.', 500, 90),
  ('Design / Hair Tattoo', 'Riscas e desenhos artísticos no cabelo. Personalizados.', 250, 30),
  ('Aparar Barba', 'Aparar, contornar e hidratar a barba.', 150, 20),
  ('Lavagem + Hidratação', 'Lavagem profunda com produtos próprios para cabelo africano.', 200, 30),
  ('Pacote Pai & Filho', 'Dois cortes (adulto + criança até 12 anos) com desconto.', 450, 60);
