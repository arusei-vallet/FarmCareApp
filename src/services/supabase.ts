// src/services/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
  || 'https://jluxaezbaiilupmfgmgm.supabase.co'

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdXhhZXpiYWlpbHVwbWZnbWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDI2OTAsImV4cCI6MjA4NjM3ODY5MH0.2Psokk5EMrtzrV4sxI-sUczHCchxPrzZCV0W6Q78CEU'

console.log('Supabase URL:', supabaseUrl ? 'configured' : 'MISSING')
console.log('Supabase Key:', supabaseAnonKey ? 'configured' : 'MISSING')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})