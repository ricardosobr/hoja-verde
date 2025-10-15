/**
 * @jest-environment jsdom
 */

import {
  validateOrderStatusTransition,
  getValidNextOrderStatuses,
  updateOrderStatus,
  getOrderById,
  getOrdersList,
  canCancelOrder,
  getOrderStatusDisplay,
  OrderStatus
} from '@/lib/orders'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
}

// Mock validation
jest.mock('@/lib/validation', () => ({
  validateOrderStatusTransition: jest.fn()
}))

jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase
}))

describe('Order Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateOrderStatusTransition', () => {
    test('allows valid status transitions', () => {
      const validTransitions = [
        ['pending', 'confirmed'],
        ['confirmed', 'in_progress'],
        ['in_progress', 'ready'],
        ['ready', 'shipped'],
        ['shipped', 'delivered']
      ]

      validTransitions.forEach(([from, to]) => {
        const result = validateOrderStatusTransition(from as OrderStatus, to as OrderStatus)
        expect(result.isValid).toBe(true)
        expect(result.reason).toBeUndefined()
      })
    })

    test('rejects invalid status transitions', () => {
      const invalidTransitions = [
        ['pending', 'shipped'],
        ['confirmed', 'delivered'],
        ['delivered', 'pending'],
        ['cancelled', 'confirmed']
      ]

      invalidTransitions.forEach(([from, to]) => {
        const result = validateOrderStatusTransition(from as OrderStatus, to as OrderStatus)
        expect(result.isValid).toBe(false)
        expect(result.reason).toBeDefined()
      })
    })

    test('rejects same status transitions', () => {
      const result = validateOrderStatusTransition('pending', 'pending')
      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('already set')
    })

    test('rejects transitions from final states', () => {
      const finalStates: OrderStatus[] = ['delivered', 'cancelled']
      
      finalStates.forEach(status => {
        const result = validateOrderStatusTransition(status, 'pending')
        expect(result.isValid).toBe(false)
        expect(result.reason).toContain(`Cannot change status of ${status}`)
      })
    })
  })

  describe('getValidNextOrderStatuses', () => {
    test('returns correct next statuses for each status', () => {
      const expectedTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['in_progress', 'cancelled'],
        in_progress: ['ready', 'cancelled'],
        ready: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: [],
        cancelled: []
      }

      Object.entries(expectedTransitions).forEach(([status, expected]) => {
        const result = getValidNextOrderStatuses(status as OrderStatus)
        expect(result).toEqual(expected)
      })
    })
  })

  describe('updateOrderStatus', () => {
    const mockOrderId = 'test-order-id'
    const mockUserId = 'test-user-id'

    beforeEach(() => {
      // Mock validation to pass by default
      require('@/lib/validation').validateOrderStatusTransition.mockReturnValue({
        valid: true,
        errors: [],
        warnings: []
      })
    })

    test('successfully updates order status', async () => {
      const mockOrder = {
        order_status: 'pending',
        folio: 'ORD-00000001'
      }

      const mockUser = {
        role: 'admin'
      }

      // Mock queries
      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOrder, error: null })
      }

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      }

      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      }

      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { 
            id: 'history-1',
            old_status: 'pending',
            new_status: 'confirmed',
            changed_by: mockUserId,
            changed_at: new Date().toISOString()
          }, 
          error: null 
        })
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'documents') {
          return {
            ...mockOrderQuery,
            ...mockUpdate
          }
        }
        if (table === 'users') {
          return mockUserQuery
        }
        if (table === 'status_history') {
          return mockInsert
        }
        return mockOrderQuery
      })

      const result = await updateOrderStatus(mockOrderId, 'confirmed', mockUserId, 'Manual confirmation')

      expect(result.success).toBe(true)
      expect(result.message).toContain('confirmed')
      expect(result.statusHistory).toBeDefined()
    })

    test('fails when order not found', async () => {
      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return mockUserQuery
        }
        return mockOrderQuery
      })

      const result = await updateOrderStatus(mockOrderId, 'confirmed', mockUserId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Failed to fetch order data')
    })

    test('fails validation and returns error', async () => {
      const mockOrder = {
        order_status: 'delivered',
        folio: 'ORD-00000001'
      }

      const mockUser = {
        role: 'admin'
      }

      // Mock validation failure
      require('@/lib/validation').validateOrderStatusTransition.mockReturnValue({
        valid: false,
        errors: ['Cannot change status of delivered orders'],
        warnings: []
      })

      const mockOrderQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOrder, error: null })
      }

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return mockUserQuery
        }
        return mockOrderQuery
      })

      const result = await updateOrderStatus(mockOrderId, 'pending', mockUserId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Cannot change status of delivered orders')
    })
  })

  describe('getOrderById', () => {
    test('successfully retrieves order data', async () => {
      const mockOrderId = 'test-order-id'
      const mockOrderData = {
        id: mockOrderId,
        folio: 'ORD-00000001',
        order_status: 'pending',
        document_items: [],
        companies: {
          name: 'Test Company',
          contact_name: 'Test Contact',
          email: 'test@example.com',
          phone: '+1234567890'
        },
        quotation: {
          folio: 'COT-00000001',
          issue_date: '2025-01-01'
        }
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOrderData, error: null })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getOrderById(mockOrderId)

      expect(result.success).toBe(true)
      expect(result.order).toEqual(mockOrderData)
    })

    test('handles order not found', async () => {
      const mockOrderId = 'non-existent-id'

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getOrderById(mockOrderId)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Order not found')
    })
  })

  describe('getOrdersList', () => {
    test('successfully retrieves orders list', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          folio: 'ORD-00000001',
          order_status: 'pending'
        },
        {
          id: 'order-2',
          folio: 'ORD-00000002',
          order_status: 'confirmed'
        }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ 
          data: mockOrders, 
          error: null, 
          count: 2 
        })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getOrdersList({})

      expect(result.success).toBe(true)
      expect(result.orders).toEqual(mockOrders)
      expect(result.totalCount).toBe(2)
    })

    test('handles database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' }, 
          count: 0 
        })
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await getOrdersList({})

      expect(result.success).toBe(false)
      expect(result.orders).toEqual([])
      expect(result.totalCount).toBe(0)
    })
  })

  describe('canCancelOrder', () => {
    test('returns true for cancellable order statuses', () => {
      const cancellableStatuses: OrderStatus[] = ['pending', 'confirmed', 'in_progress', 'ready']
      
      cancellableStatuses.forEach(status => {
        expect(canCancelOrder(status)).toBe(true)
      })
    })

    test('returns false for non-cancellable order statuses', () => {
      const nonCancellableStatuses: OrderStatus[] = ['shipped', 'delivered', 'cancelled']
      
      nonCancellableStatuses.forEach(status => {
        expect(canCancelOrder(status)).toBe(false)
      })
    })
  })

  describe('getOrderStatusDisplay', () => {
    test('returns correct display information for all statuses', () => {
      const statusTests = [
        { status: 'pending', expectedLabel: 'Pendiente', expectedColor: 'text-yellow-700' },
        { status: 'confirmed', expectedLabel: 'Confirmada', expectedColor: 'text-blue-700' },
        { status: 'in_progress', expectedLabel: 'En Proceso', expectedColor: 'text-purple-700' },
        { status: 'ready', expectedLabel: 'Lista', expectedColor: 'text-indigo-700' },
        { status: 'shipped', expectedLabel: 'Enviada', expectedColor: 'text-orange-700' },
        { status: 'delivered', expectedLabel: 'Entregada', expectedColor: 'text-green-700' },
        { status: 'cancelled', expectedLabel: 'Cancelada', expectedColor: 'text-red-700' }
      ]

      statusTests.forEach(({ status, expectedLabel, expectedColor }) => {
        const result = getOrderStatusDisplay(status as OrderStatus)
        expect(result.label).toBe(expectedLabel)
        expect(result.color).toBe(expectedColor)
        expect(result.bgColor).toBeDefined()
      })
    })
  })
})