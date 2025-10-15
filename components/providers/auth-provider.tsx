'use client'

import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

const AuthContext = createContext<Record<string, never>>({})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const { setUser, setLoading } = useAuthStore()
  const router = useRouter()
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const initialCheckDoneRef = useRef(false)

  useEffect(() => {
    console.log('🔍 AuthProvider: Initializing...')
    setLoading(true)

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔍 AuthProvider: Auth state changed:', event)

        if (event === 'INITIAL_SESSION') {
          console.log('🔍 AuthProvider: Initial session event')
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          } else {
            setUser(null)
          }
          setLoading(false)
          setInitialCheckDone(true)
          initialCheckDoneRef.current = true
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔍 AuthProvider: User signed in')
          await fetchUserProfile(session.user.id)

          // Redirect based on role - check from store after setting user
          const userProfile = await fetchUserProfile(session.user.id)
          if (userProfile?.role === 'admin') {
            router.push('/admin/dashboard')
          } else {
            router.push('/client')
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🔍 AuthProvider: User signed out')
          setUser(null)
          router.push('/login')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔍 AuthProvider: Token refreshed')
        }
      }
    )

    // Fallback timeout in case INITIAL_SESSION doesn't fire
    const fallbackTimeout = setTimeout(() => {
      if (!initialCheckDoneRef.current) {
        console.log('🔍 AuthProvider: Fallback timeout - initial check not completed')
        setLoading(false)
        setInitialCheckDone(true)
        initialCheckDoneRef.current = true
      }
    }, 2000)

    async function fetchUserProfile(userId: string) {
      try {
        console.log('🔍 AuthProvider: Fetching user profile for:', userId)

        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('id, email, full_name, role, status')
          .eq('id', userId)
          .single()

        if (userError) {
          console.error('Error fetching user profile:', userError)
          setUser(null)
          return null
        }

        let companyId = null
        let companyName = null

        // For non-admin users, fetch client profile and company
        if (userProfile && userProfile.role !== 'admin') {
          const { data: clientProfile } = await supabase
            .from('client_profiles')
            .select('company_id')
            .eq('user_id', userId)
            .single()

          if (clientProfile?.company_id) {
            companyId = clientProfile.company_id

            const { data: company } = await supabase
              .from('companies')
              .select('name')
              .eq('id', clientProfile.company_id)
              .single()

            companyName = company?.name
          }
        }

        const userData = {
          id: userProfile.id,
          email: userProfile.email,
          fullName: userProfile.full_name,
          role: userProfile.role,
          status: userProfile.status,
          companyId,
          companyName,
        }

        console.log('🔍 AuthProvider: Setting user:', userData)
        setUser(userData)
        return userData
      } catch (error) {
        console.error('Auth error:', error)
        setUser(null)
        return null
      }
    }

    return () => {
      clearTimeout(fallbackTimeout)
      subscription.unsubscribe()
    }
  }, [supabase, setUser, setLoading, router])

  // Show loading screen while checking authentication
  if (!initialCheckDone) {
    return (
      <AuthContext.Provider value={{}}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Cargando...</h2>
            <p className="text-gray-600">Verificando autenticación</p>
          </div>
        </div>
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
