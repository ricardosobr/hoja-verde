import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { ClientSidebar } from '@/components/client/client-sidebar'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock the auth store
jest.mock('@/lib/store', () => ({
  useAuthStore: jest.fn(),
}))

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('ClientSidebar', () => {
  const mockUser = {
    id: '1',
    email: 'client@test.com',
    fullName: 'Test Client',
    role: 'client' as const,
    status: 'active' as const,
    companyId: 'company1',
    companyName: 'Test Company'
  }

  const mockLogout = jest.fn()

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isLoading: false,
      setUser: jest.fn(),
      setLoading: jest.fn(),
    })
    mockUsePathname.mockReturnValue('/client')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders sidebar with user information', () => {
    render(<ClientSidebar />)
    
    expect(screen.getByText('Hoja Verde')).toBeInTheDocument()
    expect(screen.getByText('Portal Cliente')).toBeInTheDocument()
    expect(screen.getByText(mockUser.fullName)).toBeInTheDocument()
    expect(screen.getByText(mockUser.companyName!)).toBeInTheDocument()
  })

  it('renders navigation items', () => {
    render(<ClientSidebar />)
    
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Mis Cotizaciones')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/client/quotations')
    render(<ClientSidebar />)
    
    const quotationsLink = screen.getByText('Mis Cotizaciones').closest('a')
    expect(quotationsLink).toHaveClass('bg-green-100', 'text-green-600')
  })

  it('calls logout when logout button is clicked', () => {
    render(<ClientSidebar />)
    
    const logoutButton = screen.getByText('Cerrar Sesión')
    fireEvent.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('can be collapsed and expanded', () => {
    render(<ClientSidebar />)
    
    // Find the button that contains the chevron icon
    const buttons = screen.getAllByRole('button')
    const collapseButton = buttons.find(button => {
      const svg = button.querySelector('svg')
      return svg && (svg.classList.contains('lucide-chevron-left') || svg.classList.contains('lucide-chevron-right'))
    })
    
    expect(collapseButton).toBeInTheDocument()
    
    // Initially expanded - should show text content
    expect(screen.getByText('Hoja Verde')).toBeInTheDocument()
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument()
    
    // Collapse
    fireEvent.click(collapseButton!)
    
    // After collapse, the text should be hidden but the logout button should still exist
    const logoutButtons = screen.getAllByRole('button')
    const logoutButton = logoutButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-log-out')
    )
    expect(logoutButton).toBeInTheDocument()
  })

  it('handles user without company name', () => {
    mockUseAuthStore.mockReturnValue({
      user: { ...mockUser, companyName: undefined },
      logout: mockLogout,
      isLoading: false,
      setUser: jest.fn(),
      setLoading: jest.fn(),
    })

    render(<ClientSidebar />)
    
    expect(screen.getByText(mockUser.email)).toBeInTheDocument()
  })
})