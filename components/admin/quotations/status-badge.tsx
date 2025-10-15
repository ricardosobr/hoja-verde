'use client'

import { cn } from '@/lib/utils'
import { 
  Clock, 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RotateCcw 
} from 'lucide-react'

export type QuotationStatus = 
  | 'draft' 
  | 'generated' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'expired' 
  | 'converted'

interface StatusBadgeProps {
  status: QuotationStatus | string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: FileText,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Being created'
  },
  generated: {
    label: 'Generated',
    icon: Eye,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Sent to client'
  },
  under_review: {
    label: 'Under Review',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Client is reviewing'
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200',
    description: 'Client approved'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
    description: 'Client rejected'
  },
  expired: {
    label: 'Expired',
    icon: AlertCircle,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    description: 'Past validity date'
  },
  converted: {
    label: 'Converted',
    icon: RotateCcw,
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Converted to order'
  }
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base'
}

export function StatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md', 
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status as QuotationStatus] || {
    label: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: AlertCircle,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Unknown status'
  }

  const IconComponent = config.icon

  return (
    <span 
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        sizeClasses[size],
        config.className,
        className
      )}
      title={config.description}
    >
      {showIcon && <IconComponent className="w-3 h-3 mr-1" />}
      {config.label}
    </span>
  )
}

export function getStatusColor(status: string): string {
  const config = statusConfig[status as QuotationStatus]
  return config?.className || 'bg-gray-100 text-gray-800 border-gray-200'
}

export function getStatusText(status: string): string {
  const config = statusConfig[status as QuotationStatus]
  return config?.label || status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function getStatusDescription(status: string): string {
  const config = statusConfig[status as QuotationStatus]
  return config?.description || 'Unknown status'
}

export function getValidStatusTransitions(currentStatus: QuotationStatus): QuotationStatus[] {
  const transitions: Record<QuotationStatus, QuotationStatus[]> = {
    draft: ['generated'],
    generated: ['under_review', 'expired'],
    under_review: ['approved', 'rejected', 'expired'],
    approved: ['converted', 'expired'],
    rejected: ['generated'], // Can regenerate after rejection
    expired: ['generated'], // Can regenerate after expiry
    converted: [] // Final state
  }

  return transitions[currentStatus] || []
}

interface StatusSelectorProps {
  currentStatus: QuotationStatus | string
  onStatusChange: (newStatus: QuotationStatus) => void
  disabled?: boolean
  className?: string
}

export function StatusSelector({ 
  currentStatus, 
  onStatusChange, 
  disabled = false,
  className 
}: StatusSelectorProps) {
  const validTransitions = getValidStatusTransitions(currentStatus as QuotationStatus)
  
  if (validTransitions.length === 0) {
    return <StatusBadge status={currentStatus} />
  }

  return (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(e.target.value as QuotationStatus)}
      disabled={disabled}
      className={cn(
        'text-xs font-semibold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-green-500',
        getStatusColor(currentStatus),
        'cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <option value={currentStatus}>
        {getStatusText(currentStatus)}
      </option>
      {validTransitions.map((status) => (
        <option key={status} value={status}>
          {getStatusText(status)}
        </option>
      ))}
    </select>
  )
}