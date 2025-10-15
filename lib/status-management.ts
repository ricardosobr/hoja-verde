/**
 * Quotation Status Management Utilities
 * Handles status transitions, validation, and audit tracking
 */

import { createClient } from '@/lib/supabase'

export type QuotationStatus = 
  | 'draft' 
  | 'generated' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'expired' 
  | 'converted'

export interface StatusTransition {
  from: QuotationStatus
  to: QuotationStatus
  isValid: boolean
  reason?: string
}

export interface StatusHistoryEntry {
  id: string
  document_id: string
  status_type: 'quotation_status'
  old_status: QuotationStatus | null
  new_status: QuotationStatus
  changed_by: string
  changed_at: string
  reason?: string
  notes?: string
}

/**
 * Define valid status transitions
 */
const VALID_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  draft: ['generated'],
  generated: ['under_review', 'expired'],
  under_review: ['approved', 'rejected', 'expired'],
  approved: ['converted', 'expired'],
  rejected: ['generated'], // Allow regeneration after rejection
  expired: ['generated'], // Allow regeneration after expiry
  converted: [] // Final state - no transitions allowed
}

/**
 * Validate if a status transition is allowed
 */
export function validateStatusTransition(
  fromStatus: QuotationStatus, 
  toStatus: QuotationStatus
): StatusTransition {
  const validTransitions = VALID_TRANSITIONS[fromStatus] || []
  const isValid = validTransitions.includes(toStatus)
  
  let reason: string | undefined
  if (!isValid) {
    if (fromStatus === toStatus) {
      reason = 'Status is already set to this value'
    } else if (fromStatus === 'converted') {
      reason = 'Cannot change status of converted quotations'
    } else {
      reason = `Cannot transition from ${fromStatus} to ${toStatus}`
    }
  }

  return {
    from: fromStatus,
    to: toStatus,
    isValid,
    reason
  }
}

/**
 * Get all valid next statuses for a given current status
 */
export function getValidNextStatuses(currentStatus: QuotationStatus): QuotationStatus[] {
  return VALID_TRANSITIONS[currentStatus] || []
}

/**
 * Check if a quotation has expired based on its validity date
 */
export function isQuotationExpired(issueDate: string, validityDays: number): boolean {
  const issueDateTime = new Date(issueDate)
  const expiryDate = new Date(issueDateTime.getTime() + (validityDays * 24 * 60 * 60 * 1000))
  return new Date() > expiryDate
}

/**
 * Update quotation status with proper validation and audit tracking
 */
