'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import { companySchema, CompanyFormData, defaultCompanyValues, formatCompanyDataForDatabase } from '@/lib/schemas/company'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'


interface Company {
  id: string
  name: string
  rfc: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  status: 'active' | 'inactive' | 'pending'
}

interface CompanyFormProps {
  company?: Company | null
  onSubmit: () => void
}

export function CompanyForm({ company, onSubmit }: CompanyFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: company
      ? {
          name: company.name,
          rfc: company.rfc || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          postal_code: company.postal_code || '',
          country: company.country,
          phone: company.phone || '',
          email: company.email || '',
          website: company.website || '',
          status: company.status,
        }
      : defaultCompanyValues,
  })

  const onFormSubmit = async (data: CompanyFormData) => {
    setIsLoading(true)

    try {
      const companyData = formatCompanyDataForDatabase(data, user?.id || '')

      if (company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', company.id)

        if (error) throw error

        addNotification({
          type: 'success',
          title: 'Company Updated',
          message: `"${data.name}" has been updated successfully`,
        })
      } else {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert([companyData])

        if (error) throw error

        addNotification({
          type: 'success',
          title: 'Company Created',
          message: `"${data.name}" has been created successfully`,
        })
      }

      onSubmit()
    } catch (error: unknown) {
      console.error('Error saving company:', error)
      
      if ((error as { code?: string })?.code === '23505') {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'A company with this RFC already exists',
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to save company. Please try again.',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-brand-lg">
      <DialogHeader className="pb-6 border-b border-hoja-verde-100">
        <DialogTitle className="text-2xl font-bold text-hoja-verde-800">
          {company ? 'Edit Company' : 'Add New Company'}
        </DialogTitle>
      </DialogHeader>

      {/* Form */}
      <form id="company-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 py-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-hoja-verde-700 flex items-center space-x-2">
                <span className="w-2 h-2 bg-hoja-verde-500 rounded-full"></span>
                <span>Basic Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <Label htmlFor="name" className="text-sm font-semibold text-hoja-verde-700">Company Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter company name"
                    className={errors.name ? 'border-red-300 focus:border-red-400' : 'border-hoja-verde-200 focus:border-hoja-verde-500'}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 animate-fade-in flex items-center space-x-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      <span>{errors.name.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="rfc" className="text-sm font-semibold text-hoja-verde-700">RFC</Label>
                  <Input
                    id="rfc"
                    {...register('rfc')}
                    placeholder="e.g., ABC123456DE1"
                    className={errors.rfc ? 'border-red-300 focus:border-red-400' : 'border-hoja-verde-200 focus:border-hoja-verde-500'}
                  />
                  {errors.rfc && (
                    <p className="text-sm text-red-600 animate-fade-in flex items-center space-x-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      <span>{errors.rfc.message}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground bg-hoja-verde-50 px-3 py-1 rounded-full">Mexican tax identification number</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="status" className="text-sm font-semibold text-hoja-verde-700">Status</Label>
                  <select
                    id="status"
                    {...register('status')}
                    className="w-full h-12 px-4 py-3 border-2 border-hoja-verde-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-hoja-verde-100 focus:border-hoja-verde-500 bg-white hover:border-hoja-verde-300 transition-all font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6 border-t border-hoja-verde-100 pt-8">
              <h3 className="text-lg font-semibold text-hoja-verde-700 flex items-center space-x-2">
                <span className="w-2 h-2 bg-hoja-verde-500 rounded-full"></span>
                <span>Contact Information</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-hoja-verde-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="company@example.com"
                    className={errors.email ? 'border-red-300 focus:border-red-400' : 'border-hoja-verde-200 focus:border-hoja-verde-500'}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 animate-fade-in flex items-center space-x-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      <span>{errors.email.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+52 999 123 4567"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    {...register('website')}
                    placeholder="https://www.company.com"
                    className={errors.website ? 'border-red-300' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-red-600">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Address</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      placeholder="State"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      {...register('postal_code')}
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

      </form>
      
      <DialogFooter className="border-t border-hoja-verde-100 pt-6 space-x-3">
        <Button
          type="button"
          variant="outline"
          className="border-hoja-verde-200 text-hoja-verde-700 hover:bg-hoja-verde-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="company-form"
          variant="brand"
          size="lg"
          disabled={isLoading}
          className="min-w-[140px]"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{company ? 'Updating...' : 'Creating...'}</span>
            </div>
          ) : (
            company ? 'Update Company' : 'Create Company'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}