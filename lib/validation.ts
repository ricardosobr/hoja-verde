/**
 * Application-level validation utilities
 * Complements database constraints with business logic validation
 */

import { createClient } from '@/lib/supabase'
import { QuotationStatus } from '@/lib/status-management'
import { OrderStatus } from '@/lib/orders'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Validate quotation-to-order conversion constraints
 */
export async function validateQuotationConversion(
  quotationId: string,
  userId: string
): Promise<ValidationResult> {
  const supabase = createClient()
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Check quotation exists and user has access
    const { data: quotation, error: quotationError } = await supabase
      .from('documents')
      .select('quotation_status, type, folio, total, company_id')
      .eq('id', quotationId)
      .eq('type', 'quotation')
      .single()

    if (quotationError || !quotation) {
      errors.push('Quotation not found or access denied')
      return { valid: false, errors, warnings }
    }

    // Validate quotation status
    if (quotation.quotation_status !== 'approved') {
      errors.push('Only approved quotations can be converted to orders')
    }

    // Check if quotation is already converted
    if (quotation.quotation_status === 'converted') {
      errors.push('Quotation has already been converted to an order')
    }

    // Check for existing order with same quotation_id
    const { data: existingOrder, error: orderCheckError } = await supabase
      .from('documents')
      .select('id, folio')
      .eq('quotation_id', quotationId)
      .eq('type', 'order')
      .maybeSingle()

    if (orderCheckError) {
      errors.push('Error checking for existing order')
    } else if (existingOrder) {
      errors.push(`Order ${existingOrder.folio} already exists for this quotation`)
    }

    // Validate quotation has items
    const { data: items, error: itemsError } = await supabase
      .from('document_items')
      .select('id')
      .eq('document_id', quotationId)
      .limit(1)

    if (itemsError) {
      warnings.push('Unable to verify quotation items')
    } else if (!items || items.length === 0) {
      errors.push('Quotation must have at least one item to convert to order')
    }

    // Validate user permissions for order creation
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      errors.push('Invalid user authentication')
    }

    // Check user role (should be admin for order creation)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      warnings.push('Unable to verify user permissions')
    } else if (userData.role !== 'admin') {
      errors.push('Only admin users can convert quotations to orders')
    }

    // Business logic validations
    if (quotation.total <= 0) {
      errors.push('Quotation total must be greater than zero')
    }

    // Check company status
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('status')
      .eq('id', quotation.company_id)
      .single()

    if (companyError || !company) {
      warnings.push('Unable to verify company status')
    } else if (company.status !== 'active') {
      warnings.push('Company is not active - consider verifying before processing order')
    }

  } catch (error) {
    console.error('Error validating quotation conversion:', error)
    errors.push('Unexpected error during validation')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Validate order status transition constraints
 */
export function validateOrderStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  userRole?: string
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if user has permission for this status change
  if (userRole && userRole !== 'admin') {
    // Clients can only view, not change order status
    errors.push('Only admin users can change order status')
  }

  // Business logic for specific transitions
  if (currentStatus === 'delivered' && newStatus !== 'delivered') {
    errors.push('Cannot change status of delivered orders')
  }

  if (currentStatus === 'cancelled' && newStatus !== 'cancelled') {
    errors.push('Cannot change status of cancelled orders')
  }

  // Validate shipping requirements
  if (newStatus === 'shipped' && currentStatus !== 'ready') {
    warnings.push('Orders should typically be marked as ready before shipping')
  }

  // Validate completion requirements
  if (newStatus === 'delivered' && currentStatus !== 'shipped') {
    warnings.push('Orders should typically be shipped before marking as delivered')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Validate folio uniqueness across document types
 */
export async function validateFolioUniqueness(
  folio: string,
  documentType: 'quotation' | 'order'
): Promise<ValidationResult> {
  const supabase = createClient()
  const errors: string[] = []

  try {
    // Check if folio already exists
    const { data: existing, error } = await supabase
      .from('documents')
      .select('id, type, folio')
      .eq('folio', folio)
      .maybeSingle()

    if (error) {
      errors.push('Error checking folio uniqueness')
    } else if (existing) {
      errors.push(`Folio ${folio} already exists for ${existing.type}`)
    }

    // Validate folio format
    const quotationPattern = /^COT-\d{8}$/
    const orderPattern = /^ORD-\d{8}$/

    if (documentType === 'quotation' && !quotationPattern.test(folio)) {
      errors.push('Quotation folio must follow format COT-XXXXXXXX')
    } else if (documentType === 'order' && !orderPattern.test(folio)) {
      errors.push('Order folio must follow format ORD-XXXXXXXX')
    }

  } catch (error) {
    console.error('Error validating folio uniqueness:', error)
    errors.push('Unexpected error validating folio')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate document data integrity before conversion
 */
export async function validateDocumentDataIntegrity(
  documentId: string
): Promise<ValidationResult> {
  const supabase = createClient()
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Get document with items
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        document_items (*)
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      errors.push('Document not found')
      return { valid: false, errors, warnings }
    }

    // Validate required fields
    if (!document.folio || document.folio.trim() === '') {
      errors.push('Document folio is required')
    }

    if (!document.company_id) {
      errors.push('Company ID is required')
    }

    if (!document.issue_date) {
      errors.push('Issue date is required')
    }

    // Validate totals consistency
    if (document.total <= 0) {
      errors.push('Document total must be greater than zero')
    }

    if (document.subtotal <= 0) {
      errors.push('Document subtotal must be greater than zero')
    }

    // Validate items
    if (!document.document_items || document.document_items.length === 0) {
      errors.push('Document must have at least one item')
    } else {
      // Calculate totals from items and verify consistency
      let calculatedSubtotal = 0
      let calculatedTaxes = 0

      for (const item of document.document_items) {
        if (item.quantity <= 0) {
          errors.push(`Item "${item.description}" has invalid quantity`)
        }
        if (item.unit_price <= 0) {
          errors.push(`Item "${item.description}" has invalid unit price`)
        }
        if (item.total <= 0) {
          errors.push(`Item "${item.description}" has invalid total`)
        }

        calculatedSubtotal += item.subtotal || 0
        calculatedTaxes += item.tax || 0
      }

      // Allow for small rounding differences
      const tolerance = 0.01
      if (Math.abs(calculatedSubtotal - document.subtotal) > tolerance) {
        warnings.push('Calculated subtotal does not match document subtotal')
      }

      if (Math.abs(calculatedTaxes - document.taxes) > tolerance) {
        warnings.push('Calculated taxes do not match document taxes')
      }
    }

  } catch (error) {
    console.error('Error validating document data integrity:', error)
    errors.push('Unexpected error during data validation')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Comprehensive pre-conversion validation
 */
export async function validatePreConversion(
  quotationId: string,
  userId: string
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Run all validations
  const [
    conversionValidation,
    dataIntegrityValidation
  ] = await Promise.all([
    validateQuotationConversion(quotationId, userId),
    validateDocumentDataIntegrity(quotationId)
  ])

  // Combine results
  errors.push(...conversionValidation.errors)
  errors.push(...dataIntegrityValidation.errors)

  if (conversionValidation.warnings) {
    warnings.push(...conversionValidation.warnings)
  }
  if (dataIntegrityValidation.warnings) {
    warnings.push(...dataIntegrityValidation.warnings)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}