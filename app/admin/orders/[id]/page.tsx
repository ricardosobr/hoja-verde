'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { 
  getOrderById, 
  updateOrderStatus, 
  getOrderStatusHistory,
  getValidNextOrderStatuses,
  getOrderStatusDisplay,
  OrderStatus
} from '@/lib/orders'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  ArrowLeft,
  Package,
  User,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  Mail,
  Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Order {
  id: string
  folio: string
  type: 'order'
  order_status: OrderStatus
  quotation_id: string | null
  company_id: string
  issue_date: string
  subtotal: number
  taxes: number
  total: number
  notes?: string
  created_by: string
  document_items: OrderItem[]
  companies: {
    name: string
    contact_name: string
    email: string
    phone?: string
  }
  quotation?: {
    folio: string
    issue_date: string
  }
}

interface OrderItem {
  id: string
  product_id: string
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  total: number
}

interface StatusHistoryEntry {
  id: string
  old_status: OrderStatus | null
  new_status: OrderStatus
  changed_by: string
  changed_at: string
  reason?: string
  notes?: string
  users: {
    full_name: string
    email: string
  }
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = resolvedParams.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  useEffect(() => {
    if (orderId) {
      fetchOrderData()
    }
  }, [orderId])

  const fetchOrderData = async () => {
    setIsLoading(true)
    
    try {
      // Fetch order details
      const orderResult = await getOrderById(orderId)
      if (!orderResult.success) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: orderResult.message || 'Failed to fetch order details'
        })
        return
      }

      setOrder(orderResult.order)

      // Fetch status history
      const history = await getOrderStatusHistory(orderId)
      setStatusHistory(history)

    } catch (error) {
      console.error('Error fetching order data:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: OrderStatus, reason?: string) => {
    if (!order) return

    setIsUpdatingStatus(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'You must be logged in to update order status'
        })
        return
      }

      const result = await updateOrderStatus(
        orderId,
        newStatus,
        user.id,
        reason,
        `Status changed from ${order.order_status} to ${newStatus}`
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: result.message
        })
        
        // Refresh order data
        await fetchOrderData()
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.message
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred while updating status'
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusActions = (currentStatus: OrderStatus) => {
    const validNextStatuses = getValidNextOrderStatuses(currentStatus)
    
    return validNextStatuses.map(status => {
      const display = getOrderStatusDisplay(status)
      return {
        status,
        label: display.label,
        action: getStatusActionText(status)
      }
    })
  }

  const getStatusActionText = (status: OrderStatus): string => {
    switch (status) {
      case 'confirmed': return 'Confirmar Orden'
      case 'in_progress': return 'Iniciar Proceso'
      case 'ready': return 'Marcar Lista'
      case 'shipped': return 'Enviar'
      case 'delivered': return 'Marcar Entregada'
      case 'cancelled': return 'Cancelar'
      default: return `Cambiar a ${status}`
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
        
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Orden no encontrada
          </h3>
          <p className="text-gray-600">
            La orden solicitada no existe o no tienes permisos para verla.
          </p>
        </div>
      </div>
    )
  }

  const statusDisplay = getOrderStatusDisplay(order.order_status)
  const statusActions = getStatusActions(order.order_status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            {/* Breadcrumb Navigation */}
            {order.quotation && (
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <button
                  onClick={() => router.push(`/admin/quotations/${order.quotation_id}`)}
                  className="hover:text-blue-600 flex items-center space-x-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>Cotización {order.quotation.folio}</span>
                </button>
                <span>→</span>
                <span className="text-gray-900 font-medium flex items-center space-x-1">
                  <Package className="w-3 h-3" />
                  <span>Orden {order.folio}</span>
                </span>
              </nav>
            )}
            
            <h1 className="text-3xl font-bold text-gray-900">
              Orden {order.folio}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                {statusDisplay.label}
              </span>
              {order.quotation && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Generada desde cotización:</span>
                  <button
                    onClick={() => router.push(`/admin/quotations/${order.quotation_id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {order.quotation.folio}
                  </button>
                  <span className="text-xs text-gray-500">
                    ({formatDate(order.quotation.issue_date)})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {statusActions.map(action => (
            <Button
              key={action.status}
              onClick={() => handleStatusUpdate(action.status)}
              disabled={isUpdatingStatus}
              className="bg-green-600 hover:bg-green-700"
            >
              {action.action}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información de la Orden
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Folio</p>
                  <p className="text-sm text-gray-600">{order.folio}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Fecha de Emisión</p>
                  <p className="text-sm text-gray-600">{formatDate(order.issue_date)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Empresa</p>
                  <p className="text-sm text-gray-600">{order.companies.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Contacto</p>
                  <p className="text-sm text-gray-600">{order.companies.contact_name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{order.companies.email}</p>
                </div>
              </div>
              
              {order.companies.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Teléfono</p>
                    <p className="text-sm text-gray-600">{order.companies.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Document Relationship Section */}
            {order.quotation && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Trazabilidad del Documento</h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Cotización Original: {order.quotation.folio}
                        </p>
                        <p className="text-xs text-blue-700">
                          Emitida el {formatDate(order.quotation.issue_date)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/quotations/${order.quotation_id}`)}
                      className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Ver Cotización
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {order.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notas</h4>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Artículos de la Orden
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descuento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.document_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {item.discount_percentage}%
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos:</span>
                  <span className="text-gray-900">{formatCurrency(order.taxes)}</span>
                </div>
                <div className="flex justify-between text-lg font-medium border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status History Sidebar */}
        <div className="space-y-6">
          {order.quotation && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ciclo de Vida del Documento
              </h3>
              
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      Cotización Creada
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.quotation.folio}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(order.quotation.issue_date)}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      Cotización Aprobada
                    </div>
                    <div className="text-xs text-gray-500">
                      Lista para conversión a orden
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      Orden Generada
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.folio}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(order.issue_date)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Historial de Estados de la Orden
            </h3>
            
            <div className="space-y-4">
              {statusHistory.map((entry, index) => (
                <div key={entry.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.old_status ? 
                        `${getOrderStatusDisplay(entry.old_status).label} → ${getOrderStatusDisplay(entry.new_status).label}` :
                        `Estado inicial: ${getOrderStatusDisplay(entry.new_status).label}`
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.users.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(entry.changed_at)}
                    </div>
                    {entry.reason && (
                      <div className="text-xs text-gray-600 mt-1">
                        {entry.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}