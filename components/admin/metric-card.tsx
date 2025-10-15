'use client'

import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface MetricCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
    percentage: number
  }
  description?: string
  color?: 'emerald' | 'blue' | 'purple' | 'orange' | 'indigo' | 'rose'
  className?: string
}

const colorStyles = {
  emerald: {
    icon: 'text-emerald-600 bg-emerald-50',
    border: 'border-emerald-100',
    gradient: 'from-emerald-500/10 to-transparent',
  },
  blue: {
    icon: 'text-blue-600 bg-blue-50',
    border: 'border-blue-100',
    gradient: 'from-blue-500/10 to-transparent',
  },
  purple: {
    icon: 'text-purple-600 bg-purple-50',
    border: 'border-purple-100',
    gradient: 'from-purple-500/10 to-transparent',
  },
  orange: {
    icon: 'text-orange-600 bg-orange-50',
    border: 'border-orange-100',
    gradient: 'from-orange-500/10 to-transparent',
  },
  indigo: {
    icon: 'text-indigo-600 bg-indigo-50',
    border: 'border-indigo-100',
    gradient: 'from-indigo-500/10 to-transparent',
  },
  rose: {
    icon: 'text-rose-600 bg-rose-50',
    border: 'border-rose-100',
    gradient: 'from-rose-500/10 to-transparent',
  },
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = 'emerald',
  className
}: MetricCardProps) {
  const styles = colorStyles[color]

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl",
        styles.border,
        className
      )}
    >
      {/* Background Gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          styles.gradient
        )}
      />

      <CardContent className="relative p-6">
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {title}
            </p>
          </div>

          <div className={cn(
            "p-3 rounded-xl shadow-sm",
            styles.icon
          )}>
            <Icon className="w-6 h-6" strokeWidth={2.5} />
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-3">
          <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </h3>
        </div>

        {/* Trend and Description */}
        <div className="flex items-center justify-between">
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
              trend.isPositive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            )}>
              {trend.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={3} />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={3} />
              )}
              <span>{Math.abs(trend.percentage).toFixed(1)}%</span>
            </div>
          )}

          {description && (
            <p className="text-xs text-gray-500 ml-auto">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
