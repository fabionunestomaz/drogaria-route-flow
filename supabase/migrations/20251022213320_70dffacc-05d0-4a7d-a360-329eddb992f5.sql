-- Tornar customer_id opcional em deliveries
ALTER TABLE deliveries 
ALTER COLUMN customer_id DROP NOT NULL;

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_id ON deliveries(customer_id) WHERE customer_id IS NOT NULL;