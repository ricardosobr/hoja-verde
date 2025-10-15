'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { useNotificationStore, useQuotationFormStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, 
  Minus, 
  Save, 
  Send,
  ArrowLeft,
  Search,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const quotationSchema = z.object({
  company_id: z.string().min(1, 'Please select a company'),
  contact_name: z.string().min(1, 'Contact name is required'),
  contact_email: z.string().email('Valid email is required'),
  contact_phone: z.string().optional(),
  validity_days: z.number().min(1, 'Validity must be at least 1 day'),
  terms: z.string().min(1, 'Terms and conditions are required'),
  delivery_terms: z.string().min(1, 'Delivery terms are required'),
  payment_terms: z.string().min(1, 'Payment terms are required'),
})

type QuotationFormData = z.infer<typeof quotationSchema>

interface Company {
  id: string
  name: string
  rfc: string | null
}

interface Product {
  id: string
  code: string
  name: string
  unit: string
  public_price: number
  tax_id: string | null
  taxes?: {
    rate: number
  }
}

interface QuotationItem {
  id: string
  product_id: string
  product_code: string
  product_name: string
  unit: string
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  subtotal: number
  total: number
}

export default function CreateQuotationPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<QuotationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      validity_days: 30,
      terms: 'Se entrega en el lugar y tiempo requerido por Ustedes PRECIO + IVA en productos determinados. MONEDA: PESOS MEXICANOS NO HAY DEVOLUCIONES NO HAY CANCELACIONES, DE SER ASÍ SE COBRA EL 25% ENTREGA GRATUITA EN SUS INSTALACIONES',
      delivery_terms: 'Plazo de entrega de 4 a 7 días hábiles',
      payment_terms: 'Contra entrega',
    }
  })

  const selectedCompanyId = watch('company_id')

  useEffect(() => {
    fetchCompanies()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCompanyContacts(selectedCompanyId)
    }
  }, [selectedCompanyId])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, rfc')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          code,
          name,
          unit,
          public_price,
          tax_id,
          taxes(rate)
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCompanyContacts = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select(`
          users(full_name, email, phone)
        `)
        .eq('company_id', companyId)
        .eq('is_primary_contact', true)
        .single()

      if (error) throw error
      
      if (data?.users) {
        setValue('contact_name', data.users.full_name)
        setValue('contact_email', data.users.email)
        setValue('contact_phone', data.users.phone || '')
      }
    } catch (error) {
      console.error('Error fetching company contacts:', error)
    }
  }

  const addProduct = (product: Product) => {
    const existingItem = selectedProducts.find(item => item.product_id === product.id)
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1)
    } else {
      const taxRate = product.taxes?.rate || 0
      const quantity = 1
      const unitPrice = product.public_price
      const subtotal = quantity * unitPrice
      const taxAmount = subtotal * taxRate
      const total = subtotal + taxAmount

      const newItem: QuotationItem = {
        id: Math.random().toString(36).substr(2, 9),
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        unit: product.unit,
        quantity,
        unit_price: unitPrice,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        subtotal,
        total,
      }

      setSelectedProducts([...selectedProducts, newItem])
    }
    setShowProductSearch(false)
    setProductSearchTerm('')
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(itemId)
      return
    }

    setSelectedProducts(products => 
      products.map(item => {
        if (item.id === itemId) {
          const subtotal = newQuantity * item.unit_price
          const taxAmount = subtotal * item.tax_rate
          const total = subtotal + taxAmount
          
          return {
            ...item,
            quantity: newQuantity,
            subtotal,
            tax_amount: taxAmount,
            total,
          }
        }
        return item
      })
    )
  }

  const removeProduct = (itemId: string) => {
    setSelectedProducts(products => products.filter(item => item.id !== itemId))
  }

  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce((sum, item) => sum + item.subtotal, 0)
    const taxAmount = selectedProducts.reduce((sum, item) => sum + item.tax_amount, 0)
    const total = subtotal + taxAmount

    return { subtotal, taxAmount, total }
  }

  const onSubmit = async (data: QuotationFormData) => {
    if (selectedProducts.length === 0) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please add at least one product to the quotation'
      })
      return
    }

    setIsLoading(true)

    try {
      const totals = calculateTotals()
      
      // Generate folio
      const folio = `COT-${Date.now().toString(16).toUpperCase()}`

      // Create quotation
      const { data: quotation, error: quotationError } = await supabase
        .from('documents')
        .insert({
          folio,
          type: 'quotation',
          company_id: data.company_id,
          client_id: (await supabase.auth.getUser()).data.user?.id,
          contact_name: data.contact_name,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          validity_days: data.validity_days,
          terms: data.terms,
          delivery_terms: data.delivery_terms,
          payment_terms: data.payment_terms,
          quotation_status: 'draft',
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          total: totals.total,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single()

      if (quotationError) throw quotationError

      // Create quotation items
      const items = selectedProducts.map(item => ({
        document_id: quotation.id,
        product_id: item.product_id,
        product_code: item.product_code,
        product_name: item.product_name,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
      }))

      const { error: itemsError } = await supabase
        .from('document_items')
        .insert(items)

      if (itemsError) throw itemsError

      addNotification({
        type: 'success',
        title: 'Quotation Created',
        message: `Quotation ${folio} has been created successfully`
      })

      router.push('/admin/quotations')
    } catch (error) {
      console.error('Error creating quotation:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create quotation'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(productSearchTerm.toLowerCase())
  )

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/quotations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotations
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Quotation</h1>
            <p className="text-gray-600 mt-1">
              Generate a new quotation for a client
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="company_id">Company *</Label>
              <select
                {...register('company_id')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} {company.rfc && `(${company.rfc})`}
                  </option>
                ))}
              </select>
              {errors.company_id && (
                <p className="mt-1 text-sm text-red-600">{errors.company_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="validity_days">Validity (Days) *</Label>
              <Input
                id="validity_days"
                type="number"
                {...register('validity_days', { valueAsNumber: true })}
                className={errors.validity_days ? 'border-red-300' : ''}
              />
              {errors.validity_days && (
                <p className="mt-1 text-sm text-red-600">{errors.validity_days.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                {...register('contact_name')}
                className={errors.contact_name ? 'border-red-300' : ''}
              />
              {errors.contact_name && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                {...register('contact_email')}
                className={errors.contact_email ? 'border-red-300' : ''}
              />
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                {...register('contact_phone')}
              />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <Button
              type="button"
              onClick={() => setShowProductSearch(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Product Search Modal */}
          {showProductSearch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Add Product</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProductSearch(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-600">
                              {product.code} • {product.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(product.public_price)}</div>
                            <div className="text-sm text-gray-600">per {product.unit}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Products Table */}
          {selectedProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedProducts.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-sm text-gray-500">{item.product_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.tax_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Totals */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex justify-end space-x-8">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Subtotal:</div>
                    <div className="text-sm text-gray-600">Tax:</div>
                    <div className="text-lg font-semibold text-gray-900">Total:</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">{formatCurrency(totals.subtotal)}</div>
                    <div className="text-sm text-gray-900">{formatCurrency(totals.taxAmount)}</div>
                    <div className="text-lg font-semibold text-gray-900">{formatCurrency(totals.total)}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No products added yet. Click "Add Product" to start.</p>
            </div>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="terms">Terms and Conditions *</Label>
              <textarea
                {...register('terms')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                rows={3}
              />
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_terms">Delivery Terms *</Label>
                <Input
                  id="delivery_terms"
                  {...register('delivery_terms')}
                  className={errors.delivery_terms ? 'border-red-300' : ''}
                />
                {errors.delivery_terms && (
                  <p className="mt-1 text-sm text-red-600">{errors.delivery_terms.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="payment_terms">Payment Terms *</Label>
                <Input
                  id="payment_terms"
                  {...register('payment_terms')}
                  className={errors.payment_terms ? 'border-red-300' : ''}
                />
                {errors.payment_terms && (
                  <p className="mt-1 text-sm text-red-600">{errors.payment_terms.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/admin/quotations">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading || selectedProducts.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Quotation
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}