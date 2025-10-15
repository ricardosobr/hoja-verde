/**
 * Order Status Management Utilities
 * Handles order status transitions, validation, and workflow management
 */

import { createClient } from '@/lib/supabase'

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'in_progress' 
  | 'ready' 
  | 'shipped' 
  | 'delivered'
  | 'cancelled'

export interface OrderStatusTransition {
  from: OrderStatus
  to: OrderStatus
  isValid: boolean
  reason?: string
}

export interface OrderStatusHistoryEntry {
  id: string
  document_id: string
  status_type: 'order_status'
  old_status: OrderStatus | null
  new_status: OrderStatus
  changed_by: string
  changed_at: string
  reason?: string
  notes?: string
}

export interface OrderDetails {
  id: string
  type: 'order'
  folio: string
  issue_date: string
  valid_until: string
  order_status: OrderStatus
  total_amount: number
  notes?: string
  quotation_id: string
  company_id: string
  created_by: string
  created_at: string
  updated_at: string
  document_items: OrderItem[]
  companies: {
    name: string
    contact_name: string
    email: string
    phone: string
  }
  quotation: {
    folio: string
    issue_date: string
  }
}

export interface OrderItem {
  id: string
  document_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  description: string
  created_at: string
}

export interface OrderListItem {
  id: string
  folio: string
  issue_date: string
  order_status: OrderStatus
  total_amount: number
  companies: {
    name: string
    contact_name: string
  }
  quotation: {
    folio: string
  }
}

/**
 * Define valid order status transitions
 */
const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // Final state - no transitions allowed
  cancelled: [] // Final state - no transitions allowed
}

/**
 * Validate if an order status transition is allowed
 */
