
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

    const authHeader = req.headers.get('authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { action, amount, paymentMethod } = await req.json()

    if (action === 'deposit') {
      // Generate transaction reference
      const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      
      // Create pending transaction
      const { data: transaction, error: txnError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: amount,
          status: 'pending',
          payment_method: paymentMethod,
          transaction_reference: transactionRef,
          description: `Deposit via ${paymentMethod}`
        })
        .select()
        .single()

      if (txnError) throw txnError

      // For demo purposes, auto-complete the transaction
      // In production, this would integrate with actual payment gateway
      setTimeout(async () => {
        // Update transaction status
        await supabaseClient
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', transaction.id)

        // Update user balance
        const { data: userData } = await supabaseClient
          .from('users')
          .select('balance')
          .eq('id', user.id)
          .single()

        if (userData) {
          await supabaseClient
            .from('users')
            .update({ balance: userData.balance + amount })
            .eq('id', user.id)
        }
      }, 2000) // 2 second delay to simulate payment processing

      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction: {
            id: transaction.id,
            reference: transactionRef,
            status: 'pending',
            amount: amount
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'withdraw') {
      // Check user balance
      const { data: userData } = await supabaseClient
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single()

      if (!userData || userData.balance < amount) {
        return new Response(
          JSON.stringify({ error: 'Insufficient balance' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate transaction reference
      const transactionRef = `WTH_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      
      // Create withdrawal transaction
      const { data: transaction, error: txnError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amount,
          status: 'completed',
          payment_method: paymentMethod,
          transaction_reference: transactionRef,
          description: `Withdrawal via ${paymentMethod}`
        })
        .select()
        .single()

      if (txnError) throw txnError

      // Update user balance
      await supabaseClient
        .from('users')
        .update({ balance: userData.balance - amount })
        .eq('id', user.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction: {
            id: transaction.id,
            reference: transactionRef,
            status: 'completed',
            amount: -amount
          }
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
