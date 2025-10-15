import { z } from 'zod'
import { validateRFC } from '@/lib/utils'

/**
 * Shared company schema for validation across all company forms
 * Used in create, edit, and modal forms to ensure consistent validation
 */
export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  rfc: z.string().optional().refine((val) => {
    if (!val) return true
    return validateRFC(val)
  }, 'Invalid RFC format'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default('Mexico'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'pending']).default('active')
})

export type CompanyFormData = z.infer<typeof companySchema>

/**
 * Default values for company form
 */
export const defaultCompanyValues: CompanyFormData = {
  name: '',
  rfc: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Mexico',
  phone: '',
  email: '',
  website: '',
  status: 'active',
}

/**
 * Helper function to convert form data to database format
 * Converts empty strings to null for nullable database fields
 */
export function formatCompanyDataForDatabase(data: CompanyFormData, createdBy: string) {
  return {
    ...data,
    rfc: data.rfc || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    postal_code: data.postal_code || null,
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    created_by: createdBy,
  }
}