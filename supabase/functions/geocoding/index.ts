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
    
    console.log('Geocoding request:', { type, limit });

    // Input validation
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate query length to prevent DoS
    if (typeof query !== 'string' || query.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Invalid query format or length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate type parameter
    if (!['forward', 'reverse'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid type parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate limit parameter
    const parsedLimit = Math.min(Math.max(1, Number(limit) || 5), 10);
    if (isNaN(parsedLimit)) {
      return new Response(
        JSON.stringify({ error: 'Invalid limit parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let url: string;

    if (type === 'reverse') {
      // Reverse geocoding: coordinates to address
      const [lng, lat] = query.split(',').map(Number);
      
      // Validate coordinates
      if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        return new Response(
          JSON.stringify({ error: 'Invalid coordinates' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=pt-BR&limit=1`;
    } else {
      // Forward geocoding: address to coordinates
      const encodedQuery = encodeURIComponent(query);
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&language=pt-BR&country=BR&limit=${parsedLimit}`;
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
