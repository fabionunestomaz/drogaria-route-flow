import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  type: string;
  data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();

    // Validate input
    if (!payload.user_id || !payload.title || !payload.body || !payload.type) {
      throw new Error('Missing required fields: user_id, title, body, type');
    }

    // Create notification in database
    const { data: notification, error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data || null,
      })
      .select()
      .single();

    if (notifError) throw notifError;

    // Get user's push subscriptions
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', payload.user_id);

    if (subsError) throw subsError;

    // Send push notifications to all user's devices
    const pushResults = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // In a real implementation, you would use web-push library here
          // For now, we'll just log and update last_used_at
          console.log('Would send push to:', sub.endpoint);

          await supabaseClient
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);

          return { success: true, endpoint: sub.endpoint };
        } catch (error) {
          console.error('Failed to send push:', error);
          return { success: false, endpoint: sub.endpoint, error };
        }
      })
    );

    // Mark notification as sent
    await supabaseClient
      .from('notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notification.id);

    return new Response(
      JSON.stringify({
        success: true,
        notification,
        pushResults: pushResults.map((r) =>
          r.status === 'fulfilled' ? r.value : { success: false }
        ),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});