/**
 * M-Pesa STK Push Edge Function
 * 
 * This function initiates an STK Push payment request to M-Pesa Daraja API.
 * It keeps your M-Pesa credentials secure on the server side.
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
    // Only accept POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse request body
    const { phoneNumber, amount, accountReference, transactionDesc } = await req.json()

    // Validate required parameters
    if (!phoneNumber || !amount || !accountReference || !transactionDesc) {
      throw new Error('Missing required parameters: phoneNumber, amount, accountReference, transactionDesc')
    }

    // Validate phone number format (must be 2547XXXXXXXX)
    const phoneRegex = /^254[71]\d{8}$/
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('Invalid phone number format. Use 2547XXXXXXXX')
    }

    // Validate amount (must be positive number)
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a positive number')
    }

    // Get M-Pesa credentials from environment variables
    const MPESA_CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY') || ''
    const MPESA_CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET') || ''
    const MPESA_SHORTCODE = Deno.env.get('MPESA_SHORTCODE') || ''
    const MPESA_PASSKEY = Deno.env.get('MPESA_PASSKEY') || ''
    const MPESA_ENVIRONMENT = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox'
    const MPESA_CALLBACK_URL = Deno.env.get('MPESA_CALLBACK_URL') || ''

    // Validate credentials
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
      throw new Error('M-Pesa credentials not configured')
    }

    // Determine Daraja API base URL
    const DARAJA_BASE_URL = MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'

    console.log(`Using M-Pesa environment: ${MPESA_ENVIRONMENT}`)

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

    // Step 3: Initiate STK Push
    const stkRequestBody = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Ensure amount is an integer
      PartyA: phoneNumber,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    }

    console.log('Initiating STK Push for:', stkRequestBody)

    const stkResponse = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkRequestBody),
    })

    if (!stkResponse.ok) {
      const errorText = await stkResponse.text()
      console.error('STK Push error:', errorText)
      throw new Error(`STK Push failed: ${stkResponse.status}`)
    }

    const stkData = await stkResponse.json()
    console.log('STK Push response:', stkData)

    // Validate response
    if (stkData.ResponseCode !== '0') {
      throw new Error(stkData.ErrorMessage || stkData.ResponseDescription || 'STK Push failed')
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        CheckoutRequestID: stkData.CheckoutRequestID,
        MerchantRequestID: stkData.MerchantRequestID,
        ResponseCode: stkData.ResponseCode,
        ResponseDescription: stkData.ResponseDescription,
        CustomerMessage: stkData.CustomerMessage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('M-Pesa STK Push error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to initiate STK push',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
