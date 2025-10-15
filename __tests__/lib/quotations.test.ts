/**
 * @jest-environment jsdom
 */

import {
  convertQuotationToOrder,
  getQuotationForConversion,
  canConvertQuotation
} from '@/lib/quotations'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  },
  rpc: jest.fn()
}

// Mock status management
jest.mock('@/lib/status-management', () => ({
  updateQuotationStatus: jest.fn()
}))

// Mock validation
jest.mock('@/lib/validation', () => ({
  validatePreConversion: jest.fn(),
  validateFolioUniqueness: jest.fn()
}))

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase
}))

describe('Quotation Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('canConvertQuotation', () => {
    test('returns true for approved quotations', () => {
      expect(canConvertQuotation('approved')).toBe(true)
    })

    test('returns false for non-approved quotations', () => {
      expect(canConvertQuotation('draft')).toBe(false)
      expect(canConvertQuotation('generated')).toBe(false)
      expect(canConvertQuotation('under_review')).toBe(false)
      expect(canConvertQuotation('rejected')).toBe(false)
      expect(canConvertQuotation('expired')).toBe(false)
      expect(canConvertQuotation('converted')).toBe(false)
    })
  })

  describe('convertQuotationToOrder', () => {
    const mockQuotationId = 'test-quotation-id'
    const mockUserId = 'test-user-id'
    const mockOrderId = 'test-order-id'
    const mockOrderFolio = 'ORD-00000001'

    beforeEach(() => {
      // Mock validation to pass by default
      require('@/lib/validation').validatePreConversion.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: []
      })

      require('@/lib/validation').validateFolioUniqueness.mockResolvedValue({
        valid: true,
        errors: []
      })

      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } }
      })
    })

    test('successfully converts approved quotation to order', async () => {
      // Mock quotation data
      const mockQuotation = {
        id: mockQuotationId,
        folio: 'COT-00000001',
        quotation_status: 'approved',
        company_id: 'test-company-id',
        subtotal: 100,
        taxes: 16,
        total: 116,
        notes: 'Test notes',
        document_items: [
          {
            id: 'item-1',
            product_id: 'product-1',
            description: 'Test product',
            quantity: 2,
            unit_price: 50,
            discount_percentage: 0,
            total: 100
          }
        ]
      }

      // Mock order creation
      const mockOrder = {
        id: mockOrderId,
        folio: mockOrderFolio,
        type: 'order'
      }

      // Setup mocks
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockQuotation, error: null })
      }

      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOrder, error: null })
      }

      const mockItemsInsert = {
        insert: jest.fn().mockResolvedValue({ error: null })
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'documents') {
          return {
            ...mockQuery,
            ...mockInsert
          }
        }
        if (table === 'document_items') {
          return mockItemsInsert
        }
        if (table === 'status_history') {
          return mockItemsInsert // Same structure
        }
        return mockQuery
      })

      // Mock status update
      require('@/lib/status-management').updateQuotationStatus.mockResolvedValue({
        success: true
      })

      const result = await convertQuotationToOrder(mockQuotationId, mockUserId)

      expect(result.success).toBe(true)
      expect(result.orderId).toBe(mockOrderId)
      expect(result.orderFolio).toBe(mockOrderFolio)
      expect(result.message).toContain('successfully')
    })

    test('fails validation and returns error', async () => {
      // Mock validation failure
      require('@/lib/validation').validatePreConversion.mockResolvedValue({
        valid: false,
        errors: ['Quotation is not approved'],
        warnings: []
      })

      const result = await convertQuotationToOrder(mockQuotationId, mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('VALIDATION_FAILED')
      expect(result.message).toContain('not approved')
    })

    test('handles folio uniqueness validation failure', async () => {
      // Mock folio validation failure
      require('@/lib/validation').validateFolioUniqueness.mockResolvedValue({
        valid: false,
        errors: ['Folio already exists']
      })

      // Mock quotation data
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { quotation_status: 'approved' }, 
          error: null 
        })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await convertQuotationToOrder(mockQuotationId, mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('FOLIO_VALIDATION_FAILED')
      expect(result.message).toContain('Folio generation failed')
    })

    test('handles database errors during order creation', async () => {
      // Mock quotation data
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { 
            quotation_status: 'approved',
            document_items: []
          },
          error: null
        })
      }

      // Mock order creation failure
      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        })
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'documents') {
          return {
            ...mockQuery,
            ...mockInsert
          }
        }
        return mockQuery
      })

      const result = await convertQuotationToOrder(mockQuotationId, mockUserId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('ORDER_CREATION_FAILED')
    })
  })

  describe('getQuotationForConversion', () => {
    test('successfully retrieves quotation data', async () => {
      const mockQuotationId = 'test-quotation-id'
      const mockQuotationData = {
        id: mockQuotationId,
        folio: 'COT-00000001',
        quotation_status: 'approved',
        document_items: [],
        companies: {
          name: 'Test Company',
          contact_name: 'Test Contact',
          email: 'test@example.com'
        }
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockQuotationData, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getQuotationForConversion(mockQuotationId)

      expect(result.success).toBe(true)
      expect(result.quotation).toEqual(mockQuotationData)
    })

    test('handles quotation not found', async () => {
      const mockQuotationId = 'non-existent-id'

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getQuotationForConversion(mockQuotationId)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Quotation not found')
    })
  })
})