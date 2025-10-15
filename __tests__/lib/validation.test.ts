/**
 * @jest-environment jsdom
 */

import {
  validateQuotationConversion,
  validateOrderStatusTransition,
  validateFolioUniqueness,
  validateDocumentDataIntegrity,
  validatePreConversion
} from '@/lib/validation'
import { OrderStatus } from '@/lib/orders'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
}

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase
}))

describe('Validation Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateQuotationConversion', () => {
    const mockQuotationId = 'test-quotation-id'
    const mockUserId = 'test-user-id'

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } }
      })
    })

    test('validates successful conversion requirements', async () => {
      const mockQuotation = {
        quotation_status: 'approved',
        type: 'quotation',
        folio: 'COT-00000001',
        total: 100,
        company_id: 'company-1'
      }

      const mockQueries = [
        // Quotation query
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockQuotation, error: null })
        },
        // Existing order check
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
        },
        // Items check
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [{ id: 'item-1' }], error: null })
        },
        // User check
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
        },
        // Company check
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { status: 'active' }, error: null })
        }
      ]

      let queryIndex = 0
      mockSupabase.from.mockImplementation(() => {
        return mockQueries[queryIndex++] || mockQueries[0]
      })

      const result = await validateQuotationConversion(mockQuotationId, mockUserId)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('fails validation for non-approved quotation', async () => {
      const mockQuotation = {
        quotation_status: 'draft',
        type: 'quotation',
        folio: 'COT-00000001',
        total: 100,
        company_id: 'company-1'
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockQuotation, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await validateQuotationConversion(mockQuotationId, mockUserId)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Only approved quotations can be converted to orders')
    })

    test('fails validation for already converted quotation', async () => {
      const mockQuotation = {
        quotation_status: 'converted',
        type: 'quotation',
        folio: 'COT-00000001',
        total: 100,
        company_id: 'company-1'
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockQuotation, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await validateQuotationConversion(mockQuotationId, mockUserId)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Quotation has already been converted to an order')
    })

    test('fails validation when existing order found', async () => {
      const mockQuotation = {
        quotation_status: 'approved',
        type: 'quotation',
        folio: 'COT-00000001',
        total: 100,
        company_id: 'company-1'
      }

      const mockExistingOrder = {
        id: 'order-1',
        folio: 'ORD-00000001'
      }

      const mockQueries = [
        // Quotation query
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockQuotation, error: null })
        },
        // Existing order check
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: mockExistingOrder, error: null })
        }
      ]

      let queryIndex = 0
      mockSupabase.from.mockImplementation(() => {
        return mockQueries[queryIndex++] || mockQueries[0]
      })

      const result = await validateQuotationConversion(mockQuotationId, mockUserId)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Order ORD-00000001 already exists for this quotation')
    })

    test('fails validation for non-admin user', async () => {
      const mockQuotation = {
        quotation_status: 'approved',
        type: 'quotation',
        folio: 'COT-00000001',
        total: 100,
        company_id: 'company-1'
      }

      const mockQueries = [
        // Quotation query
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockQuotation, error: null })
        },
        // Existing order check
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
        },
        // Items check
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [{ id: 'item-1' }], error: null })
        },
        // User check
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { role: 'client' }, error: null })
        }
      ]

      let queryIndex = 0
      mockSupabase.from.mockImplementation(() => {
        return mockQueries[queryIndex++] || mockQueries[0]
      })

      const result = await validateQuotationConversion(mockQuotationId, mockUserId)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Only admin users can convert quotations to orders')
    })
  })

  describe('validateOrderStatusTransition', () => {
    test('allows valid transitions for admin users', () => {
      const result = validateOrderStatusTransition('pending', 'confirmed', 'admin')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('blocks transitions for non-admin users', () => {
      const result = validateOrderStatusTransition('pending', 'confirmed', 'client')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Only admin users can change order status')
    })

    test('prevents changing status of delivered orders', () => {
      const result = validateOrderStatusTransition('delivered', 'pending', 'admin')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Cannot change status of delivered orders')
    })

    test('prevents changing status of cancelled orders', () => {
      const result = validateOrderStatusTransition('cancelled', 'pending', 'admin')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Cannot change status of cancelled orders')
    })

    test('warns about skipping status progression', () => {
      const result = validateOrderStatusTransition('confirmed', 'shipped', 'admin')
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Orders should typically be marked as ready before shipping')
    })
  })

  describe('validateFolioUniqueness', () => {
    test('validates unique folio', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await validateFolioUniqueness('ORD-00000001', 'order')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('fails validation for existing folio', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ 
          data: { id: 'existing-id', type: 'order', folio: 'ORD-00000001' }, 
          error: null 
        })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await validateFolioUniqueness('ORD-00000001', 'order')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Folio ORD-00000001 already exists for order')
    })

    test('validates folio format for quotations', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // Valid format
      const validResult = await validateFolioUniqueness('COT-00000001', 'quotation')
      expect(validResult.valid).toBe(true)

      // Invalid format
      const invalidResult = await validateFolioUniqueness('INVALID-FOLIO', 'quotation')
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.errors).toContain('Quotation folio must follow format COT-XXXXXXXX')
    })

    test('validates folio format for orders', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      // Valid format
      const validResult = await validateFolioUniqueness('ORD-00000001', 'order')
      expect(validResult.valid).toBe(true)

      // Invalid format
      const invalidResult = await validateFolioUniqueness('INVALID-FOLIO', 'order')
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.errors).toContain('Order folio must follow format ORD-XXXXXXXX')
    })
  })

  describe('validateDocumentDataIntegrity', () => {
    test('validates document with correct data', async () => {
      const mockDocument = {
        folio: 'COT-00000001',
        company_id: 'company-1',
        issue_date: '2025-01-01',
        total: 116,
        subtotal: 100,
        taxes: 16,
        document_items: [
          {
            id: 'item-1',
            description: 'Test product',
            quantity: 2,
            unit_price: 50,
            total: 100,
            subtotal: 100,
            tax: 16
          }
        ]
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDocument, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await validateDocumentDataIntegrity('test-document-id')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('fails validation for missing required fields', async () => {
      const mockDocument = {
        folio: '',
        company_id: null,
        issue_date: null,
        total: 0,
        subtotal: 0,
        document_items: []
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDocument, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await validateDocumentDataIntegrity('test-document-id')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Document folio is required')
      expect(result.errors).toContain('Company ID is required')
      expect(result.errors).toContain('Issue date is required')
      expect(result.errors).toContain('Document total must be greater than zero')
      expect(result.errors).toContain('Document must have at least one item')
    })

    test('fails validation for invalid item data', async () => {
      const mockDocument = {
        folio: 'COT-00000001',
        company_id: 'company-1',
        issue_date: '2025-01-01',
        total: 100,
        subtotal: 100,
        document_items: [
          {
            id: 'item-1',
            description: 'Test product',
            quantity: 0,
            unit_price: 0,
            total: 0
          }
        ]
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDocument, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await validateDocumentDataIntegrity('test-document-id')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Item "Test product" has invalid quantity')
      expect(result.errors).toContain('Item "Test product" has invalid unit price')
      expect(result.errors).toContain('Item "Test product" has invalid total')
    })
  })

  describe('validatePreConversion', () => {
    test('runs comprehensive validation successfully', async () => {
      // Mock all validation functions to pass
      const mockQuotation = {
        quotation_status: 'approved',
        type: 'quotation',
        folio: 'COT-00000001',
        total: 100,
        company_id: 'company-1'
      }

      const mockDocument = {
        folio: 'COT-00000001',
        company_id: 'company-1',
        issue_date: '2025-01-01',
        total: 100,
        subtotal: 100,
        document_items: [
          {
            id: 'item-1',
            description: 'Test product',
            quantity: 1,
            unit_price: 100,
            total: 100,
            subtotal: 100
          }
        ]
      }

      const mockQueries = [
        // validateQuotationConversion queries
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockQuotation, error: null })
        },
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
        },
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [{ id: 'item-1' }], error: null })
        },
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
        },
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { status: 'active' }, error: null })
        },
        // validateDocumentDataIntegrity query
        {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockDocument, error: null })
        }
      ]

      let queryIndex = 0
      mockSupabase.from.mockImplementation(() => {
        return mockQueries[queryIndex++] || mockQueries[0]
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })

      const result = await validatePreConversion('test-quotation-id', 'test-user-id')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})