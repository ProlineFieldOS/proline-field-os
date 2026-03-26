import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { loadFromSupabase, loadTemplateFromSupabase, syncToSupabase } = useStore()

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadFromSupabase(session.user.id)
        loadTemplateFromSupabase(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadFromSupabase(session.user.id)
        loadTemplateFromSupabase(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email, password, name, inviteCode) => {
    const VALID_CODES = ['PROLINEBETA2026']
    if (!VALID_CODES.includes(inviteCode?.toUpperCase().trim())) {
      return { error: { message: 'Invalid or expired invite code.' } }
    }
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    return { error }
  }

  const signOut = async () => {
    if (user) await syncToSupabase(user.id)
    await supabase?.auth.signOut()
    setUser(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  // Auto-sync to Supabase every 2 minutes if signed in
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => syncToSupabase(user.id), 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
