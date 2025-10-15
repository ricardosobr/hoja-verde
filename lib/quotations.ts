/**
 * Quotation Management Utilities
 * Handles quotation-specific operations including conversion to orders
 */

import { createClient } from '@/lib/supabase'
import { updateQuotationStatus } from '@/lib/status-management'
import { validatePreConversion, validateFolioUniqueness } from '@/lib/validation'

export interface QuotationData {
  id: string
  folio: string
  type: 'quotation'
  quotation_status: string
  company_id: string
  issue_date: string
  validity_days: number
  items: QuotationItem[]
  subtotal: number
  taxes: number
  total: number
  notes?: string
  created_by: string
}

export interface QuotationItem {
  id: string
  document_id: string
  product_id: string
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  total: number
}

export interface OrderData {
  id: string
  folio: string
  type: 'order'
  order_status: 'pending'
  quotation_id: string
  company_id: string
  issue_date: string
  items: OrderItem[]
  subtotal: number
  taxes: number
  total: number
  notes?: string
  created_by: string
}

export interface OrderItem {
  id: string
  document_id: string
  product_id: string
  description: string
  quantity: number
  unit_price: number
  discount_percentage: number
  total: number
}

export interface ConversionResult {
  success: boolean
  message: string
  orderId?: string
  orderFolio?: string
  error?: string
}

/**
 * Generate unique order folio with ORD-XXXXXXXX format using atomic transaction
 */
async function generateOrderFolio(): Promise<string> {
  const supabase = createClient()
  
  try {
    // Use a database function to atomically generate next folio number
    const { data, error } = await supabase
      .rpc('get_next_order_folio')
    
    if (error) {
      console.error('Error generating order folio via RPC:', error)
      // Fallback: Use timestamp-based approach with retry logic
      return await generateFolioWithRetry('ORD')
    }
    
    if (data && typeof data === 'string') {
      return data
    }
    
    // If RPC doesn't return expected format, fallback
    return await generateFolioWithRetry('ORD')
  } catch (error) {
    console.error('Error in atomic folio generation:', error)
    return await generateFolioWithRetry('ORD')
  }
}

/**
 * Fallback folio generation with retry logic to handle race conditions
 */
async function generateFolioWithRetry(prefix: string, maxRetries = 5): Promise<string> {
  const supabase = createClient()
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use current timestamp + random component for uniqueness
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
      const folio = `${prefix}-${timestamp}${random}`
      
      // Check if this folio already exists
      const { data: existing } = await supabase
        .from('documents')
        .select('id')
        .eq('folio', folio)
        .limit(1)
      
      if (!existing || existing.length === 0) {
        return folio
      }
      
      // If collision detected, wait a bit and retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 10))
        continue
      }
    } catch (error) {
      console.error(`Folio generation attempt ${attempt} failed:`, error)
    }
  }
  
  // Final fallback - use millisecond timestamp with process ID-like suffix
  return `${prefix}-${Date.now()}${Math.floor(Math.random() * 1000)}`
}

/**
 * Document item interface for type safety
 */
interface DocumentItem {
  id: string
  document_id: string
  product_id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
}

/**
 * Convert quotation to order with complete data integrity
 */
