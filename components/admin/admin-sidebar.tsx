'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Settings,
  Truck,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and metrics',
    disabled: false
  },
  {
    name: 'Quotations',
    href: '/admin/quotations',
    icon: FileText,
    description: 'Manage quotations',
    disabled: false
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    description: 'Order management',
    disabled: false
  },
  {
    name: 'Clients',
    href: '/admin/clients',
    icon: Users,
    description: 'Client management',
    disabled: false
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
    description: 'Product catalog',
    disabled: false
  },
  {
    name: 'Deliveries',
    href: '/admin/deliveries',
    icon: Truck,
    description: 'Delivery tracking',
    disabled: false
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    description: 'Coming soon',
    disabled: true
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Coming soon',
    disabled: true
  },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          flex flex-col transition-all duration-300 ease-in-out relative
          ${collapsed ? 'w-20' : 'w-72'}
        `}
        style={{
          height: '100vh',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '4px 0 24px -2px rgba(0, 0, 0, 0.1), 2px 0 8px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 10
        }}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-white/30">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    letterSpacing: '-0.5px'
                  }}>HV</span>
                </div>
                <div>
                  <h1 style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#111827',
                    lineHeight: '1.2',
                    marginBottom: '2px'
                  }}>
                    Hoja Verde
                  </h1>
                  <p style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    margin: '0'
                  }}>
                    Admin Panel
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex p-2 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                e.currentTarget.style.color = '#059669'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href
            const isDisabled = item.disabled

            return (
              <Link
                key={item.name}
                href={isDisabled ? '#' : item.href}
                className="group flex items-center rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden"
                style={{
                  padding: collapsed ? '12px' : '12px 16px',
                  animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
                  textDecoration: 'none',
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  pointerEvents: isDisabled ? 'none' : 'auto'
                }}
                title={collapsed ? (isDisabled ? `${item.name} (${item.description})` : item.name) : undefined}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault()
                    return false
                  }
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isDisabled) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isDisabled) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }
                }}
              >
                {/* Active background */}
                {isActive && !isDisabled && (
                  <div
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(20,184,166,0.15) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      boxShadow: '0 2px 4px -1px rgba(16, 185, 129, 0.1)'
                    }}
                  />
                )}

                <div className="relative flex items-center space-x-3 w-full">
                  <div className="flex-shrink-0 relative">
                    <item.icon
                      className={`w-5 h-5 transition-all duration-200 ${
                        isDisabled
                          ? 'text-gray-400'
                          : isActive
                          ? 'text-emerald-600'
                          : 'text-gray-500 group-hover:text-emerald-600'
                      }`}
                      style={{
                        transform: 'scale(1)',
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) e.currentTarget.style.transform = 'scale(1)'
                      }}
                    />
                  </div>

                  {!collapsed && (
                    <div className="flex-1 min-w-0" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                      <div className={`font-semibold truncate ${
                        isDisabled
                          ? 'text-gray-400'
                          : isActive
                          ? 'text-emerald-700'
                          : 'text-gray-700 group-hover:text-emerald-700'
                      }`}>
                        {item.name}
                      </div>
                      <div className={`text-xs truncate transition-colors ${
                        isDisabled
                          ? 'text-gray-400 italic'
                          : isActive
                          ? 'text-emerald-600'
                          : 'text-gray-500 group-hover:text-emerald-600'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 lg:p-4 border-t border-white/30">
          {!collapsed && (
            <div
              className="text-center py-2 px-3 rounded-lg"
              style={{
                fontSize: '11px',
                color: '#6b7280',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.1)',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              © 2025 Hoja Verde
            </div>
          )}
        </div>
      </aside>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Custom scrollbar */
        nav::-webkit-scrollbar {
          width: 4px;
        }

        nav::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        nav::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 2px;
        }

        nav::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </>
  )
}