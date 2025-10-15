'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useDashboardStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { fetchDashboardData } from '@/lib/dashboard-queries'
import { log } from '@/lib/logger'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  TrendingUp,
  Users,
  FileText,
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Plus,
  UserPlus,
  PackagePlus,
  Activity
} from 'lucide-react'
import { MetricCard } from '@/components/admin/metric-card'
import { RecentQuotations } from '@/components/admin/recent-quotations'
import { StatusChart } from '@/components/admin/status-chart'
import { RevenueChart } from '@/components/admin/revenue-chart'
import ErrorBoundary, { DashboardErrorFallback, ChartErrorFallback } from '@/components/admin/error-boundary'
import { DashboardSkeleton } from '@/components/admin/loading-skeletons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminDashboard() {
  const { metrics, isLoading, setMetrics, setLoading } = useDashboardStore()
  const [timeRange, setTimeRange] = useState('30')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const supabase = createClient()

  const fetchDashboardMetrics = useCallback(async () => {
    console.log('🔍 Dashboard: Starting fetchDashboardMetrics...')
    setLoading(true)

    try {
      console.log('🔍 Dashboard: Calling fetchDashboardData...')
      const dashboardData = await fetchDashboardData({
        timeRange: parseInt(timeRange),
        includeGrowthData: true,
        includeChartData: true
      })

      console.log('🔍 Dashboard: Data received:', dashboardData)
      setMetrics({
        totalQuotations: dashboardData.metrics.totalQuotations,
        totalOrders: dashboardData.metrics.totalOrders,
        totalClients: dashboardData.metrics.totalClients,
        totalProducts: dashboardData.metrics.totalProducts,
        totalRevenue: dashboardData.metrics.totalRevenue,
        conversionRate: dashboardData.metrics.conversionRate,
        averageQuoteValue: dashboardData.metrics.averageQuoteValue,
        trends: dashboardData.trends || {
          revenueGrowth: { value: 0, isPositive: true, percentage: 0 },
          quotationsGrowth: { value: 0, isPositive: true, percentage: 0 },
          ordersGrowth: { value: 0, isPositive: true, percentage: 0 },
          clientsGrowth: { value: 0, isPositive: true, percentage: 0 }
        },
        recentQuotations: dashboardData.recentQuotations,
        statusDistribution: dashboardData.chartData?.statusDistribution || [],
        monthlyRevenue: dashboardData.chartData?.monthlyRevenue || []
      })
    } catch (error) {
      log.error('Error fetching dashboard metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      })
      setMetrics({
        totalQuotations: 0,
        totalOrders: 0,
        totalClients: 0,
        totalProducts: 0,
        totalRevenue: 0,
        conversionRate: 0,
        averageQuoteValue: 0,
        trends: {
          revenueGrowth: { value: 0, isPositive: true, percentage: 0 },
          quotationsGrowth: { value: 0, isPositive: true, percentage: 0 },
          ordersGrowth: { value: 0, isPositive: true, percentage: 0 },
          clientsGrowth: { value: 0, isPositive: true, percentage: 0 }
        },
        recentQuotations: [],
        statusDistribution: [],
        monthlyRevenue: []
      })
    } finally {
      setLoading(false)
    }
  }, [timeRange, setMetrics, setLoading])

  useEffect(() => {
    fetchDashboardMetrics()
  }, [fetchDashboardMetrics])

  const debouncedUpdate = useCallback(() => {
    const now = new Date()
    if (!lastUpdate || now.getTime() - lastUpdate.getTime() > 2000) {
      setLastUpdate(now)
      fetchDashboardMetrics()
    }
  }, [lastUpdate, fetchDashboardMetrics])

  useEffect(() => {
    let subscription: RealtimeChannel | null = null

    try {
      subscription = supabase
        .channel('dashboard-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'documents' },
          (payload) => {
            try {
              log.realtimeEvent('documents', payload.eventType, 'real-time-update')
              debouncedUpdate()
            } catch (error) {
              console.warn('Error handling documents update:', error)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'companies' },
          (payload) => {
            try {
              log.realtimeEvent('companies', payload.eventType, 'real-time-update')
              debouncedUpdate()
            } catch (error) {
              console.warn('Error handling companies update:', error)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            try {
              log.realtimeEvent('products', payload.eventType, 'real-time-update')
              debouncedUpdate()
            } catch (error) {
              console.warn('Error handling products update:', error)
            }
          }
        )
        .subscribe()
    } catch (error) {
      console.warn('Error setting up real-time subscriptions:', error)
    }

    return () => {
      if (subscription) {
        try {
          supabase.removeChannel(subscription)
        } catch (error) {
          console.warn('Error removing subscription:', error)
        }
      }
    }
  }, [debouncedUpdate, supabase])

  const cardData = useMemo(() => {
    if (!metrics) return null

    return {
      revenue: {
        title: "Ingresos Totales",
        value: formatCurrency(metrics.totalRevenue),
        trend: metrics.trends.revenueGrowth,
        description: "vs período anterior",
        color: "emerald" as const
      },
      quotations: {
        title: "Cotizaciones",
        value: metrics.totalQuotations.toString(),
        trend: metrics.trends.quotationsGrowth,
        description: "vs período anterior",
        color: "blue" as const
      },
      orders: {
        title: "Pedidos",
        value: metrics.totalOrders.toString(),
        trend: metrics.trends.ordersGrowth,
        description: "vs período anterior",
        color: "purple" as const
      },
      clients: {
        title: "Clientes Activos",
        value: metrics.totalClients.toString(),
        trend: metrics.trends.clientsGrowth,
        description: "vs período anterior",
        color: "orange" as const
      }
    }
  }, [metrics])

  // Only show skeleton on initial load for max 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading && !metrics && showSkeleton) {
    return <DashboardSkeleton />
  }

  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="max-w-[1600px] mx-auto p-6 space-y-8">

          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                Panel de Control
              </h1>
              <p className="text-lg text-gray-600">
                Resumen ejecutivo de métricas y estadísticas del negocio
              </p>
            </div>

            <div className="flex items-center gap-4">
              {isLoading && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
                  <span className="text-sm font-medium text-emerald-700">Actualizando...</span>
                </div>
              )}

              <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="7">Últimos 7 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 3 meses</option>
                  <option value="365">Último año</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardData && (
              <>
                <MetricCard
                  title={cardData.revenue.title}
                  value={cardData.revenue.value}
                  icon={DollarSign}
                  trend={cardData.revenue.trend}
                  description={cardData.revenue.description}
                  color={cardData.revenue.color}
                />

                <MetricCard
                  title={cardData.quotations.title}
                  value={cardData.quotations.value}
                  icon={FileText}
                  trend={cardData.quotations.trend}
                  description={cardData.quotations.description}
                  color={cardData.quotations.color}
                />

                <MetricCard
                  title={cardData.orders.title}
                  value={cardData.orders.value}
                  icon={ShoppingCart}
                  trend={cardData.orders.trend}
                  description={cardData.orders.description}
                  color={cardData.orders.color}
                />

                <MetricCard
                  title={cardData.clients.title}
                  value={cardData.clients.value}
                  icon={Users}
                  trend={cardData.clients.trend}
                  description={cardData.clients.description}
                  color={cardData.clients.color}
                />
              </>
            )}
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Catálogo
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900">
                      {metrics?.totalProducts || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <Package className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500">Productos activos disponibles</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Conversión
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900">
                      {(metrics?.conversionRate || 0).toFixed(1)}%
                    </h3>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500">Tasa de cotizaciones a pedidos</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                      Valor Promedio
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900">
                      {formatCurrency(metrics?.averageQuoteValue || 0)}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500">Por cotización generada</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ErrorBoundary fallback={ChartErrorFallback}>
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <PieChart className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Distribución de Estados</CardTitle>
                      <CardDescription>Estados de cotizaciones por categoría</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <StatusChart data={metrics?.statusDistribution || []} />
                </CardContent>
              </Card>
            </ErrorBoundary>

            <ErrorBoundary fallback={ChartErrorFallback}>
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Tendencia de Ingresos</CardTitle>
                      <CardDescription>Evolución mensual de ingresos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RevenueChart timeRange={timeRange} />
                </CardContent>
              </Card>
            </ErrorBoundary>
          </div>

          {/* Recent Quotations */}
          <Card className="border-2">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Cotizaciones Recientes</CardTitle>
                    <CardDescription>Últimas actividades de cotización</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <RecentQuotations quotations={metrics?.recentQuotations || []} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-2 bg-gradient-to-br from-gray-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              <CardDescription>Atajos para operaciones frecuentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-auto py-4 flex-col gap-3 hover:bg-emerald-50 hover:border-emerald-300"
                >
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <Plus className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Nueva Cotización</p>
                    <p className="text-xs text-gray-500">Crear cotización</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-auto py-4 flex-col gap-3 hover:bg-blue-50 hover:border-blue-300"
                >
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Nuevo Cliente</p>
                    <p className="text-xs text-gray-500">Registrar cliente</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-auto py-4 flex-col gap-3 hover:bg-purple-50 hover:border-purple-300"
                >
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <PackagePlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Gestionar Productos</p>
                    <p className="text-xs text-gray-500">Actualizar catálogo</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </ErrorBoundary>
  )
}