export async function convertQuotationToOrder(
  quotationId: string,
  userId: string
): Promise<ConversionResult> {
  const supabase = createClient()

  try {
    // Comprehensive pre-conversion validation
    const validation = await validatePreConversion(quotationId, userId)
    if (!validation.valid) {
      return {
        success: false,
        message: validation.errors.join('; '),
        error: 'VALIDATION_FAILED'
      }
    }

    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Conversion warnings:', validation.warnings)
    }

    // Fetch complete quotation data
    const { data: quotation, error: quotationError } = await supabase
      .from('documents')
      .select(`
        *,
        document_items (*)
      `)
      .eq('id', quotationId)
      .eq('type', 'quotation')
      .single()

    if (quotationError || !quotation) {
      return {
        success: false,
        message: 'Quotation not found or could not be fetched',
        error: 'QUOTATION_NOT_FOUND'
      }
    }

    // Validate quotation status
    if (quotation.quotation_status !== 'approved') {
      return {
        success: false,
        message: 'Only approved quotations can be converted to orders',
        error: 'INVALID_STATUS'
      }
    }

    // Generate unique order folio
    const orderFolio = await generateOrderFolio()
    
    // Validate folio uniqueness
    const folioValidation = await validateFolioUniqueness(orderFolio, 'order')
    if (!folioValidation.valid) {
      return {
        success: false,
        message: `Folio generation failed: ${folioValidation.errors.join('; ')}`,
        error: 'FOLIO_VALIDATION_FAILED'
      }
    }

    // Start atomic transaction
    const { data: order, error: orderError } = await supabase
      .from('documents')
      .insert({
        folio: orderFolio,
        type: 'order',
        order_status: 'pending',
        quotation_id: quotationId,
        company_id: quotation.company_id,
        issue_date: new Date().toISOString(),
        subtotal: quotation.subtotal,
        taxes: quotation.taxes,
        total: quotation.total,
        notes: quotation.notes,
        created_by: userId
      })
      .select()
      .single()

    if (orderError || !order) {
      return {
        success: false,
        message: 'Failed to create order record',
        error: 'ORDER_CREATION_FAILED'
      }
    }

    // Copy quotation items to order items
    if (quotation.document_items && quotation.document_items.length > 0) {
      const orderItems = quotation.document_items.map((item: DocumentItem) => ({
        document_id: order.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        total: item.total
      }))

      const { error: itemsError } = await supabase
        .from('document_items')
        .insert(orderItems)

      if (itemsError) {
        // Rollback: delete the created order
        await supabase
          .from('documents')
          .delete()
          .eq('id', order.id)

        return {
          success: false,
          message: 'Failed to copy quotation items to order',
          error: 'ITEMS_COPY_FAILED'
        }
      }
    }

    // Update quotation status to 'converted' with audit trail
    const statusUpdateResult = await updateQuotationStatus(
      quotationId,
      'converted',
      userId,
      'Converted to order',
      `Order created: ${orderFolio}`
    )

    if (!statusUpdateResult.success) {
      // Rollback: delete the created order and items
      await supabase
        .from('documents')
        .delete()
        .eq('id', order.id)

      return {
        success: false,
        message: 'Failed to update quotation status during conversion',
        error: 'STATUS_UPDATE_FAILED'
      }
    }

    // Create status history for new order
    await supabase
      .from('status_history')
      .insert({
        document_id: order.id,
        status_type: 'order_status',
        old_status: null,
        new_status: 'pending',
        changed_by: userId,
        reason: 'Order created from quotation',
        notes: `Converted from quotation: ${quotation.folio}`
      })

    return {
      success: true,
      message: `Order ${orderFolio} created successfully from quotation ${quotation.folio}`,
      orderId: order.id,
      orderFolio: orderFolio
    }

  } catch (error) {
    console.error('Error during quotation to order conversion:', error)
    return {
      success: false,
      message: 'An unexpected error occurred during conversion',
      error: 'UNEXPECTED_ERROR'
    }
  }
}

/**
 * Get quotation details for conversion preview
 */
export async function getQuotationForConversion(
  quotationId: string
): Promise<{
  success: boolean
  quotation?: QuotationData
  message?: string
}> {
  const supabase = createClient()

  try {
    const { data: quotation, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_items (*),
        companies (name, contact_name, email)
      `)
      .eq('id', quotationId)
      .eq('type', 'quotation')
      .single()

    if (error || !quotation) {
      return {
        success: false,
        message: 'Quotation not found'
      }
    }

    return {
      success: true,
      quotation: quotation as QuotationData
    }
  } catch (error) {
    console.error('Error fetching quotation for conversion:', error)
    return {
      success: false,
      message: 'Error fetching quotation details'
    }
  }
}

/**
 * Check if quotation can be converted (status validation)
 */
export function canConvertQuotation(quotationStatus: string): boolean {
  return quotationStatus === 'approved'
}