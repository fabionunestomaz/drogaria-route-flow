-- Adicionar coluna request_id na tabela deliveries para vincular às solicitações
ALTER TABLE public.deliveries 
ADD COLUMN request_id UUID REFERENCES public.delivery_requests(id) ON DELETE SET NULL;

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_deliveries_request_id ON public.deliveries(request_id);

-- Comentário explicativo
COMMENT ON COLUMN public.deliveries.request_id IS 'Vincula a entrega à solicitação original do cliente (se aplicável)';