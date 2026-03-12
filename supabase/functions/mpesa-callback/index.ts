/**
 * M-Pesa Callback Edge Function
 * 
 * This function receives callbacks from M-Pesa Daraja API when a payment is completed.
 * M-Pesa will POST to this endpoint with the payment result.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // M-Pesa sends POST requests
    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method)
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      })
    }

    // Parse callback data
    const callbackData = await req.json()
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2))

    // Extract the callback body
    const stkCallback = callbackData.Body?.stkCallback
    
    if (!stkCallback) {
      throw new Error('Invalid callback format: missing stkCallback')
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    } = stkCallback

    // Initialize variables for successful transaction
    let mpesaReceiptNumber = null
    let transactionDate = null
    let amount = null
    let phoneNumber = null
    let status = 'cancelled'

    // Check if payment was successful (ResultCode: 0 = success, others = failed/cancelled)
    if (ResultCode === 0) {
      status = 'completed'
      
      // Extract transaction details from callback metadata
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
      
      for (const item of callbackMetadata) {
        if (item.Name === 'MpesaReceiptNumber') {
          mpesaReceiptNumber = item.Value
        } else if (item.Name === 'TransactionDate') {
          transactionDate = item.Value
        } else if (item.Name === 'Amount') {
          amount = item.Value
        } else if (item.Name === 'PhoneNumber') {
          phoneNumber = item.Value
        }
      }

      console.log('Payment successful:', {
        mpesaReceiptNumber,
        transactionDate,
        amount,
        phoneNumber,
      })
    } else {
      console.log('Payment failed/cancelled:', {
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
      })
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update the transaction in the database
    const { error: updateError } = await supabase
      .from('mpesa_transactions')
      .update({
        status: status,
        result_code: ResultCode.toString(),
        result_desc: ResultDesc,
        mpesa_receipt_number: mpesaReceiptNumber,
        transaction_date: transactionDate ? new Date(transactionDate.toString()).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('checkout_request_id', CheckoutRequestID)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      throw updateError
    }

    console.log('Transaction updated successfully:', CheckoutRequestID)

    // If payment was successful, update the order status
    if (status === 'completed') {
      // Find the order associated with this transaction
      const { data: transaction } = await supabase
        .from('mpesa_transactions')
        .select('order_id')
        .eq('checkout_request_id', CheckoutRequestID)
        .single()

      if (transaction?.order_id) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.order_id)

        if (orderError) {
          console.error('Error updating order:', orderError)
        } else {
          console.log('Order updated successfully:', transaction.order_id)
        }
      }
    }

    // Return success response to M-Pesa
    return new Response(
      JSON.stringify({
        ResultCode: 0,
        ResultDesc: 'Success',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('M-Pesa Callback error:', error)
    
    // Return error response to M-Pesa
    return new Response(
      JSON.stringify({
        ResultCode: 1,
        ResultDesc: error.message || 'Callback processing failed',
      }),
      {
        status: 200, // Return 200 to prevent M-Pesa from retrying
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
