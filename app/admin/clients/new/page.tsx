'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import { companySchema, CompanyFormData, defaultCompanyValues, formatCompanyDataForDatabase } from '@/lib/schemas/company'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'


export default function NewClientPage() {
  const router = useRouter()
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
    defaultValues: defaultCompanyValues,
  })

  const onFormSubmit = async (data: CompanyFormData) => {
    setIsLoading(true)

    try {
      const companyData = formatCompanyDataForDatabase(data, user?.id || '')

      const { error } = await supabase
        .from('companies')
        .insert([companyData])

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'Company Created',
        message: `"${data.name}" has been created successfully`,
      })

      router.push('/admin/clients')
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/clients')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clients</span>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Company</h1>
        <p className="text-gray-600 mt-1">
          Create a new client company profile with contact information and fiscal configuration.
        </p>
      </div>

      {/* Company Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter company name"
                  className={errors.name ? 'border-red-300' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  {...register('rfc')}
                  placeholder="e.g., ABC123456DE1"
                  className={errors.rfc ? 'border-red-300' : ''}
                />
                {errors.rfc && (
                  <p className="text-sm text-red-600">{errors.rfc.message}</p>
                )}
                <p className="text-xs text-gray-500">Mexican tax identification number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="company@example.com"
                  className={errors.email ? 'border-red-300' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
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

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/clients')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Company'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}