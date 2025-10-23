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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { cnh_number, cnh_front_url, cnh_back_url, selfie_url, vehicle_type, plate } = await req.json();

    // Validar dados obrigatórios
    if (!cnh_number || !cnh_front_url || !cnh_back_url || !selfie_url || !vehicle_type || !plate) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate field types and formats
    if (typeof cnh_number !== 'string' || cnh_number.length < 9 || cnh_number.length > 15) {
      return new Response(JSON.stringify({ error: 'Invalid CNH number format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URLs are from storage bucket
    const validUrls = [cnh_front_url, cnh_back_url, selfie_url].every(url => 
      typeof url === 'string' && 
      (url.includes('supabase.co/storage/') || url.startsWith('http'))
    );
    
    if (!validUrls) {
      return new Response(JSON.stringify({ error: 'Invalid document URLs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate vehicle type
    const validVehicleTypes = ['moto', 'carro', 'van', 'bicicleta'];
    if (!validVehicleTypes.includes(vehicle_type)) {
      return new Response(JSON.stringify({ error: 'Invalid vehicle type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate plate format (simplified Brazilian format)
    const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i;
    if (typeof plate !== 'string' || !plateRegex.test(plate.replace(/[-\s]/g, ''))) {
      return new Response(JSON.stringify({ error: 'Invalid license plate format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Inserir na tabela drivers
    const { error: driverError } = await supabase
      .from('drivers')
      .insert({
        user_id: user.id,
        cnh_number,
        cnh_front_url,
        cnh_back_url,
        selfie_url,
        vehicle_type,
        plate,
        approved: false,
      });

    if (driverError) {
      console.error('Error creating driver:', driverError);
      return new Response(JSON.stringify({ error: driverError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Adicionar role 'driver' (usando service role para bypass RLS)
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'driver',
      });

    if (roleError && !roleError.message.includes('duplicate')) {
      console.error('Error adding driver role:', roleError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Driver registration submitted. Awaiting approval.' 
    }), {
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
