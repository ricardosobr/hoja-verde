'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { useDashboardStore } from '@/lib/store'
import { log } from '@/lib/logger'

interface RevenueChartProps {
  timeRange: string
}

export function RevenueChart({ timeRange }: RevenueChartProps) {
  const { metrics, isLoading } = useDashboardStore()
  const [renderTime, setRenderTime] = useState<number>(0)

  // Memoized and optimized chart data processing
  const chartData = useMemo(() => {
    const startTime = performance.now()
    
    if (!metrics?.monthlyRevenue) return []
    
    // Filter data based on time range
    const months = parseInt(timeRange) === 7 ? 1 : 
                  parseInt(timeRange) === 30 ? 3 : 
                  parseInt(timeRange) === 90 ? 6 : 12
    
    // Optimize data processing for large datasets
    const processedData = metrics.monthlyRevenue.slice(-months).map(item => ({
      month: item.month,
      revenue: item.revenue,
      quotations: item.quotations,
      orders: item.orders
    }))

    const endTime = performance.now()
    setRenderTime(endTime - startTime)
    
    return processedData
  }, [metrics?.monthlyRevenue, timeRange])

  const summaryStats = useMemo(() => {
    if (!chartData.length) return { total: 0, average: 0, peak: 0 }
    
    // Optimized calculation for large datasets
    let total = 0
    let peak = 0
    
    for (const item of chartData) {
      total += item.revenue
      if (item.revenue > peak) peak = item.revenue
    }
    
    const average = total / chartData.length
    
    return { total, average, peak }
  }, [chartData])

  // Log performance when data changes
  useEffect(() => {
    if (chartData.length > 0) {
      log.chartRender('revenue-chart', chartData.length, renderTime)
    }
  }, [chartData, renderTime])

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse space-y-2 w-full">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No revenue data available</p>
          <p className="text-xs text-gray-400 mt-2">
            Try adjusting the time range or check if there are any quotations/orders
          </p>
        </div>
      </div>
    )
  }

  // Performance warning for very large datasets
  if (chartData.length > 100) {
    log.warn('Large dataset detected in revenue chart', {
      component: 'revenue-chart',
      dataPoints: chartData.length,
      renderTime
    })
  }

  // Memoized CustomTooltip for better performance
  const CustomTooltip = useCallback(({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ payload: { revenue: number; quotations: number; orders: number } }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-green-600">
            Revenue: <span className="font-semibold">{formatCurrency(data.revenue)}</span>
          </p>
          <p className="text-blue-600 text-sm">
            Quotations: {data.quotations} | Orders: {data.orders}
          </p>
        </div>
      )
    }
    return null
  }, [])

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(summaryStats.total)}
          </div>
          <div className="text-sm text-gray-500">Total Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(summaryStats.average)}
          </div>
          <div className="text-sm text-gray-500">Average</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(summaryStats.peak)}
          </div>
          <div className="text-sm text-gray-500">Peak Month</div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(value) => formatCurrency(value).replace(/\.\d{2}$/, '')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}