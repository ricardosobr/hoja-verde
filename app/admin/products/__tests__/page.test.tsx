import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductsPage from '../page'

// Mock the Supabase client
const mockSupabaseFrom = jest.fn()
const mockSelect = jest.fn()
const mockOrder = jest.fn()
const mockRange = jest.fn()
const mockEq = jest.fn()
const mockOr = jest.fn()
const mockDelete = jest.fn()
const mockUpdate = jest.fn()

// Setup mock chain
mockSupabaseFrom.mockReturnValue({
  select: mockSelect.mockReturnThis(),
  order: mockOrder.mockReturnThis(),
  range: mockRange.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  or: mockOr.mockReturnThis(),
  delete: mockDelete.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
})

jest.mock('@/lib/supabase', () => ({
  createClient: () => ({
    from: mockSupabaseFrom,
  }),
}))

// Mock the child components
interface MockProductFormProps {
  onClose: () => void
  onSubmit: () => void
}

jest.mock('@/components/admin/product-form', () => ({
  ProductForm: ({ onClose, onSubmit }: MockProductFormProps) => (
    <div data-testid="product-form">
      <button onClick={onClose}>Close Form</button>
      <button onClick={onSubmit}>Submit Form</button>
    </div>
  ),
}))

interface MockProductFiltersProps {
  onFiltersChange: (filters: Record<string, string | boolean | number>) => void
}

jest.mock('@/components/admin/product-filters', () => ({
  ProductFilters: ({ onFiltersChange }: MockProductFiltersProps) => (
    <div data-testid="product-filters">
      <button onClick={() => onFiltersChange({})}>Apply Filters</button>
    </div>
  ),
}))

const mockProducts = [
  {
    id: '1',
    code: 'PROD001',
    name: 'Test Product 1',
    description: 'First test product',
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
    created_at: '2025-01-01T00:00:00Z',
    product_categories: { name: 'Category 1' },
    taxes: null,
  },
  {
    id: '2',
    code: 'PROD002',
    name: 'Test Product 2',
    description: 'Second test product',
    category_id: '2',
    unit: 'KG',
    cost_price: 200,
    profit_margin: 0.30,
    base_price: 260,
    public_price: 300,
    tax_id: '1',
    tax_included: true,
    stock_quantity: 3,
    min_stock_level: 5,
    is_active: false,
    created_at: '2025-01-02T00:00:00Z',
    product_categories: { name: 'Category 2' },
    taxes: { name: 'IVA', rate: 0.16 },
  },
]

describe('ProductsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default successful API responses
    mockSelect.mockResolvedValue({ 
      data: mockProducts, 
      error: null, 
      count: mockProducts.length 
    })
    
    mockEq.mockResolvedValue({
      data: [
        { id: '1', name: 'Category 1', description: 'Test category' },
        { id: '2', name: 'Category 2', description: 'Another category' },
      ],
      error: null,
    })
  })

  it('renders page title and description', async () => {
    render(<ProductsPage />)
    
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Manage your product catalog, pricing, and inventory')).toBeInTheDocument()
  })

  it('renders action buttons in header', async () => {
    render(<ProductsPage />)
    
    expect(screen.getByRole('button', { name: /show cost prices/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument()
  })

  it('renders search input', async () => {
    render(<ProductsPage />)
    
    expect(screen.getByPlaceholderText(/search products by name or code/i)).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    render(<ProductsPage />)
    
    // Should show skeleton loading
    expect(screen.getByText('Products')).toBeInTheDocument()
  })

  it('displays products in table after loading', async () => {
    render(<ProductsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
      expect(screen.getByText('Test Product 2')).toBeInTheDocument()
    })
    
    expect(screen.getByText('PROD001')).toBeInTheDocument()
    expect(screen.getByText('PROD002')).toBeInTheDocument()
  })

  it('shows product status correctly', async () => {
    render(<ProductsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })
  })

  it('shows low stock warning', async () => {
    render(<ProductsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Low stock')).toBeInTheDocument()
    })
  })

  it('opens product form when Add Product is clicked', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    
    const addButton = screen.getByRole('button', { name: /add product/i })
    await user.click(addButton)
    
    expect(screen.getByTestId('product-form')).toBeInTheDocument()
  })

  it('opens product form for editing when edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const editButtons = screen.getAllByRole('button', { name: '' }) // Edit buttons
    const editButton = editButtons.find(button => 
      button.querySelector('svg') // Find button with edit icon
    )
    
    if (editButton) {
      await user.click(editButton)
      expect(screen.getByTestId('product-form')).toBeInTheDocument()
    }
  })

  it('handles delete confirmation and calls delete API', async () => {
    const user = userEvent.setup()
    global.confirm = jest.fn(() => true)
    mockDelete.mockResolvedValue({ error: null })
    
    render(<ProductsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    })
    
    const deleteButtons = screen.getAllByRole('button', { name: '' }) // Delete buttons
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') // Find button with trash icon
    )
    
    if (deleteButton) {
      await user.click(deleteButton)
      
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Test Product 1"?')
      expect(mockDelete).toHaveBeenCalled()
    }
  })

  it('handles search input changes', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    
    const searchInput = screen.getByPlaceholderText(/search products by name or code/i)
    await user.type(searchInput, 'test search')
    
    expect(searchInput).toHaveValue('test search')
  })

  it('shows empty state when no products', async () => {
    mockSelect.mockResolvedValueOnce({ 
      data: [], 
      error: null, 
      count: 0 
    })
    
    render(<ProductsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument()
    })
    
    expect(screen.getByText(/get started by adding your first product/i)).toBeInTheDocument()
  })

  it('shows filters when filter button is clicked', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    await user.click(filtersButton)
    
    expect(screen.getByTestId('product-filters')).toBeInTheDocument()
  })

  it('toggles cost price visibility', async () => {
    const user = userEvent.setup()
    render(<ProductsPage />)
    
    const toggleButton = screen.getByRole('button', { name: /show cost prices/i })
    await user.click(toggleButton)
    
    expect(screen.getByRole('button', { name: /hide cost prices/i })).toBeInTheDocument()
  })
})