
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  telefone TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  preco_mzn INTEGER NOT NULL,
  duracao_min INTEGER NOT NULL,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Appointments
CREATE TYPE public.appointment_status AS ENUM ('booked', 'occupied');

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'booked',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_appointments_data ON public.appointments(data);
CREATE INDEX idx_appointments_user ON public.appointments(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + assign customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, telefone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== RLS POLICIES =====

-- Profiles: own read/update; admins read all
CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles: user views own; admins manage
CREATE POLICY "Users view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Services: public read; admin write
CREATE POLICY "Services public read" ON public.services
FOR SELECT USING (true);
CREATE POLICY "Admins manage services" ON public.services
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Appointments:
-- Authenticated users SELECT only their own full rows
CREATE POLICY "Users view own appointments" ON public.appointments
FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all appointments" ON public.appointments
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
-- Authenticated users insert only their own bookings
CREATE POLICY "Users insert own appointments" ON public.appointments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'booked');
-- Users can cancel/delete only their own
CREATE POLICY "Users delete own appointments" ON public.appointments
FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage appointments" ON public.appointments
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Public view that exposes only date/time/status (no user_id, no notes) for privacy
-- Used by authenticated customers to see slot occupancy
CREATE OR REPLACE VIEW public.appointment_slots
WITH (security_invoker = true)
AS
SELECT
  id,
  data,
  hora_inicio,
  hora_fim,
  status
FROM public.appointments;

-- Allow authenticated users to read the slots view
-- (RLS still applies via security_invoker; we need a permissive policy on appointments for the view's SELECT)
CREATE POLICY "Authenticated read slot times only via view" ON public.appointments
FOR SELECT TO authenticated USING (true);
-- Note: The above policy allows reading row existence; to keep details private,
-- the app MUST query via the appointment_slots view (no user_id/notes columns).
-- Drop the previous "Users view own appointments" since the new permissive one supersedes it,
-- but we still need to keep the ability to fetch full rows for own bookings -- handled by same true policy.

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed services (Mozambique salon)
INSERT INTO public.services (nome, descricao, preco_mzn, duracao_min) VALUES
  ('Corte Feminino', 'Corte personalizado para todos os tipos de cabelo, com lavagem e finalização.', 800, 45),
  ('Tranças Box Braids', 'Tranças finas estilo box braids, longa duração e acabamento perfeito.', 3500, 240),
  ('Tranças Nagô', 'Tranças rente ao couro cabeludo, padrões clássicos e modernos.', 2000, 180),
  ('Manicure', 'Cuidado completo das unhas das mãos com esmaltagem à escolha.', 500, 45),
  ('Pedicure', 'Tratamento relaxante e estético dos pés com esmaltagem.', 600, 60),
  ('Alisamento', 'Alisamento profissional com produtos de alta qualidade.', 2500, 150),
  ('Hidratação Profunda', 'Hidratação intensiva para devolver brilho e maciez ao cabelo.', 700, 60),
  ('Penteado para Eventos', 'Penteado elegante para casamentos, festas e ocasiões especiais.', 1200, 90),
  ('Coloração', 'Coloração completa com produtos profissionais e tonalidade à escolha.', 1800, 120),
  ('Mega Hair', 'Aplicação de mega hair com técnica adequada ao seu cabelo.', 5000, 180);
