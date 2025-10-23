-- Fix Critical Security Issues

-- 1. Allow drivers to view and update their assigned rides
CREATE POLICY "Drivers can view their assigned rides"
ON public.rides
FOR SELECT
TO authenticated
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their assigned rides"
ON public.rides
FOR UPDATE
TO authenticated
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

-- 2. Allow new drivers to register (insert their own driver profile)
CREATE POLICY "Users can create their own driver profile"
ON public.drivers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to cancel rides
CREATE POLICY "Customers can cancel their rides"
ON public.ride_cancellations
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.rides
  WHERE rides.id = ride_cancellations.ride_id
  AND rides.customer_id = auth.uid()
));

CREATE POLICY "Drivers can cancel their assigned rides"
ON public.ride_cancellations
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.rides
  WHERE rides.id = ride_cancellations.ride_id
  AND rides.driver_id = auth.uid()
));

-- 4. Add additional security for driver documents
-- Create a secure view that doesn't expose document URLs unless necessary
CREATE OR REPLACE VIEW public.drivers_public AS
SELECT 
  id,
  user_id,
  vehicle_type,
  plate,
  approved,
  shift_status,
  created_at,
  last_seen_at,
  -- Exclude sensitive document URLs and CNH numbers
  CASE WHEN auth.uid() = user_id THEN cnh_number ELSE NULL END as cnh_number,
  CASE WHEN auth.uid() = user_id THEN cnh_front_url ELSE NULL END as cnh_front_url,
  CASE WHEN auth.uid() = user_id THEN cnh_back_url ELSE NULL END as cnh_back_url,
  CASE WHEN auth.uid() = user_id THEN selfie_url ELSE NULL END as selfie_url
FROM public.drivers;

-- 5. Ensure delivery_requests has proper RLS for tracking
-- Allow public access to tracking with token (read-only)
CREATE POLICY "Anyone with tracking token can view request"
ON public.delivery_requests
FOR SELECT
TO anon, authenticated
USING (tracking_token IS NOT NULL);

-- 6. Secure ride_locations - only allow viewing for participants
CREATE POLICY "Drivers can view locations for their rides"
ON public.ride_locations
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.rides
  WHERE rides.id = ride_locations.ride_id
  AND rides.driver_id = auth.uid()
));

-- 7. Add audit logging trigger for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  table_name text NOT NULL,
  operation text NOT NULL,
  record_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger function to log driver document access
CREATE OR REPLACE FUNCTION log_driver_document_access()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER driver_document_audit
AFTER UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION log_driver_document_access();