export function validateOrderStatusTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): OrderStatusTransition {
  const validTransitions = VALID_ORDER_TRANSITIONS[fromStatus] || []
  const isValid = validTransitions.includes(toStatus)
  
  let reason: string | undefined
  if (!isValid) {
    if (fromStatus === toStatus) {
      reason = 'Status is already set to this value'
    } else if (fromStatus === 'delivered' || fromStatus === 'cancelled') {
      reason = `Cannot change status of ${fromStatus} orders`
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
 * Get all valid next statuses for a given current order status
 */
export function getValidNextOrderStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return VALID_ORDER_TRANSITIONS[currentStatus] || []
}

/**
 * Update order status with proper validation and audit tracking
 */
export async function updateOrderStatus(
  documentId: string,
  newStatus: OrderStatus,
  userId: string,
  reason?: string,
  notes?: string
): Promise<{
  success: boolean
  message: string
  statusHistory?: OrderStatusHistoryEntry
}> {
  const supabase = createClient()

  try {
    // Verify authentication and get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return {
        success: false,
        message: 'Authentication failed - unauthorized user'
      }
    }

    // Get current order data and user role
    const [orderResult, userResult] = await Promise.all([
      supabase
        .from('documents')
        .select('order_status, folio')
        .eq('id', documentId)
        .eq('type', 'order')
        .single(),
      supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
    ])

    if (orderResult.error) {
      return {
        success: false,
        message: 'Failed to fetch order data'
      }
    }

    const currentStatus = orderResult.data.order_status as OrderStatus
    const userRole = userResult.data?.role
    
    // Validate transition with business rules
    const businessValidation = validateOrderStatusTransition(currentStatus, newStatus, userRole)
    if (!businessValidation.valid) {
      return {
        success: false,
        message: businessValidation.errors.join('; ')
      }
    }

    // Log warnings if any
    if (businessValidation.warnings && businessValidation.warnings.length > 0) {
      console.warn('Order status update warnings:', businessValidation.warnings)
    }

    // Validate transition with base status logic
    const transition = validateOrderStatusTransition(currentStatus, newStatus)
    if (!transition.isValid) {
      return {
        success: false,
        message: transition.reason || 'Invalid status transition'
      }
    }

    // Start transaction - update order status
    const { error: updateError } = await supabase
      .from('documents')
      .update({ order_status: newStatus })
      .eq('id', documentId)

    if (updateError) {
      return {
        success: false,
        message: 'Failed to update order status'
      }
    }

    // Add status history entry
    const { data: historyEntry, error: historyError } = await supabase
      .from('status_history')
      .insert({
        document_id: documentId,
        status_type: 'order_status',
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
      message: `Order ${orderResult.data.folio} status updated to ${newStatus}`,
      statusHistory: historyEntry
    }

  } catch (error) {
    console.error('Error updating order status:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}

/**
 * Get status history for an order
 */
export async function getOrderStatusHistory(
  documentId: string
): Promise<OrderStatusHistoryEntry[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('status_history')
      .select(`
        *,
        users!status_history_changed_by_fkey(full_name, email)
      `)
      .eq('document_id', documentId)
      .eq('status_type', 'order_status')
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching order status history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching order status history:', error)
    return []
  }
}

/**
 * Get order summary statistics for dashboard
 */
export async function getOrderStatusSummary(): Promise<{
  [key in OrderStatus]: number
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('order_status')
      .eq('type', 'order')

    if (error) {
      console.error('Error fetching order status summary:', error)
      return {
        pending: 0,
        confirmed: 0,
        in_progress: 0,
        ready: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      }
    }

    const summary = data.reduce((acc, doc) => {
      const status = doc.order_status as OrderStatus
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<OrderStatus, number>)

    return {
      pending: summary.pending || 0,
      confirmed: summary.confirmed || 0,
      in_progress: summary.in_progress || 0,
      ready: summary.ready || 0,
      shipped: summary.shipped || 0,
      delivered: summary.delivered || 0,
      cancelled: summary.cancelled || 0
    }

  } catch (error) {
    console.error('Error calculating order status summary:', error)
    return {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      ready: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    }
  }
}

/**
 * Get order details with full information
 */
export async function getOrderById(orderId: string): Promise<{
  success: boolean
  order?: OrderDetails
  message?: string
}> {
  const supabase = createClient()

  try {
    const { data: order, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_items (*),
        companies (name, contact_name, email, phone),
        quotation:documents!documents_quotation_id_fkey (folio, issue_date)
      `)
      .eq('id', orderId)
      .eq('type', 'order')
      .single()

    if (error || !order) {
      return {
        success: false,
        message: 'Order not found'
      }
    }

    return {
      success: true,
      order
    }
  } catch (error) {
    console.error('Error fetching order details:', error)
    return {
      success: false,
      message: 'Error fetching order details'
    }
  }
}

/**
 * Get orders list with filtering and pagination
 */
export async function getOrdersList(params: {
  status?: OrderStatus
  search?: string
  page?: number
  limit?: number
}): Promise<{
  success: boolean
  orders: OrderListItem[]
  totalCount: number
  message?: string
}> {
  const supabase = createClient()
  const { status, search, page = 1, limit = 10 } = params
  
  try {
    let query = supabase
      .from('documents')
      .select(`
        *,
        companies (name, contact_name),
        quotation:documents!documents_quotation_id_fkey (folio)
      `, { count: 'exact' })
      .eq('type', 'order')

    if (status) {
      query = query.eq('order_status', status)
    }

    if (search) {
      // Use proper Supabase filtering to prevent SQL injection
      // Escape SQL wildcards and special characters
      const sanitizedSearch = search.replace(/[%_\\'"]/g, '')
      query = query.or(`folio.ilike.%${sanitizedSearch}%,companies.name.ilike.%${sanitizedSearch}%`)
    }

    const { data: orders, error, count } = await query
      .order('issue_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      return {
        success: false,
        orders: [],
        totalCount: 0,
        message: 'Error fetching orders list'
      }
    }

    return {
      success: true,
      orders: orders || [],
      totalCount: count || 0
    }
  } catch (error) {
    console.error('Error fetching orders list:', error)
    return {
      success: false,
      orders: [],
      totalCount: 0,
      message: 'Error fetching orders list'
    }
  }
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(orderStatus: OrderStatus): boolean {
  return ['pending', 'confirmed', 'in_progress', 'ready'].includes(orderStatus)
}

/**
 * Get status display information
 */
export function getOrderStatusDisplay(status: OrderStatus): {
  label: string
  color: string
  bgColor: string
} {
  const statusMap = {
    pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    confirmed: { label: 'Confirmada', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    in_progress: { label: 'En Proceso', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    ready: { label: 'Lista', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    shipped: { label: 'Enviada', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    delivered: { label: 'Entregada', color: 'text-green-700', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' }
  }

  return statusMap[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' }
}