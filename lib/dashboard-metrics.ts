import { formatDistanceToNow } from 'date-fns'

export interface TrendData {
  value: number
  isPositive: boolean
  percentage: number
}

export interface DashboardMetrics {
  totalRevenue: number
  totalQuotations: number
  totalOrders: number
  totalClients: number
  totalProducts: number
  conversionRate: number
  averageQuoteValue: number
  revenueGrowth: TrendData
  quotationsGrowth: TrendData
  ordersGrowth: TrendData
  clientsGrowth: TrendData
  recentQuotations: any[]
  statusDistribution: Array<{ status: string; count: number }>
  monthlyRevenue: Array<{ month: string; revenue: number }>
}

export interface MetricPeriodData {
  current: number
  previous: number
  startDate: Date
  endDate: Date
  previousStartDate: Date
  previousEndDate: Date
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Calculate trend data for a metric
 */
export function calculateTrend(current: number, previous: number): TrendData {
  const percentage = calculatePercentageChange(current, previous)
  return {
    value: Math.abs(percentage),
    isPositive: percentage >= 0,
    percentage
  }
}

/**
 * Get date ranges for current and previous periods
 */
export function getDateRanges(days: number): {
  current: { start: Date; end: Date }
  previous: { start: Date; end: Date }
} {
  const now = new Date()
  const currentEnd = new Date(now)
  const currentStart = new Date(now)
  currentStart.setDate(currentStart.getDate() - days)

  const previousEnd = new Date(currentStart)
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - days)

  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd }
  }
}

/**
 * Calculate conversion rate from quotations to orders
 */
export function calculateConversionRate(quotationsCount: number, ordersCount: number): number {
  if (quotationsCount === 0) return 0
  return (ordersCount / quotationsCount) * 100
}

/**
 * Calculate average quotation value
 */
export function calculateAverageQuoteValue(totalRevenue: number, quotationsCount: number): number {
  if (quotationsCount === 0) return 0
  return totalRevenue / quotationsCount
}

/**
 * Format status distribution for charts
 */
export function formatStatusDistribution(rawData: Record<string, number>): Array<{ status: string; count: number; percentage: number }> {
  const total = Object.values(rawData).reduce((sum, count) => sum + count, 0)
  
  return Object.entries(rawData).map(([status, count]) => ({
    status: formatStatusLabel(status),
    count,
    percentage: total > 0 ? (count / total) * 100 : 0
  }))
}

/**
 * Format status labels for display
 */
export function formatStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'sent': 'Sent',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'expired': 'Expired',
    'pending': 'Pending',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  }
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1)
}

/**
 * Generate monthly revenue data for charts
 */
export function generateMonthlyRevenueData(
  quotationsData: Array<{ total: number; created_at: string }>,
  ordersData: Array<{ total: number; created_at: string }>,
  months: number = 12
): Array<{ month: string; revenue: number; quotations: number; orders: number }> {
  const monthlyData: Record<string, { revenue: number; quotations: number; orders: number }> = {}
  
  // Initialize months
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
    monthlyData[monthKey] = { revenue: 0, quotations: 0, orders: 0 }
  }
  
  // Aggregate quotations data
  quotationsData.forEach(item => {
    const monthKey = item.created_at.slice(0, 7)
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].revenue += item.total || 0
      monthlyData[monthKey].quotations += 1
    }
  })
  
  // Aggregate orders data
  ordersData.forEach(item => {
    const monthKey = item.created_at.slice(0, 7)
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].revenue += item.total || 0
      monthlyData[monthKey].orders += 1
    }
  })
  
  return Object.entries(monthlyData).map(([month, data]) => ({
    month: formatMonthLabel(month),
    ...data
  }))
}

/**
 * Format month label for display
 */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Calculate growth metrics for a specific period
 */
export function calculateGrowthMetrics(
  currentData: Array<{ total?: number; created_at: string }>,
  previousData: Array<{ total?: number; created_at: string }>
): {
  count: TrendData
  revenue: TrendData
} {
  const currentCount = currentData.length
  const previousCount = previousData.length
  const currentRevenue = currentData.reduce((sum, item) => sum + (item.total || 0), 0)
  const previousRevenue = previousData.reduce((sum, item) => sum + (item.total || 0), 0)
  
  return {
    count: calculateTrend(currentCount, previousCount),
    revenue: calculateTrend(currentRevenue, previousRevenue)
  }
}

/**
 * Validate metric data for consistency
 */
export function validateMetrics(metrics: Partial<DashboardMetrics>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check for negative values
  const numericFields = ['totalRevenue', 'totalQuotations', 'totalOrders', 'totalClients', 'totalProducts']
  numericFields.forEach(field => {
    const value = metrics[field as keyof DashboardMetrics] as number
    if (value !== undefined && value < 0) {
      errors.push(`${field} cannot be negative`)
    }
  })
  
  // Check conversion rate bounds
  if (metrics.conversionRate !== undefined && (metrics.conversionRate < 0 || metrics.conversionRate > 100)) {
    errors.push('Conversion rate must be between 0 and 100')
  }
  
  // Check data consistency
  if (metrics.totalQuotations !== undefined && metrics.totalOrders !== undefined) {
    if (metrics.totalOrders > metrics.totalQuotations) {
      errors.push('Total orders cannot exceed total quotations')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Cache key generator for dashboard metrics
 */
export function generateCacheKey(timeRange: string, userId?: string): string {
  const base = `dashboard-metrics-${timeRange}`
  return userId ? `${base}-${userId}` : base
}

/**
 * Debounce function for metric calculations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}