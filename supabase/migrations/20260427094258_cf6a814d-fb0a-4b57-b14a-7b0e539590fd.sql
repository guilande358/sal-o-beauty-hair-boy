
-- 1. Add columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS nome_cliente TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS comprovativo_url TEXT,
  ADD COLUMN IF NOT EXISTS codigo TEXT UNIQUE;

-- 2. Allow anonymous public bookings via INSERT
DROP POLICY IF EXISTS "Anonymous public bookings" ON public.appointments;
CREATE POLICY "Anonymous public bookings"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND nome_cliente IS NOT NULL
  AND length(nome_cliente) BETWEEN 1 AND 120
  AND status = 'booked'
);

-- 3. Allow anon to read services (already public) and slot times (the view already has authenticated; add anon)
DROP POLICY IF EXISTS "Anon read slot times only via view" ON public.appointments;
CREATE POLICY "Anon read slot times only via view"
ON public.appointments
FOR SELECT
TO anon
USING (true);

-- 4. Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
ON public.push_subscriptions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete subscriptions"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Notification settings (single-row, only admins manage)
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_destinatario TEXT NOT NULL,
  push_ativo BOOLEAN NOT NULL DEFAULT true,
  email_ativo BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE
);
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage notification settings"
ON public.notification_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone read notification settings server-side"
ON public.notification_settings
FOR SELECT
TO authenticated
USING (true);

-- 6. Public storage bucket for anonymous receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovativos-publicos', 'comprovativos-publicos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can upload to comprovativos-publicos" ON storage.objects;
CREATE POLICY "Public can upload to comprovativos-publicos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'comprovativos-publicos');

DROP POLICY IF EXISTS "Public read comprovativos-publicos" ON storage.objects;
CREATE POLICY "Public read comprovativos-publicos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'comprovativos-publicos');

-- 7. Realtime
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payments';
  END IF;
END $$;
