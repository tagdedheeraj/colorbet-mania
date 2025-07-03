
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create a new active game
    const gameNumber = Math.floor(Math.random() * 10000) + 1000
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + 60000) // 60 seconds from now

    const { data: game, error: gameError } = await supabaseClient
      .from('games')
      .insert({
        game_number: gameNumber,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'active',
        game_mode: 'quick'
      })
      .select()
      .single()

    if (gameError) {
      throw gameError
    }

    console.log('Created game:', game)

    return new Response(
      JSON.stringify({ success: true, game }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error creating demo game:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    )
  }
})
