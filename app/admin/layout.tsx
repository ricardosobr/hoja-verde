'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import ErrorBoundary from '@/components/admin/error-boundary'
import { Loader2 } from 'lucide-react'

// Enable/disable debug mode for development
const DEBUG_MODE = process.env.NODE_ENV === 'development'

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error)
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const [hasLayoutError, setHasLayoutError] = useState(false)

  useEffect(() => {
    if (DEBUG_MODE) {
      console.log('🔍 AdminLayout: Auth state changed', { isLoading, user: !!user, role: user?.role })
    }

    if (!isLoading && (!user || user.role !== 'admin')) {
      if (DEBUG_MODE) {
        console.log('🔍 AdminLayout: Redirecting to home - no auth')
      }
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 50%, #e0f2fe 100%)'
      }}>
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute"
            style={{
              top: '-10%',
              left: '-5%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(40px)',
              animation: 'float 20s ease-in-out infinite'
            }}
          />
          <div
            className="absolute"
            style={{
              top: '50%',
              right: '-10%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(40px)',
              animation: 'float 25s ease-in-out infinite reverse'
            }}
          />
        </div>

        <div className="relative min-h-screen flex items-center justify-center">
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            animation: 'slideUp 0.5s ease-out',
            textAlign: 'center' as const
          }}>
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '4px'
              }}>
                Verificando acceso...
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Un momento por favor
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0) scale(1);
            }
            33% {
              transform: translateY(-30px) translateX(20px) scale(1.05);
            }
            66% {
              transform: translateY(20px) translateX(-15px) scale(0.95);
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 50%, #e0f2fe 100%)'
      }}>
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute"
            style={{
              top: '-10%',
              left: '-5%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(40px)',
              animation: 'float 20s ease-in-out infinite'
            }}
          />
        </div>

        <div className="relative min-h-screen flex items-center justify-center">
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            textAlign: 'center' as const,
            maxWidth: '400px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              padding: '12px',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '20px'
            }}>
              <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '12px'
            }}>
              Acceso Denegado
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: '14px'
            }}>
              No tienes permisos para acceder a esta área.
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) translateX(0) scale(1);
            }
            33% {
              transform: translateY(-30px) translateX(20px) scale(1.05);
            }
            66% {
              transform: translateY(20px) translateX(-15px) scale(0.95);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{
      background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 50%, #e0f2fe 100%)'
    }}>
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute"
          style={{
            top: '-20%',
            left: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'float 30s ease-in-out infinite'
          }}
        />
        <div
          className="absolute"
          style={{
            top: '30%',
            right: '-15%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'float 35s ease-in-out infinite reverse'
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '-20%',
            left: '20%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'float 40s ease-in-out infinite'
          }}
        />
      </div>

      {/* Sidebar - Always visible, collapsible */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative">
        <ErrorBoundary>
          <div className="p-4 sm:p-6 lg:p-8" style={{
            animation: 'fadeIn 0.5s ease-out'
          }}>
            {children}
          </div>
        </ErrorBoundary>
      </main>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          33% {
            transform: translateY(-20px) translateX(15px) scale(1.02);
          }
          66% {
            transform: translateY(15px) translateX(-10px) scale(0.98);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}