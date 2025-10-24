-- Adicionar foreign key entre drivers e profiles
ALTER TABLE public.drivers
DROP CONSTRAINT IF EXISTS drivers_user_id_fkey;

ALTER TABLE public.drivers
ADD CONSTRAINT drivers_user_id_profiles_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;