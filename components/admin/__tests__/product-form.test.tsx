import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductForm } from '../product-form'

// Mock the form validation schema
jest.mock('zod', () => ({
  z: {
    object: jest.fn(() => ({
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      string: jest.fn().mockReturnThis(),
      number: jest.fn().mockReturnThis(),
      int: jest.fn().mockReturnThis(),
      boolean: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
      default: jest.fn().mockReturnThis(),
    })),
  },
}))

// Mock react-hook-form
const mockRegister = jest.fn()
const mockHandleSubmit = jest.fn()
const mockWatch = jest.fn()
const mockSetValue = jest.fn()

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    watch: mockWatch,
    setValue: mockSetValue,
    formState: { errors: {} },
  }),
}))

const mockProps = {
  categories: [
    { id: '1', name: 'Category 1', description: 'Test category' },
    { id: '2', name: 'Category 2', description: 'Another category' },
  ],
  onClose: jest.fn(),
  onSubmit: jest.fn(),
}

describe('ProductForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWatch.mockReturnValue(0) // Default values for cost_price, profit_margin, etc.
  })

  it('renders form fields correctly', () => {
    render(<ProductForm {...mockProps} />)
    
    expect(screen.getByLabelText(/product code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/unit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cost price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/profit margin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/public price/i)).toBeInTheDocument()
  })

  it('renders create mode correctly', () => {
    render(<ProductForm {...mockProps} />)
    
    expect(screen.getByText('Add New Product')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument()
  })

  it('renders edit mode correctly', () => {
    const product = {
      id: '1',
      code: 'TEST001',
      name: 'Test Product',
      description: 'A test product',
      category_id: '1',
      unit: 'PIEZA',
      cost_price: 100,
      profit_margin: 0.25,
      base_price: 125,
      public_price: 150,
      tax_id: null,
      tax_included: false,
      stock_quantity: 10,
      min_stock_level: 5,
      is_active: true,
    }

    render(<ProductForm {...mockProps} product={product} />)
    
    expect(screen.getByText('Edit Product')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update product/i })).toBeInTheDocument()
  })

  it('displays all category options', () => {
    render(<ProductForm {...mockProps} />)
    
    const categorySelect = screen.getByLabelText(/category/i)
    expect(categorySelect).toBeInTheDocument()
    
    // Check for default option
    expect(screen.getByText('Select a category')).toBeInTheDocument()
  })

  it('displays all unit options', () => {
    render(<ProductForm {...mockProps} />)
    
    const unitSelect = screen.getByLabelText(/unit/i)
    expect(unitSelect).toBeInTheDocument()
    
    // Check for some unit options
    expect(screen.getByDisplayValue('PIEZA')).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<ProductForm {...mockProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<ProductForm {...mockProps} />)
    
    const closeButton = screen.getByRole('button', { name: '' }) // X button has no text
    await user.click(closeButton)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('shows loading state during form submission', () => {
    // Mock loading state
    const mockUseState = jest.spyOn(React, 'useState')
    mockUseState.mockReturnValueOnce([true, jest.fn()]) // isLoading = true
    
    render(<ProductForm {...mockProps} />)
    
    expect(screen.getByText(/creating.../i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled()
  })

  it('handles form submission for new product', async () => {
    mockHandleSubmit.mockImplementation((fn) => fn)
    
    render(<ProductForm {...mockProps} />)
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    expect(mockHandleSubmit).toHaveBeenCalled()
  })

  it('shows all required field labels with asterisks', () => {
    render(<ProductForm {...mockProps} />)
    
    expect(screen.getByText(/product code \*/i)).toBeInTheDocument()
    expect(screen.getByText(/product name \*/i)).toBeInTheDocument()
    expect(screen.getByText(/unit \*/i)).toBeInTheDocument()
    expect(screen.getByText(/cost price \*/i)).toBeInTheDocument()
    expect(screen.getByText(/profit margin \(/i)).toBeInTheDocument()
    expect(screen.getByText(/public price \*/i)).toBeInTheDocument()
  })
})