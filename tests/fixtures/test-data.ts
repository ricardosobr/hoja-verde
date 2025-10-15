/**
 * Test data fixtures for Playwright tests
 * Contains test users, products, quotations, and other test data
 */

export const testUsers = {
  admin: {
    email: 'admin@hojaverde.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  client: {
    email: 'cliente@ejemplo.com', 
    password: 'cliente123',
    role: 'client',
    companyId: 'test-company-id',
    name: 'Cliente Ejemplo',
    company: 'Empresa de Prueba'
  },
  testClient2: {
    email: 'cliente2@test.com',
    password: 'cliente123',
    role: 'client',
    companyId: 'test-company-2',
    name: 'John Doe',
    company: 'Test Company 2'
  }
};

export const testProducts = [
  {
    code: 'PROD001',
    name: 'Test Product 1',
    description: 'First test product',
    costPrice: 100,
    profitMargin: 0.3,
    publicPrice: 150,
    unit: 'pcs',
    category: 'categoria-test',
    isActive: true
  },
  {
    code: 'PROD002',
    name: 'Test Product 2',
    description: 'Second test product',
    costPrice: 200,
    profitMargin: 0.25,
    publicPrice: 300,
    unit: 'kg',
    category: 'categoria-test-2',
    isActive: true
  },
  {
    code: 'PROD003',
    name: 'Discontinued Product',
    description: 'Product no longer available',
    costPrice: 50,
    profitMargin: 0.4,
    publicPrice: 75,
    unit: 'pcs',
    category: 'categoria-test',
    isActive: false
  }
];

export const testQuotations = [
  {
    folio: 'COT-TEST001',
    contactName: 'John Doe',
    contactEmail: 'john@test.com',
    contactPhone: '+1234567890',
    companyId: 'test-company-id',
    validityDays: 30,
    status: 'generated',
    total: 1500.00,
    subtotal: 1300.00,
    taxes: 200.00,
    items: [
      {
        productId: 'PROD001',
        quantity: 5,
        unitPrice: 150,
        total: 750
      },
      {
        productId: 'PROD002',
        quantity: 2,
        unitPrice: 300,
        total: 600
      }
    ]
  },
  {
    folio: 'COT-TEST002',
    contactName: 'Jane Smith',
    contactEmail: 'jane@test.com',
    contactPhone: '+1987654321',
    companyId: 'test-company-2',
    validityDays: 15,
    status: 'in_review',
    total: 900.00,
    subtotal: 800.00,
    taxes: 100.00,
    items: [
      {
        productId: 'PROD001',
        quantity: 3,
        unitPrice: 150,
        total: 450
      }
    ]
  }
];

export const testCompanies = [
  {
    id: 'test-company-id',
    name: 'Empresa de Prueba',
    rfc: 'EMP123456789',
    address: 'Calle Test 123, Ciudad de Prueba',
    phone: '+52 55 1234 5678',
    email: 'info@empresaprueba.com',
    contactPerson: 'María González',
    isActive: true
  },
  {
    id: 'test-company-2',
    name: 'Test Company 2',
    rfc: 'TC2123456789',
    address: '456 Test Street, Test City',
    phone: '+1 555 123 4567',
    email: 'contact@testcompany2.com',
    contactPerson: 'John Smith',
    isActive: true
  }
];

export const testOrders = [
  {
    id: 'ORD-TEST001',
    quotationId: 'COT-TEST001',
    folio: 'ORD-TEST001',
    status: 'confirmed',
    total: 1500.00,
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    deliveryAddress: 'Dirección de entrega 123',
    notes: 'Orden de prueba para testing'
  }
];

export const testDeliveries = [
  {
    id: 'DEL-TEST001',
    orderId: 'ORD-TEST001',
    folio: 'DEL-TEST001',
    status: 'pending',
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    address: 'Dirección de entrega 123',
    contactPerson: 'John Doe',
    contactPhone: '+1234567890'
  }
];

