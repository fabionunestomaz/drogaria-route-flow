-- Criar tabela de clientes
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de configurações da farmácia
CREATE TABLE public.pharmacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  pharmacy_name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  phone TEXT,
  base_price NUMERIC DEFAULT 5.00,
  price_per_km NUMERIC DEFAULT 2.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de lotes de entrega (rotas)
CREATE TABLE public.delivery_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  total_distance NUMERIC,
  total_price NUMERIC,
  optimized_route JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de entregas individuais
CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.delivery_batches(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'failed')),
  sequence INTEGER NOT NULL DEFAULT 0,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  notes TEXT,
  proof_photo_url TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies para customers
CREATE POLICY "Farmácias podem gerenciar seus clientes"
ON public.customers
FOR ALL
USING (auth.uid() = pharmacy_id)
WITH CHECK (auth.uid() = pharmacy_id);

-- RLS Policies para pharmacy_settings
CREATE POLICY "Usuários podem gerenciar suas configurações"
ON public.pharmacy_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies para delivery_batches
CREATE POLICY "Farmácias podem gerenciar seus lotes"
ON public.delivery_batches
FOR ALL
USING (auth.uid() = pharmacy_id)
WITH CHECK (auth.uid() = pharmacy_id);

CREATE POLICY "Motoboys podem ver lotes atribuídos a eles"
ON public.delivery_batches
FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Motoboys podem atualizar status dos seus lotes"
ON public.delivery_batches
FOR UPDATE
USING (auth.uid() = driver_id);

-- RLS Policies para deliveries
CREATE POLICY "Farmácias podem gerenciar entregas dos seus lotes"
ON public.deliveries
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_batches
    WHERE delivery_batches.id = deliveries.batch_id
    AND delivery_batches.pharmacy_id = auth.uid()
  )
);

CREATE POLICY "Motoboys podem ver entregas dos seus lotes"
ON public.deliveries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_batches
    WHERE delivery_batches.id = deliveries.batch_id
    AND delivery_batches.driver_id = auth.uid()
  )
);

CREATE POLICY "Motoboys podem atualizar entregas dos seus lotes"
ON public.deliveries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_batches
    WHERE delivery_batches.id = deliveries.batch_id
    AND delivery_batches.driver_id = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pharmacy_settings_updated_at
BEFORE UPDATE ON public.pharmacy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_batches_updated_at
BEFORE UPDATE ON public.delivery_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();