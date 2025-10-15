import { createClient } from '@/lib/supabase'
import { getDateRanges, calculateGrowthMetrics, formatStatusDistribution } from './dashboard-metrics'
import { log } from './logger'

export interface QueryOptions {
  timeRange: number // days
  includeGrowthData?: boolean
  includeChartData?: boolean
  limit?: number // Add pagination limit
  offset?: number // Add pagination offset
}

export interface DashboardQueryResult {
  metrics: {
    totalRevenue: number
    totalQuotations: number
    totalOrders: number
    totalClients: number
    totalProducts: number
    conversionRate: number
    averageQuoteValue: number
  }
  trends?: {
    revenueGrowth: { value: number; isPositive: boolean; percentage: number }
    quotationsGrowth: { value: number; isPositive: boolean; percentage: number }
    ordersGrowth: { value: number; isPositive: boolean; percentage: number }
    clientsGrowth: { value: number; isPositive: boolean; percentage: number }
  }
  chartData?: {
    statusDistribution: Array<{ status: string; count: number; percentage: number }>
    monthlyRevenue: Array<{ month: string; revenue: number; quotations: number; orders: number }>
  }
  recentQuotations: Array<{
    id: string
    folio: string
    companyName: string
    total: number
    status: string
    createdAt: string
  }>
}

/**
 * Main dashboard query function - fetches all dashboard data in optimized queries
 */
