-- Criar tabela para rastreamento de lotes de entrega
CREATE TABLE public.delivery_batch_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL,
  driver_id UUID,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.delivery_batch_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers podem inserir suas próprias localizações
CREATE POLICY "Drivers can insert their locations"
ON public.delivery_batch_locations
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

-- Policy: Farmácias podem ver localizações dos seus batches
CREATE POLICY "Pharmacies can view locations of their batches"
ON public.delivery_batch_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM delivery_batches
    WHERE delivery_batches.id = delivery_batch_locations.batch_id
      AND delivery_batches.pharmacy_id = auth.uid()
  )
);

-- Policy: Drivers podem ver localizações dos seus batches
CREATE POLICY "Drivers can view locations for their batches"
ON public.delivery_batch_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM delivery_batches
    WHERE delivery_batches.id = delivery_batch_locations.batch_id
      AND delivery_batches.driver_id = auth.uid()
  )
);

-- Adicionar índice para performance
CREATE INDEX idx_delivery_batch_locations_batch_id ON public.delivery_batch_locations(batch_id);
CREATE INDEX idx_delivery_batch_locations_recorded_at ON public.delivery_batch_locations(recorded_at);

-- Habilitar realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_batch_locations;