'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  QuotationPDFData, 
  generatePDFFileName,
  validatePDFData,
  DEFAULT_ISSUER 
} from '@/lib/pdf'
import { PDFDownloadLink } from '@react-pdf/renderer'
import QuotationPDF from '@/components/pdf/quotation-pdf'
import { StatusSelector } from '@/components/admin/quotations/status-badge'
import { updateQuotationStatus, QuotationStatus } from '@/lib/status-management'
import { convertQuotationToOrder, canConvertQuotation } from '@/lib/quotations'
import { 
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  ShoppingCart,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DocumentItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  tax: number
  discount: number
  total: number
  products?: {
    name: string
    code: string
    description?: string
  }
}

interface Document {
  id: string
  folio: string
  type: 'quotation' | 'order'
  company_id: string
  client_id: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  issue_date: string
  validity_days: number
  expiry_date: string
  terms: string | null
  delivery_terms: string | null
  payment_terms: string | null
  quotation_status: string | null
  order_status: string | null
  subtotal: number
  tax_amount: number
  discount: number
  total: number
  notes?: string
  created_at: string
  companies?: {
    id: string
    name: string
    rfc: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    email: string
    contact_name?: string
  }
  document_items?: DocumentItem[]
}

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addNotification } = useNotificationStore()
  const [quotation, setQuotation] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState<QuotationPDFData | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [convertedOrderId, setConvertedOrderId] = useState<string | null>(null)

  const supabase = createClient()
  const quotationId = params?.id as string

  useEffect(() => {
    if (quotationId) {
      fetchQuotation()
      checkConvertedOrder()
    }
  }, [quotationId])

  const fetchQuotation = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          companies (
            id,
            name,
            rfc,
            address,
            city,
            state,
            zip,
            phone,
            email,
            contact_name
          ),
          document_items (
            *,
            products (
              name,
              code,
              description
            )
          )
        `)
        .eq('id', quotationId)
        .eq('type', 'quotation')
        .single()

      if (error) throw error

      setQuotation(data)
      
      // Prepare PDF data
      if (data && data.companies) {
        const pdfData: QuotationPDFData = {
          id: data.id,
          folio: data.folio,
          status: data.quotation_status || 'draft',
          createdAt: data.issue_date,
          validUntil: data.expiry_date,
          subtotal: data.subtotal,
          tax: data.tax_amount,
          discount: data.discount || 0,
          total: data.total,
          notes: data.notes || data.terms || '',
          company: {
            id: data.companies.id,
            name: data.companies.name,
            rfc: data.companies.rfc,
            address: data.companies.address,
            city: data.companies.city,
            state: data.companies.state,
            zip: data.companies.zip,
            phone: data.companies.phone,
            email: data.companies.email,
            contactName: data.contact_name || data.companies.contact_name,
          },
          items: (data.document_items || []).map((item: DocumentItem) => ({
            id: item.id,
            productName: item.products?.name || 'Producto',
            productCode: item.products?.code || '',
            description: item.products?.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: item.subtotal,
            tax: item.tax,
            total: item.total,
          })),
          issuer: DEFAULT_ISSUER,
        }

        // Validate PDF data
        const validation = validatePDFData(pdfData)
        if (validation.valid) {
          setPdfData(pdfData)
        } else {
          console.error('PDF data validation errors:', validation.errors)
          addNotification('error', `Error preparando PDF: ${validation.errors.join(', ')}`)
        }
      }
    } catch (error: any) {
      console.error('Error fetching quotation:', error)
      addNotification('error', 'Error al cargar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: QuotationStatus) => {
    if (!quotation) return
    
    try {
      await updateQuotationStatus(supabase, quotation.id, newStatus)
      
      setQuotation({
        ...quotation,
        quotation_status: newStatus
      })

      // Update PDF data status
      if (pdfData) {
        setPdfData({
          ...pdfData,
          status: newStatus
        })
      }

      addNotification('success', 'Estado actualizado correctamente')
    } catch (error: any) {
      console.error('Error updating status:', error)
      addNotification('error', error.message || 'Error al actualizar el estado')
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar esta cotización?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', quotationId)

      if (error) throw error

      addNotification('success', 'Cotización eliminada correctamente')
      router.push('/admin/quotations')
    } catch (error: any) {
      console.error('Error deleting quotation:', error)
      addNotification('error', 'Error al eliminar la cotización')
    }
  }

  const checkConvertedOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, folio')
        .eq('quotation_id', quotationId)
        .eq('type', 'order')
        .single()

      if (!error && data) {
        setConvertedOrderId(data.id)
      }
    } catch (error) {
      // Order doesn't exist, which is fine
    }
  }

  const handleConvertToOrder = async () => {
    if (!quotation) return

    // Show confirmation dialog
    if (!confirm(`¿Está seguro de convertir la cotización ${quotation.folio} en una orden?`)) return

    setIsConverting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addNotification('error', 'Debe estar autenticado para realizar esta acción')
        return
      }

      const result = await convertQuotationToOrder(quotationId, user.id)

      if (result.success) {
        addNotification('success', result.message)
        setConvertedOrderId(result.orderId || null)
        
        // Update quotation status to reflect conversion
        await fetchQuotation()
      } else {
        addNotification('error', result.message)
      }
    } catch (error: any) {
      console.error('Error converting quotation to order:', error)
      addNotification('error', 'Error inesperado al convertir la cotización')
    } finally {
      setIsConverting(false)
    }
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'expired':
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <FileText className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50'
      case 'rejected':
        return 'text-red-600 bg-red-50'
      case 'expired':
        return 'text-orange-600 bg-orange-50'
      case 'draft':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Cotización no encontrada</h2>
          <Link href="/admin/quotations" className="mt-4 text-primary hover:underline">
            Volver a cotizaciones
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/quotations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Cotización {quotation.folio}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Show order link if converted */}
          {convertedOrderId && (
            <Link href={`/admin/orders/${convertedOrderId}`}>
              <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                <Package className="h-4 w-4 mr-2" />
                Ver Orden
              </Button>
            </Link>
          )}

          {/* Show convert button if quotation can be converted */}
          {!convertedOrderId && canConvertQuotation(quotation.quotation_status || '') && (
            <Button 
              onClick={handleConvertToOrder}
              disabled={isConverting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Convertir a Orden
                </>
              )}
            </Button>
          )}

          {pdfData && (
            <PDFDownloadLink
              document={<QuotationPDF data={pdfData} />}
              fileName={generatePDFFileName(quotation.folio, quotation.companies?.name || 'cliente')}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {({ blob, url, loading, error }) => (
                <>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </>
                  )}
                </>
              )}
            </PDFDownloadLink>
          )}
          
          <Link href={`/admin/quotations/${quotationId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Status and Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Estado</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon(quotation.quotation_status)}
            <StatusSelector
              status={quotation.quotation_status as QuotationStatus || 'draft'}
              onStatusChange={handleStatusChange}
            />
          </div>
          {convertedOrderId && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2 text-green-700 text-sm">
                <Package className="h-4 w-4" />
                <span>Convertida a orden</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Fecha de Emisión</h3>
          <p className="text-lg font-semibold">{formatDate(quotation.issue_date)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Vigencia</h3>
          <p className="text-lg font-semibold">{formatDate(quotation.expiry_date)}</p>
          <p className="text-sm text-gray-500">({quotation.validity_days} días)</p>
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Información del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Empresa</p>
            <p className="font-medium">{quotation.companies?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">RFC</p>
            <p className="font-medium">{quotation.companies?.rfc}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contacto</p>
            <p className="font-medium">{quotation.contact_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{quotation.contact_email}</p>
          </div>
          {quotation.contact_phone && (
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium">{quotation.contact_phone}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Dirección</p>
            <p className="font-medium">
              {quotation.companies?.address}, {quotation.companies?.city}, {quotation.companies?.state} C.P. {quotation.companies?.zip}
            </p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Productos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3 text-right">P. Unitario</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">IVA</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.document_items?.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{item.products?.code}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{item.products?.name}</p>
                      {item.products?.description && (
                        <p className="text-xs text-gray-500">{item.products.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.subtotal)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.tax)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-end">
          <div className="space-y-2 w-64">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(quotation.subtotal)}</span>
            </div>
            {quotation.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Descuento:</span>
                <span className="font-medium text-red-600">-{formatCurrency(quotation.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">IVA (16%):</span>
              <span className="font-medium">{formatCurrency(quotation.tax_amount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(quotation.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Notes */}
      {(quotation.terms || quotation.delivery_terms || quotation.payment_terms) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Términos y Condiciones</h2>
          <div className="space-y-3">
            {quotation.terms && (
              <div>
                <p className="text-sm font-medium text-gray-500">Términos Generales</p>
                <p className="text-sm">{quotation.terms}</p>
              </div>
            )}
            {quotation.delivery_terms && (
              <div>
                <p className="text-sm font-medium text-gray-500">Términos de Entrega</p>
                <p className="text-sm">{quotation.delivery_terms}</p>
              </div>
            )}
            {quotation.payment_terms && (
              <div>
                <p className="text-sm font-medium text-gray-500">Términos de Pago</p>
                <p className="text-sm">{quotation.payment_terms}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}