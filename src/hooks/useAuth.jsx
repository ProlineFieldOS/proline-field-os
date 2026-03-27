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

    // Initial session check — load from Supabase once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadFromSupabase(session.user.id)
        loadTemplateFromSupabase(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      // TOKEN_REFRESHED fires every ~hour and must NOT reload from Supabase
      // — it would overwrite any unsaved local changes
      // Only load on actual sign-in events
      if (event === 'SIGNED_IN' && session?.user) {
        loadFromSupabase(session.user.id)
        loadTemplateFromSupabase(session.user.id)
      }

      if (event === 'SIGNED_UP' && session?.user) {
        // New account — set trial dates then sync
        const store = useStore.getState?.()
        if (store?.updateSubscription) {
          store.updateSubscription({
            plan: 'trial',
            trialStartDate: new Date().toISOString(),
            renewalDate: new Date(Date.now() + 14 * 86400000).toISOString(),
          })
        }
        setTimeout(() => syncToSupabase(session.user.id), 800)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, plan: 'beta_free', planActivatedAt: new Date().toISOString() } }
    })
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

  // Auto-sync to Supabase every 2 minutes — push local → remote, never pull
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
