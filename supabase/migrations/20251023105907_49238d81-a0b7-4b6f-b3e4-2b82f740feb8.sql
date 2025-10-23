-- =====================================
-- MIGRATION: Atualizar schema rides para spec completa
-- =====================================

-- 1. Adicionar campos faltantes na tabela rides
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS price_mode TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS price_manual NUMERIC,
  ADD COLUMN IF NOT EXISTS price_auto_base NUMERIC DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS price_auto_per_km NUMERIC DEFAULT 2.00,
  ADD COLUMN IF NOT EXISTS price_auto_per_min NUMERIC DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS price_min NUMERIC DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS eta_seconds_current INTEGER,
  ADD COLUMN IF NOT EXISTS last_eta_recalc_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_reason TEXT,
  ADD COLUMN IF NOT EXISTS distance_km_est NUMERIC,
  ADD COLUMN IF NOT EXISTS duration_min_est INTEGER;

-- 2. Atualizar enum de status de rides se necessário
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ride_status_enum') THEN
    CREATE TYPE ride_status_enum AS ENUM (
      'created', 'offered', 'accepted', 
      'enroute_pickup', 'picked', 'enroute_dropoff', 
      'delivered', 'completed', 'canceled'
    );
  END IF;
END $$;

-- 3. Criar tabela ride_cancellations
CREATE TABLE IF NOT EXISTS public.ride_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  canceled_by TEXT NOT NULL CHECK (canceled_by IN ('customer', 'driver', 'admin')),
  reason TEXT,
  fee_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ride_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ride cancellations"
  ON public.ride_cancellations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_cancellations.ride_id
      AND (rides.customer_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

-- 4. Criar tabela coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'percent')),
  value NUMERIC NOT NULL,
  active BOOLEAN DEFAULT true,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active coupons"
  ON public.coupons FOR SELECT
  USING (active = true AND (valid_until IS NULL OR valid_until > now()));

-- 5. Criar tabela ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ride_id, customer_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings of their rides"
  ON public.ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ratings.ride_id
      AND (rides.customer_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

CREATE POLICY "Customers can create ratings for their rides"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- 6. Criar tabela messages (chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their rides"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = messages.ride_id
      AND (rides.customer_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their rides"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id
    AND EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = messages.ride_id
      AND (rides.customer_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

-- 7. Criar tabela audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rides_customer_id ON public.rides(customer_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON public.rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ride_locations_ride_id ON public.ride_locations(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_locations_recorded_at ON public.ride_locations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_ride_id ON public.messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at DESC);

-- 9. Habilitar realtime para novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_cancellations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;