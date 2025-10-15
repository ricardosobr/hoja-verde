'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { getStatusLabel, getStatusBadgeColor } from '@/lib/client-quotations'
import { Calendar, User, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Database } from '@/lib/supabase'

interface StatusHistoryEntry {
  id: string
  document_id: string
  status: string
  changed_at: string
  changed_by: string
  user_name?: string
  comment?: string
}

interface QuotationStatusHistoryProps {
  quotationId: string
}

export function QuotationStatusHistory({ quotationId }: QuotationStatusHistoryProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        // For now, we'll mock the history since we don't have the full implementation
        // In a real implementation, this would fetch from status_history table
        const mockHistory: StatusHistoryEntry[] = [
          {
            id: '1',
            document_id: quotationId,
            status: 'draft',
            changed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            changed_by: 'system',
            user_name: 'Sistema',
            comment: 'Cotización creada'
          },
          {
            id: '2',
            document_id: quotationId,
            status: 'generated',
            changed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            changed_by: 'admin',
            user_name: 'Admin Usuario',
            comment: 'Cotización generada y enviada al cliente'
          }
        ]
        
        setHistory(mockHistory.reverse()) // Most recent first
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading history')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [quotationId])


  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay historial disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <div key={entry.id} className="relative">
          {/* Timeline line */}
          {index < history.length - 1 && (
            <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200"></div>
          )}
          
          <div className="flex space-x-3">
            {/* Status badge as timeline marker */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full ${
                  entry.status === 'draft' ? 'bg-gray-400' :
                  entry.status === 'generated' ? 'bg-blue-500' :
                  entry.status === 'in_review' ? 'bg-yellow-500' :
                  entry.status === 'approved' ? 'bg-green-500' :
                  entry.status === 'rejected' ? 'bg-red-500' :
                  entry.status === 'converted' ? 'bg-purple-500' :
                  'bg-gray-400'
                }`}></div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge 
                  className={`text-xs px-2 py-1 ${getStatusBadgeColor(entry.status as Database['public']['Enums']['quotation_status'])}`}
                  variant="outline"
                >
                  {getStatusLabel(entry.status as Database['public']['Enums']['quotation_status'])}
                </Badge>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(entry.changed_at)}
                </div>
              </div>
              
              {entry.user_name && (
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <User className="h-3 w-3 mr-1" />
                  {entry.user_name}
                </div>
              )}

              {entry.comment && (
                <p className="text-xs text-gray-700 bg-gray-50 rounded p-2">
                  {entry.comment}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

