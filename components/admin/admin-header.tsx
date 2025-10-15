'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import {
  Bell,
  Search,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Sun,
  Moon,
  Home,
  ChevronRight
} from 'lucide-react'

// Breadcrumb mapping
const breadcrumbMap: Record<string, string[]> = {
  '/admin/dashboard': ['Dashboard'],
  '/admin/quotations': ['Quotations'],
  '/admin/quotations/create': ['Quotations', 'Create'],
  '/admin/orders': ['Orders'],
  '/admin/clients': ['Clients'],
  '/admin/products': ['Products'],
  '/admin/deliveries': ['Deliveries'],
  '/admin/reports': ['Reports'],
  '/admin/settings': ['Settings'],
}

export function AdminHeader() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle search functionality
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      // Implement actual search logic here
      console.log('Searching for:', query)
    }
  }, [])

  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch(debouncedSearchQuery)
    }
  }, [debouncedSearchQuery, handleSearch])
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
          setShowUserMenu(false)
        }
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
          setShowNotifications(false)
        }
      } catch (error) {
        console.warn('Error handling click outside:', error)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/')
  }

  // Get breadcrumbs for current path
  const breadcrumbs = breadcrumbMap[pathname] || ['Dashboard']

  // Mock notifications (replace with real data)
  const notifications = [
    { id: 1, title: 'New quotation request', message: 'Client ABC Corp requested a new quote', time: '2 min ago', unread: true },
    { id: 2, title: 'Order confirmed', message: 'Order #12345 has been confirmed', time: '1 hour ago', unread: true },
    { id: 3, title: 'Payment received', message: 'Payment for invoice #67890 received', time: '3 hours ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header
      className="sticky top-0 z-50 border-b transition-all duration-200"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
    >
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Breadcrumbs & Search */}
          <div className="flex items-center space-x-6 flex-1">
            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center space-x-2 text-sm">
              <Home className="w-4 h-4 text-gray-400" />
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb} className="flex items-center space-x-2">
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <span className={`${
                    index === breadcrumbs.length - 1
                      ? 'text-emerald-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                  }`}>
                    {crumb}
                  </span>
                </div>
              ))}
            </nav>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-200 ${
                    searchFocused ? 'text-emerald-500' : 'text-gray-400'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Search quotations, clients, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none"
                  style={{
                    background: searchFocused ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                    borderColor: searchFocused ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                    boxShadow: searchFocused ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : 'none'
                  }}
                />
                {searchQuery && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-[60]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div className="p-3 text-sm text-gray-500">
                      Search results for "{searchQuery}"...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
              }}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-yellow-500" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                }}
              >
                <Bell className="w-4 h-4 text-gray-600" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center text-xs font-medium text-white rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      width: '18px',
                      height: '18px',
                      fontSize: '10px',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-lg border shadow-lg z-[60]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    animation: 'slideDown 0.2s ease-out'
                  }}
                >
                  <div className="p-4 border-b border-white/30">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-white/20 hover:bg-white/50 transition-colors cursor-pointer ${
                          notification.unread ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.unread ? 'bg-emerald-500' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center">
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
                  }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold text-gray-900 truncate max-w-32">
                    {user?.fullName || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
                <ChevronDown
                  className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                    showUserMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-lg border shadow-lg z-[60]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    animation: 'slideDown 0.2s ease-out'
                  }}
                >
                  <div className="p-4 border-b border-white/30">
                    <div className="text-sm font-semibold text-gray-900">
                      {user?.fullName || 'Admin User'}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {user?.email || 'admin@hojaverde.com'}
                    </div>
                  </div>

                  <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-white/50 flex items-center space-x-3 transition-colors">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Profile Settings</span>
                  </button>

                  <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-white/50 flex items-center space-x-3 transition-colors">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Preferences</span>
                  </button>

                  <div className="border-t border-white/30 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/50 flex items-center space-x-3 transition-colors rounded-lg mx-2 mb-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </header>
  )
}