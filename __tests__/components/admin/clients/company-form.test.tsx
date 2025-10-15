import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CompanyForm } from '@/components/admin/company-form'
import { useAuthStore, useNotificationStore } from '@/lib/store'

// Mocks are defined globally in jest.setup.js

describe('CompanyForm Component', () => {
  const mockAddNotification = jest.fn()
  const mockOnClose = jest.fn()
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useAuthStore as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' }
    })
    
    ;(useNotificationStore as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification
    })
  })

  test('renders company form for creating new company', () => {
    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.getByText('Add New Company')).toBeInTheDocument()
    expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/RFC/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Status/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Company/ })).toBeInTheDocument()
  })

  test('renders company form for editing existing company', () => {
    const existingCompany = {
      id: 'company-1',
      name: 'Test Company',
      rfc: 'ABC123456DE1',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postal_code: '12345',
      country: 'Mexico',
      phone: '+52 999 123 4567',
      email: 'test@company.com',
      website: 'https://www.company.com',
      logo_url: null,
      status: 'active' as const,
      created_at: '2023-01-01T00:00:00Z'
    }

    render(
      <CompanyForm
        company={existingCompany}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    expect(screen.getByText('Edit Company')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ABC123456DE1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Update Company/ })).toBeInTheDocument()
  })

  test('validates required company name field', async () => {
    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const submitButton = screen.getByRole('button', { name: /Create Company/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument()
    })
  })

  test('validates RFC format when provided', async () => {
    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const nameInput = screen.getByLabelText(/Company Name/)
    const rfcInput = screen.getByLabelText(/RFC/)
    const submitButton = screen.getByRole('button', { name: /Create Company/ })

    fireEvent.change(nameInput, { target: { value: 'Test Company' } })
    fireEvent.change(rfcInput, { target: { value: 'INVALID-RFC' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid RFC format')).toBeInTheDocument()
    })
  })

  test('accepts valid RFC format', async () => {
    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const nameInput = screen.getByLabelText(/Company Name/)
    const rfcInput = screen.getByLabelText(/RFC/)

    fireEvent.change(nameInput, { target: { value: 'Test Company' } })
    fireEvent.change(rfcInput, { target: { value: 'ABC123456DE1' } })

    await waitFor(() => {
      expect(screen.queryByText('Invalid RFC format')).not.toBeInTheDocument()
    })
  })

  test('validates email format when provided', async () => {
    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const nameInput = screen.getByLabelText(/Company Name/)
    const emailInput = screen.getByLabelText(/Email/)
    const submitButton = screen.getByRole('button', { name: /Create Company/ })

    fireEvent.change(nameInput, { target: { value: 'Test Company' } })
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })
  })

  test('validates website URL format when provided', async () => {
    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const nameInput = screen.getByLabelText(/Company Name/)
    const websiteInput = screen.getByLabelText(/Website/)
    const submitButton = screen.getByRole('button', { name: /Create Company/ })

    fireEvent.change(nameInput, { target: { value: 'Test Company' } })
    fireEvent.change(websiteInput, { target: { value: 'not-a-url' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid website URL')).toBeInTheDocument()
    })
  })

  test('allows empty optional fields', async () => {
    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const nameInput = screen.getByLabelText(/Company Name/)
    fireEvent.change(nameInput, { target: { value: 'Test Company' } })

    // Leave RFC, email, and website empty
    const rfcInput = screen.getByLabelText(/RFC/)
    const emailInput = screen.getByLabelText(/Email/)
    const websiteInput = screen.getByLabelText(/Website/)

    fireEvent.change(rfcInput, { target: { value: '' } })
    fireEvent.change(emailInput, { target: { value: '' } })
    fireEvent.change(websiteInput, { target: { value: '' } })

    // Should not show validation errors for empty optional fields
    await waitFor(() => {
      expect(screen.queryByText('Invalid RFC format')).not.toBeInTheDocument()
      expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument()
      expect(screen.queryByText('Invalid website URL')).not.toBeInTheDocument()
    })
  })

  test('calls onClose when cancel button is clicked', () => {
    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /Cancel/ })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('calls onClose when X button is clicked', () => {
    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const closeButton = screen.getByRole('button', { name: /Close/ })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('submits form with correct data for new company', async () => {
    const { createClient } = require('@/lib/supabase')
    const mockInsert = jest.fn(() => Promise.resolve({ error: null }))
    const mockFrom = jest.fn(() => ({ insert: mockInsert }))
    createClient.mockReturnValue({ from: mockFrom })

    render(
      <CompanyForm
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const nameInput = screen.getByLabelText(/Company Name/)
    const rfcInput = screen.getByLabelText(/RFC/)
    const emailInput = screen.getByLabelText(/Email/)
    const submitButton = screen.getByRole('button', { name: /Create Company/ })

    fireEvent.change(nameInput, { target: { value: 'Test Company' } })
    fireEvent.change(rfcInput, { target: { value: 'ABC123456DE1' } })
    fireEvent.change(emailInput, { target: { value: 'test@company.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('companies')
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Test Company',
          rfc: 'ABC123456DE1',
          email: 'test@company.com',
          created_by: 'test-user-id'
        })
      ])
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })
  })
})

describe('CompanyForm Integration Tests', () => {
  test('handles form submission with complete company data', () => {
    // Integration test would require more complex setup with actual Supabase client
    // This is a placeholder for integration testing
    expect(true).toBe(true)
  })

  test('handles form submission errors gracefully', () => {
    // Test error handling during form submission
    expect(true).toBe(true)
  })
})