'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { getClientQuotationById, updateQuotationStatus, getStatusBadgeColor, getStatusLabel, canClientUpdateStatus, getClientAllowedActions } from '@/lib/client-quotations'
import type { ClientQuotation } from '@/lib/client-quotations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { QuotationApproval } from '@/components/client/quotation-approval'
import { QuotationStatusHistory } from '@/components/client/quotation-status-history'
import {
  ArrowLeft,
  Download,
  FileText,
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ClientQuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [quotation, setQuotation] = useState<ClientQuotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const quotationId = params?.id as string

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !quotationId) return
      
      try {
        setLoading(true)
        setError(null)
        const data = await getClientQuotationById(quotationId, user.id)
        if (!data) {
          setError('Cotización no encontrada')
          return
        }
        setQuotation(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading quotation')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [user?.id, quotationId])

  const loadQuotation = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getClientQuotationById(quotationId, user!.id)
      if (!data) {
        setError('Cotización no encontrada')
        return
      }
      setQuotation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading quotation')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: 'in_review' | 'approved' | 'rejected') => {
    if (!quotation) return

    try {
      setUpdating(true)
      await updateQuotationStatus(quotation.id, newStatus, user!.id)
      
      // Reload quotation to get updated status
      await loadQuotation()
      
      // Show success message would go here
      
      // If approved or rejected, redirect back to list after a moment
      if (newStatus === 'approved' || newStatus === 'rejected') {
        setTimeout(() => {
          router.push('/client/quotations')
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={loadQuotation}>Intentar de Nuevo</Button>
            <Button variant="outline" asChild>
              <Link href="/client/quotations">Volver a Cotizaciones</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cotización no encontrada</h1>
          <p className="text-gray-600 mb-4">La cotización que buscas no existe o no tienes permisos para verla.</p>
          <Button asChild>
            <Link href="/client/quotations">Volver a Cotizaciones</Link>
          </Button>
        </div>
      </div>
    )
  }

  const allowedActions = getClientAllowedActions(quotation.quotation_status)
  const isExpired = quotation.expiry_date && new Date(quotation.expiry_date) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/client/quotations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cotización {quotation.folio}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusBadgeColor(quotation.quotation_status)}>
                {getStatusLabel(quotation.quotation_status)}
              </Badge>
              {canClientUpdateStatus(quotation.quotation_status) && !isExpired && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Acción Requerida
                </Badge>
              )}
              {isExpired && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  Expirada
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Información de la Cotización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Folio</label>
                  <p className="text-lg font-semibold">{quotation.folio}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Emisión</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatDate(quotation.issue_date)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Válida por</label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{quotation.validity_days} días</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Vencimiento</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                      {quotation.expiry_date ? formatDate(quotation.expiry_date) : 'No especificada'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Empresa</label>
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">{quotation.companies?.name}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contacto</label>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{quotation.contact_name}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{quotation.contact_email}</span>
                  </div>
                </div>
                {quotation.contact_phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Teléfono</label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{quotation.contact_phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items would go here - placeholder for now */}
          <Card>
            <CardHeader>
              <CardTitle>Productos/Servicios</CardTitle>
              <CardDescription>
                Los productos incluidos en esta cotización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Los detalles de productos se mostrarán aquí</p>
                <p className="text-sm">Esta funcionalidad se completará en la siguiente iteración</p>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Términos y Condiciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quotation.terms && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Términos Generales</label>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{quotation.terms}</p>
                </div>
              )}
              {quotation.delivery_terms && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Términos de Entrega</label>
                  <p className="text-sm text-gray-800 mt-1">{quotation.delivery_terms}</p>
                </div>
              )}
              {quotation.payment_terms && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Términos de Pago</label>
                  <p className="text-sm text-gray-800 mt-1">{quotation.payment_terms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Total */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <DollarSign className="h-5 w-5 mr-2" />
                Total de la Cotización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(quotation.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA:</span>
                  <span>{formatCurrency(quotation.tax_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(quotation.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {(allowedActions.length > 0 && !isExpired) && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones Disponibles</CardTitle>
                <CardDescription>
                  Revisa la cotización y toma una decisión
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuotationApproval
                  quotation={quotation}
                  onStatusUpdate={handleStatusUpdate}
                  isUpdating={updating}
                />
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Estado</CardTitle>
              <CardDescription>
                Seguimiento de cambios en la cotización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuotationStatusHistory quotationId={quotation.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}