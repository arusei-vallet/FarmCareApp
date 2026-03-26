/**
 * Email Notification Edge Function
 *
 * This function sends email notifications for order confirmations,
 * payment receipts, and other app notifications.
 * Supports multiple email providers (SendGrid, Resend, AWS SES)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html?: string
  text?: string
  type?: 'order_confirmation' | 'payment_receipt' | 'password_reset' | 'custom'
  orderId?: string
  userId?: string
  fromName?: string
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
    const body: EmailRequest = await req.json()
    const { to, subject, html, text, type = 'custom', orderId, userId, fromName = 'FarmCare' } = body

    // Validate required parameters
    if (!to || (!html && !text)) {
      throw new Error('Missing required parameters: to, html/text')
    }

    // Get email provider credentials from environment variables
    const EMAIL_PROVIDER = Deno.env.get('EMAIL_PROVIDER') || 'sendgrid'
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || ''
    const SENDGRID_FROM_EMAIL = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@farmcare.com'
    
    // Resend credentials (alternative)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
    const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'FarmCare <noreply@farmcare.com>'

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

    // Get user email if userId provided
    let userEmail = to
    if (userId) {
      const { data: userData } = await supabaseClient
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (userData?.email) {
        userEmail = userData.email
      }
    }

    console.log(`Sending email to: ${userEmail}, Subject: ${subject}, Type: ${type}`)

    let emailResult: { success: boolean; messageId?: string; error?: string }

    // Send email based on provider
    if (EMAIL_PROVIDER === 'sendgrid') {
      emailResult = await sendViaSendGrid(
        SENDGRID_API_KEY,
        SENDGRID_FROM_EMAIL,
        userEmail,
        subject,
        html,
        text,
        fromName
      )
    } else if (EMAIL_PROVIDER === 'resend') {
      emailResult = await sendViaResend(
        RESEND_API_KEY,
        RESEND_FROM_EMAIL,
        userEmail,
        subject,
        html,
        text
      )
    } else {
      throw new Error(`Unsupported email provider: ${EMAIL_PROVIDER}`)
    }

    // Log email transaction
    if (emailResult.success) {
      await supabaseClient.from('email_logs').insert({
        recipient_email: userEmail,
        subject: subject,
        body: html || text,
        type: type,
        order_id: orderId,
        user_id: userId,
        status: 'sent',
        provider: EMAIL_PROVIDER,
        provider_message_id: emailResult.messageId,
      })
    } else {
      await supabaseClient.from('email_logs').insert({
        recipient_email: userEmail,
        subject: subject,
        body: html || text,
        type: type,
        order_id: orderId,
        user_id: userId,
        status: 'failed',
        provider: EMAIL_PROVIDER,
        error_message: emailResult.error,
      })
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
        provider: EMAIL_PROVIDER,
      }),
      {
        status: emailResult.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Email Notification error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send email',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function sendViaSendGrid(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  html?: string,
  text?: string,
  fromName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail }],
            subject: subject,
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        content: [
          ...(html ? [{ type: 'text/html', value: html }] : []),
          ...(text ? [{ type: 'text/plain', value: text }] : []),
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SendGrid error:', errorText)
      throw new Error(`Email failed: ${response.status}`)
    }

    // SendGrid returns 202 Accepted on success
    const messageId = response.headers.get('x-message-id') || undefined
    console.log('SendGrid email sent successfully')

    return { success: true, messageId }
  } catch (error) {
    console.error('SendGrid error:', error)
    return { success: false, error: error.message }
  }
}

async function sendViaResend(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  html?: string,
  text?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!apiKey) {
      throw new Error('Resend API key not configured')
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: subject,
        html: html,
        text: text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Resend error:', errorText)
      throw new Error(`Email failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('Resend email sent successfully:', data)

    return { success: true, messageId: data.id }
  } catch (error) {
    console.error('Resend error:', error)
    return { success: false, error: error.message }
  }
}
