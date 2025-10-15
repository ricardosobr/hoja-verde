'use client'

import React from 'react'
import { log } from '@/lib/logger'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>
}

interface ErrorBoundaryFallbackProps {
  error: Error
  resetError: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// Default fallback component
const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, resetError }) => (
  <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">
          Something went wrong
        </h3>
        <div className="mt-2 text-sm text-red-700">
          <p>There was an error rendering this component. Please try refreshing the page or contact support if the issue persists.</p>
        </div>
        <div className="mt-4">
          <button
            onClick={resetError}
            className="text-sm font-medium text-red-800 hover:text-red-900 underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  </div>
)

// Chart-specific fallback component
export const ChartErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, resetError }) => (
  <div className="h-64 flex items-center justify-center">
    <div className="text-center">
      <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Chart Error</h3>
      <p className="text-gray-600 mb-4">Unable to render chart data</p>
      <button
        onClick={resetError}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Retry
      </button>
    </div>
  </div>
)

// Dashboard-specific fallback component  
export const DashboardErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, resetError }) => (
  <div className="min-h-64 flex items-center justify-center">
    <div className="max-w-md w-full bg-white shadow-sm border border-gray-200 rounded-lg p-6">
      <div className="text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard Error</h3>
        <p className="text-gray-600 mb-6">
          We encountered an error while loading the dashboard. This might be due to network issues or data problems.
        </p>
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Retry Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  </div>
)

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to our logging system
    log.error('Error boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })

    // In production, you might want to send to external error reporting
    if (process.env.NODE_ENV === 'production') {
      // Send to external error reporting service like Sentry
      console.error('Production error caught by boundary:', error)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

export default ErrorBoundary