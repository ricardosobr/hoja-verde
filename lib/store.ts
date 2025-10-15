import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// User state
interface User {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'client'
  status: 'active' | 'inactive' | 'pending'
  companyId?: string
  companyName?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isLoading: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

// Dashboard state
interface TrendData {
  value: number
  isPositive: boolean
  percentage: number
}

interface DashboardMetrics {
  totalQuotations: number
  totalOrders: number
  totalClients: number
  totalProducts: number
  totalRevenue: number
  conversionRate: number
  averageQuoteValue: number
  trends: {
    revenueGrowth: TrendData
    quotationsGrowth: TrendData
    ordersGrowth: TrendData
    clientsGrowth: TrendData
  }
  recentQuotations: Array<{
    id: string
    folio: string
    companyName: string
    total: number
    status: string
    createdAt: string
  }>
  statusDistribution: Array<{
    status: string
    count: number
    percentage?: number
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
    quotations: number
    orders: number
  }>
}

interface DashboardState {
  metrics: DashboardMetrics | null
  isLoading: boolean
  lastUpdated: string | null
  setMetrics: (metrics: DashboardMetrics) => void
  setLoading: (loading: boolean) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  isLoading: false,
  lastUpdated: null,
  setMetrics: (metrics) => set({ 
    metrics, 
    isLoading: false,
    lastUpdated: new Date().toISOString()
  }),
  setLoading: (isLoading) => set({ isLoading }),
}))

// Quotation form state
interface QuotationItem {
  id: string
  productId: string
  productCode: string
  productName: string
  unit: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  subtotal: number
  total: number
}

interface QuotationFormState {
  companyId: string
  clientId: string
  contactName: string
  contactEmail: string
  contactPhone: string
  validityDays: number
  terms: string
  deliveryTerms: string
  paymentTerms: string
  items: QuotationItem[]
  subtotal: number
  taxAmount: number
  total: number
  setCompany: (companyId: string) => void
  setClient: (clientId: string, contactName: string, contactEmail: string, contactPhone: string) => void
  setTerms: (terms: string, deliveryTerms: string, paymentTerms: string) => void
  addItem: (item: QuotationItem) => void
  updateItem: (id: string, updates: Partial<QuotationItem>) => void
  removeItem: (id: string) => void
  calculateTotals: () => void
  reset: () => void
}

export const useQuotationFormStore = create<QuotationFormState>((set, get) => ({
  companyId: '',
  clientId: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  validityDays: 30,
  terms: 'Se entrega en el lugar y tiempo requerido por Ustedes PRECIO + IVA en productos determinados. MONEDA: PESOS MEXICANOS NO HAY DEVOLUCIONES NO HAY CANCELACIONES, DE SER ASÍ SE COBRA EL 25% ENTREGA GRATUITA EN SUS INSTALACIONES',
  deliveryTerms: 'Plazo de entrega de 4 a 7 días hábiles',
  paymentTerms: 'Contra entrega',
  items: [],
  subtotal: 0,
  taxAmount: 0,
  total: 0,
  
  setCompany: (companyId) => set({ companyId }),
  
  setClient: (clientId, contactName, contactEmail, contactPhone) => 
    set({ clientId, contactName, contactEmail, contactPhone }),
  
  setTerms: (terms, deliveryTerms, paymentTerms) => 
    set({ terms, deliveryTerms, paymentTerms }),
  
  addItem: (item) => {
    set((state) => ({ items: [...state.items, item] }))
    get().calculateTotals()
  },
  
  updateItem: (id, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }))
    get().calculateTotals()
  },
  
  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
    get().calculateTotals()
  },
  
  calculateTotals: () => {
    const { items } = get()
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0)
    const total = subtotal + taxAmount
    set({ subtotal, taxAmount, total })
  },
  
  reset: () => set({
    companyId: '',
    clientId: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    validityDays: 30,
    terms: 'Se entrega en el lugar y tiempo requerido por Ustedes PRECIO + IVA en productos determinados. MONEDA: PESOS MEXICANOS NO HAY DEVOLUCIONES NO HAY CANCELACIONES, DE SER ASÍ SE COBRA EL 25% ENTREGA GRATUITA EN SUS INSTALACIONES',
    deliveryTerms: 'Plazo de entrega de 4 a 7 días hábiles',
    paymentTerms: 'Contra entrega',
    items: [],
    subtotal: 0,
    taxAmount: 0,
    total: 0,
  }),
}))

// Notification state
interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }))
    
    // Auto-remove after duration (default 5 seconds)
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
    }, notification.duration || 5000)
  },
  
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  
  clearAll: () => set({ notifications: [] }),
}))