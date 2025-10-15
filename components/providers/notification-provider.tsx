'use client'

import { createContext, useContext, useEffect } from 'react'
import { useNotificationStore } from '@/lib/store'

const NotificationContext = createContext({})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { notifications, removeNotification } = useNotificationStore()

  useEffect(() => {
    // Auto-remove notifications after 5 seconds
    const timeouts = notifications.map((notification) => {
      if (notification.id) {
        return setTimeout(() => {
          removeNotification(notification.id!)
        }, 5000)
      }
      return null
    })

    return () => {
      timeouts.forEach((timeout) => {
        if (timeout) clearTimeout(timeout)
      })
    }
  }, [notifications, removeNotification])

  return (
    <NotificationContext.Provider value={{}}>
      {children}
      
      {/* Notification Toast Container */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm rounded-lg border p-4 shadow-lg animate-slide-up ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : notification.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : notification.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-1">
                  {notification.title && (
                    <h4 className="text-sm font-semibold mb-1">
                      {notification.title}
                    </h4>
                  )}
                  <p className="text-sm">{notification.message}</p>
                </div>
                
                <button
                  onClick={() => notification.id && removeNotification(notification.id)}
                  className="ml-4 text-current hover:opacity-70"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export const useNotificationContext = () => useContext(NotificationContext)