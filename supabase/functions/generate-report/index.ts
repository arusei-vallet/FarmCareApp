/**
 * Report Generation Edge Function
 *
 * This function generates various reports:
 * - Sales reports
 * - Order reports
 * - Product performance
 * - Customer analytics
 * - Farmer revenue
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportRequest {
  type: 'sales' | 'orders' | 'products' | 'customers' | 'revenue'
  startDate: string
  endDate: string
  farmerId?: string
  customerId?: string
  format?: 'json' | 'csv'
  groupBy?: 'day' | 'week' | 'month' | 'product' | 'category'
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
    const body: ReportRequest = await req.json()
    const {
      type,
      startDate,
      endDate,
      farmerId,
      customerId,
      format = 'json',
      groupBy = 'day',
    } = body

    // Validate required parameters
    if (!type || !startDate || !endDate) {
      throw new Error('Missing required parameters: type, startDate, endDate')
    }

    console.log(`Generating report: ${type} from ${startDate} to ${endDate}`)

    let reportData: any

    // Generate report based on type
    switch (type) {
      case 'sales':
        reportData = await generateSalesReport(supabaseClient, startDate, endDate, farmerId, groupBy)
        break
      case 'orders':
        reportData = await generateOrdersReport(supabaseClient, startDate, endDate, farmerId, customerId)
        break
      case 'products':
        reportData = await generateProductsReport(supabaseClient, startDate, endDate, farmerId)
        break
      case 'customers':
        reportData = await generateCustomersReport(supabaseClient, startDate, endDate)
        break
      case 'revenue':
        reportData = await generateRevenueReport(supabaseClient, startDate, endDate, farmerId, groupBy)
        break
      default:
        throw new Error(`Unknown report type: ${type}`)
    }

    // Format response
    if (format === 'csv') {
      const csv = convertToCSV(reportData)
      return new Response(csv, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}_report_${startDate}_to_${endDate}.csv"`,
        },
      })
    }

    // Return JSON response
    return new Response(
      JSON.stringify({
        success: true,
        type: type,
        startDate: startDate,
        endDate: endDate,
        groupBy: groupBy,
        generatedAt: new Date().toISOString(),
        data: reportData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Report Generation error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate report',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function generateSalesReport(
  supabaseClient: any,
  startDate: string,
  endDate: string,
  farmerId?: string,
  groupBy: string = 'day'
) {
  // Build query based on groupBy
  let query = supabaseClient
    .from('orders')
    .select(`
      id,
      total_amount,
      status,
      payment_status,
      created_at,
      order_items (
        quantity,
        price,
        products (
          name,
          category
        )
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .in('status', ['completed', 'delivered'])

  if (farmerId) {
    query = query.eq('farmer_id', farmerId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch sales data: ${error.message}`)
  }

  // Aggregate sales by group
  const aggregated: any = {}
  let totalSales = 0
  let totalOrders = 0

  data.forEach((order: any) => {
    let key: string
    const date = new Date(order.created_at)

    switch (groupBy) {
      case 'week':
        key = getWeekKey(date)
        break
      case 'month':
        key = getMonthKey(date)
        break
      case 'category':
        key = order.order_items?.[0]?.products?.category || 'Unknown'
        break
      default: // day
        key = getDayKey(date)
    }

    if (!aggregated[key]) {
      aggregated[key] = {
        sales: 0,
        orders: 0,
        items: 0,
      }
    }

    aggregated[key].sales += order.total_amount || 0
    aggregated[key].orders += 1
    aggregated[key].items += order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0

    totalSales += order.total_amount || 0
    totalOrders += 1
  })

  return {
    summary: {
      totalSales,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      totalItems: Object.values(aggregated).reduce((sum: any, v: any) => sum + v.items, 0),
    },
    byPeriod: Object.entries(aggregated).map(([key, value]: [string, any]) => ({
      period: key,
      ...value,
    })),
  }
}

async function generateOrdersReport(
  supabaseClient: any,
  startDate: string,
  endDate: string,
  farmerId?: string,
  customerId?: string
) {
  let query = supabaseClient
    .from('orders')
    .select(`
      id,
      order_number,
      total_amount,
      status,
      payment_status,
      payment_method,
      created_at,
      customers (
        name,
        phone
      ),
      order_items (
        quantity,
        price,
        products (
          name
        )
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (farmerId) {
    query = query.eq('farmer_id', farmerId)
  }

  if (customerId) {
    query = query.eq('customer_id', customerId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  const statusCounts: any = {}
  const paymentStatusCounts: any = {}
  let totalRevenue = 0

  data.forEach((order: any) => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    paymentStatusCounts[order.payment_status] = (paymentStatusCounts[order.payment_status] || 0) + 1
    if (order.status === 'completed' || order.status === 'delivered') {
      totalRevenue += order.total_amount || 0
    }
  })

  return {
    summary: {
      totalOrders: data.length,
      totalRevenue,
      byStatus: statusCounts,
      byPaymentStatus: paymentStatusCounts,
    },
    orders: data,
  }
}

async function generateProductsReport(
  supabaseClient: any,
  startDate: string,
  endDate: string,
  farmerId?: string
) {
  const { data: orderItems, error } = await supabaseClient
    .from('order_items')
    .select(`
      quantity,
      price,
      product_id,
      products (
        id,
        name,
        category,
        unit,
        stock_quantity
      ),
      orders (
        created_at,
        status,
        farmer_id
      )
    `)
    .gte('orders.created_at', startDate)
    .lte('orders.created_at', endDate)

  if (error) {
    throw new Error(`Failed to fetch product data: ${error.message}`)
  }

  // Filter by farmer if specified
  let filteredItems = orderItems
  if (farmerId) {
    filteredItems = orderItems.filter((item: any) => item.orders.farmer_id === farmerId)
  }

  // Only count completed/delivered orders
  filteredItems = filteredItems.filter((item: any) =>
    ['completed', 'delivered'].includes(item.orders.status)
  )

  // Aggregate by product
  const productStats: any = {}

  filteredItems.forEach((item: any) => {
    const productId = item.product_id
    const product = item.products

    if (!productStats[productId]) {
      productStats[productId] = {
        id: productId,
        name: product.name,
        category: product.category,
        unit: product.unit,
        currentStock: product.stock_quantity,
        quantitySold: 0,
        revenue: 0,
        orders: 0,
      }
    }

    productStats[productId].quantitySold += item.quantity
    productStats[productId].revenue += item.quantity * item.price
    productStats[productId].orders += 1
  })

  // Sort by revenue
  const sortedProducts = Object.values(productStats).sort(
    (a: any, b: any) => b.revenue - a.revenue
  )

  return {
    summary: {
      totalProductsSold: sortedProducts.reduce((sum: number, p: any) => sum + p.quantitySold, 0),
      totalRevenue: sortedProducts.reduce((sum: number, p: any) => sum + p.revenue, 0),
      topProduct: sortedProducts[0]?.name || 'N/A',
    },
    products: sortedProducts,
  }
}

async function generateCustomersReport(
  supabaseClient: any,
  startDate: string,
  endDate: string
) {
  const { data: customers, error } = await supabaseClient
    .from('customers')
    .select(`
      id,
      name,
      email,
      phone,
      created_at,
      orders (
        id,
        total_amount,
        status,
        created_at
      )
    `)

  if (error) {
    throw new Error(`Failed to fetch customer data: ${error.message}`)
  }

  const customerStats = customers.map((customer: any) => {
    const orders = customer.orders || []
    const filteredOrders = orders.filter((o: any) =>
      o.created_at >= startDate && o.created_at <= endDate
    )
    const completedOrders = filteredOrders.filter((o: any) =>
      ['completed', 'delivered'].includes(o.status)
    )

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      registeredAt: customer.created_at,
      totalOrders: filteredOrders.length,
      completedOrders: completedOrders.length,
      totalSpent: completedOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0),
      averageOrderValue: completedOrders.length > 0
        ? completedOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0) / completedOrders.length
        : 0,
    }
  })

  // Sort by total spent
  customerStats.sort((a: any, b: any) => b.totalSpent - a.totalSpent)

  return {
    summary: {
      totalCustomers: customers.length,
      activeCustomers: customerStats.filter((c: any) => c.totalOrders > 0).length,
      totalRevenue: customerStats.reduce((sum: any, c: any) => sum + c.totalSpent, 0),
    },
    customers: customerStats,
  }
}

async function generateRevenueReport(
  supabaseClient: any,
  startDate: string,
  endDate: string,
  farmerId?: string,
  groupBy: string = 'day'
) {
  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select(`
      id,
      total_amount,
      payment_status,
      status,
      created_at,
      farmer_id
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .in('status', ['completed', 'delivered'])
    .in('payment_status', ['paid', 'partially_paid'])

  if (error) {
    throw new Error(`Failed to fetch revenue data: ${error.message}`)
  }

  // Filter by farmer if specified
  let filteredOrders = orders
  if (farmerId) {
    filteredOrders = orders.filter((o: any) => o.farmer_id === farmerId)
  }

  // Aggregate by period
  const revenueByPeriod: any = {}
  let totalRevenue = 0

  filteredOrders.forEach((order: any) => {
    let key: string
    const date = new Date(order.created_at)

    switch (groupBy) {
      case 'week':
        key = getWeekKey(date)
        break
      case 'month':
        key = getMonthKey(date)
        break
      default: // day
        key = getDayKey(date)
    }

    if (!revenueByPeriod[key]) {
      revenueByPeriod[key] = 0
    }

    revenueByPeriod[key] += order.total_amount || 0
    totalRevenue += order.total_amount || 0
  })

  return {
    summary: {
      totalRevenue,
      averageDailyRevenue: totalRevenue / Object.keys(revenueByPeriod).length,
      highestDay: Object.entries(revenueByPeriod).sort((a: any, b: any) => b[1] - a[1])[0],
    },
    byPeriod: Object.entries(revenueByPeriod).map(([key, value]: [string, any]) => ({
      period: key,
      revenue: value,
    })),
  }
}

// Helper functions
function getDayKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getWeekKey(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
}

function convertToCSV(data: any): string {
  // Simple CSV conversion for flat data
  if (!data || typeof data !== 'object') {
    return ''
  }

  const items = Array.isArray(data) ? data : [data]
  if (items.length === 0) {
    return ''
  }

  const headers = Object.keys(items[0])
  const rows = items.map((item: any) =>
    headers.map((header) => JSON.stringify(item[header] || '')).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}