export async function fetchDashboardData(options: QueryOptions): Promise<DashboardQueryResult> {
  console.log('📊 fetchDashboardData: START', { options })
  const supabase = createClient()
  const { current, previous } = getDateRanges(options.timeRange)
  const startTime = performance.now()

  // Set default limits to prevent performance issues
  const limit = options.limit || 10000 // Default limit for large datasets
  const offset = options.offset || 0

  console.log('📊 fetchDashboardData: Date ranges', { current, previous })

  try {
    console.log('📊 fetchDashboardData: Starting parallel queries...')

    // Run main queries in parallel (excluding optional queries)
    const [
      currentQuotationsResult,
      currentOrdersResult,
      clientsResult,
      productsResult,
      recentQuotationsResult
    ] = await Promise.all([
      // Current period quotations
      supabase
        .from('documents')
        .select('id, total, quotation_status, created_at')
        .eq('type', 'quotation')
        .gte('created_at', current.start.toISOString())
        .lte('created_at', current.end.toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      // Current period orders
      supabase
        .from('documents')
        .select('id, total, order_status, created_at')
        .eq('type', 'order')
        .gte('created_at', current.start.toISOString())
        .lte('created_at', current.end.toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      // Active clients count
      supabase
        .from('companies')
        .select('id', { count: 'exact' })
        .eq('status', 'active'),

      // Active products count
      supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('is_active', true),

      // Recent quotations (without join to avoid hanging)
      supabase
        .from('documents')
        .select('id, folio, total, quotation_status, created_at, company_id')
        .eq('type', 'quotation')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    console.log('📊 Main queries completed')

    // Fetch company names separately for recent quotations
    const companyIds = recentQuotationsResult.data?.map(d => d.company_id).filter(Boolean) || []
    let companiesMap: Record<string, string> = {}

    if (companyIds.length > 0) {
      const companiesResult = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds)

      if (companiesResult.data) {
        companiesMap = companiesResult.data.reduce((acc, company) => {
          acc[company.id] = company.name
          return acc
        }, {} as Record<string, string>)
      }
    }

    // Run optional queries sequentially after main queries
    let previousQuotationsResult = null
    let previousOrdersResult = null
    let chartDataResult = null

    if (options.includeGrowthData) {
      [previousQuotationsResult, previousOrdersResult] = await Promise.all([
        supabase
          .from('documents')
          .select('id, total, quotation_status, created_at')
          .eq('type', 'quotation')
          .gte('created_at', previous.start.toISOString())
          .lte('created_at', previous.end.toISOString())
          .order('created_at', { ascending: false })
          .limit(limit),

        supabase
          .from('documents')
          .select('id, total, order_status, created_at')
          .eq('type', 'order')
          .gte('created_at', previous.start.toISOString())
          .lte('created_at', previous.end.toISOString())
          .order('created_at', { ascending: false })
          .limit(limit)
      ])
    }

    if (options.includeChartData) {
      chartDataResult = await fetchChartData(limit)
    }

    console.log('📊 All queries completed successfully')

    // Process current period data
    const currentQuotations = currentQuotationsResult.data || []
    const currentOrders = currentOrdersResult.data || []
    const totalClients = clientsResult.count || 0
    const totalProducts = productsResult.count || 0

    // Calculate basic metrics
    const totalRevenue = [
      ...currentQuotations.map(q => q.total || 0),
      ...currentOrders.map(o => o.total || 0)
    ].reduce((sum, total) => sum + total, 0)

    const totalQuotations = currentQuotations.length
    const totalOrders = currentOrders.length
    const conversionRate = totalQuotations > 0 ? (totalOrders / totalQuotations) * 100 : 0
    const averageQuoteValue = totalQuotations > 0 ? totalRevenue / totalQuotations : 0

    // Format recent quotations using the separate companies lookup
    const recentQuotations = (recentQuotationsResult.data || []).map(doc => ({
      id: doc.id,
      folio: doc.folio,
      companyName: doc.company_id ? (companiesMap[doc.company_id] || 'Unknown Company') : 'Unknown Company',
      total: doc.total || 0,
      status: doc.quotation_status || 'unknown',
      createdAt: doc.created_at
    }))

    const result: DashboardQueryResult = {
      metrics: {
        totalRevenue,
        totalQuotations,
        totalOrders,
        totalClients,
        totalProducts,
        conversionRate,
        averageQuoteValue
      },
      recentQuotations
    }

    // Add growth data if requested
    if (options.includeGrowthData && previousQuotationsResult && previousOrdersResult) {
      const previousQuotations = previousQuotationsResult.data || []
      const previousOrders = previousOrdersResult.data || []

      const quotationsGrowth = calculateGrowthMetrics(currentQuotations, previousQuotations)
      const ordersGrowth = calculateGrowthMetrics(currentOrders, previousOrders)

      // Calculate previous period totals for comparison
      const previousRevenue = [
        ...previousQuotations.map(q => q.total || 0),
        ...previousOrders.map(o => o.total || 0)
      ].reduce((sum, total) => sum + total, 0)

      const previousClients = totalClients // Simplified for now - could be enhanced with historical data

      result.trends = {
        revenueGrowth: {
          value: Math.abs(((totalRevenue - previousRevenue) / Math.max(previousRevenue, 1)) * 100),
          isPositive: totalRevenue >= previousRevenue,
          percentage: ((totalRevenue - previousRevenue) / Math.max(previousRevenue, 1)) * 100
        },
        quotationsGrowth: quotationsGrowth.count,
        ordersGrowth: ordersGrowth.count,
        clientsGrowth: {
          value: 0, // Simplified - would need historical tracking
          isPositive: true,
          percentage: 0
        }
      }
    }

    // Add chart data if requested
    if (options.includeChartData && chartDataResult) {
      result.chartData = chartDataResult
    }

    // Log performance metrics
    const endTime = performance.now()
    const totalRecords = currentQuotations.length + currentOrders.length + totalClients + totalProducts
    log.queryPerformance('fetchDashboardData', endTime - startTime, totalRecords)

    console.log('📊 fetchDashboardData: COMPLETED successfully', { result })
    return result

  } catch (error) {
    const endTime = performance.now()
    console.error('❌ fetchDashboardData: ERROR', error)
    log.error('Error fetching dashboard data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timeRange: options.timeRange,
      duration: endTime - startTime
    })
    throw error
  }
}

/**
 * Fetch chart-specific data with optimized queries and pagination
 */
async function fetchChartData(limit: number = 10000): Promise<{
  statusDistribution: Array<{ status: string; count: number; percentage: number }>
  monthlyRevenue: Array<{ month: string; revenue: number; quotations: number; orders: number }>
}> {
  const supabase = createClient()
  const startTime = performance.now()

  // Get last 12 months date range
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 12)

  const [statusResult, monthlyDataResult] = await Promise.all([
    // Status distribution query with limit
    supabase
      .from('documents')
      .select('quotation_status')
      .eq('type', 'quotation')
      .not('quotation_status', 'is', null)
      .limit(limit),

    // Monthly revenue data with limit
    supabase
      .from('documents')
      .select('type, total, created_at')
      .in('type', ['quotation', 'order'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(limit)
  ])

  // Process status distribution
  const statusCounts: Record<string, number> = {}
  if (statusResult.data) {
    statusResult.data.forEach(doc => {
      const status = doc.quotation_status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
  }

  const statusDistribution = formatStatusDistribution(statusCounts)

  // Process monthly revenue data
  const monthlyData: Record<string, { revenue: number; quotations: number; orders: number }> = {}

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
    monthlyData[monthKey] = { revenue: 0, quotations: 0, orders: 0 }
  }

  // Aggregate data by month
  if (monthlyDataResult.data) {
    monthlyDataResult.data.forEach(doc => {
      const monthKey = doc.created_at.slice(0, 7)
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += doc.total || 0
        if (doc.type === 'quotation') {
          monthlyData[monthKey].quotations += 1
        } else if (doc.type === 'order') {
          monthlyData[monthKey].orders += 1
        }
      }
    })
  }

  const monthlyRevenue = Object.entries(monthlyData).map(([month, data]) => ({
    month: formatMonthForChart(month),
    ...data
  }))

  // Log performance
  const endTime = performance.now()
  log.queryPerformance('fetchChartData', endTime - startTime, 
    (statusResult.data?.length || 0) + (monthlyDataResult.data?.length || 0))

  return {
    statusDistribution,
    monthlyRevenue
  }
}

/**
 * Optimized query for real-time metric updates
 */
export async function fetchQuickMetrics(): Promise<{
  totalQuotations: number
  totalOrders: number
  totalClients: number
  totalProducts: number
}> {
  const supabase = createClient()

  const [quotationsCount, ordersCount, clientsCount, productsCount] = await Promise.all([
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'quotation'),

    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'order'),

    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),

    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
  ])

  return {
    totalQuotations: quotationsCount.count || 0,
    totalOrders: ordersCount.count || 0,
    totalClients: clientsCount.count || 0,
    totalProducts: productsCount.count || 0
  }
}

