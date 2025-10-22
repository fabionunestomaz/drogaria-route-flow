import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAPBOX_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'forward', limit = 5 } = await req.json();
    
    console.log('Geocoding request:', { query, type, limit });

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let url: string;

    if (type === 'reverse') {
      // Reverse geocoding: coordinates to address
      const [lng, lat] = query.split(',').map(Number);
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=pt-BR&limit=1`;
    } else {
      // Forward geocoding: address to coordinates
      const encodedQuery = encodeURIComponent(query);
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&language=pt-BR&country=BR&limit=${limit}`;
    }

    console.log('Calling Mapbox API:', url.replace(MAPBOX_TOKEN || '', 'TOKEN_HIDDEN'));

    const response = await fetch(url);
    const data = await response.json();

    console.log('Mapbox response:', { features: data.features?.length });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in geocoding function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
