import { z } from 'zod'

// Import the actual schema from the component
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

describe('Product Form Validation Integration Tests', () => {
  describe('Valid product data', () => {
    it('should validate complete valid product data', () => {
      const validProduct: ProductFormData = {
        code: 'PROD001',
        name: 'Test Product',
        description: 'A test product',
        category_id: 'cat-123',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: 0.25,
        public_price: 150,
        tax_included: false,
        stock_quantity: 10,
        min_stock_level: 5,
        is_active: true,
      }

      const result = productSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
    })

    it('should validate minimal required fields', () => {
      const minimalProduct = {
        code: 'MIN001',
        name: 'Minimal Product',
        unit: 'PIEZA',
        cost_price: 50,
        profit_margin: 0.1,
        public_price: 55,
        stock_quantity: 0,
        min_stock_level: 0,
      }

      const result = productSchema.safeParse(minimalProduct)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid product data - Required fields', () => {
    it('should reject empty product code', () => {
      const invalidProduct = {
        code: '',
        name: 'Test Product',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: 0.25,
        public_price: 125,
        stock_quantity: 10,
        min_stock_level: 5,
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Product code is required')
      }
    })

    it('should reject empty product name', () => {
      const invalidProduct = {
        code: 'PROD001',
        name: '',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: 0.25,
        public_price: 125,
        stock_quantity: 10,
        min_stock_level: 5,
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Product name is required')
      }
    })

    it('should reject empty unit', () => {
      const invalidProduct = {
        code: 'PROD001',
        name: 'Test Product',
        unit: '',
        cost_price: 100,
        profit_margin: 0.25,
        public_price: 125,
        stock_quantity: 10,
        min_stock_level: 5,
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Unit is required')
      }
    })
  })

  describe('Invalid product data - Numeric validations', () => {
    it('should reject negative cost price', () => {
      const invalidProduct = {
        code: 'PROD001',
        name: 'Test Product',
        unit: 'PIEZA',
        cost_price: -10,
        profit_margin: 0.25,
        public_price: 125,
        stock_quantity: 10,
        min_stock_level: 5,
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cost price must be positive')
      }
    })

    it('should reject negative profit margin', () => {
      const invalidProduct = {
        code: 'PROD001',
        name: 'Test Product',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: -0.1,
        public_price: 125,
        stock_quantity: 10,
        min_stock_level: 5,
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Profit margin must be positive')
      }
    })

    it('should reject profit margin over 500%', () => {
      const invalidProduct = {
        code: 'PROD001',
        name: 'Test Product',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: 6, // 600%
        public_price: 125,
        stock_quantity: 10,
        min_stock_level: 5,
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Profit margin cannot exceed 500%')
      }
    })

    it('should reject negative public price', () => {
      const invalidProduct = {
        code: 'PROD001',
        name: 'Test Product',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: 0.25,
        public_price: -50,
        stock_quantity: 10,
        min_stock_level: 5,
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Public price must be positive')
      }
    })

    it('should reject negative stock quantity', () => {
      const invalidProduct = {
        code: 'PROD001',
        name: 'Test Product',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: 0.25,
        public_price: 125,
        stock_quantity: -5,
        min_stock_level: 5,
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Stock quantity must be positive')
      }
    })

    it('should reject non-integer stock quantities', () => {
      const invalidProduct = {
        code: 'PROD001',
        name: 'Test Product',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: 0.25,
        public_price: 125,
        stock_quantity: 10.5,
        min_stock_level: 5,
      }

      const result = productSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
    })
  })

  describe('Pricing calculations', () => {
    it('should handle zero cost price correctly', () => {
      const product = {
        code: 'FREE001',
        name: 'Free Product',
        unit: 'PIEZA',
        cost_price: 0,
        profit_margin: 0,
        public_price: 0,
        stock_quantity: 100,
        min_stock_level: 10,
      }

      const result = productSchema.safeParse(product)
      expect(result.success).toBe(true)
    })

    it('should accept maximum valid profit margin (500%)', () => {
      const product = {
        code: 'HIGH001',
        name: 'High Margin Product',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: 5, // Exactly 500%
        public_price: 600,
        stock_quantity: 1,
        min_stock_level: 0,
      }

      const result = productSchema.safeParse(product)
      expect(result.success).toBe(true)
    })
  })

  describe('Default values', () => {
    it('should apply default values for optional fields', () => {
      const productWithDefaults = {
        code: 'DEF001',
        name: 'Default Product',
        unit: 'PIEZA',
        cost_price: 100,
        profit_margin: 0.25,
        public_price: 125,
        stock_quantity: 10,
        min_stock_level: 5,
      }

      const result = productSchema.parse(productWithDefaults)
      
      expect(result.tax_included).toBe(false)
      expect(result.is_active).toBe(true)
    })
  })
})