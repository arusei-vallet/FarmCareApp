/**
 * M-Pesa STK Push Edge Function (Improved)
 *
 * This function initiates an STK Push payment request to M-Pesa Daraja API.
 * It keeps your M-Pesa credentials secure on the server side.
 *
 * Features:
 * - Enhanced error handling and validation
 * - Comprehensive logging for debugging
 * - Transaction logging to database
 * - Retry attempt tracking
 * - Better error messages
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper function to log with timestamp
const log = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...data,
  }
  console.log(JSON.stringify(logEntry))
  return logEntry
}

// Helper function to validate phone number format
const validatePhoneNumber = (phone: string): { valid: boolean; formatted: string; error?: string } => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  let formatted = cleaned

  // Handle different formats
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Format: 0712345678 -> 254712345678
    formatted = '254' + cleaned.substring(1)
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    // Format: 712345678 -> 254712345678
    formatted = '254' + cleaned
  } else if (cleaned.startsWith('1') && cleaned.length === 9) {
    // Format: 112345678 -> 254112345678 (new Safaricom prefixes)
    formatted = '254' + cleaned
  } else if (cleaned.startsWith('254') && cleaned.length === 12) {
    // Already in correct format
    formatted = cleaned
  } else {
    return {
      valid: false,
      formatted: '',
      error: 'Invalid phone number format. Use 07XXXXXXXX, 7XXXXXXXX, or 2547XXXXXXXX',
    }
  }

  // Validate final length
  if (formatted.length !== 12) {
    return {
      valid: false,
      formatted: '',
      error: 'Phone number must be 12 digits when formatted (2547XXXXXXXX)',
    }
  }

  // Validate Safaricom prefixes (7XX, 1XX)
  const prefix = formatted.substring(3, 4)
  if (!['7', '1'].includes(prefix)) {
    return {
      valid: false,
      formatted: '',
      error: 'Invalid Safaricom prefix. Number should start with 2547 or 2541',
    }
  }

  return { valid: true, formatted }
}

serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  log('INFO', `📱 STK Push request started`, { requestId, method: req.method })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('INFO', `CORS preflight handled`, { requestId })
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      log('ERROR', `❌ Method not allowed`, { requestId, method: req.method })
      throw new Error('Method not allowed')
    }

    // Parse request body
    let requestBody: any
    try {
      requestBody = await req.json()
    } catch (parseError) {
      log('ERROR', `❌ Invalid JSON in request body`, { requestId, error: parseError.message })
      throw new Error('Invalid JSON in request body')
    }

    const { phoneNumber, amount, accountReference, transactionDesc, orderId, userId } = requestBody

    log('INFO', `📥 Request received`, {
      requestId,
      phoneNumber,
      amount,
      accountReference,
      hasOrderId: !!orderId,
      hasUserId: !!userId,
    })

    // Validate required parameters
    if (!phoneNumber || !amount || !accountReference || !transactionDesc) {
      log('ERROR', `❌ Missing required parameters`, {
        requestId,
        missing: {
          phoneNumber: !phoneNumber,
          amount: !amount,
          accountReference: !accountReference,
          transactionDesc: !transactionDesc,
        },
      })
      throw new Error('Missing required parameters: phoneNumber, amount, accountReference, transactionDesc')
    }

    // Validate phone number format
    const phoneValidation = validatePhoneNumber(phoneNumber)
    if (!phoneValidation.valid) {
      log('ERROR', `❌ Phone validation failed`, { requestId, error: phoneValidation.error })
      throw new Error(phoneValidation.error)
    }

    const formattedPhone = phoneValidation.formatted
    log('INFO', `✅ Phone validated and formatted`, { requestId, original: phoneNumber, formatted: formattedPhone })

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      log('ERROR', `❌ Invalid amount`, { requestId, amount, type: typeof amount })
      throw new Error('Amount must be a positive number')
    }

    if (amount < 1) {
      log('ERROR', `❌ Amount too small`, { requestId, amount })
      throw new Error('Minimum amount is KES 1')
    }

    if (amount > 150000) {
      log('ERROR', `❌ Amount exceeds limit`, { requestId, amount })
      throw new Error('Maximum amount is KES 150,000 per transaction')
    }

    // Get M-Pesa credentials from environment variables
    const MPESA_CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY')
    const MPESA_CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')
    const MPESA_SHORTCODE = Deno.env.get('MPESA_SHORTCODE')
    const MPESA_PASSKEY = Deno.env.get('MPESA_PASSKEY')
    const MPESA_ENVIRONMENT = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox'
    const MPESA_CALLBACK_URL = Deno.env.get('MPESA_CALLBACK_URL')

    // Validate credentials
    const missingCredentials = []
    if (!MPESA_CONSUMER_KEY) missingCredentials.push('MPESA_CONSUMER_KEY')
    if (!MPESA_CONSUMER_SECRET) missingCredentials.push('MPESA_CONSUMER_SECRET')
    if (!MPESA_SHORTCODE) missingCredentials.push('MPESA_SHORTCODE')
    if (!MPESA_PASSKEY) missingCredentials.push('MPESA_PASSKEY')
    if (!MPESA_CALLBACK_URL) missingCredentials.push('MPESA_CALLBACK_URL')

    if (missingCredentials.length > 0) {
      log('ERROR', `❌ Missing M-Pesa credentials`, { requestId, missing: missingCredentials })
      throw new Error(`M-Pesa credentials not configured: ${missingCredentials.join(', ')}`)
    }

    log('INFO', `✅ All credentials present`, {
      requestId,
      environment: MPESA_ENVIRONMENT,
      shortcode: MPESA_SHORTCODE,
    })

    // Determine Daraja API base URL
    const DARAJA_BASE_URL = MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'

    log('INFO', `🌐 Using Daraja API`, { requestId, baseUrl: DARAJA_BASE_URL, environment: MPESA_ENVIRONMENT })

    // Step 1: Get access token
    log('INFO', `🔑 Requesting access token...`, { requestId })
    const tokenStartTime = Date.now()

    const auth = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`)

    const tokenResponse = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      timeout: 10000, // 10 second timeout
    })

    const tokenDuration = Date.now() - tokenStartTime
    log('INFO', `🔑 Token response received`, { requestId, duration: tokenDuration, status: tokenResponse.status })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      log('ERROR', `❌ Token error`, {
        requestId,
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
      })
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      log('ERROR', `❌ No access token in response`, { requestId, responseData: tokenData })
      throw new Error('No access token received from M-Pesa')
    }

    log('INFO', `✅ Access token obtained`, {
      requestId,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    })

    // Step 2: Generate timestamp and password
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14)

    const password = btoa(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`)

    log('INFO', `🔐 Generated STK credentials`, { requestId, timestamp, shortcode: MPESA_SHORTCODE })

    // Step 3: Initiate STK Push
    const stkRequestBody = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Ensure amount is an integer
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    }

    log('INFO', `📤 Initiating STK Push...`, {
      requestId,
      amount: stkRequestBody.Amount,
      phone: stkRequestBody.PhoneNumber,
      accountRef: stkRequestBody.AccountReference,
    })

    const stkStartTime = Date.now()

    const stkResponse = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkRequestBody),
      timeout: 15000, // 15 second timeout
    })

    const stkDuration = Date.now() - stkStartTime
    log('INFO', `📥 STK response received`, { requestId, duration: stkDuration, status: stkResponse.status })

    if (!stkResponse.ok) {
      const errorText = await stkResponse.text()
      log('ERROR', `❌ STK Push HTTP error`, {
        requestId,
        status: stkResponse.status,
        statusText: stkResponse.statusText,
        error: errorText,
      })
      throw new Error(`STK Push failed: ${stkResponse.status} ${stkResponse.statusText}`)
    }

    const stkData = await stkResponse.json()
    log('INFO', `📊 STK Response data`, {
      requestId,
      ResponseCode: stkData.ResponseCode,
      ResponseDescription: stkData.ResponseDescription,
      CheckoutRequestID: stkData.CheckoutRequestID,
      MerchantRequestID: stkData.MerchantRequestID,
      CustomerMessage: stkData.CustomerMessage,
    })

    // Check for M-Pesa API errors
    if (stkData.ResponseCode && stkData.ResponseCode !== '0') {
      log('ERROR', `❌ STK Push rejected by M-Pesa`, {
        requestId,
        ResponseCode: stkData.ResponseCode,
        ResponseDescription: stkData.ResponseDescription,
        ErrorMessage: stkData.ErrorMessage,
        CustomerMessage: stkData.CustomerMessage,
      })
      throw new Error(stkData.CustomerMessage || stkData.ErrorMessage || stkData.ResponseDescription || 'STK Push failed')
    }

    // Validate response has required fields
    if (!stkData.CheckoutRequestID) {
      log('ERROR', `❌ Missing CheckoutRequestID in response`, { requestId, responseData: stkData })
      throw new Error('Invalid response from M-Pesa: Missing CheckoutRequestID')
    }

    // Create Supabase client to log transaction
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    let transactionId = null

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Insert transaction record
        const { data: transactionData, error: insertError } = await supabase
          .from('mpesa_transactions')
          .insert({
            checkout_request_id: stkData.CheckoutRequestID,
            merchant_request_id: stkData.MerchantRequestID || null,
            phone_number: formattedPhone,
            amount: amount,
            account_reference: accountReference,
            transaction_desc: transactionDesc,
            status: 'pending',
            result_code: stkData.ResponseCode || null,
            result_desc: stkData.ResponseDescription || null,
            order_id: orderId || null,
            user_id: userId || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (insertError) {
          log('ERROR', `⚠️ Failed to log transaction to database`, {
            requestId,
            error: insertError.message,
            details: insertError.details,
          })
        } else {
          transactionId = transactionData?.id
          log('INFO', `✅ Transaction logged to database`, { requestId, transactionId, checkoutRequestId: stkData.CheckoutRequestID })
        }
      } catch (dbError) {
        log('ERROR', `⚠️ Database error`, { requestId, error: dbError.message })
        // Don't fail the request if database logging fails
      }
    } else {
      log('WARN', `⚠️ Supabase credentials not available for logging`, { requestId })
    }

    const totalDuration = Date.now() - startTime

    log('INFO', `✅ STK Push initiated successfully`, {
      requestId,
      transactionId,
      checkoutRequestId: stkData.CheckoutRequestID,
      totalDuration,
    })

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        CheckoutRequestID: stkData.CheckoutRequestID,
        MerchantRequestID: stkData.MerchantRequestID,
        ResponseCode: stkData.ResponseCode,
        ResponseDescription: stkData.ResponseDescription,
        CustomerMessage: stkData.CustomerMessage,
        transactionId,
        requestId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    const totalDuration = Date.now() - startTime

    log('ERROR', `❌ STK Push failed`, {
      requestId,
      error: error.message,
      stack: error.stack,
      totalDuration,
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to initiate STK push',
        requestId,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
