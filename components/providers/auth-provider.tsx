'use client'

import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

const AuthContext = createContext<Record<string, never>>({})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const initialCheckDoneRef = useRef(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    useAuthStore.persist.rehydrate()
    setIsHydrated(true)
  }, [])

  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return

    console.log('🔍 AuthProvider: Initializing...')
    setLoading(true)

    let subscriptionCleanedUp = false

    const initAuth = async () => {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔍 AuthProvider: Auth state changed:', event, 'Session:', !!session)

            if (event === 'INITIAL_SESSION') {
              console.log('🔍 AuthProvider: Initial session event')
              if (session?.user) {
                console.log('🔍 AuthProvider: User found in session:', session.user.id)
                await fetchUserProfile(session.user.id)
              } else {
                console.log('🔍 AuthProvider: No user in session')
                setUser(null)
              }
              setLoading(false)
              if (!initialCheckDoneRef.current) {
                setInitialCheckDone(true)
                initialCheckDoneRef.current = true
              }
            } else if (event === 'SIGNED_IN' && session?.user) {
              console.log('🔍 AuthProvider: User signed in')
              const userProfile = await fetchUserProfile(session.user.id)
              if (userProfile?.role === 'admin') {
                router.push('/admin/dashboard')
              } else {
                router.push('/client')
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('🔍 AuthProvider: User signed out')
              setUser(null)
              router.push('/')
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('🔍 AuthProvider: Token refreshed')
            }
          }
        )

        const cleanup = () => {
          if (!subscriptionCleanedUp) {
            subscriptionCleanedUp = true
            subscription.unsubscribe()
          }
        }

        return cleanup
      } catch (error) {
        console.error('🔍 AuthProvider: Error initializing auth:', error)
        setHasError(true)
        setLoading(false)
        setInitialCheckDone(true)
        initialCheckDoneRef.current = true
        return () => {}
      }
    }

    const cleanupPromise = initAuth()

    const fallbackTimeout = setTimeout(() => {
      if (!initialCheckDoneRef.current) {
        console.log('🔍 AuthProvider: Fallback timeout triggered - forcing completion')
        setLoading(false)
        setInitialCheckDone(true)
        initialCheckDoneRef.current = true
        setUser(null)
      }
    }, 3000)

    async function fetchUserProfile(userId: string) {
      try {
        console.log('🔍 AuthProvider: Fetching user profile for:', userId)

        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('id, email, full_name, role, status')
          .eq('id', userId)
          .single()

        if (userError) {
          console.error('🔍 AuthProvider: Error fetching user profile:', userError)
          setUser(null)
          return null
        }

        console.log('🔍 AuthProvider: User profile fetched:', userProfile)

        let companyId = null
        let companyName = null

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

        console.log('🔍 AuthProvider: Setting user data:', userData)
        setUser(userData)
        return userData
      } catch (error) {
        console.error('🔍 AuthProvider: Exception fetching profile:', error)
        setUser(null)
        return null
      }
    }

    return () => {
      clearTimeout(fallbackTimeout)
      cleanupPromise.then(cleanup => cleanup())
    }
  }, [supabase, setUser, setLoading, router, isHydrated])

  if (!initialCheckDone) {
    return (
      <AuthContext.Provider value={{}}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Cargando...</h2>
            <p className="text-gray-600">Verificando autenticación</p>
            {hasError && (
              <p className="text-red-600 mt-4 text-sm">
                Error al conectar. Por favor recarga la página.
              </p>
            )}
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
