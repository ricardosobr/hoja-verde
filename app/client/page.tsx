'use client'

import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Eye, Plus } from 'lucide-react'
import Link from 'next/link'

export default function ClientDashboard() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido, {user?.fullName}
        </h1>
        <p className="text-gray-600">
          {user?.companyName && `${user.companyName} - `}
          Gestiona tus cotizaciones y solicitudes
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">Mis Cotizaciones</CardTitle>
              <CardDescription>
                Ver todas tus cotizaciones
              </CardDescription>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">-</div>
              <Button asChild size="sm">
                <Link href="/client/quotations">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Cotizaciones
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <CardDescription>
                Cotizaciones por revisar
              </CardDescription>
            </div>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-yellow-600">-</div>
              <Button asChild size="sm" variant="outline">
                <Link href="/client/quotations?status=generated">
                  Revisar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
              <CardDescription>
                Cotizaciones aprobadas
              </CardDescription>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">-</div>
              <Button asChild size="sm" variant="outline">
                <Link href="/client/quotations?status=approved">
                  Ver Aprobadas
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas actualizaciones en tus cotizaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay actividad reciente</p>
            <Button asChild className="mt-4">
              <Link href="/client/quotations">Ver Cotizaciones</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}