export async function updateQuotationStatus(
  documentId: string,
  newStatus: QuotationStatus,
  userId: string,
  reason?: string,
  notes?: string
): Promise<{
  success: boolean
  message: string
  statusHistory?: StatusHistoryEntry
}> {
  const supabase = createClient()

  try {
    // Get current quotation data
    const { data: quotation, error: fetchError } = await supabase
      .from('documents')
      .select('quotation_status, issue_date, validity_days')
      .eq('id', documentId)
      .eq('type', 'quotation')
      .single()

    if (fetchError) {
      return {
        success: false,
        message: 'Failed to fetch quotation data'
      }
    }

    const currentStatus = quotation.quotation_status as QuotationStatus
    
    // Validate transition
    const transition = validateStatusTransition(currentStatus, newStatus)
    if (!transition.isValid) {
      return {
        success: false,
        message: transition.reason || 'Invalid status transition'
      }
    }

    // Special handling for expired status
    if (newStatus === 'expired') {
      const isExpired = isQuotationExpired(quotation.issue_date, quotation.validity_days)
      if (!isExpired) {
        return {
          success: false,
          message: 'Cannot mark quotation as expired - validity period has not ended'
        }
      }
    }

    // Start transaction
    const { error: updateError } = await supabase.rpc('update_quotation_status', {
      p_document_id: documentId,
      p_new_status: newStatus,
      p_changed_by: userId,
      p_reason: reason,
      p_notes: notes
    })

    if (updateError) {
      // Fallback to manual update if RPC is not available
      console.warn('RPC function not available, using manual update')
      
      // Update document status
      const { error: docUpdateError } = await supabase
        .from('documents')
        .update({ quotation_status: newStatus })
        .eq('id', documentId)

      if (docUpdateError) {
        return {
          success: false,
          message: 'Failed to update quotation status'
        }
      }

      // Add status history entry
      const { data: historyEntry, error: historyError } = await supabase
        .from('status_history')
        .insert({
          document_id: documentId,
          status_type: 'quotation_status',
          old_status: currentStatus,
          new_status: newStatus,
          changed_by: userId,
          reason,
          notes
        })
        .select()
        .single()

      if (historyError) {
        console.warn('Failed to create status history entry:', historyError)
      }

      return {
        success: true,
        message: `Quotation status updated to ${newStatus}`,
        statusHistory: historyEntry
      }
    }

    return {
      success: true,
      message: `Quotation status updated to ${newStatus}`
    }

  } catch (error) {
    console.error('Error updating quotation status:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}

/**
 * Get status history for a quotation
 */
export async function getQuotationStatusHistory(
  documentId: string
): Promise<StatusHistoryEntry[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('status_history')
      .select(`
        *,
        users!status_history_changed_by_fkey(full_name, email)
      `)
      .eq('document_id', documentId)
      .eq('status_type', 'quotation_status')
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching status history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching status history:', error)
    return []
  }
}

/**
 * Auto-expire quotations that have passed their validity date
 */
export async function autoExpireQuotations(): Promise<{
  success: boolean
  expiredCount: number
  message: string
}> {
  const supabase = createClient()

  try {
    // Get quotations that should be expired
    const { data: quotations, error: fetchError } = await supabase
      .from('documents')
      .select('id, folio, issue_date, validity_days')
      .eq('type', 'quotation')
      .in('quotation_status', ['generated', 'under_review'])

    if (fetchError) {
      return {
        success: false,
        expiredCount: 0,
        message: 'Failed to fetch quotations for expiry check'
      }
    }

    const expiredQuotations = quotations.filter(q => 
      isQuotationExpired(q.issue_date, q.validity_days)
    )

    if (expiredQuotations.length === 0) {
      return {
        success: true,
        expiredCount: 0,
        message: 'No quotations to expire'
      }
    }

    // Update expired quotations
    const { error: updateError } = await supabase
      .from('documents')
      .update({ quotation_status: 'expired' })
      .in('id', expiredQuotations.map(q => q.id))

    if (updateError) {
      return {
        success: false,
        expiredCount: 0,
        message: 'Failed to update expired quotations'
      }
    }

    return {
      success: true,
      expiredCount: expiredQuotations.length,
      message: `${expiredQuotations.length} quotations marked as expired`
    }

  } catch (error) {
    console.error('Error in auto-expire process:', error)
    return {
      success: false,
      expiredCount: 0,
      message: 'An unexpected error occurred during expiry check'
    }
  }
}

/**
 * Get status summary statistics for dashboard
 */
export async function getStatusSummary(): Promise<{
  [key in QuotationStatus]: number
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('quotation_status')
      .eq('type', 'quotation')

    if (error) {
      console.error('Error fetching status summary:', error)
      return {
        draft: 0,
        generated: 0,
        under_review: 0,
        approved: 0,
        rejected: 0,
        expired: 0,
        converted: 0
      }
    }

    const summary = data.reduce((acc, doc) => {
      const status = doc.quotation_status as QuotationStatus
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<QuotationStatus, number>)

    return {
      draft: summary.draft || 0,
      generated: summary.generated || 0,
      under_review: summary.under_review || 0,
      approved: summary.approved || 0,
      rejected: summary.rejected || 0,
      expired: summary.expired || 0,
      converted: summary.converted || 0
    }

  } catch (error) {
    console.error('Error calculating status summary:', error)
    return {
      draft: 0,
      generated: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      converted: 0
    }
  }
}