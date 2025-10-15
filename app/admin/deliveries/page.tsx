'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'
import { 
  Search, 
  Truck, 
  MapPin,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Delivery {
  id: string
  order_id: string
  scheduled_date: string | null
  actual_delivery_date: string | null
  delivery_address: string
  delivery_instructions: string | null
  tracking_number: string | null
  carrier: string | null
  delivery_status: string
  delivered_to: string | null
  delivery_notes: string | null
  proof_of_delivery_url: string | null
  created_at: string
  updated_at: string
  documents?: {
    id: string
    folio: string
    contact_name: string
    total: number
    companies?: {
      name: string
    }
  }
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  useEffect(() => {
    fetchDeliveries()
  }, [currentPage, searchTerm, statusFilter])

  const fetchDeliveries = async () => {
    setIsLoading(true)
    
    try {
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          documents!deliveries_order_id_fkey(
            id,
            folio,
            contact_name,
            total,
            companies(name)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchTerm) {
        // Note: This is a simplified search - in production you'd want to join with documents table
        query = query.or(`tracking_number.ilike.%${searchTerm}%,carrier.ilike.%${searchTerm}%,delivered_to.ilike.%${searchTerm}%`)
      }

      if (statusFilter) {
        query = query.eq('delivery_status', statusFilter)
      }

      const { data, error, count } = await query

      if (error) throw error

      setDeliveries(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch deliveries'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (deliveryId: string, newStatus: string) => {
    try {
      const updates: any = { delivery_status: newStatus }
      
      if (newStatus === 'delivered') {
        updates.actual_delivery_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', deliveryId)

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: 'Delivery status updated successfully'
      })

      fetchDeliveries()
    } catch (error) {
      console.error('Error updating status:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update delivery status'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparing':
        return <Package className="w-4 h-4" />
      case 'in_transit':
        return <Truck className="w-4 h-4" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading && deliveries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-600 mt-1">
            Track and manage order deliveries
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
              placeholder="Search by tracking number, carrier, or recipient..."
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
            <option value="preparing">Preparing</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivered
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Truck className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {delivery.documents?.folio}
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery.documents?.companies?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {delivery.documents?.contact_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{delivery.delivery_address}</div>
                          {delivery.delivery_instructions && (
                            <div className="text-xs text-gray-500 mt-1">
                              {delivery.delivery_instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {delivery.tracking_number ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {delivery.tracking_number}
                          </div>
                          {delivery.carrier && (
                            <div className="text-gray-500">{delivery.carrier}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No tracking</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(delivery.delivery_status)}
                      <select
                        value={delivery.delivery_status}
                        onChange={(e) => handleStatusChange(delivery.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-green-500 ${
                          getStatusColor(delivery.delivery_status, 'delivery')
                        }`}
                      >
                        <option value="preparing">Preparing</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.scheduled_date ? (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(delivery.scheduled_date)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.actual_delivery_date ? (
                      <div>
                        <div>{formatDate(delivery.actual_delivery_date)}</div>
                        {delivery.delivered_to && (
                          <div className="text-xs text-gray-500">
                            To: {delivery.delivered_to}
                          </div>
                        )}
                      </div>
                    ) : delivery.delivery_status === 'delivered' ? (
                      <span className="text-green-600">Just delivered</span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
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
              {Math.min(currentPage * itemsPerPage, deliveries.length)} of{' '}
              {deliveries.length} deliveries
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
      {!isLoading && deliveries.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No deliveries found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter
              ? 'Try adjusting your search or filters'
              : 'Deliveries will appear here when orders are shipped'}
          </p>
        </div>
      )}
    </div>
  )
}