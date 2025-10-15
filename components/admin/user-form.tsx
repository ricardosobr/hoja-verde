'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
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
}

interface UserFormProps {
  company: Company
  onSubmit: () => void
}

export function UserForm({ company, onSubmit }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    position: '',
    department: '',
    phone: '',
    whatsapp: '',
    is_primary_contact: false,
    can_create_quotations: true,
    can_approve_orders: false,
    credit_limit: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.credit_limit < 0) {
      newErrors.credit_limit = 'Credit limit cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (existingUser) {
        setErrors({ email: 'A user with this email already exists' })
        setIsLoading(false)
        return
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'client'
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: 'client',
          status: 'active'
        })

      if (userError) throw userError

      // Create client profile
      const { error: profileError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: authData.user.id,
          company_id: company.id,
          position: formData.position || null,
          department: formData.department || null,
          phone: formData.phone || null,
          whatsapp: formData.whatsapp || null,
          is_primary_contact: formData.is_primary_contact,
          can_create_quotations: formData.can_create_quotations,
          can_approve_orders: formData.can_approve_orders,
          credit_limit: formData.credit_limit
        })

      if (profileError) throw profileError

      addNotification({
        type: 'success',
        title: 'User Created',
        message: `${formData.full_name} has been added to ${company.name}`
      })

      onSubmit()
    } catch (error: unknown) {
      console.error('Error creating user:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: (error as Error).message || 'Failed to create user'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add User</DialogTitle>
        <p className="text-sm text-gray-600 mt-1">
          Add a new user to {company.name}
        </p>
      </DialogHeader>

      {/* Form */}
      <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className={errors.full_name ? 'border-red-500' : ''}
                  placeholder="Enter full name"
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  placeholder="Enter password (min. 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="e.g., Sales Manager"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="e.g., Sales"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., +52 55 1234 5678"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  placeholder="e.g., +52 55 1234 5678"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Permissions & Settings</h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.is_primary_contact}
                  onChange={(e) => handleInputChange('is_primary_contact', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Primary Contact</span>
                  <p className="text-xs text-gray-500">This user will be the main point of contact for the company</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.can_create_quotations}
                  onChange={(e) => handleInputChange('can_create_quotations', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Can Create Quotations</span>
                  <p className="text-xs text-gray-500">Allow this user to create new quotation requests</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.can_approve_orders}
                  onChange={(e) => handleInputChange('can_approve_orders', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Can Approve Orders</span>
                  <p className="text-xs text-gray-500">Allow this user to approve and place orders</p>
                </div>
              </label>
            </div>

            <div>
              <Label htmlFor="credit_limit">Credit Limit (MXN)</Label>
              <Input
                id="credit_limit"
                type="number"
                min="0"
                step="0.01"
                value={formData.credit_limit}
                onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value) || 0)}
                className={errors.credit_limit ? 'border-red-500' : ''}
                placeholder="0.00"
              />
              {errors.credit_limit && (
                <p className="text-sm text-red-600 mt-1">{errors.credit_limit}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maximum credit limit for this user. Set to 0 for no limit.
              </p>
            </div>
          </div>

        </form>
      <DialogFooter>
        <Button
          type="submit"
          form="user-form"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating User...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}