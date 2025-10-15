'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import {
  Home,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: 'Inicio',
    href: '/client',
    icon: Home,
  },
  {
    name: 'Mis Cotizaciones',
    href: '/client/quotations',
    icon: FileText,
  },
]

export function ClientSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HV</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Hoja Verde</h2>
              <p className="text-xs text-gray-500">Portal Cliente</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="p-2"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.companyName || user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-green-100 text-green-600"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  collapsed ? "mx-auto" : "mr-3"
                )}
              />
              {!collapsed && item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
          {!collapsed && "Cerrar Sesión"}
        </Button>
      </div>
    </div>
  )
}