-- Criar tabela de solicitações de entrega dos clientes
CREATE TABLE IF NOT EXISTS public.delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id),
  origin_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  dest_address TEXT NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  distance NUMERIC,
  estimated_time INTEGER,
  estimated_price NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'cancelled')),
  tracking_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;

-- Clientes podem criar e ver suas próprias solicitações
CREATE POLICY "Customers can create their own requests"
  ON public.delivery_requests
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view their own requests"
  ON public.delivery_requests
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own requests"
  ON public.delivery_requests
  FOR UPDATE
  USING (auth.uid() = customer_id AND status = 'pending');

-- Admins podem ver e gerenciar todas as solicitações
CREATE POLICY "Admins can view all requests"
  ON public.delivery_requests
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests"
  ON public.delivery_requests
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_delivery_requests_updated_at
  BEFORE UPDATE ON public.delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX idx_delivery_requests_customer ON public.delivery_requests(customer_id);
CREATE INDEX idx_delivery_requests_status ON public.delivery_requests(status);
CREATE INDEX idx_delivery_requests_tracking ON public.delivery_requests(tracking_token);
CREATE INDEX idx_delivery_requests_created ON public.delivery_requests(created_at DESC);