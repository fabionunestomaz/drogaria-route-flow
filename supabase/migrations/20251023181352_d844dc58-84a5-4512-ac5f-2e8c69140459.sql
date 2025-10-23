-- Corrigir endereço padrão com número e preços
UPDATE pharmacy_settings 
SET address = 'Av. Luís Eduardo Magalhães, nº 657, São Félix do Coribe - BA, 47670-025',
    base_price = CASE WHEN base_price = 0 THEN 5 ELSE base_price END,
    price_per_km = CASE WHEN price_per_km = 0 THEN 2 ELSE price_per_km END
WHERE user_id = '15b91770-dd11-4061-92bb-4f249e902ed9';

-- Criar tabela para configuração avançada de preços
CREATE TABLE IF NOT EXISTS public.delivery_pricing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Parâmetros de custo
  gasoline_price NUMERIC NOT NULL DEFAULT 6.00, -- R$/litro
  vehicle_consumption NUMERIC NOT NULL DEFAULT 30.00, -- km/litro (moto)
  maintenance_per_km NUMERIC NOT NULL DEFAULT 0.50, -- R$/km
  cost_per_minute NUMERIC NOT NULL DEFAULT 0.30, -- R$/minuto
  
  -- Taxas e margens
  base_fee NUMERIC NOT NULL DEFAULT 5.00, -- Taxa fixa mínima
  profit_margin NUMERIC NOT NULL DEFAULT 20.00, -- % de lucro
  minimum_price NUMERIC NOT NULL DEFAULT 10.00, -- Preço mínimo por entrega
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.delivery_pricing_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own pricing config"
  ON public.delivery_pricing_config
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pricing config"
  ON public.delivery_pricing_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pricing config"
  ON public.delivery_pricing_config
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_delivery_pricing_config_updated_at
  BEFORE UPDATE ON public.delivery_pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();