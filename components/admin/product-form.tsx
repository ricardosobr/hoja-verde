'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { useAuthStore, useNotificationStore } from '@/lib/store'
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

const productSchema = z.object({
  code: z.string().min(1, 'Product code is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  cost_price: z.number().min(0, 'Cost price must be positive'),
  profit_margin: z.number().min(0, 'Profit margin must be positive').max(5, 'Profit margin cannot exceed 500%'),
  public_price: z.number().min(0, 'Public price must be positive'),
  tax_included: z.boolean().default(false),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be positive'),
  min_stock_level: z.number().int().min(0, 'Minimum stock level must be positive'),
  is_active: z.boolean().default(true)
})

type ProductFormData = z.infer<typeof productSchema>

interface Product {
  id: string
  code: string
  name: string
  description: string | null
  category_id: string | null
  unit: string
  cost_price: number
  profit_margin: number
  base_price: number
  public_price: number
  tax_id: string | null
  tax_included: boolean
  stock_quantity: number
  min_stock_level: number
  is_active: boolean
}

interface Category {
  id: string
  name: string
  description: string | null
}

interface Tax {
  id: string
  name: string
  type: 'percentage' | 'fixed_amount'
  rate?: number
  amount?: number
  is_default: boolean
}

interface ProductFormProps {
  product?: Product | null
  categories: Category[]
  onSubmit: () => void
}

export function ProductForm({ product, categories, onSubmit }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [selectedTax, setSelectedTax] = useState<string>('')
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          code: product.code,
          name: product.name,
          description: product.description || '',
          category_id: product.category_id || '',
          unit: product.unit,
          cost_price: product.cost_price,
          profit_margin: product.profit_margin,
          public_price: product.public_price,
          tax_included: product.tax_included,
          stock_quantity: product.stock_quantity,
          min_stock_level: product.min_stock_level,
          is_active: product.is_active,
        }
      : {
          code: '',
          name: '',
          description: '',
          category_id: '',
          unit: 'PIEZA',
          cost_price: 0,
          profit_margin: 0.25, // 25% default
          public_price: 0,
          tax_included: false,
          stock_quantity: 0,
          min_stock_level: 0,
          is_active: true,
        },
  })

  const costPrice = watch('cost_price')
  const profitMargin = watch('profit_margin')
  // Removed unused variable

  /**
   * Fetch available taxes from database and set default tax if applicable
   * Prioritizes default tax from database or existing product's tax
   * Used for tax dropdown population in pricing section
   */
  const fetchTaxes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('taxes')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (error) throw error
      
      setTaxes(data || [])
      
      // Set default tax if editing product with tax or if default tax exists
      if (product?.tax_id) {
        setSelectedTax(product.tax_id)
      } else {
        const defaultTax = data?.find(tax => tax.is_default)
        if (defaultTax) {
          setSelectedTax(defaultTax.id)
        }
      }
    } catch (error) {
      console.error('Error fetching taxes:', error)
    }
  }, [supabase, product?.tax_id])

  useEffect(() => {
    fetchTaxes()
  }, [fetchTaxes])

  /**
   * Auto-calculate public price when cost price or profit margin changes
   * Business Rule: publicPrice = costPrice * (1 + profitMargin)
   * Example: $100 cost + 25% margin = $125 public price
   * Rounds to 2 decimal places for currency precision
   */
  useEffect(() => {
    if (costPrice && profitMargin) {
      const basePrice = costPrice * (1 + profitMargin)
      setValue('public_price', Math.round(basePrice * 100) / 100)
    }
  }, [costPrice, profitMargin, setValue])

  /**
   * Handle form submission for creating or updating products
   * Calculates base price using the same business rule as the auto-calculation
   * Handles both create and update operations based on presence of existing product
   * 
   * @param data - Validated form data from react-hook-form
   */
  const onFormSubmit = async (data: ProductFormData) => {
    setIsLoading(true)

    try {
      // Calculate base price using business rule: basePrice = costPrice * (1 + profitMargin)
      const basePrice = data.cost_price * (1 + data.profit_margin)

      const productData = {
        ...data,
        base_price: basePrice,
        tax_id: selectedTax || null,
        created_by: user?.id,
      }

      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)

        if (error) throw error

        addNotification({
          type: 'success',
          title: 'Product Updated',
          message: `"${data.name}" has been updated successfully`,
        })
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([productData])

        if (error) throw error

        addNotification({
          type: 'success',
          title: 'Product Created',
          message: `"${data.name}" has been created successfully`,
        })
      }

      onSubmit()
    } catch (error: unknown) {
      console.error('Error saving product:', error)
      
      if (error.code === '23505') {
        addNotification({
          type: 'error',
          title: 'Duplicate Product Code',
          message: `Product code "${data.code}" already exists. Please use a unique code.`,
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to save product. Please try again.',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {product ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
      </DialogHeader>

      {/* Form */}
      <form id="product-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Product Code *</Label>
                <Input
                  id="code"
                  {...register('code')}
                  placeholder="e.g., COD001"
                  className={errors.code ? 'border-red-300' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <select
                  id="unit"
                  {...register('unit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="PIEZA">PIEZA</option>
                  <option value="KG">KG</option>
                  <option value="LITRO">LITRO</option>
                  <option value="METRO">METRO</option>
                  <option value="CAJA">CAJA</option>
                  <option value="PAQUETE">PAQUETE</option>
                  <option value="LATA">LATA</option>
                  <option value="BOTELLA">BOTELLA</option>
                </select>
                {errors.unit && (
                  <p className="text-sm text-red-600">{errors.unit.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter product name"
                className={errors.name ? 'border-red-300' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                placeholder="Enter product description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register('category_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    {...register('cost_price', { valueAsNumber: true })}
                    placeholder="0.00"
                    className={errors.cost_price ? 'border-red-300' : ''}
                  />
                  {errors.cost_price && (
                    <p className="text-sm text-red-600">{errors.cost_price.message}</p>
                  )}
                  <p className="text-xs text-gray-500">Internal cost price</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profit_margin">Profit Margin (%) *</Label>
                  <Input
                    id="profit_margin"
                    type="number"
                    step="0.01"
                    {...register('profit_margin', { valueAsNumber: true })}
                    placeholder="0.25"
                    className={errors.profit_margin ? 'border-red-300' : ''}
                  />
                  {errors.profit_margin && (
                    <p className="text-sm text-red-600">{errors.profit_margin.message}</p>
                  )}
                  <p className="text-xs text-gray-500">e.g., 0.25 = 25%</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="public_price">Public Price *</Label>
                  <Input
                    id="public_price"
                    type="number"
                    step="0.01"
                    {...register('public_price', { valueAsNumber: true })}
                    placeholder="0.00"
                    className={errors.public_price ? 'border-red-300' : ''}
                  />
                  {errors.public_price && (
                    <p className="text-sm text-red-600">{errors.public_price.message}</p>
                  )}
                  <p className="text-xs text-gray-500">Price shown to clients</p>
                </div>
              </div>

              {/* Tax Configuration */}
              <div className="mt-4 space-y-2">
                <Label htmlFor="tax">Tax</Label>
                <div className="flex items-center space-x-4">
                  <select
                    id="tax"
                    value={selectedTax}
                    onChange={(e) => setSelectedTax(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">No tax</option>
                    {taxes.map((tax) => (
                      <option key={tax.id} value={tax.id}>
                        {tax.name} ({tax.type === 'percentage' ? `${(tax.rate || 0) * 100}%` : `$${tax.amount}`})
                      </option>
                    ))}
                  </select>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('tax_included')}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Tax included in price</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    {...register('stock_quantity', { valueAsNumber: true })}
                    placeholder="0"
                    className={errors.stock_quantity ? 'border-red-300' : ''}
                  />
                  {errors.stock_quantity && (
                    <p className="text-sm text-red-600">{errors.stock_quantity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stock_level">Minimum Stock Level *</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    {...register('min_stock_level', { valueAsNumber: true })}
                    placeholder="0"
                    className={errors.min_stock_level ? 'border-red-300' : ''}
                  />
                  {errors.min_stock_level && (
                    <p className="text-sm text-red-600">{errors.min_stock_level.message}</p>
                  )}
                  <p className="text-xs text-gray-500">Alert when stock falls below this level</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <Label htmlFor="is_active">Product is active</Label>
            </div>

          </form>
      <DialogFooter>
        <Button
          type="submit"
          form="product-form"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {product ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            product ? 'Update Product' : 'Create Product'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}