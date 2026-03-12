/**
 * M-Pesa Daraja API Service
 * 
 * This service handles M-Pesa STK Push payments using the Daraja API.
 * For security, all M-Pesa API calls should be made through a backend/Edge Function.
 * 
 * @see https://developer.safaricom.co.ke/
 */

import { supabase } from './supabase'

// M-Pesa configuration from environment variables
const MPESA_CONFIG = {
  consumerKey: process.env.EXPO_PUBLIC_MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.EXPO_PUBLIC_MPESA_CONSUMER_SECRET || '',
  shortcode: process.env.EXPO_PUBLIC_MPESA_SHORTCODE || '',
  passkey: process.env.EXPO_PUBLIC_MPESA_PASSKEY || '',
  environment: process.env.EXPO_PUBLIC_MPESA_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.EXPO_PUBLIC_MPESA_CALLBACK_URL || '',
}

// Daraja API URLs
const DARAJA_SANDBOX_URL = 'https://sandbox.safaricom.co.ke'
const DARAJA_PRODUCTION_URL = 'https://api.safaricom.co.ke'

const getDarajaBaseUrl = () => {
  return MPESA_CONFIG.environment === 'production' 
    ? DARAJA_PRODUCTION_URL 
    : DARAJA_SANDBOX_URL
}

/**
 * Get M-Pesa access token from Daraja API
 * This should be called from a backend/Edge Function for security
 */
export const getAccessToken = async (): Promise<string> => {
  try {
    const auth = btoa(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`)
    
    const response = await fetch(`${getDarajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get M-Pesa access token')
    }

    const data = await response.json()
    return data.access_token
  } catch (error: any) {
    console.error('M-Pesa token error:', error)
    throw new Error('Failed to authenticate with M-Pesa')
  }
}

/**
 * Get password for STK Push (base64 encoded)
 */
const getPassword = (): string => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
  const data = `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`
  return btoa(data)
}

/**
 * Get timestamp for STK Push
 */
const getTimestamp = (): string => {
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
}

/**
 * Initiate STK Push payment
 * 
 * @param phoneNumber - Phone number in format 2547XXXXXXXX
 * @param amount - Amount to charge
 * @param accountReference - Account reference (e.g., order number)
 * @param transactionDesc - Transaction description
 */
export const initiateSTKPush = async ({
  phoneNumber,
  amount,
  accountReference,
  transactionDesc,
}: {
  phoneNumber: string
  amount: number
  accountReference: string
  transactionDesc: string
}) => {
  try {
    // Call our Supabase Edge Function instead of Daraja directly
    // This keeps API keys secure on the server
    const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
      body: {
        phoneNumber,
        amount,
        accountReference,
        transactionDesc,
      },
    })

    if (error) {
      throw error
    }

    if (!data || !data.CheckoutRequestID) {
      throw new Error('Invalid response from M-Pesa service')
    }

    return {
      CheckoutRequestID: data.CheckoutRequestID,
      MerchantRequestID: data.MerchantRequestID,
      ResponseCode: data.ResponseCode,
      ResponseDescription: data.ResponseDescription,
      CustomerMessage: data.CustomerMessage,
    }
  } catch (error: any) {
    console.error('STK Push error:', error)
    throw new Error(error.message || 'Failed to initiate STK push')
  }
}

/**
 * Query STK Push payment status
 * 
 * @param checkoutRequestId - The CheckoutRequestID from initiateSTKPush
 */
export const querySTKStatus = async (checkoutRequestId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('mpesa-query-status', {
      body: {
        checkoutRequestId,
      },
    })

    if (error) {
      throw error
    }

    return {
      ResultCode: data.ResultCode,
      ResultDesc: data.ResultDesc,
      CheckoutRequestID: data.CheckoutRequestID,
      MerchantRequestID: data.MerchantRequestID,
      Amount: data.Amount,
      MpesaReceiptNumber: data.MpesaReceiptNumber,
      TransactionDate: data.TransactionDate,
      PhoneNumber: data.PhoneNumber,
    }
  } catch (error: any) {
    console.error('Query STK status error:', error)
    throw error
  }
}

/**
 * Poll payment status from database
 * This checks the mpesa_transactions table for status updates
 * 
 * @param checkoutRequestId - The CheckoutRequestID to check
 */
export const pollPaymentStatus = async (checkoutRequestId: string) => {
  try {
    const { data, error } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .single()

    if (error) {
      throw error
    }

    return {
      status: data?.status,
      resultCode: data?.result_code,
      resultDesc: data?.result_desc,
      mpesaReceiptNumber: data?.mpesa_receipt_number,
      transactionDate: data?.transaction_date,
      amount: data?.amount,
      phoneNumber: data?.phone_number,
    }
  } catch (error: any) {
    console.error('Poll payment status error:', error)
    throw error
  }
}

/**
 * Validate M-Pesa phone number format
 * Accepts formats: 0712345678, 712345678, 254712345678, +254712345678
 * Returns formatted number: 254712345678
 */
export const validateMPesaPhone = (phone: string): { valid: boolean; formatted: string } => {
  const cleaned = phone.replace(/\D/g, '')
  
  // Remove leading zeros
  let formatted = cleaned
  
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
  } else if (cleaned.startsWith('254') && cleaned.length === 11) {
    // Format: 25471234567 (missing digit)
    return { valid: false, formatted: '' }
  } else {
    return { valid: false, formatted: '' }
  }
  
  // Validate length (should be 12 digits for 254XXXXXXXXX)
  if (formatted.length !== 12) {
    return { valid: false, formatted: '' }
  }
  
  return { valid: true, formatted }
}

/**
 * Format phone number for display
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    // Format: 254712345678 -> 0712 345 678
    return `0${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`
  }
  
  return phone
}
