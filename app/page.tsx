'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import LoginForm from '@/components/auth/login-form'
import { Leaf } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/client')
      }
    }
  }, [mounted, user, isLoading, router])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
      }}>
        <div className="text-center">
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            padding: '16px',
            borderRadius: '16px',
            display: 'inline-block',
            marginBottom: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <Leaf className="w-8 h-8 text-white" style={{ animation: 'pulse 2s infinite' }} />
          </div>
          <div style={{
            width: '64px',
            height: '4px',
            background: 'linear-gradient(90deg, #10b981 0%, #14b8a6 100%)',
            borderRadius: '999px',
            margin: '0 auto',
            animation: 'pulse 1s infinite'
          }}></div>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
      }}>
        <div className="text-center">
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            padding: '16px',
            borderRadius: '16px',
            display: 'inline-block',
            marginBottom: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <p className="text-white font-medium">Redirigiendo...</p>
          <div style={{
            width: '64px',
            height: '4px',
            background: 'white',
            borderRadius: '999px',
            margin: '16px auto 0',
            animation: 'pulse 1s infinite'
          }}></div>
        </div>
      </div>
    )
  }

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
            background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(20,184,166,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'float 25s ease-in-out infinite reverse'
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '-20%',
            left: '30%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'float 30s ease-in-out infinite'
          }}
        />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full" style={{
          maxWidth: '360px',
          minWidth: '280px',
          margin: '0 auto'
        }}>
          {/* Glass card container */}
          <div className="container" style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '24px 20px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            animation: 'slideUp 0.5s ease-out'
          }}>
            {/* Logo and Brand */}
            <div className="text-center">
              {/* Modern Logo */}
              <div className="relative mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
                <div style={{
                  position: 'absolute',
                  inset: '0',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(20,184,166,0.2) 100%)',
                  borderRadius: '16px',
                  transform: 'rotate(6deg)'
                }}></div>
                <div style={{
                  position: 'relative',
                  height: '100%',
                  background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px rgba(16,185,129,0.3)',
                  transform: 'translateY(0)',
                  transition: 'transform 0.3s ease'
                }}>
                  <Leaf className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
              </div>

              <h1 style={{
                fontSize: '26px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '4px'
              }}>
                Hoja Verde
              </h1>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '24px'
              }}>
                Sistema de Cotizaciones
              </p>
            </div>

            {/* Welcome Message */}
            <div className="text-center mb-6">
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '4px'
              }}>
                ¡Bienvenido!
              </h2>
              <p style={{
                fontSize: '13px',
                color: '#6b7280'
              }}>
                Ingresa tus credenciales
              </p>
            </div>

            {/* Login Form */}
            <LoginForm />
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              © 2025 Hoja Verde • Todos los derechos reservados
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

        @media (max-width: 480px) {
          .container {
            padding: 16px 12px !important;
          }
        }
      `}</style>
    </div>
  )
}