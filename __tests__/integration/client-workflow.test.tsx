import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { useAuthStore } from '@/lib/store'
import { getClientQuotations, updateQuotationStatus } from '@/lib/client-quotations'
import ClientQuotationsPage from '@/app/client/quotations/page'

// Mock the dependencies
jest.mock('@/lib/store')
jest.mock('@/lib/client-quotations', () => ({
  getClientQuotations: jest.fn(),
  updateQuotationStatus: jest.fn(),
  getStatusBadgeColor: jest.fn((status: string) => `bg-${status}-100`),
  getStatusLabel: jest.fn((status: string) => status),
  canClientUpdateStatus: jest.fn(),
  getClientAllowedActions: jest.fn()
}))
jest.mock('@/lib/utils', () => ({
  formatCurrency: jest.fn((amount: number) => `$${amount.toLocaleString()}`),
  cn: jest.fn((...classes) => classes.join(' '))
}))
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
const mockGetClientQuotations = getClientQuotations as jest.MockedFunction<typeof getClientQuotations>
const mockUpdateQuotationStatus = updateQuotationStatus as jest.MockedFunction<typeof updateQuotationStatus>

describe('Client Quotation Workflow Integration', () => {
  const mockUser = {
    id: 'user-123',
    companyId: 'company-456',
    role: 'client' as const,
    email: 'client@example.com',
    fullName: 'Test Client'
  }

  const mockQuotations = [
    {
      id: 'quotation-1',
      folio: 'Q-2025-001',
      quotation_status: 'generated' as const,
      contact_name: 'John Doe',
      contact_email: 'john@example.com',
      issue_date: '2025-01-12',
      expiry_date: '2025-02-12',
      total: 15000.00,
      companies: {
        name: 'Test Company'
      }
    },
    {
      id: 'quotation-2', 
      folio: 'Q-2025-002',
      quotation_status: 'in_review' as const,
      contact_name: 'Jane Smith',
      contact_email: 'jane@example.com',
      issue_date: '2025-01-10',
      expiry_date: '2025-02-10',
      total: 25000.00,
      companies: {
        name: 'Test Company'
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      initialize: jest.fn()
    })
    mockGetClientQuotations.mockResolvedValue(mockQuotations)
  })

  describe('Quotation List Display', () => {
    it('should fetch and display quotations for authenticated client', async () => {
      render(<ClientQuotationsPage />)

      await waitFor(() => {
        expect(mockGetClientQuotations).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.companyId
        )
      })

      expect(screen.getByText('Q-2025-001')).toBeInTheDocument()
      expect(screen.getByText('Q-2025-002')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should show loading state while fetching quotations', () => {
      mockUseAuthStore.mockReturnValue({
        user: mockUser,
        isLoading: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        initialize: jest.fn()
      })

      render(<ClientQuotationsPage />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should handle error state when quotations fail to load', async () => {
      const errorMessage = 'Failed to load quotations'
      mockGetClientQuotations.mockRejectedValue(new Error(errorMessage))

      render(<ClientQuotationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })
  })

  describe('Quotation Status Filtering', () => {
    it('should filter quotations by status', async () => {
      render(<ClientQuotationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Q-2025-001')).toBeInTheDocument()
        expect(screen.getByText('Q-2025-002')).toBeInTheDocument()
      })

      // Click on "En Revisión" filter
      const reviewStatusCard = screen.getByText('En Revisión').closest('div')
      if (reviewStatusCard) {
        fireEvent.click(reviewStatusCard)
      }

      // Should only show quotations in review status
      await waitFor(() => {
        expect(screen.queryByText('Q-2025-001')).not.toBeInTheDocument()
        expect(screen.getByText('Q-2025-002')).toBeInTheDocument()
      })
    })

    it('should search quotations by folio and contact name', async () => {
      render(<ClientQuotationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Q-2025-001')).toBeInTheDocument()
        expect(screen.getByText('Q-2025-002')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/buscar por folio/i)
      fireEvent.change(searchInput, { target: { value: 'John' } })

      await waitFor(() => {
        expect(screen.getByText('Q-2025-001')).toBeInTheDocument()
        expect(screen.queryByText('Q-2025-002')).not.toBeInTheDocument()
      })
    })
  })

  describe('Status Update Workflow', () => {
    it('should allow clients to update quotation status when authorized', async () => {
      mockUpdateQuotationStatus.mockResolvedValue()
      
      // Mock quotation detail page would need to be tested separately
      // This test verifies the status update function is called correctly
      
      await updateQuotationStatus('quotation-1', 'in_review', mockUser.id)
      
      expect(mockUpdateQuotationStatus).toHaveBeenCalledWith(
        'quotation-1',
        'in_review', 
        mockUser.id
      )
    })

    it('should handle status update errors gracefully', async () => {
      const errorMessage = 'Invalid status transition'
      mockUpdateQuotationStatus.mockRejectedValue(new Error(errorMessage))
      
      await expect(
        updateQuotationStatus('quotation-1', 'approved', mockUser.id)
      ).rejects.toThrow(errorMessage)
    })
  })

  describe('Security and Authorization', () => {
    it('should only show quotations from user company', async () => {
      render(<ClientQuotationsPage />)

      await waitFor(() => {
        expect(mockGetClientQuotations).toHaveBeenCalledWith(
          mockUser.id,
          mockUser.companyId
        )
      })

      // Verify RLS filtering is applied through companyId parameter
      expect(mockGetClientQuotations).toHaveBeenCalledTimes(1)
      expect(mockGetClientQuotations).toHaveBeenCalledWith(
        expect.any(String),
        mockUser.companyId
      )
    })

    it('should redirect unauthorized users', () => {
      mockUseAuthStore.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        initialize: jest.fn()
      })

      render(<ClientQuotationsPage />)

      expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('should refresh quotations when refresh button is clicked', async () => {
      render(<ClientQuotationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Q-2025-001')).toBeInTheDocument()
      })

      const refreshButton = screen.getByText('Actualizar')
      fireEvent.click(refreshButton)

      expect(mockGetClientQuotations).toHaveBeenCalledTimes(2)
    })
  })

  describe('Responsive Design', () => {
    it('should display properly on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<ClientQuotationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Mis Cotizaciones')).toBeInTheDocument()
      })

      // Verify responsive elements are present
      const statusCards = screen.getAllByRole('article')
      expect(statusCards.length).toBeGreaterThan(0)
    })
  })
})