/**
 * Common test selectors and locators
 */
export const selectors = {
  // Authentication
  emailInput: 'input[type="email"], input[name="email"]',
  passwordInput: 'input[type="password"], input[name="password"]',
  loginButton: 'button[type="submit"], button:has-text("Iniciar sesión")',
  logoutButton: 'button:has-text("Cerrar sesión")',
  userMenu: '[data-testid="user-menu"]',
  
  // Navigation
  adminSidebar: '[data-testid="admin-sidebar"]',
  clientSidebar: '[data-testid="client-sidebar"]',
  dashboardLink: 'a:has-text("Dashboard")',
  quotationsLink: 'a:has-text("Cotizaciones")',
  productsLink: 'a:has-text("Productos")',
  clientsLink: 'a:has-text("Clientes")',
  ordersLink: 'a:has-text("Órdenes")',
  
  // Forms
  saveButton: 'button:has-text("Guardar")',
  cancelButton: 'button:has-text("Cancelar")',
  createButton: 'button:has-text("Crear"), button:has-text("Nuevo")',
  editButton: 'button:has-text("Editar")',
  deleteButton: 'button:has-text("Eliminar")',
  
  // Tables and lists
  dataTable: '[data-testid*="table"], table',
  tableRow: 'tbody tr',
  noDataMessage: ':has-text("No hay datos"), :has-text("Sin resultados")',
  
  // Notifications
  successNotification: '.toast:has-text("exitosamente"), .toast:has-text("éxito")',
  errorNotification: '.toast:has-text("error"), .toast:has-text("Error")',
  
  // Loading states
  loadingSpinner: '[data-testid="loading"], .spinner, :has-text("Cargando")',
  
  // PDF
  pdfDownloadButton: 'button:has-text("Descargar PDF")',
  
  // Status badges
  statusBadge: '[data-testid*="status"], .badge'
};

/**
 * Common test data generators
 */
export const generators = {
  randomEmail: () => `test${Date.now()}@example.com`,
  randomPhone: () => `+52${Math.floor(Math.random() * 1000000000)}`,
  randomString: (length = 8) => Math.random().toString(36).substring(2, length + 2),
  randomNumber: (min = 1, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min,
  
  generateProduct: (overrides = {}) => ({
    code: `PROD${Date.now()}`,
    name: `Test Product ${generators.randomString()}`,
    description: `Test product description ${generators.randomString()}`,
    costPrice: generators.randomNumber(50, 500),
    profitMargin: 0.3,
    publicPrice: 0, // Will be calculated
    unit: 'pcs',
    category: 'test-category',
    isActive: true,
    ...overrides
  }),
  
  generateQuotation: (overrides = {}) => ({
    contactName: `Test Contact ${generators.randomString()}`,
    contactEmail: generators.randomEmail(),
    contactPhone: generators.randomPhone(),
    companyId: 'test-company-id',
    validityDays: 30,
    status: 'generated',
    ...overrides
  }),
  
  generateCompany: (overrides = {}) => ({
    name: `Test Company ${generators.randomString()}`,
    rfc: `RFC${generators.randomString().toUpperCase()}123`,
    address: `Test Address ${generators.randomNumber()}`,
    phone: generators.randomPhone(),
    email: generators.randomEmail(),
    contactPerson: `Contact ${generators.randomString()}`,
    isActive: true,
    ...overrides
  })
};

/**
 * Test environment configuration
 */
export const testConfig = {
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    veryLong: 60000
  },
  
  urls: {
    base: process.env.TEST_BASE_URL || 'http://localhost:3000',
    login: '/',
    adminDashboard: '/admin/dashboard',
    clientDashboard: '/client',
    adminQuotations: '/admin/quotations',
    adminProducts: '/admin/products',
    adminClients: '/admin/clients',
    clientQuotations: '/client/quotations'
  },
  
  viewport: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }
};