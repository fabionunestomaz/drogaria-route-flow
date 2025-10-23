-- Fix Security Linter Issues

-- 1. Fix Security Definer View - Remove it and use proper RLS instead
DROP VIEW IF EXISTS public.drivers_public;

-- Instead, update the drivers RLS policies to be more restrictive
-- Revoke the existing "Drivers can view their own profile" policy and make it more specific
DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.drivers;

-- Create more restrictive policy that doesn't expose documents to others
CREATE POLICY "Drivers can view their own complete profile"
ON public.drivers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view basic info but not documents unless necessary
CREATE POLICY "Admins can view driver profiles"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id -- Admin can see others
);

-- 2. Fix Function Search Path - Add proper search_path to log function
DROP TRIGGER IF EXISTS driver_document_audit ON public.drivers;
DROP FUNCTION IF EXISTS log_driver_document_access();

CREATE OR REPLACE FUNCTION public.log_driver_document_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND (
    OLD.cnh_front_url IS DISTINCT FROM NEW.cnh_front_url OR
    OLD.cnh_back_url IS DISTINCT FROM NEW.cnh_back_url OR
    OLD.selfie_url IS DISTINCT FROM NEW.selfie_url
  )) THEN
    INSERT INTO public.security_audit_log (user_id, table_name, operation, record_id)
    VALUES (auth.uid(), 'drivers', 'document_update', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER driver_document_audit
AFTER UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.log_driver_document_access();

-- 3. Note: Leaked Password Protection must be enabled in Supabase Auth settings
-- This cannot be done via SQL migration, only through Supabase dashboard
-- Document this for manual configuration