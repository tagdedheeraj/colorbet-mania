
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

    const requestBody = await req.json()
    const { action, gameMode = 'quick', gameId } = requestBody

    console.log('Game manager action:', action, { gameMode, gameId })

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

      console.log(`Created new ${gameMode} game #${gameNumber} (${duration}s)`)

      return new Response(
        JSON.stringify({ success: true, game }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'complete_game') {
      if (!gameId) {
        throw new Error('Game ID is required for completing game')
      }
      
      console.log('Completing game:', gameId)
      
      // Generate random result
      const colors = ['red', 'green', 'purple-red']
      const resultColor = colors[Math.floor(Math.random() * colors.length)]
      const resultNumber = Math.floor(Math.random() * 10)

      console.log('Generated result:', { resultColor, resultNumber })

      // Update game with result
      const { error: updateError } = await supabaseClient
        .from('games')
        .update({
          result_color: resultColor,
          result_number: resultNumber,
          status: 'completed'
        })
        .eq('id', gameId)

      if (updateError) {
        console.error('Error updating game:', updateError)
        throw updateError
      }

      // Process all bets for this game
      const { data: bets, error: betsError } = await supabaseClient
        .from('bets')
        .select('*')
        .eq('game_id', gameId)

      if (betsError) {
        console.error('Error loading bets:', betsError)
        throw betsError
      }

      console.log(`Processing ${bets?.length || 0} bets for game ${gameId}`)

      if (bets && bets.length > 0) {
        const betUpdates = []
        const balanceUpdates = new Map()
        const transactions = []

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

          console.log(`Bet ${bet.id}: ${bet.bet_type} ${bet.bet_value} - ${isWinner ? 'WON' : 'LOST'} ${actualWin}`)

          // Prepare bet update
          betUpdates.push({
            id: bet.id,
            is_winner: isWinner,
            actual_win: actualWin
          })

          // If user won, prepare balance update and transaction
          if (isWinner && actualWin > 0) {
            const currentBalance = balanceUpdates.get(bet.user_id) || 0
            balanceUpdates.set(bet.user_id, currentBalance + actualWin)

            transactions.push({
              user_id: bet.user_id,
              type: 'win',
              amount: actualWin,
              description: `Win from Game #${gameId} - ${bet.bet_type}: ${bet.bet_value}`
            })
          }
        }

        // Update all bets
        for (const betUpdate of betUpdates) {
          const { error: betUpdateError } = await supabaseClient
            .from('bets')
            .update({
              is_winner: betUpdate.is_winner,
              actual_win: betUpdate.actual_win
            })
            .eq('id', betUpdate.id)

          if (betUpdateError) {
            console.error('Error updating bet:', betUpdate.id, betUpdateError)
          }
        }

        // Update user balances
        for (const [userId, winAmount] of balanceUpdates) {
          // Get current balance
          const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single()

          if (!userError && user) {
            const newBalance = (user.balance || 0) + winAmount
            
            const { error: balanceError } = await supabaseClient
              .from('users')
              .update({ balance: newBalance })
              .eq('id', userId)

            if (balanceError) {
              console.error('Error updating balance for user:', userId, balanceError)
            } else {
              console.log(`Updated balance for user ${userId}: +${winAmount} = ${newBalance}`)
            }
          }
        }

        // Add win transactions
        if (transactions.length > 0) {
          const { error: transactionError } = await supabaseClient
            .from('transactions')
            .insert(transactions)

          if (transactionError) {
            console.error('Error inserting transactions:', transactionError)
          } else {
            console.log(`Added ${transactions.length} win transactions`)
          }
        }

        console.log(`Game completion processed: ${betUpdates.length} bets, ${balanceUpdates.size} winners`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: { color: resultColor, number: resultNumber },
          processedBets: bets?.length || 0,
          winners: bets?.filter(bet => {
            if (bet.bet_type === 'color' && bet.bet_value === resultColor) return true
            if (bet.bet_type === 'number' && parseInt(bet.bet_value) === resultNumber && resultNumber !== 0) return true
            return false
          }).length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Game manager error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
