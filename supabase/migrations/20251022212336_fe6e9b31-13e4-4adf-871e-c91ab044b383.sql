-- Adicionar foreign key entre delivery_batches.driver_id e drivers.user_id
-- Primeiro, verificar se a FK já existe e removê-la se necessário
ALTER TABLE delivery_batches 
DROP CONSTRAINT IF EXISTS delivery_batches_driver_id_fkey;

-- Adicionar a nova foreign key correta
ALTER TABLE delivery_batches
ADD CONSTRAINT delivery_batches_driver_id_fkey 
FOREIGN KEY (driver_id) 
REFERENCES drivers(user_id) 
ON DELETE SET NULL;

-- Adicionar role 'driver' ao usuário atual (fabiobam_99@hotmail.com)
INSERT INTO user_roles (user_id, role)
VALUES ('15b91770-dd11-4061-92bb-4f249e902ed9', 'driver')
ON CONFLICT (user_id, role) DO NOTHING;

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_delivery_batches_driver_id 
ON delivery_batches(driver_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_batch_id 
ON deliveries(batch_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_status 
ON deliveries(status);