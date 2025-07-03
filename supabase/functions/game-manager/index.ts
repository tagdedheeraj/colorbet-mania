
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

    const { action, gameMode = 'quick' } = await req.json()

    if (action === 'start_game') {
      // Generate game number
      const { data: lastGame } = await supabaseClient
        .from('games')
        .select('game_number')
        .order('game_number', { ascending: false })
        .limit(1)
        .single()

      const gameNumber = (lastGame?.game_number || 0) + 1
      
      // Game durations in seconds
      const durations = {
        blitz: 30,
        quick: 60,
        classic: 180,
        extended: 300
      }
      
      const duration = durations[gameMode as keyof typeof durations] || 60
      const startTime = new Date()
      const endTime = new Date(startTime.getTime() + duration * 1000)

      // Create new game
      const { data: game, error } = await supabaseClient
        .from('games')
        .insert({
          game_number: gameNumber,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          game_mode: gameMode,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, game }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'complete_game') {
      const { gameId } = await req.json()
      
      // Generate random result
      const colors = ['red', 'green', 'purple-red']
      const resultColor = colors[Math.floor(Math.random() * colors.length)]
      const resultNumber = Math.floor(Math.random() * 10)

      // Update game with result
      const { error: updateError } = await supabaseClient
        .from('games')
        .update({
          result_color: resultColor,
          result_number: resultNumber,
          status: 'completed'
        })
        .eq('id', gameId)

      if (updateError) throw updateError

      // Process all bets for this game
      const { data: bets } = await supabaseClient
        .from('bets')
        .select('*')
        .eq('game_id', gameId)

      if (bets) {
        for (const bet of bets) {
          let isWinner = false
          let actualWin = 0

          // Check if bet won
          if (bet.bet_type === 'color' && bet.bet_value === resultColor) {
            isWinner = true
            actualWin = bet.potential_win
          } else if (bet.bet_type === 'number' && parseInt(bet.bet_value) === resultNumber && resultNumber !== 0) {
            isWinner = true
            actualWin = bet.potential_win
          }

          // Update bet result
          await supabaseClient
            .from('bets')
            .update({
              is_winner: isWinner,
              actual_win: actualWin
            })
            .eq('id', bet.id)

          // Update user balance if won
          if (isWinner) {
            const { data: user } = await supabaseClient
              .from('users')
              .select('balance')
              .eq('id', bet.user_id)
              .single()

            if (user) {
              await supabaseClient
                .from('users')
                .update({ balance: user.balance + actualWin })
                .eq('id', bet.user_id)

              // Add win transaction
              await supabaseClient
                .from('transactions')
                .insert({
                  user_id: bet.user_id,
                  type: 'win',
                  amount: actualWin,
                  description: `Game #${gameId} win`
                })
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: { color: resultColor, number: resultNumber }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
