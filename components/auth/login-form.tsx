'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message.includes('Invalid')) {
          addNotification({
            type: 'error',
            title: 'Error de autenticación',
            message: 'Email o contraseña incorrectos',
          })
        } else {
          addNotification({
            type: 'error',
            title: 'Error de conexión',
            message: 'No se pudo conectar con el servidor. Intenta de nuevo.',
          })
        }
        return
      }

      addNotification({
        type: 'success',
        title: 'Bienvenido',
        message: 'Has iniciado sesión correctamente',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Ocurrió un error inesperado. Intenta de nuevo.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 10px 10px 36px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    transition: 'all 0.2s',
    outline: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)',
    boxSizing: 'border-box' as const,
    minWidth: '0',
  }

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: '#fca5a5',
  }

  const iconStyle = {
    position: 'absolute' as const,
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Email Field */}
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Correo Electrónico
        </label>
        <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
          <Mail size={20} style={iconStyle} />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            {...register('email')}
            style={errors.email ? inputErrorStyle : inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981'
              e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'
            }}
            onBlur={(e) => {
              if (!errors.email) {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
              }
            }}
          />
        </div>
        {errors.email && (
          <p style={{
            fontSize: '12px',
            color: '#ef4444',
            marginTop: '4px'
          }}>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Contraseña
        </label>
        <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
          <Lock size={20} style={iconStyle} />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            style={{
              ...((errors.password ? inputErrorStyle : inputStyle)),
              paddingRight: '36px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981'
              e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'
            }}
            onBlur={(e) => {
              if (!errors.password) {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
              }
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#4b5563'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p style={{
            fontSize: '12px',
            color: '#ef4444',
            marginTop: '4px'
          }}>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember me & Forgot password */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '-8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              border: '1px solid #e5e7eb',
              marginRight: '8px',
              cursor: 'pointer',
              accentColor: '#10b981'
            }}
          />
          <label htmlFor="remember-me" style={{
            fontSize: '14px',
            color: '#4b5563',
            cursor: 'pointer'
          }}>
            Recordarme
          </label>
        </div>
        <button
          type="button"
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#10b981',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '10px 20px',
          borderRadius: '10px',
          border: 'none',
          background: isLoading
            ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          transform: 'translateY(0)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: isLoading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
        }}
        onMouseDown={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(0) scale(0.98)'
          }
        }}
        onMouseUp={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1)'
          }
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Iniciando sesión...</span>
          </>
        ) : (
          'Iniciar Sesión'
        )}
      </button>

      {/* Divider */}
      <div style={{
        position: 'relative',
        margin: '16px 0'
      }}>
        <div style={{
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            width: '100%',
            borderTop: '1px solid #e5e7eb'
          }}></div>
        </div>
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <span style={{
            padding: '0 16px',
            fontSize: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            color: '#6b7280'
          }}>
            O continúa con
          </span>
        </div>
      </div>

      {/* Social Login Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      }}>
        <button
          type="button"
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            opacity: isLoading ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
              e.currentTarget.style.borderColor = '#d1d5db'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
            e.currentTarget.style.borderColor = '#e5e7eb'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            opacity: isLoading ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
              e.currentTarget.style.borderColor = '#d1d5db'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
            e.currentTarget.style.borderColor = '#e5e7eb'
          }}
        >
          <svg width="20" height="20" fill="#1a1a1a" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 7.708c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          <span>GitHub</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          form {
            gap: 14px !important;
          }

          input {
            font-size: 16px !important; /* Prevents zoom on iOS */
            padding: 12px 12px 12px 36px !important;
          }

          button {
            padding: 12px 20px !important;
            font-size: 16px !important;
          }
        }

        @media (max-width: 320px) {
          input {
            padding: 10px 10px 10px 32px !important;
          }
        }
      `}</style>
    </form>
  )
}