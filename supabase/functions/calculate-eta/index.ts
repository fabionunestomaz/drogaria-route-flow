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
    const { origin_lng, origin_lat, dest_lng, dest_lat } = await req.json();

    // Validate required parameters
    if (!origin_lng || !origin_lat || !dest_lng || !dest_lat) {
      return new Response(
        JSON.stringify({ error: 'Missing required coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate coordinates
    const oLng = Number(origin_lng);
    const oLat = Number(origin_lat);
    const dLng = Number(dest_lng);
    const dLat = Number(dest_lat);

    // Validate coordinate ranges
    if (
      isNaN(oLng) || isNaN(oLat) || isNaN(dLng) || isNaN(dLat) ||
      oLng < -180 || oLng > 180 || dLng < -180 || dLng > 180 ||
      oLat < -90 || oLat > 90 || dLat < -90 || dLat > 90
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid coordinate values' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!mapboxToken) {
      throw new Error('MAPBOX_ACCESS_TOKEN not configured');
    }

    const coordinates = `${oLng},${oLat};${dLng},${dLat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?alternatives=false&overview=full&geometries=geojson&access_token=${mapboxToken}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Mapbox API error');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No route found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const route = data.routes[0];
    const eta_seconds = Math.round(route.duration);
    const distance_km = route.distance / 1000;

    return new Response(
      JSON.stringify({ 
        eta_seconds, 
        distance_km,
        geometry: route.geometry 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error calculating ETA:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});