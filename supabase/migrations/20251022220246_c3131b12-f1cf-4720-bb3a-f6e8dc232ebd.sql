-- Fase 1: Corrigir estrutura do banco de dados

-- 1.1 Adicionar foreign keys na tabela drivers
ALTER TABLE public.drivers
DROP CONSTRAINT IF EXISTS drivers_user_id_fkey;

ALTER TABLE public.drivers
ADD CONSTRAINT drivers_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 1.2 Atualizar políticas RLS da tabela drivers
DROP POLICY IF EXISTS "Admins can view all drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can update drivers" ON public.drivers;

CREATE POLICY "Admins can view all drivers"
ON public.drivers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update drivers"
ON public.drivers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Comentários explicativos
COMMENT ON POLICY "Admins can view all drivers" ON public.drivers IS 'Permite que administradores vejam todos os motoristas cadastrados';
COMMENT ON POLICY "Admins can update drivers" ON public.drivers IS 'Permite que administradores aprovem ou atualizem informações de motoristas';