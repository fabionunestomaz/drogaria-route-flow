import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.pathname.split('/').pop();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch ride data using service role (bypasses RLS for public access)
    const { data: ride, error } = await supabase
      .from('rides')
      .select(`
        id,
        status,
        origin_address,
        dest_address,
        tracking_enabled,
        tracking_expires_at,
        created_at,
        updated_at,
        driver_id,
        ride_locations (
          lat,
          lng,
          speed,
          heading,
          recorded_at
        )
      `)
      .eq('tracking_token', token)
      .single();

    if (error || !ride) {
      console.error('Ride not found:', error);
      return new Response(JSON.stringify({ error: 'Tracking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ride.tracking_enabled) {
      return new Response(JSON.stringify({ error: 'Tracking disabled' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if tracking has expired
    if (ride.tracking_expires_at && new Date(ride.tracking_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Tracking expired' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get driver info if available
    let driverInfo = null;
    if (ride.driver_id) {
      const { data: driver } = await supabase
        .from('drivers')
        .select(`
          vehicle_type,
          plate,
          user_id
        `)
        .eq('user_id', ride.driver_id)
        .single();

      if (driver) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, photo_url')
          .eq('user_id', driver.user_id)
          .single();

        driverInfo = {
          name: profile?.name?.split(' ')[0] || 'Motoboy',
          photo_url: profile?.photo_url,
          vehicle_type: driver.vehicle_type,
          plate: driver.plate,
        };
      }
    }

    // Get latest location
    const latestLocation = ride.ride_locations && ride.ride_locations.length > 0
      ? ride.ride_locations[0]
      : null;

    // Build timeline
    const timeline = [
      {
        status: 'created',
        label: 'Pedido criado',
        timestamp: ride.created_at,
        completed: true,
      },
      {
        status: 'assigned',
        label: 'Motoboy atribuído',
        timestamp: ride.driver_id ? ride.updated_at : null,
        completed: !!ride.driver_id,
      },
      {
        status: 'enroute',
        label: 'A caminho',
        timestamp: ride.status === 'enroute_pickup' || ride.status === 'enroute_dropoff' ? ride.updated_at : null,
        completed: ride.status === 'enroute_pickup' || ride.status === 'enroute_dropoff' || ride.status === 'delivered',
      },
      {
        status: 'delivered',
        label: 'Entregue',
        timestamp: ride.status === 'delivered' ? ride.updated_at : null,
        completed: ride.status === 'delivered',
      },
    ];

    const response = {
      status: ride.status,
      origin: ride.origin_address,
      destination: ride.dest_address,
      driver: driverInfo,
      current_location: latestLocation,
      timeline,
      is_active: ['pending', 'assigned', 'enroute_pickup', 'enroute_dropoff'].includes(ride.status),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
