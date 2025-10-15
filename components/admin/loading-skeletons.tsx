'use client'

import React from 'react'

// Enhanced skeleton component with brand styling
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-shimmer bg-gradient-to-r from-hoja-verde-100 via-hoja-verde-50 to-hoja-verde-100 rounded-lg ${className}`}></div>
)

// Enhanced dashboard card skeleton
export const DashboardCardSkeleton: React.FC = () => (
  <div className="group bg-gradient-to-br from-white to-brand-cream/30 p-6 rounded-xl border-0 shadow-brand animate-fade-in">
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="p-3 bg-hoja-verde-50 rounded-xl">
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton className="h-8 w-20" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
)

// Enhanced chart skeleton with brand colors
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-64" }) => (
  <div className={`${height} flex items-center justify-center`}>
    <div className="w-full space-y-4 animate-fade-in">
      <div className="flex justify-between items-end space-x-2">
        {[40, 60, 45, 80, 35, 70, 55].map((barHeight, index) => (
          <div 
            key={index}
            className="bg-gradient-to-t from-hoja-verde-200 to-hoja-verde-100 rounded-t-lg animate-shimmer"
            style={{ height: `${barHeight}%`, width: '12%' }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-8" />
        ))}
      </div>
    </div>
  </div>
)

// Pie chart skeleton  
export const PieChartSkeleton: React.FC = () => (
  <div className="h-64 flex items-center justify-center">
    <div className="animate-pulse">
      <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
        <div className="w-16 h-16 bg-white rounded-full"></div>
      </div>
    </div>
  </div>
)

// Recent quotations skeleton
export const RecentQuotationsSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-12 ml-auto" />
        </div>
      </div>
    ))}
  </div>
)

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={`header-${index}`} className="h-4 flex-1" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={`cell-${rowIndex}-${colIndex}`} 
            className={`h-4 ${colIndex === 0 ? 'w-16' : 'flex-1'}`} 
          />
        ))}
      </div>
    ))}
  </div>
)

// Full dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>

    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <DashboardCardSkeleton key={index} />
      ))}
    </div>

    {/* Secondary Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <DashboardCardSkeleton key={index} />
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <Skeleton className="h-6 w-48 mb-4" />
        <PieChartSkeleton />
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <Skeleton className="h-6 w-32 mb-4" />
        <ChartSkeleton />
      </div>
    </div>

    {/* Recent Activity */}
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="p-6">
        <RecentQuotationsSkeleton />
      </div>
    </div>
  </div>
)

// Enhanced loading state with brand styling
export const LoadingStateWithProgress: React.FC<{ 
  message?: string
  progress?: number
  showProgress?: boolean 
}> = ({ 
  message = "Loading dashboard...", 
  progress = 0,
  showProgress = false 
}) => (
  <div className="min-h-64 flex items-center justify-center">
    <div className="text-center animate-fade-in">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-hoja-verde-100 border-t-hoja-verde-600 mx-auto mb-4 shadow-brand-sm"></div>
      <p className="text-hoja-verde-700 font-medium mb-2">{message}</p>
      {showProgress && (
        <div className="w-48 mx-auto">
          <div className="bg-hoja-verde-100 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-hoja-verde-500 to-hoja-verde-600 h-3 rounded-full transition-all duration-500 shadow-brand-sm"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 font-medium">{Math.round(progress)}% complete</p>
        </div>
      )}
    </div>
  </div>
)

export default Skeleton