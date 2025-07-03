
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active games that have expired
    const { data: expiredGames, error: fetchError } = await supabase
      .from('games')
      .select('id, game_number, end_time')
      .eq('status', 'active')
      .lt('end_time', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired games:', fetchError);
      throw fetchError;
    }

    if (expiredGames && expiredGames.length > 0) {
      // Mark expired games as completed
      const { error: updateError } = await supabase
        .from('games')
        .update({ status: 'completed' })
        .in('id', expiredGames.map(game => game.id));

      if (updateError) {
        console.error('Error updating expired games:', updateError);
        throw updateError;
      }

      console.log(`Marked ${expiredGames.length} expired games as completed`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleanedGames: expiredGames?.length || 0 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in cleanup-games function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
