'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateQuotationStatus, QuotationStatus } from '@/lib/status-management'
import { StatusSelector } from '@/components/admin/quotations/status-badge'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

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
  total: number
  created_at: string
  companies?: {
    name: string
  }
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  useEffect(() => {
    fetchQuotations()
  }, [currentPage, searchTerm, statusFilter])

  const fetchQuotations = async () => {
    setIsLoading(true)
    
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          companies(name)
        `, { count: 'exact' })
        .eq('type', 'quotation')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchTerm) {
        query = query.or(`folio.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`)
      }

      if (statusFilter) {
        query = query.eq('quotation_status', statusFilter)
      }

      const { data, error, count } = await query

      if (error) throw error

      setQuotations(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching quotations:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch quotations'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (quotationId: string, newStatus: QuotationStatus) => {
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) {
        throw new Error('User not authenticated')
      }

      const result = await updateQuotationStatus(
        quotationId, 
        newStatus, 
        user.data.user.id,
        'Status changed via admin interface'
      )

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: result.message
        })
        fetchQuotations()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update quotation status'
      })
    }
  }

  const handleDelete = async (quotation: Document) => {
    if (!confirm(`Are you sure you want to delete quotation ${quotation.folio}?`)) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', quotation.id)

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'Quotation Deleted',
        message: `Quotation ${quotation.folio} has been deleted`
      })

      fetchQuotations()
    } catch (error) {
      console.error('Error deleting quotation:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete quotation'
      })
    }
  }

  if (isLoading && quotations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all customer quotations
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => window.location.href = '/admin/quotations/create'}
            className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search quotations by folio, client, or email..."
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
            <option value="draft">Draft</option>
            <option value="generated">Generated</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quotation
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
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotations.map((quotation) => (
                <tr key={quotation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {quotation.folio}
                        </div>
                        <div className="text-sm text-gray-500">
                          {quotation.companies?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{quotation.contact_name}</div>
                    <div className="text-sm text-gray-500">{quotation.contact_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(quotation.total)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Subtotal: {formatCurrency(quotation.subtotal)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusSelector
                      currentStatus={quotation.quotation_status || 'draft'}
                      onStatusChange={(newStatus) => handleStatusChange(quotation.id, newStatus)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(quotation.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(quotation.expiry_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/quotations/${quotation.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/admin/quotations/${quotation.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(quotation)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
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
              {Math.min(currentPage * itemsPerPage, quotations.length)} of{' '}
              {quotations.length} quotations
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
      {!isLoading && quotations.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No quotations found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first quotation'}
          </p>
          <Button
            onClick={() => window.location.href = '/admin/quotations/create'}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quotation
          </Button>
        </div>
      )}
    </div>
  )
}