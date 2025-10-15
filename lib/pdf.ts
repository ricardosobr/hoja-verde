import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface QuotationPDFData {
  id: string;
  folio: string;
  status: string;
  createdAt: string;
  validUntil: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  company: {
    id: string;
    name: string;
    rfc: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    contactName?: string;
    logo?: string;
  };
  items: Array<{
    id: string;
    productName: string;
    productCode: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    tax: number;
    total: number;
  }>;
  issuer?: {
    name: string;
    rfc: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    draft: 'BORRADOR',
    generated: 'GENERADA',
    approved: 'APROBADA',
    rejected: 'RECHAZADA',
    expired: 'EXPIRADA',
  };
  return statusLabels[status] || status.toUpperCase();
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    draft: '#6B7280',
    generated: '#3B82F6',
    approved: '#10B981',
    rejected: '#EF4444',
    expired: '#F59E0B',
  };
  return statusColors[status] || '#6B7280';
};

export const createPDFStyles = () => StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyInfo: {
    flex: 1,
  },
  documentInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#111827',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 5,
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
    color: '#4B5563',
  },
  boldText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  column: {
    flexDirection: 'column',
    flex: 1,
  },
  clientSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    padding: 8,
    color: '#FFFFFF',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #E5E7EB',
    padding: 8,
    minHeight: 30,
  },
  tableCell: {
    fontSize: 9,
    color: '#4B5563',
  },
  productCodeCell: {
    width: '10%',
  },
  productNameCell: {
    width: '35%',
  },
  quantityCell: {
    width: '10%',
    textAlign: 'center',
  },
  unitPriceCell: {
    width: '15%',
    textAlign: 'right',
  },
  subtotalCell: {
    width: '15%',
    textAlign: 'right',
  },
  totalCell: {
    width: '15%',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    width: 250,
  },
  totalLabel: {
    fontSize: 10,
    width: 100,
    textAlign: 'right',
    marginRight: 20,
    color: '#4B5563',
  },
  totalValue: {
    fontSize: 10,
    width: 100,
    textAlign: 'right',
    color: '#111827',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
    paddingTop: 10,
    borderTop: '2px solid #1F2937',
    width: 250,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
    marginRight: 20,
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 5,
  },
  statusBadge: {
    padding: '5px 10px',
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 60,
    opacity: 0.1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notesSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#374151',
  },
  notesText: {
    fontSize: 9,
    color: '#4B5563',
    lineHeight: 1.4,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 30,
    fontSize: 8,
    color: '#9CA3AF',
  },
});

export const generatePDFFileName = (folio: string, companyName: string): string => {
  const sanitizedCompany = companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const date = format(new Date(), 'yyyyMMdd');
  return `cotizacion_${folio}_${sanitizedCompany}_${date}.pdf`;
};

export const shouldShowWatermark = (status: string): boolean => {
  return ['draft', 'rejected', 'expired'].includes(status);
};

export const calculateTaxAmount = (subtotal: number, taxRate: number = 0.16): number => {
  return subtotal * taxRate;
};

export const calculateTotalWithTax = (subtotal: number, taxRate: number = 0.16): number => {
  return subtotal * (1 + taxRate);
};

export const validatePDFData = (data: QuotationPDFData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.folio) errors.push('Folio es requerido');
  if (!data.company?.name) errors.push('Nombre del cliente es requerido');
  if (!data.company?.rfc) errors.push('RFC del cliente es requerido');
  if (!data.items || data.items.length === 0) errors.push('Debe incluir al menos un producto');
  
  if (data.items) {
    data.items.forEach((item, index) => {
      if (!item.productName) errors.push(`Producto ${index + 1}: Nombre es requerido`);
      if (item.quantity <= 0) errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
      if (item.unitPrice < 0) errors.push(`Producto ${index + 1}: Precio no puede ser negativo`);
    });
  }

  if (data.total < 0) errors.push('El total no puede ser negativo');

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const DEFAULT_ISSUER = {
  name: 'Hoja Verde S.A. de C.V.',
  rfc: 'HVE240101ABC',
  address: 'Av. Reforma 123',
  city: 'Ciudad de México',
  state: 'CDMX',
  zip: '06600',
  phone: '(55) 1234-5678',
  email: 'ventas@hojaverde.mx',
};