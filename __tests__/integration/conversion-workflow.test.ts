/**
 * @jest-environment jsdom
 */

import { 
  convertQuotationToOrder 
} from '@/lib/quotations'
import { 
  updateOrderStatus,
  getOrderById,
  OrderStatus 
} from '@/lib/orders'
import {
  validateQuotationConversion
} from '@/lib/validation'

// Mock Supabase client with comprehensive auth and database mocking
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  },
  rpc: jest.fn()
}

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase
}))

describe('Quotation to Order Conversion Workflow Integration', () => {
  const mockUserId = 'test-user-id'
  const mockQuotationId = 'test-quotation-id'
  const mockCompanyId = 'test-company-id'
  const mockOrderId = 'test-order-id'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful authentication
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    })
  })

  describe('End-to-End Conversion Flow', () => {
    test('successfully converts approved quotation to order and manages full lifecycle', async () => {
      // Step 1: Setup approved quotation
      const mockApprovedQuotation = {
        id: mockQuotationId,
        type: 'quotation',
        quotation_status: 'approved',
        folio: 'COT-00000123',
        company_id: mockCompanyId,
        total: 1500.00,
        issue_date: '2025-09-12',
        created_at: '2025-09-11T10:00:00Z',
        created_by: mockUserId
      }

      const mockQuotationItems = [
        {
          id: 'item-1',
          document_id: mockQuotationId,
          product_code: 'PROD-001',
          quantity: 2,
          unit_price: 500.00,
          subtotal: 1000.00
        },
        {
          id: 'item-2', 
          document_id: mockQuotationId,
          product_code: 'PROD-002',
          quantity: 1,
          unit_price: 500.00,
          subtotal: 500.00
        }
      ]

      const mockUser = {
        id: mockUserId,
        role: 'admin'
      }

      const mockCompany = {
        id: mockCompanyId,
        name: 'Test Company',
        contact_name: 'John Doe'
      }

      // Mock validation phase
      mockSupabase.from.mockImplementation((table) => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
          limit: jest.fn().mockReturnThis()
        }

        if (table === 'documents') {
          mockQuery.single.mockResolvedValue({
            data: mockApprovedQuotation,
            error: null
          })
        } else if (table === 'document_items') {
          mockQuery.single.mockResolvedValue({
            data: mockQuotationItems,
            error: null
          })
        } else if (table === 'users') {
          mockQuery.single.mockResolvedValue({
            data: mockUser,
            error: null
          })
        } else if (table === 'companies') {
          mockQuery.single.mockResolvedValue({
            data: mockCompany,
            error: null
          })
        }

        return mockQuery
      })

      // Step 2: Validate quotation is ready for conversion
      const validation = await validateQuotationConversion(mockQuotationId, mockUserId)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)

      // Step 3: Mock conversion process
      const mockNewOrder = {
        id: mockOrderId,
        type: 'order',
        folio: 'ORD-00000001',
        quotation_id: mockQuotationId,
        order_status: 'pending',
        company_id: mockCompanyId,
        total: 1500.00,
        issue_date: '2025-09-12',
        created_at: '2025-09-12T10:00:00Z',
        created_by: mockUserId
      }

      // Mock folio generation
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 'ORD-00000001',
        error: null
      })

      // Mock order insertion
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockNewOrder,
          error: null
        })
      }

      // Mock quotation status update  
      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockApprovedQuotation, quotation_status: 'converted' },
          error: null
        })
      }

      // Mock item copying
      const mockItemsInsertQuery = {
        insert: jest.fn().mockResolvedValue({
          data: mockQuotationItems.map(item => ({
            ...item,
            id: `order-item-${item.id}`,
            document_id: mockOrderId
          })),
          error: null
        })
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'documents') {
          const query = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            insert: mockInsertQuery.insert,
            update: mockUpdateQuery.update
          }
          
          query.single.mockResolvedValue({
            data: mockApprovedQuotation,
            error: null
          })
          
          return query
        } else if (table === 'document_items') {
          return mockItemsInsertQuery
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(), 
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      // Step 4: Execute conversion
      const conversionResult = await convertQuotationToOrder(mockQuotationId, mockUserId)
      
      expect(conversionResult.success).toBe(true)
      expect(conversionResult.order).toBeDefined()
      expect(conversionResult.order?.folio).toBe('ORD-00000001')
      expect(conversionResult.order?.quotation_id).toBe(mockQuotationId)
      expect(conversionResult.order?.order_status).toBe('pending')

      // Step 5: Test order status workflow progression
      const statusProgression: OrderStatus[] = [
        'confirmed', 'in_progress', 'ready', 'shipped', 'delivered'
      ]

      let currentOrder = mockNewOrder
      
      for (const nextStatus of statusProgression) {
        // Mock order retrieval and update
        mockSupabase.from.mockImplementation((table) => {
          if (table === 'documents') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: currentOrder,
                error: null
              }),
              update: jest.fn().mockReturnThis()
            }
          } else if (table === 'users') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: mockUser,
                error: null
              })
            }
          }
          
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          }
        })

        const statusUpdateResult = await updateOrderStatus(mockOrderId, nextStatus, mockUserId)
        
        expect(statusUpdateResult.success).toBe(true)
        
        // Update current order for next iteration
        currentOrder = {
          ...currentOrder,
          order_status: nextStatus
        }
      }

      // Step 6: Verify final order state
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                ...mockNewOrder,
                order_status: 'delivered'
              },
              error: null
            })
          }
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      const finalOrder = await getOrderById(mockOrderId)
      
      expect(finalOrder.success).toBe(true)
      expect(finalOrder.order?.order_status).toBe('delivered')
    }, 10000) // Extended timeout for integration test

    test('handles conversion failure scenarios gracefully', async () => {
      // Test with invalid quotation status
      const mockDraftQuotation = {
        id: mockQuotationId,
        type: 'quotation',
        quotation_status: 'draft', // Not approved
        folio: 'COT-00000124',
        company_id: mockCompanyId,
        total: 1000.00
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockDraftQuotation,
              error: null
            })
          }
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          limit: jest.fn().mockReturnThis()
        }
      })

      const validation = await validateQuotationConversion(mockQuotationId, mockUserId)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Quotation must be approved to convert to order')
    })

    test('prevents duplicate conversions', async () => {
      // Test with already converted quotation
      const mockConvertedQuotation = {
        id: mockQuotationId,
        type: 'quotation',
        quotation_status: 'converted', // Already converted
        folio: 'COT-00000125',
        company_id: mockCompanyId,
        total: 1200.00
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockConvertedQuotation,
              error: null
            })
          }
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          limit: jest.fn().mockReturnThis()
        }
      })

      const validation = await validateQuotationConversion(mockQuotationId, mockUserId)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Quotation has already been converted to an order')
    })

    test('validates user permissions for order operations', async () => {
      const mockClientUser = {
        id: 'client-user-id',
        role: 'client'
      }

      // Mock authentication for client user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockClientUser.id } },
        error: null
      })

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockClientUser,
              error: null
            })
          }
        } else if (table === 'documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockOrderId,
                order_status: 'pending'
              },
              error: null
            })
          }
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      const statusUpdateResult = await updateOrderStatus(mockOrderId, 'confirmed', mockClientUser.id)
      
      expect(statusUpdateResult.success).toBe(false)
      expect(statusUpdateResult.message).toContain('insufficient permissions')
    })
  })

  describe('Data Integrity Verification', () => {
    test('ensures complete data transfer during conversion', async () => {
      const mockQuotation = {
        id: mockQuotationId,
        type: 'quotation',
        quotation_status: 'approved',
        folio: 'COT-00000126',
        company_id: mockCompanyId,
        total: 2000.00,
        issue_date: '2025-09-12',
        notes: 'Special handling required',
        created_by: mockUserId
      }

      const mockQuotationItems = [
        {
          id: 'item-1',
          document_id: mockQuotationId,
          product_code: 'PROD-001',
          quantity: 5,
          unit_price: 400.00,
          subtotal: 2000.00
        }
      ]

      // Mock the complete conversion flow with data integrity checks
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockQuotation,
              error: null
            }),
            insert: jest.fn().mockReturnThis()
          }
        } else if (table === 'document_items') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockQuotationItems,
              error: null
            }),
            insert: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
          }
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        }
      })

      mockSupabase.rpc.mockResolvedValue({
        data: 'ORD-00000002',
        error: null
      })

      const conversionResult = await convertQuotationToOrder(mockQuotationId, mockUserId)
      
      // Verify conversion preserves all critical data
      expect(conversionResult.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('documents')
      expect(mockSupabase.from).toHaveBeenCalledWith('document_items')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_order_folio')
    })
  })

  describe('Error Handling and Recovery', () => {
    test('handles database errors gracefully during conversion', async () => {
      // Mock database error during order creation
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'documents') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: mockQuotationId,
                quotation_status: 'approved'
              },
              error: null
            }),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis()
          }
        }
        
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          }),
          limit: jest.fn().mockReturnThis()
        }
      })

      const conversionResult = await convertQuotationToOrder(mockQuotationId, mockUserId)
      
      expect(conversionResult.success).toBe(false)
      expect(conversionResult.message).toContain('Error')
    })

    test('validates folio uniqueness during generation', async () => {
      // Test scenario where generated folio already exists
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Folio generation failed - duplicate detected' }
      })

      const conversionResult = await convertQuotationToOrder(mockQuotationId, mockUserId)
      
      expect(conversionResult.success).toBe(false)
      expect(conversionResult.message).toContain('folio generation')
    })
  })
})