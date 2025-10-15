import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/admin/products',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...args) => args.filter(Boolean).join(' ')),
  validateRFC: jest.fn((rfc) => {
    const rfcPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-V1-9][A-Z1-9][0-9A]$/
    return rfcPattern.test(rfc)
  }),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString('es-MX')),
}))

// Mock stores
jest.mock('@/lib/store', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'test-user-id' },
  })),
  useNotificationStore: jest.fn(() => ({
    addNotification: jest.fn(),
  })),
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: jest.fn(() => ({
          range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
        })),
        range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
      })),
    })),
  })),
}))

// Mock @react-pdf/renderer
jest.mock('@react-pdf/renderer', () => ({
  Document: jest.fn(({ children }) => children),
  Page: jest.fn(({ children }) => children),
  Text: jest.fn(({ children }) => children),
  View: jest.fn(({ children }) => children),
  Image: jest.fn(() => null),
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
  PDFDownloadLink: jest.fn(({ children }) => {
    if (typeof children === 'function') {
      return children({ blob: null, url: '', loading: false, error: null })
    }
    return children
  }),
  PDFViewer: jest.fn(({ children }) => children),
  Font: {
    register: jest.fn(),
  },
}))

// Global mocks are defined here to fix path resolution issues