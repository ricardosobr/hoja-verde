'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red'
  className?: string
}

const colorClasses = {
  green: 'text-hoja-verde-700 bg-hoja-verde-100',
  blue: 'text-blue-600 bg-blue-100',
  purple: 'text-purple-600 bg-purple-100',
  orange: 'text-brand-copper bg-brand-copper/10',
  red: 'text-red-600 bg-red-100',
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = 'green',
  className
}: DashboardCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{title}</p>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              trend.isPositive
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>

        <div className={cn(
          "p-2.5 rounded-lg",
          color === 'green' && "bg-emerald-50",
          color === 'blue' && "bg-blue-50",
          color === 'purple' && "bg-purple-50",
          color === 'orange' && "bg-orange-50",
          color === 'red' && "bg-red-50"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            color === 'green' && "text-emerald-600",
            color === 'blue' && "text-blue-600",
            color === 'purple' && "text-purple-600",
            color === 'orange' && "text-orange-600",
            color === 'red' && "text-red-600"
          )} />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  )
}