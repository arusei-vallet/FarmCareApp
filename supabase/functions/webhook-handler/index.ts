/**
 * Webhook Handler Edge Function
 *
 * This function handles incoming webhooks from external services:
 * - Payment gateway webhooks
 * - Delivery service webhooks
 * - Third-party integrations
 * - Custom triggers
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  source: string
  event: string
  data: any
  signature?: string
  timestamp?: string
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

    // Get webhook configuration from headers
    const webhookSource = req.headers.get('X-Webhook-Source') || 'unknown'
    const webhookSignature = req.headers.get('X-Webhook-Signature')
    const webhookTimestamp = req.headers.get('X-Webhook-Timestamp')
    const webhookEvent = req.headers.get('X-Webhook-Event') || 'generic'

    // Parse request body
    const body: any = await req.json()

    const payload: WebhookPayload = {
      source: webhookSource,
      event: webhookEvent,
      data: body,
      signature: webhookSignature || undefined,
      timestamp: webhookTimestamp || new Date().toISOString(),
    }

    console.log(`Webhook received from: ${webhookSource}, Event: ${webhookEvent}`)

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
          },
        },
      }
    )

    // Verify webhook signature if provided
    if (webhookSignature) {
      const isValid = await verifyWebhookSignature(payload, webhookSignature)
      if (!isValid) {
        throw new Error('Invalid webhook signature')
      }
    }

    // Log webhook receipt
    await supabaseClient.from('webhook_logs').insert({
      source: webhookSource,
      event: webhookEvent,
      payload: body,
      signature: webhookSignature,
      received_at: new Date().toISOString(),
      status: 'processing',
    })

    // Process webhook based on source and event
    let result: any

    switch (webhookSource) {
      case 'mpesa':
        result = await handleMpesaWebhook(supabaseClient, payload)
        break
      case 'delivery':
        result = await handleDeliveryWebhook(supabaseClient, payload)
        break
      case 'inventory':
        result = await handleInventoryWebhook(supabaseClient, payload)
        break
      case 'payment_gateway':
        result = await handlePaymentGatewayWebhook(supabaseClient, payload)
        break
      case 'custom':
        result = await handleCustomWebhook(supabaseClient, payload)
        break
      default:
        result = await handleGenericWebhook(supabaseClient, payload)
    }

    // Update webhook log
    await supabaseClient
      .from('webhook_logs')
      .update({
        status: 'completed',
        response: result,
        processed_at: new Date().toISOString(),
      })
      .eq('source', webhookSource)
      .eq('event', webhookEvent)
      .order('received_at', { ascending: false })
      .limit(1)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        source: webhookSource,
        event: webhookEvent,
        processed: true,
        result: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Webhook Handler error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process webhook',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function handleMpesaWebhook(supabaseClient: any, payload: WebhookPayload): Promise<any> {
  const { data } = payload

  console.log('Processing M-Pesa webhook:', data)

  // Handle M-Pesa callback data
  if (data.Body && data.Body.stkCallback) {
    const callback = data.Body.stkCallback
    const checkoutRequestId = callback.CheckoutRequestID
    const resultCode = callback.ResultCode
    const resultDesc = callback.ResultDesc

    // Update mpesa_transactions table
    const { error } = await supabaseClient
      .from('mpesa_transactions')
      .update({
        result_code: resultCode,
        result_description: resultDesc,
        status: resultCode === '0' ? 'completed' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('checkout_request_id', checkoutRequestId)

    if (error) {
      throw new Error(`Failed to update M-Pesa transaction: ${error.message}`)
    }

    // If payment successful, update order status
    if (resultCode === '0' && callback.CallbackMetadata) {
      const metadata = callback.CallbackMetadata.Item
      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value
      const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value
      const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value

      await supabaseClient
        .from('mpesa_transactions')
        .update({
          mpesa_receipt_number: mpesaReceiptNumber,
          amount: amount,
          phone_number: phoneNumber,
        })
        .eq('checkout_request_id', checkoutRequestId)

      // Get the transaction to find order_id
      const { data: transaction } = await supabaseClient
        .from('mpesa_transactions')
        .select('order_id')
        .eq('checkout_request_id', checkoutRequestId)
        .single()

      if (transaction?.order_id) {
        await supabaseClient
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.order_id)
      }
    }

    return {
      processed: true,
      checkoutRequestId,
      resultCode,
      resultDesc,
    }
  }

  return { processed: false, reason: 'Unknown M-Pesa callback format' }
}

async function handleDeliveryWebhook(supabaseClient: any, payload: WebhookPayload): Promise<any> {
  const { data, event } = payload

  console.log('Processing Delivery webhook:', data, 'Event:', event)

  const orderId = data.order_id || data.orderId || data.id

  if (!orderId) {
    throw new Error('Missing order_id in delivery webhook')
  }

  let status: string | undefined
  let trackingData: any = {}

  switch (event) {
    case 'delivery.picked_up':
      status = 'in_transit'
      trackingData = { picked_up_at: new Date().toISOString() }
      break
    case 'delivery.in_transit':
      status = 'in_transit'
      trackingData = {
        location: data.location,
        estimated_delivery: data.estimated_delivery,
      }
      break
    case 'delivery.delivered':
      status = 'delivered'
      trackingData = { delivered_at: new Date().toISOString() }
      break
    case 'delivery.failed':
      status = 'delivery_failed'
      trackingData = { failure_reason: data.reason }
      break
    default:
      status = undefined
  }

  const updateData: any = {
    ...trackingData,
    updated_at: new Date().toISOString(),
  }

  if (status) {
    updateData.status = status
  }

  const { error } = await supabaseClient
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`)
  }

  return {
    processed: true,
    orderId,
    newStatus: status,
  }
}

async function handleInventoryWebhook(supabaseClient: any, payload: WebhookPayload): Promise<any> {
  const { data, event } = payload

  console.log('Processing Inventory webhook:', data, 'Event:', event)

  const productId = data.product_id || data.productId || data.id

  if (!productId) {
    throw new Error('Missing product_id in inventory webhook')
  }

  switch (event) {
    case 'inventory.low_stock':
      // Alert farmer about low stock
      await supabaseClient.from('notifications').insert({
        type: 'low_stock_alert',
        title: 'Low Stock Alert',
        message: `Product ${productId} is running low on stock`,
        data: { product_id: productId, current_stock: data.current_stock },
        created_at: new Date().toISOString(),
      })
      break

    case 'inventory.out_of_stock':
      // Mark product as unavailable
      await supabaseClient
        .from('products')
        .update({
          is_available: false,
          stock_quantity: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
      break

    case 'inventory.restocked':
      // Update stock quantity
      await supabaseClient
        .from('products')
        .update({
          stock_quantity: data.quantity,
          is_available: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
      break
  }

  return { processed: true, productId, event }
}

async function handlePaymentGatewayWebhook(supabaseClient: any, payload: WebhookPayload): Promise<any> {
  const { data, event } = payload

  console.log('Processing Payment Gateway webhook:', data, 'Event:', event)

  const orderId = data.order_id || data.orderId

  if (!orderId) {
    throw new Error('Missing order_id in payment webhook')
  }

  let paymentStatus: string | undefined

  switch (event) {
    case 'payment.success':
      paymentStatus = 'paid'
      break
    case 'payment.failed':
      paymentStatus = 'failed'
      break
    case 'payment.refunded':
      paymentStatus = 'refunded'
      break
    case 'payment.pending':
      paymentStatus = 'pending'
      break
  }

  if (paymentStatus) {
    const { error } = await supabaseClient
      .from('orders')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      throw new Error(`Failed to update order payment status: ${error.message}`)
    }
  }

  return { processed: true, orderId, paymentStatus }
}

async function handleCustomWebhook(supabaseClient: any, payload: WebhookPayload): Promise<any> {
  const { data, event } = payload

  console.log('Processing Custom webhook:', data, 'Event:', event)

  // Custom webhooks can trigger various actions based on event type
  switch (event) {
    case 'user.created':
      // Welcome new user
      await supabaseClient.from('notifications').insert({
        user_id: data.user_id,
        type: 'welcome',
        title: 'Welcome to FarmCare!',
        message: 'Thank you for joining FarmCare. Start exploring fresh produce now.',
        created_at: new Date().toISOString(),
      })
      break

    case 'order.created':
      // Notify farmer of new order
      await supabaseClient.from('notifications').insert({
        user_id: data.farmer_id,
        type: 'new_order',
        title: 'New Order Received',
        message: `Order #${data.order_number} has been placed`,
        data: { order_id: data.order_id },
        created_at: new Date().toISOString(),
      })
      break

    case 'review.submitted':
      // Notify farmer of new review
      await supabaseClient.from('notifications').insert({
        user_id: data.farmer_id,
        type: 'new_review',
        title: 'New Review Received',
        message: `You received a ${data.rating}-star review`,
        data: { review_id: data.review_id, rating: data.rating },
        created_at: new Date().toISOString(),
      })
      break
  }

  return { processed: true, event }
}

async function handleGenericWebhook(supabaseClient: any, payload: WebhookPayload): Promise<any> {
  console.log('Processing Generic webhook:', payload)

  // Store generic webhook data for later processing
  await supabaseClient.from('webhook_events').insert({
    source: payload.source,
    event: payload.event,
    payload: payload.data,
    processed: false,
    created_at: new Date().toISOString(),
  })

  return { processed: true, stored: true }
}

async function verifyWebhookSignature(payload: WebhookPayload, signature: string): Promise<boolean> {
  // Implement signature verification based on your security requirements
  // This is a placeholder - implement actual HMAC verification for production

  const webhookSecret = Deno.env.get('WEBHOOK_SECRET') || ''

  if (!webhookSecret) {
    console.warn('WEBHOOK_SECRET not configured, skipping signature verification')
    return true
  }

  // TODO: Implement proper HMAC signature verification
  // const expectedSignature = await computeHMAC(payload, webhookSecret)
  // return expectedSignature === signature

  return true // Placeholder
}
