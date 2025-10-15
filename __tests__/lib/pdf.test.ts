import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  generatePDFFileName,
  shouldShowWatermark,
  calculateTaxAmount,
  calculateTotalWithTax,
  validatePDFData,
  QuotationPDFData,
} from '@/lib/pdf';

describe('PDF Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1500.50)).toBe('$1,500.50');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-500)).toBe('-$500.00');
    });

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });
  });

  describe('formatDate', () => {
    it('should format valid date strings', () => {
      expect(formatDate('2024-01-15')).toContain('15');
      expect(formatDate('2024-01-15')).toContain('enero');
      expect(formatDate('2024-01-15')).toContain('2024');
    });

    it('should handle invalid dates gracefully', () => {
      expect(formatDate('invalid-date')).toBe('invalid-date');
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct labels for known statuses', () => {
      expect(getStatusLabel('draft')).toBe('BORRADOR');
      expect(getStatusLabel('generated')).toBe('GENERADA');
      expect(getStatusLabel('approved')).toBe('APROBADA');
      expect(getStatusLabel('rejected')).toBe('RECHAZADA');
      expect(getStatusLabel('expired')).toBe('EXPIRADA');
    });

    it('should handle unknown statuses', () => {
      expect(getStatusLabel('unknown')).toBe('UNKNOWN');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for known statuses', () => {
      expect(getStatusColor('draft')).toBe('#6B7280');
      expect(getStatusColor('generated')).toBe('#3B82F6');
      expect(getStatusColor('approved')).toBe('#10B981');
      expect(getStatusColor('rejected')).toBe('#EF4444');
      expect(getStatusColor('expired')).toBe('#F59E0B');
    });

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('#6B7280');
    });
  });

  describe('generatePDFFileName', () => {
    it('should generate proper filename', () => {
      const filename = generatePDFFileName('FOL-001', 'Test Company');
      expect(filename).toContain('cotizacion_FOL-001_test_company_');
      expect(filename).toContain('.pdf');
    });

    it('should sanitize company name', () => {
      const filename = generatePDFFileName('FOL-001', 'Test & Company!@#');
      expect(filename).toContain('test___company___');
    });
  });

  describe('shouldShowWatermark', () => {
    it('should return true for draft, rejected, and expired statuses', () => {
      expect(shouldShowWatermark('draft')).toBe(true);
      expect(shouldShowWatermark('rejected')).toBe(true);
      expect(shouldShowWatermark('expired')).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(shouldShowWatermark('generated')).toBe(false);
      expect(shouldShowWatermark('approved')).toBe(false);
    });
  });

  describe('calculateTaxAmount', () => {
    it('should calculate tax with default rate', () => {
      expect(calculateTaxAmount(1000)).toBe(160);
      expect(calculateTaxAmount(500)).toBe(80);
    });

    it('should calculate tax with custom rate', () => {
      expect(calculateTaxAmount(1000, 0.10)).toBe(100);
      expect(calculateTaxAmount(1000, 0.20)).toBe(200);
    });
  });

  describe('calculateTotalWithTax', () => {
    it('should calculate total with default tax rate', () => {
      expect(calculateTotalWithTax(1000)).toBe(1160);
      expect(calculateTotalWithTax(500)).toBe(580);
    });

    it('should calculate total with custom tax rate', () => {
      expect(calculateTotalWithTax(1000, 0.10)).toBe(1100);
      expect(calculateTotalWithTax(1000, 0.20)).toBe(1200);
    });
  });

  describe('validatePDFData', () => {
    const validData: QuotationPDFData = {
      id: '1',
      folio: 'FOL-001',
      status: 'generated',
      createdAt: '2024-01-01',
      validUntil: '2024-01-31',
      subtotal: 1000,
      tax: 160,
      discount: 0,
      total: 1160,
      company: {
        id: '1',
        name: 'Test Company',
        rfc: 'RFC123456',
        address: '123 Main St',
        city: 'City',
        state: 'State',
        zip: '12345',
        phone: '555-1234',
        email: 'test@company.com',
      },
      items: [
        {
          id: '1',
          productName: 'Product 1',
          productCode: 'P001',
          quantity: 1,
          unitPrice: 1000,
          subtotal: 1000,
          tax: 160,
          total: 1160,
        },
      ],
    };

    it('should validate correct PDF data', () => {
      const result = validatePDFData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing folio', () => {
      const data = { ...validData, folio: '' };
      const result = validatePDFData(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Folio es requerido');
    });

    it('should detect missing company name', () => {
      const data = { ...validData, company: { ...validData.company, name: '' } };
      const result = validatePDFData(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Nombre del cliente es requerido');
    });

    it('should detect missing RFC', () => {
      const data = { ...validData, company: { ...validData.company, rfc: '' } };
      const result = validatePDFData(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('RFC del cliente es requerido');
    });

    it('should detect empty items array', () => {
      const data = { ...validData, items: [] };
      const result = validatePDFData(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Debe incluir al menos un producto');
    });

    it('should detect invalid item quantity', () => {
      const data = {
        ...validData,
        items: [{ ...validData.items[0], quantity: 0 }],
      };
      const result = validatePDFData(data);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Cantidad debe ser mayor a 0');
    });

    it('should detect negative unit price', () => {
      const data = {
        ...validData,
        items: [{ ...validData.items[0], unitPrice: -100 }],
      };
      const result = validatePDFData(data);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Precio no puede ser negativo');
    });

    it('should detect negative total', () => {
      const data = { ...validData, total: -100 };
      const result = validatePDFData(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('El total no puede ser negativo');
    });
  });
});