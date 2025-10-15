'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '@/lib/utils'
import { 
  Search, 
  Eye, 
  Edit, 
  Truck,
  ShoppingCart,
  CheckCircle,
  Clock,
  Package,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  quotation_status: string | null
  order_status: string | null
  delivery_status: string | null
  subtotal: number
  tax_amount: number
  total: number
  created_at: string
  quotation_id: string | null
  companies?: {
    name: string
  }
  deliveries?: {
    id: string
    scheduled_date: string | null
    delivery_address: string
    tracking_number: string | null
    carrier: string | null
    delivery_status: string
  }[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchTerm, statusFilter])

  const fetchOrders = async () => {
    setIsLoading(true)
    
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          companies(name),
          deliveries(
            id,
            scheduled_date,
            delivery_address,
            tracking_number,
            carrier,
            delivery_status
          )
        `, { count: 'exact' })
        .eq('type', 'order')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchTerm) {
        query = query.or(`folio.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`)
      }

      if (statusFilter) {
        query = query.eq('order_status', statusFilter)
      }

      const { data, error, count } = await query

      if (error) throw error

      setOrders(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching orders:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch orders'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ order_status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: 'Order status updated successfully'
      })

      fetchOrders()
    } catch (error) {
      console.error('Error updating status:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update order status'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'in_progress':
        return <Package className="w-4 h-4" />
      case 'ready':
        return <Package className="w-4 h-4" />
      case 'shipped':
        return <Truck className="w-4 h-4" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <ShoppingCart className="w-4 h-4" />
    }
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">
            Track and manage customer orders and deliveries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search orders by folio, client, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="ready">Ready</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ShoppingCart className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.folio}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.companies?.name}
                        </div>
                        {order.quotation_id && (
                          <div className="text-xs text-blue-600">
                            From quotation
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.contact_name}</div>
                    <div className="text-sm text-gray-500">{order.contact_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Subtotal: {formatCurrency(order.subtotal)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.order_status || '')}
                      <select
                        value={order.order_status || ''}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-green-500 ${
                          getStatusColor(order.order_status || '', 'order')
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="ready">Ready</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.deliveries && order.deliveries.length > 0 ? (
                      <div className="text-sm">
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatusColor(order.deliveries[0].delivery_status, 'delivery')
                        }`}>
                          {getStatusText(order.deliveries[0].delivery_status, 'delivery')}
                        </div>
                        {order.deliveries[0].tracking_number && (
                          <div className="text-xs text-gray-500 mt-1">
                            Track: {order.deliveries[0].tracking_number}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No delivery info</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/orders/${order.id}/delivery`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Truck className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, orders.length)} of{' '}
              {orders.length} orders
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && orders.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No orders found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter
              ? 'Try adjusting your search or filters'
              : 'Orders will appear here once quotations are converted'}
          </p>
        </div>
      )}
    </div>
  )
}