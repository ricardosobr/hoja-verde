'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Package,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductForm } from '@/components/admin/product-form'
import { ProductFilters } from '@/components/admin/product-filters'
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  created_at: string
  product_categories?: {
    name: string
  }
  taxes?: {
    name: string
    rate: number
  }
}

interface Category {
  id: string
  name: string
  description: string | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCostPrices, setShowCostPrices] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  /**
   * Fetch products with pagination, search, and category filtering
   * Implements server-side filtering and sorting for optimal performance
   * Includes related data (categories, taxes) via Supabase joins
   */
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_categories(name),
          taxes(name, rate)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory)
      }

      const { data, error, count } = await query

      if (error) throw error

      setProducts(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching products:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch products'
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, selectedCategory, supabase, addNotification])

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, category_name')
        .order('category_name')

      if (error) {
        // Categories feature not implemented yet - silently ignore
        console.warn('Categories table not configured:', error.message)
        return
      }

      // Map category_name to name for consistent interface
      const mappedData = data?.map(cat => ({
        id: cat.id,
        name: cat.category_name,
        description: null
      })) || []

      setCategories(mappedData)
    } catch (error) {
      // Silent fail - categories are optional
      console.warn('Categories not available:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [currentPage, searchTerm, selectedCategory, fetchProducts, fetchCategories])

  /**
   * Handle product deletion with user confirmation
   * Shows confirmation dialog before permanently deleting product from database
   * Updates product list automatically on successful deletion
   * 
   * @param product - Product object to delete
   */
  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'Product Deleted',
        message: `"${product.name}" has been deleted successfully`
      })

      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete product'
      })
    }
  }

  /**
   * Toggle product active/inactive status
   * Updates the is_active field in database and refreshes product list
   * Provides user feedback through notifications
   * 
   * @param product - Product object to toggle status for
   */
  const handleToggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'Product Updated',
        message: `Product ${product.is_active ? 'deactivated' : 'activated'} successfully`
      })

      fetchProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update product'
      })
    }
  }

  const handleFormSubmit = () => {
    setShowForm(false)
    setEditingProduct(null)
    fetchProducts()
  }

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product catalog, pricing, and inventory
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowCostPrices(!showCostPrices)}
            className="flex items-center space-x-2"
          >
            {showCostPrices ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showCostPrices ? 'Hide' : 'Show'} Cost Prices</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </Button>
          
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Button>
            </DialogTrigger>
            <ProductForm
              product={editingProduct}
              categories={categories}
              onSubmit={handleFormSubmit}
            />
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search products by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </Button>
        </div>
        
        {showFilters && (
          <div className="mt-4">
            <ProductFilters onFiltersChange={() => fetchProducts()} />
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                {showCostPrices && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Price
                  </th>
                )}
                {showCostPrices && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Public Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 ${!product.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Code: {product.code}
                      </div>
                      {product.description && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {product.product_categories?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{product.unit}</span>
                  </td>
                  {showCostPrices && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(product.cost_price)}
                      </span>
                    </td>
                  )}
                  {showCostPrices && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {(product.profit_margin * 100).toFixed(1)}%
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.public_price)}
                    </span>
                    {product.taxes && (
                      <div className="text-xs text-gray-500">
                        + {product.taxes.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.stock_quantity}</div>
                    {product.stock_quantity <= product.min_stock_level && (
                      <div className="text-xs text-red-600">Low stock</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product)
                          setShowForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, products.length)} of{' '}
                {products.length} products
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first product'}
          </p>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <ProductForm
              product={editingProduct}
              categories={categories}
              onSubmit={handleFormSubmit}
            />
          </Dialog>
        </div>
      )}

    </div>
  )
}