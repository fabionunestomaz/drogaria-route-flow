-- Add tracking fields to rides table
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id),
  driver_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  origin_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  dest_address TEXT NOT NULL,
  dest_lat DOUBLE PRECISION,
  dest_lng DOUBLE PRECISION,
  price_mode TEXT DEFAULT 'manual',
  price_final DECIMAL(10,2),
  coupon_code TEXT,
  cancelable_until TIMESTAMP WITH TIME ZONE,
  tracking_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  tracking_enabled BOOLEAN NOT NULL DEFAULT true,
  tracking_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Policy for customers to see their own rides
CREATE POLICY "Customers can view their own rides" 
ON public.rides 
FOR SELECT 
USING (auth.uid() = customer_id);

-- Policy for customers to create rides
CREATE POLICY "Customers can create rides" 
ON public.rides 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

-- Policy for customers to update their rides
CREATE POLICY "Customers can update their own rides" 
ON public.rides 
FOR UPDATE 
USING (auth.uid() = customer_id);

-- Create ride_locations table for tracking
CREATE TABLE IF NOT EXISTS public.ride_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id UUID,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ride_locations ENABLE ROW LEVEL SECURITY;

-- Policy for drivers to insert their locations
CREATE POLICY "Drivers can insert their locations" 
ON public.ride_locations 
FOR INSERT 
WITH CHECK (auth.uid() = driver_id);

-- Policy for customers to view locations of their rides
CREATE POLICY "Customers can view locations of their rides" 
ON public.ride_locations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.rides 
    WHERE rides.id = ride_locations.ride_id 
    AND rides.customer_id = auth.uid()
  )
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  cnh_number TEXT,
  cnh_front_url TEXT,
  cnh_back_url TEXT,
  selfie_url TEXT,
  approved BOOLEAN DEFAULT false,
  vehicle_type TEXT DEFAULT 'moto',
  plate TEXT,
  shift_status TEXT DEFAULT 'offline',
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Policy for drivers to view their own profile
CREATE POLICY "Drivers can view their own profile" 
ON public.drivers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for drivers to update their own profile
CREATE POLICY "Drivers can update their own profile" 
ON public.drivers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_locations;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rides
CREATE TRIGGER update_rides_updated_at
BEFORE UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();