/**
 * Query for real-time status distribution updates
 */
export async function fetchStatusDistribution(): Promise<Array<{ status: string; count: number; percentage: number }>> {
  const supabase = createClient()

  const { data } = await supabase
    .from('documents')
    .select('quotation_status')
    .eq('type', 'quotation')
    .not('quotation_status', 'is', null)

  const statusCounts: Record<string, number> = {}
  if (data) {
    data.forEach(doc => {
      const status = doc.quotation_status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
  }

  return formatStatusDistribution(statusCounts)
}

/**
 * Performance-optimized aggregate query for revenue calculation
 */
export async function fetchRevenueMetrics(timeRange: number): Promise<{
  totalRevenue: number
  quotationsRevenue: number
  ordersRevenue: number
  averageQuoteValue: number
  conversionRate: number
}> {
  const supabase = createClient()
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - timeRange)

  // Use aggregate functions for better performance
  const [quotationsResult, ordersResult] = await Promise.all([
    supabase
      .from('documents')
      .select('total')
      .eq('type', 'quotation')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),

    supabase
      .from('documents')
      .select('total')
      .eq('type', 'order')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
  ])

  const quotationsRevenue = (quotationsResult.data || []).reduce((sum, doc) => sum + (doc.total || 0), 0)
  const ordersRevenue = (ordersResult.data || []).reduce((sum, doc) => sum + (doc.total || 0), 0)
  const totalRevenue = quotationsRevenue + ordersRevenue

  const quotationsCount = quotationsResult.data?.length || 0
  const ordersCount = ordersResult.data?.length || 0

  return {
    totalRevenue,
    quotationsRevenue,
    ordersRevenue,
    averageQuoteValue: quotationsCount > 0 ? quotationsRevenue / quotationsCount : 0,
    conversionRate: quotationsCount > 0 ? (ordersCount / quotationsCount) * 100 : 0
  }
}

/**
 * Format month for chart display
 */
function formatMonthForChart(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Create database subscription for real-time updates
 */
export function createDashboardSubscription(callback: () => void) {
  const supabase = createClient()

  const subscription = supabase
    .channel('dashboard-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents'
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'companies'
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products'
      },
      callback
    )
    .subscribe()

  return subscription
}