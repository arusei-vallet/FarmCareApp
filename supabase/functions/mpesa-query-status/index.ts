/**
 * M-Pesa Payment Query Status Edge Function
 *
 * This function queries the status of an M-Pesa STK Push payment
 * using the CheckoutRequestID from the original request.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Only accept POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse request body
    const { checkoutRequestId, amount, accountReference } = await req.json()

    // Validate required parameters
    if (!checkoutRequestId) {
      throw new Error('Missing required parameter: checkoutRequestId')
    }

    // Get M-Pesa credentials from environment variables
    const MPESA_CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY') || ''
    const MPESA_CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET') || ''
    const MPESA_SHORTCODE = Deno.env.get('MPESA_SHORTCODE') || ''
    const MPESA_PASSKEY = Deno.env.get('MPESA_PASSKEY') || ''
    const MPESA_ENVIRONMENT = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox'

    // Validate credentials
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
      throw new Error('M-Pesa credentials not configured')
    }

    // Determine Daraja API base URL
    const DARAJA_BASE_URL = MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'

    console.log(`Querying payment status for: ${checkoutRequestId}`)

    // Step 1: Get access token
    const auth = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`)

    const tokenResponse = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token error:', errorText)
      throw new Error(`Failed to get access token: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('No access token received')
    }

    console.log('Access token obtained successfully')

    // Step 2: Generate timestamp and password
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14)

    const password = btoa(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`)

    // Step 3: Query STK Push status
    const queryRequestBody = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }

    console.log('Querying STK Push status:', queryRequestBody)

    const queryResponse = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryRequestBody),
    })

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text()
      console.error('Query error:', errorText)
      throw new Error(`Query failed: ${queryResponse.status}`)
    }

    const queryData = await queryResponse.json()
    console.log('Query response:', queryData)

    // Return query response
    return new Response(
      JSON.stringify({
        success: true,
        ResultCode: queryData.ResultCode,
        ResultDesc: queryData.ResultDesc,
        CheckoutRequestID: queryData.CheckoutRequestID,
        MerchantRequestID: queryData.MerchantRequestID,
        Amount: queryData.Amount,
        MpesaReceiptNumber: queryData.MpesaReceiptNumber,
        TransactionDate: queryData.TransactionDate,
        PhoneNumber: queryData.PhoneNumber,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('M-Pesa Query Status error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to query payment status',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
