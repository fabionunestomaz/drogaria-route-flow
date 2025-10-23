import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAPBOX_ACCESS_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coordinates, destinations } = await req.json();

    // Validate input presence
    if (!coordinates || !destinations) {
      throw new Error('Coordinates and destinations are required');
    }

    // Validate coordinates format
    if (typeof coordinates !== 'string' || coordinates.length > 2000) {
      throw new Error('Invalid coordinates format');
    }

    // Validate destinations is an array with reasonable size
    if (!Array.isArray(destinations) || destinations.length === 0 || destinations.length > 25) {
      throw new Error('Invalid destinations: must be an array with 1-25 items');
    }

    // Validate each destination has required fields
    for (const dest of destinations) {
      if (!dest || typeof dest !== 'object' || 
          typeof dest.lat !== 'number' || typeof dest.lng !== 'number' ||
          dest.lat < -90 || dest.lat > 90 || dest.lng < -180 || dest.lng > 180) {
        throw new Error('Invalid destination coordinates');
      }
    }

    // Usar Mapbox Optimization API
    const optimizationUrl = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates}?access_token=${MAPBOX_ACCESS_TOKEN}&source=first&destination=last&roundtrip=false&geometries=geojson`;

    const response = await fetch(optimizationUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Mapbox API error');
    }

    const trip = data.trips[0];
    const waypointOrder = data.waypoints.slice(1, -1); // Remove origin and last point

    // Reordenar destinations de acordo com a ordem otimizada
    const optimizedWaypoints = waypointOrder.map((wp: any) => {
      const destIndex = wp.waypoint_index - 1; // -1 because origin is not in destinations
      return destinations[destIndex];
    });

    return new Response(
      JSON.stringify({
        waypoints: optimizedWaypoints,
        totalDistance: trip.distance / 1000, // converter para km
        totalDuration: trip.duration, // em segundos
        coordinates: trip.geometry.coordinates
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
