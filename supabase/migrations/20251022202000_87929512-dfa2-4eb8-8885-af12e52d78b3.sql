-- Add tracking fields to existing rides table (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='tracking_token') THEN
    ALTER TABLE public.rides ADD COLUMN tracking_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='tracking_enabled') THEN
    ALTER TABLE public.rides ADD COLUMN tracking_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='tracking_expires_at') THEN
    ALTER TABLE public.rides ADD COLUMN tracking_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;