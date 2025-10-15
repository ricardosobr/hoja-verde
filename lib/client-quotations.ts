import { createClient } from './supabase'
import { Database } from './supabase'

type Quotation = Database['public']['Tables']['documents']['Row']
type QuotationStatus = Database['public']['Enums']['quotation_status']

export interface ClientQuotation extends Quotation {
  companies: {
    name: string
  } | null
}

export async function getClientQuotations(
  _userId: string, 
  companyId?: string,
  status?: QuotationStatus
): Promise<ClientQuotation[]> {
  const supabase = createClient()

  let query = supabase
    .from('documents')
    .select(`
      *,
      companies!documents_company_id_fkey(name)
    `)
    .eq('type', 'quotation')
    .order('created_at', { ascending: false })

  // RLS will automatically filter by company_id based on user's company
  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  if (status) {
    query = query.eq('quotation_status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching client quotations:', error)
    throw new Error(`Failed to fetch quotations: ${error.message}`)
  }

  return data || []
}

export async function getClientQuotationById(
  quotationId: string,
  _userId: string
): Promise<ClientQuotation | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      companies!documents_company_id_fkey(name)
    `)
    .eq('id', quotationId)
    .eq('type', 'quotation')
    .single()

  if (error) {
    console.error('Error fetching quotation:', error)
    throw new Error(`Failed to fetch quotation: ${error.message}`)
  }

  return data
}

export async function updateQuotationStatus(
  quotationId: string,
  newStatus: 'in_review' | 'approved' | 'rejected',
  _userId: string
): Promise<void> {
  const supabase = createClient()

  // First verify the quotation belongs to the user's company and is in valid state
  const { data: quotation, error: fetchError } = await supabase
    .from('documents')
    .select('quotation_status, company_id')
    .eq('id', quotationId)
    .eq('type', 'quotation')
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch quotation: ${fetchError.message}`)
  }

  // Validate state transitions
  const currentStatus = quotation.quotation_status
  const validTransitions: Record<string, string[]> = {
    'generated': ['in_review'],
    'in_review': ['approved', 'rejected'],
  }

  if (!currentStatus || !validTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`)
  }

  // Update the quotation status
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      quotation_status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', quotationId)
    .eq('type', 'quotation')

  if (updateError) {
    throw new Error(`Failed to update quotation status: ${updateError.message}`)
  }

  // If approved, the database trigger will handle conversion to order
}

export function getStatusBadgeColor(status: QuotationStatus | null): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'generated':
      return 'bg-blue-100 text-blue-800'
    case 'in_review':
      return 'bg-yellow-100 text-yellow-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'expired':
      return 'bg-gray-100 text-gray-800'
    case 'converted':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusLabel(status: QuotationStatus | null): string {
  switch (status) {
    case 'draft':
      return 'Borrador'
    case 'generated':
      return 'Generada'
    case 'in_review':
      return 'En Revisión'
    case 'approved':
      return 'Aprobada'
    case 'rejected':
      return 'Rechazada'
    case 'expired':
      return 'Expirada'
    case 'converted':
      return 'Convertida'
    default:
      return 'Sin Estado'
  }
}

export function canClientUpdateStatus(status: QuotationStatus | null): boolean {
  return status === 'generated' || status === 'in_review'
}

export function getClientAllowedActions(status: QuotationStatus | null): string[] {
  switch (status) {
    case 'generated':
      return ['review']
    case 'in_review':
      return ['approve', 'reject']
    default:
      return []
  }
}