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

    // Fetch delivery request data using service role (bypasses RLS for public access)
    const { data: delivery, error } = await supabase
      .from('delivery_requests')
      .select('*')
      .eq('tracking_token', token)
      .single();

    if (error || !delivery) {
      console.error('Delivery not found:', error);
      return new Response(JSON.stringify({ error: 'Tracking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No driver info or location tracking for delivery_requests yet
    const driverInfo = null;
    const latestLocation = null;

    // Build timeline
    const timeline = [
      {
        status: 'created',
        label: 'Pedido criado',
        timestamp: delivery.created_at,
        completed: true,
      },
      {
        status: 'assigned',
        label: 'Motorista atribuído',
        timestamp: delivery.status !== 'pending' ? delivery.updated_at : null,
        completed: delivery.status !== 'pending',
      },
      {
        status: 'completed',
        label: 'Entregue',
        timestamp: delivery.status === 'completed' ? delivery.updated_at : null,
        completed: delivery.status === 'completed',
      },
    ];

    const response = {
      status: delivery.status,
      origin: delivery.origin_address,
      destination: delivery.dest_address,
      driver: driverInfo,
      current_location: latestLocation,
      timeline,
      is_active: ['pending', 'assigned'].includes(delivery.status),
      distance: delivery.distance,
      estimated_time: delivery.estimated_time,
      estimated_price: delivery.estimated_price,
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
