/**
 * Inventory Update Edge Function
 *
 * This function handles stock updates when orders are placed,
 * confirmed, or cancelled. Ensures inventory consistency.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InventoryUpdate {
  productId: string
  quantityChange: number
  reason: 'order_placed' | 'order_cancelled' | 'order_completed' | 'restock' | 'adjustment'
  orderId?: string
  userId?: string
  notes?: string
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

    // Parse request body
    const body: InventoryUpdate = await req.json()
    const { productId, quantityChange, reason, orderId, userId, notes } = body

    // Validate required parameters
    if (!productId || quantityChange === undefined) {
      throw new Error('Missing required parameters: productId, quantityChange')
    }

    console.log(`Inventory update: Product ${productId}, Change: ${quantityChange}, Reason: ${reason}`)

    // Start a database transaction using RPC or sequential queries
    // Step 1: Get current product stock
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('id, stock_quantity, name, is_available')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      throw new Error(`Product not found: ${productId}`)
    }

    const currentStock = product.stock_quantity || 0
    const newStock = currentStock + quantityChange

    // Validate stock doesn't go negative
    if (newStock < 0) {
      throw new Error(`Insufficient stock. Current: ${currentStock}, Requested change: ${quantityChange}`)
    }

    // Step 2: Update product stock
    const isAvailable = newStock > 0
    const { error: updateError } = await supabaseClient
      .from('products')
      .update({
        stock_quantity: newStock,
        is_available: isAvailable,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)

    if (updateError) {
      throw new Error(`Failed to update stock: ${updateError.message}`)
    }

    // Step 3: Log inventory transaction
    const { data: logEntry, error: logError } = await supabaseClient
      .from('inventory_logs')
      .insert({
        product_id: productId,
        quantity_change: quantityChange,
        previous_stock: currentStock,
        new_stock: newStock,
        reason: reason,
        order_id: orderId,
        user_id: userId,
        notes: notes,
      })
      .select()
      .single()

    if (logError) {
      console.error('Failed to log inventory transaction:', logError)
      // Don't fail the request if logging fails, just warn
    }

    console.log(`Stock updated: ${product.name} from ${currentStock} to ${newStock}`)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        productId: productId,
        productName: product.name,
        previousStock: currentStock,
        newStock: newStock,
        quantityChange: quantityChange,
        reason: reason,
        logId: logEntry?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Inventory Update error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to update inventory',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
