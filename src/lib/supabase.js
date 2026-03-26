import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!URL || !KEY) {
  console.warn('Supabase env vars missing — auth/data will use local fallback')
}

export const supabase = (URL && KEY) ? createClient(URL, KEY) : null
