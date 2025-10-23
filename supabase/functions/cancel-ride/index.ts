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

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ride_id, reason, canceled_by } = await req.json();

    if (!ride_id || !reason) {
      return new Response(
        JSON.stringify({ error: 'Missing ride_id or reason' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ride to check status and cancelable_until
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', ride_id)
      .single();

    if (rideError || !ride) {
      return new Response(
        JSON.stringify({ error: 'Ride not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to cancel
    const isCustomer = ride.customer_id === user.id;
    const isDriver = ride.driver_id === user.id;
    const isAdmin = canceled_by === 'admin'; // Simplified, should check user_roles

    if (!isCustomer && !isDriver && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to cancel this ride' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cancellation policy
    const now = new Date();
    let fee_value = 0;

    if (isCustomer && !isAdmin) {
      // Customer cancellation policy
      if (ride.status === 'picked') {
        return new Response(
          JSON.stringify({ error: 'Cannot cancel after pickup' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (ride.status === 'accepted' || ride.status === 'enroute_pickup') {
        fee_value = 5.00; // Fixed fee
      }

      if (ride.cancelable_until && new Date(ride.cancelable_until) < now) {
        return new Response(
          JSON.stringify({ error: 'Cancellation window expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update ride status
    const { error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'canceled',
        canceled_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', ride_id);

    if (updateError) throw updateError;

    // Insert cancellation record
    const { error: cancelError } = await supabase
      .from('ride_cancellations')
      .insert({
        ride_id,
        canceled_by: canceled_by || (isCustomer ? 'customer' : 'driver'),
        reason,
        fee_value
      });

    if (cancelError) throw cancelError;

    // Log audit
    await supabase
      .from('audit_logs')
      .insert({
        entity: 'ride',
        entity_id: ride_id,
        action: 'cancel',
        metadata: { reason, canceled_by, fee_value },
        user_id: user.id
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        fee_value,
        message: fee_value > 0 ? `Taxa de cancelamento: R$ ${fee_value.toFixed(2)}` : 'Cancelamento realizado'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error canceling ride:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});