/**
 * SMS Notification Edge Function
 *
 * This function sends SMS notifications for order confirmations,
 * payment receipts, and other app notifications.
 * Supports multiple SMS providers (Africa's Talking, Twilio, etc.)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  phoneNumber: string
  message: string
  type?: 'order_confirmation' | 'payment_receipt' | 'delivery_update' | 'custom'
  orderId?: string
  userId?: string
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
    const body: SMSRequest = await req.json()
    const { phoneNumber, message, type = 'custom', orderId, userId } = body

    // Validate required parameters
    if (!phoneNumber || !message) {
      throw new Error('Missing required parameters: phoneNumber, message')
    }

    // Get SMS provider credentials from environment variables
    const SMS_PROVIDER = Deno.env.get('SMS_PROVIDER') || 'africas_talking'
    const AFRICAS_TALKING_USERNAME = Deno.env.get('AFRICAS_TALKING_USERNAME') || ''
    const AFRICAS_TALKING_API_KEY = Deno.env.get('AFRICAS_TALKING_API_KEY') || ''
    const AFRICAS_TALKING_SHORTCODE = Deno.env.get('AFRICAS_TALKING_SHORTCODE') || ''
    
    // Twilio credentials (alternative)
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || ''

    // Get Supabase credentials from request headers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get user to verify phone number
    let userPhone = phoneNumber
    if (userId) {
      const { data: userData } = await supabaseClient
        .from('users')
        .select('phone')
        .eq('id', userId)
        .single()

      if (userData?.phone) {
        userPhone = userData.phone
      }
    }

    console.log(`Sending SMS to: ${userPhone}, Type: ${type}`)

    let smsResult: { success: boolean; messageId?: string; error?: string }

    // Send SMS based on provider
    if (SMS_PROVIDER === 'africas_talking') {
      smsResult = await sendViaAfricasTalking(
        AFRICAS_TALKING_USERNAME,
        AFRICAS_TALKING_API_KEY,
        AFRICAS_TALKING_SHORTCODE,
        userPhone,
        message
      )
    } else if (SMS_PROVIDER === 'twilio') {
      smsResult = await sendViaTwilio(
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER,
        userPhone,
        message
      )
    } else {
      throw new Error(`Unsupported SMS provider: ${SMS_PROVIDER}`)
    }

    // Log SMS transaction
    if (smsResult.success) {
      await supabaseClient.from('sms_logs').insert({
        phone_number: userPhone,
        message: message,
        type: type,
        order_id: orderId,
        user_id: userId,
        status: 'sent',
        provider: SMS_PROVIDER,
        provider_message_id: smsResult.messageId,
      })
    } else {
      await supabaseClient.from('sms_logs').insert({
        phone_number: userPhone,
        message: message,
        type: type,
        order_id: orderId,
        user_id: userId,
        status: 'failed',
        provider: SMS_PROVIDER,
        error_message: smsResult.error,
      })
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: smsResult.success,
        messageId: smsResult.messageId,
        error: smsResult.error,
        provider: SMS_PROVIDER,
      }),
      {
        status: smsResult.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('SMS Notification error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send SMS',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function sendViaAfricasTalking(
  username: string,
  apiKey: string,
  shortcode: string,
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!username || !apiKey) {
      throw new Error('Africa\'s Talking credentials not configured')
    }

    // Format phone number for Africa's Talking (e.g., 2547XXXXXXXX)
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber.substring(1)
      : phoneNumber

    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'ApiKey': apiKey,
      },
      body: new URLSearchParams({
        username: username,
        to: formattedPhone,
        message: message,
        from: shortcode || 'FarmCare',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Africa\'s Talking error:', errorText)
      throw new Error(`SMS failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('Africa\'s Talking response:', data)

    // Check if any message failed
    if (data.SMSMessageData && data.SMSMessageData.Recipients) {
      const recipient = data.SMSMessageData.Recipients[0]
      if (recipient.statusCode === '101') {
        return { success: true, messageId: recipient.messageId }
      } else {
        return { success: false, error: recipient.errorMessage }
      }
    }

    return { success: false, error: 'Invalid response from SMS provider' }
  } catch (error) {
    console.error('Africa\'s Talking error:', error)
    return { success: false, error: error.message }
  }
}

async function sendViaTwilio(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  toNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured')
    }

    // Format phone numbers for Twilio
    const formattedFrom = fromNumber.startsWith('+') ? fromNumber : `+${fromNumber}`
    const formattedTo = toNumber.startsWith('+') ? toNumber : `+${toNumber}`

    const auth = btoa(`${accountSid}:${authToken}`)

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: formattedFrom,
        To: formattedTo,
        Body: message,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Twilio error:', errorText)
      throw new Error(`SMS failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('Twilio response:', data)

    return { success: true, messageId: data.sid }
  } catch (error) {
    console.error('Twilio error:', error)
    return { success: false, error: error.message }
  }
}
