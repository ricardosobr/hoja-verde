'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProductFilters {
  minPrice: string
  maxPrice: string
  minStock: string
  maxStock: string
  activeOnly: boolean
  lowStockOnly: boolean
}

interface ProductFiltersProps {
  onFiltersChange: (filters: ProductFilters) => void
}

export function ProductFilters({ onFiltersChange }: ProductFiltersProps) {
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minStock: '',
    maxStock: '',
    activeOnly: true,
    lowStockOnly: false
  })

  const handleFilterChange = (key: keyof ProductFilters, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      minPrice: '',
      maxPrice: '',
      minStock: '',
      maxStock: '',
      activeOnly: true,
      lowStockOnly: false
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Price Range */}
        <div className="space-y-2">
          <Label>Price Range</Label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Stock Range */}
        <div className="space-y-2">
          <Label>Stock Range</Label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minStock}
              onChange={(e) => handleFilterChange('minStock', e.target.value)}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxStock}
              onChange={(e) => handleFilterChange('maxStock', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Status Filters */}
        <div className="space-y-3">
          <Label>Status</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.activeOnly}
                onChange={(e) => handleFilterChange('activeOnly', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">Active only</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.lowStockOnly}
                onChange={(e) => handleFilterChange('lowStockOnly', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">Low stock only</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  )
}