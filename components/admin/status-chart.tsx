'use client'

import { useMemo, useCallback, useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getStatusText } from '@/lib/utils'
import { log } from '@/lib/logger'

interface StatusData {
  status: string
  count: number
  percentage?: number
}

interface StatusChartProps {
  data: StatusData[]
}

const statusColors = {
  draft: '#9CA3AF',
  sent: '#3B82F6',
  in_review: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  expired: '#6B7280',
  pending: '#8B5CF6',
  completed: '#059669',
  cancelled: '#DC2626',
}

export function StatusChart({ data }: StatusChartProps) {
  const [renderTime, setRenderTime] = useState<number>(0)

  // Memoized data processing for better performance
  const { chartData, total } = useMemo(() => {
    const startTime = performance.now()
    
    if (!data || data.length === 0) {
      return { chartData: [], total: 0 }
    }

    // Optimized total calculation
    let calculatedTotal = 0
    for (const item of data) {
      calculatedTotal += item.count
    }
    
    // Format data for Recharts
    const processedData = data.map((item) => ({
      name: getStatusText(item.status, 'quotation'),
      value: item.count,
      percentage: item.percentage || (calculatedTotal > 0 ? (item.count / calculatedTotal) * 100 : 0),
      color: statusColors[item.status as keyof typeof statusColors] || '#9CA3AF'
    }))

    const endTime = performance.now()
    setRenderTime(endTime - startTime)
    
    return { chartData: processedData, total: calculatedTotal }
  }, [data])

  // Log performance when data changes
  useEffect(() => {
    if (chartData.length > 0) {
      log.chartRender('status-chart', chartData.length, renderTime)
    }
  }, [chartData, renderTime])

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No data available</p>
          <p className="text-xs text-gray-400 mt-2">
            No quotation statuses found for the selected period
          </p>
        </div>
      </div>
    )
  }

  // Performance warning for large datasets
  if (chartData.length > 50) {
    log.warn('Large dataset detected in status chart', {
      component: 'status-chart',
      dataPoints: chartData.length,
      renderTime
    })
  }

  // Memoized CustomTooltip for better performance
  const CustomTooltip = useCallback(({ active, payload }: {
    active?: boolean
    payload?: Array<{ payload: { name: string; value: number; percentage: number } }>
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-gray-600">
            Count: <span className="font-semibold">{data.value}</span>
          </p>
          <p className="text-gray-600">
            Percentage: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      )
    }
    return null
  }, [])

  // Memoized CustomLabel for better performance
  const CustomLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
    percent?: number
  }) => {
    if (!percent || percent < 0.05) return null // Don't show label for slices < 5%
    
    const RADIAN = Math.PI / 180
    const radius = (innerRadius || 0) + ((outerRadius || 0) - (innerRadius || 0)) * 0.5
    const x = (cx || 0) + radius * Math.cos(-(midAngle || 0) * RADIAN)
    const y = (cy || 0) + radius * Math.sin(-(midAngle || 0) * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={(cx && x > cx) ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }, [])

  return (
    <div className="space-y-4">
      {/* Recharts Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </div>
              <div className="text-xs text-gray-500">
                {item.value} ({item.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <strong className="text-gray-900">{total}</strong> total quotations
        </div>
      </div>
    </div>
  )
}