/**
 * Unit tests for pricing and tax calculation utilities
 * Validates all calculation logic including edge cases and error handling
 */

import {
  calculateBasePrice,
  calculatePublicPrice,
  calculateTaxAmount,
  calculateLineItem,
  calculateDocumentTotals,
  roundToPesos,
  validateDocumentTotals,
  createDefaultTaxConfig,
  calculateMultipleLineItems,
  calculateProductPricing,
  type TaxConfiguration,
  type LineItemCalculation
} from '../../lib/calculations';

describe('calculateBasePrice', () => {
  test('calculates base price correctly with positive margin', () => {
    expect(calculateBasePrice(100, 0.30)).toBe(130.00);
    expect(calculateBasePrice(50, 0.25)).toBe(62.50);
    expect(calculateBasePrice(200, 0.15)).toBe(230.00);
  });

  test('handles zero margin', () => {
    expect(calculateBasePrice(100, 0)).toBe(100.00);
  });

  test('handles zero cost price', () => {
    expect(calculateBasePrice(0, 0.30)).toBe(0.00);
  });

  test('rounds result to peso precision', () => {
    expect(calculateBasePrice(33.33, 0.15)).toBe(38.33);
    expect(calculateBasePrice(66.67, 0.12)).toBe(74.67);
  });

  test('throws error for negative cost price', () => {
    expect(() => calculateBasePrice(-100, 0.30)).toThrow('Cost price cannot be negative');
  });

  test('throws error for negative profit margin', () => {
    expect(() => calculateBasePrice(100, -0.30)).toThrow('Profit margin cannot be negative');
  });
});

describe('calculateTaxAmount', () => {
  const percentageTax: TaxConfiguration = {
    id: 'iva-16',
    name: 'IVA 16%',
    type: 'percentage',
    rate: 0.16,
    is_default: true,
    is_active: true
  };

  const fixedTax: TaxConfiguration = {
    id: 'fixed-10',
    name: 'Fixed $10',
    type: 'fixed_amount',
    amount: 10.00,
    is_default: false,
    is_active: true
  };

  const inactiveTax: TaxConfiguration = {
    id: 'inactive-tax',
    name: 'Inactive Tax',
    type: 'percentage',
    rate: 0.20,
    is_default: false,
    is_active: false
  };

  test('calculates percentage tax correctly', () => {
    expect(calculateTaxAmount(100, percentageTax)).toBe(16.00);
    expect(calculateTaxAmount(250.50, percentageTax)).toBe(40.08);
  });

  test('calculates fixed amount tax correctly', () => {
    expect(calculateTaxAmount(100, fixedTax)).toBe(10.00);
    expect(calculateTaxAmount(500, fixedTax)).toBe(10.00);
  });

  test('returns zero for inactive tax', () => {
    expect(calculateTaxAmount(100, inactiveTax)).toBe(0.00);
  });

  test('handles zero base amount', () => {
    expect(calculateTaxAmount(0, percentageTax)).toBe(0.00);
    expect(calculateTaxAmount(0, fixedTax)).toBe(10.00);
  });

  test('rounds result to peso precision', () => {
    const complexTax: TaxConfiguration = {
      id: 'complex',
      name: 'Complex Tax',
      type: 'percentage',
      rate: 0.163,
      is_default: false,
      is_active: true
    };
    expect(calculateTaxAmount(100, complexTax)).toBe(16.30);
  });

  test('throws error for negative base amount', () => {
    expect(() => calculateTaxAmount(-100, percentageTax)).toThrow('Base amount cannot be negative');
  });
});

describe('calculatePublicPrice', () => {
  const tax16: TaxConfiguration = {
    id: 'iva-16',
    name: 'IVA 16%',
    type: 'percentage',
    rate: 0.16,
    is_default: true,
    is_active: true
  };

  test('calculates public price with tax not included', () => {
    expect(calculatePublicPrice(100, tax16, false)).toBe(116.00);
    expect(calculatePublicPrice(250, tax16, false)).toBe(290.00);
  });

  test('returns base price when tax is included', () => {
    expect(calculatePublicPrice(100, tax16, true)).toBe(100.00);
    expect(calculatePublicPrice(250, tax16, true)).toBe(250.00);
  });

  test('throws error for negative base price', () => {
    expect(() => calculatePublicPrice(-100, tax16, false)).toThrow('Base price cannot be negative');
  });
});

describe('calculateLineItem', () => {
  test('calculates line item correctly', () => {
    const result = calculateLineItem(5, 100, 0.16);
    expect(result).toEqual({
      quantity: 5,
      unit_price: 100,
      tax_rate: 0.16,
      tax_amount: 80.00,
      subtotal: 500.00,
      total: 580.00
    });
  });

  test('handles decimal quantities', () => {
    const result = calculateLineItem(2.5, 50, 0.16);
    expect(result).toEqual({
      quantity: 2.5,
      unit_price: 50,
      tax_rate: 0.16,
      tax_amount: 20.00,
      subtotal: 125.00,
      total: 145.00
    });
  });

  test('handles zero tax rate', () => {
    const result = calculateLineItem(3, 100, 0);
    expect(result).toEqual({
      quantity: 3,
      unit_price: 100,
      tax_rate: 0,
      tax_amount: 0.00,
      subtotal: 300.00,
      total: 300.00
    });
  });

  test('handles zero quantity', () => {
    const result = calculateLineItem(0, 100, 0.16);
    expect(result).toEqual({
      quantity: 0,
      unit_price: 100,
      tax_rate: 0.16,
      tax_amount: 0.00,
      subtotal: 0.00,
      total: 0.00
    });
  });

  test('throws error for negative quantity', () => {
    expect(() => calculateLineItem(-1, 100, 0.16)).toThrow('Quantity cannot be negative');
  });

  test('throws error for negative unit price', () => {
    expect(() => calculateLineItem(1, -100, 0.16)).toThrow('Unit price cannot be negative');
  });

  test('throws error for negative tax rate', () => {
    expect(() => calculateLineItem(1, 100, -0.16)).toThrow('Tax rate cannot be negative');
  });
});

describe('calculateDocumentTotals', () => {
  const lineItem1: LineItemCalculation = {
    quantity: 2,
    unit_price: 100,
    tax_rate: 0.16,
    tax_amount: 32.00,
    subtotal: 200.00,
    total: 232.00
  };

  const lineItem2: LineItemCalculation = {
    quantity: 1,
    unit_price: 50,
    tax_rate: 0.16,
    tax_amount: 8.00,
    subtotal: 50.00,
    total: 58.00
  };

  test('calculates document totals correctly', () => {
    const result = calculateDocumentTotals([lineItem1, lineItem2]);
    expect(result).toEqual({
      subtotal: 250.00,
      tax_amount: 40.00,
      total: 290.00
    });
  });

  test('handles empty line items array', () => {
    const result = calculateDocumentTotals([]);
    expect(result).toEqual({
      subtotal: 0.00,
      tax_amount: 0.00,
      total: 0.00
    });
  });

  test('handles single line item', () => {
    const result = calculateDocumentTotals([lineItem1]);
    expect(result).toEqual({
      subtotal: 200.00,
      tax_amount: 32.00,
      total: 232.00
    });
  });

  test('throws error for non-array input', () => {
    expect(() => calculateDocumentTotals('not an array' as unknown as LineItemCalculation[])).toThrow('Line items must be an array');
  });
});

describe('roundToPesos', () => {
  test('rounds to 2 decimal places with banker\'s rounding', () => {
    expect(roundToPesos(100.123)).toBe(100.12);
    expect(roundToPesos(100.126)).toBe(100.13);
    expect(roundToPesos(100.125)).toBe(100.12); // Banker's rounding: round to even
    expect(roundToPesos(100.135)).toBe(100.14); // Banker's rounding: round to even
  });

  test('handles whole numbers', () => {
    expect(roundToPesos(100)).toBe(100.00);
    expect(roundToPesos(0)).toBe(0.00);
  });

  test('handles negative numbers', () => {
    expect(roundToPesos(-100.126)).toBe(-100.13);
    expect(roundToPesos(-0.001)).toBe(-0.00);
  });

  test('handles very small numbers', () => {
    expect(roundToPesos(0.001)).toBe(0.00);
    expect(roundToPesos(0.006)).toBe(0.01);
  });

  test('throws error for NaN', () => {
    expect(() => roundToPesos(NaN)).toThrow('Amount must be a valid number');
  });

  test('throws error for non-number input', () => {
    expect(() => roundToPesos('not a number' as unknown as number)).toThrow('Amount must be a valid number');
  });
});

describe('validateDocumentTotals', () => {
  test('validates correct totals', () => {
    const totals = {
      subtotal: 100.00,
      tax_amount: 16.00,
      total: 116.00
    };
    expect(validateDocumentTotals(totals)).toBe(true);
  });

  test('rejects incorrect totals', () => {
    const totals = {
      subtotal: 100.00,
      tax_amount: 16.00,
      total: 115.00 // Wrong total
    };
    expect(validateDocumentTotals(totals)).toBe(false);
  });

  test('handles rounding differences', () => {
    const totals = {
      subtotal: 100.33,
      tax_amount: 16.05,
      total: 116.38
    };
    expect(validateDocumentTotals(totals)).toBe(true);
  });
});

describe('createDefaultTaxConfig', () => {
  test('creates default IVA 16% configuration', () => {
    const config = createDefaultTaxConfig();
    expect(config).toEqual({
      id: 'default-iva-16',
      name: 'IVA 16%',
      type: 'percentage',
      rate: 0.16,
      is_default: true,
      is_active: true
    });
  });
});

describe('calculateMultipleLineItems', () => {
  test('calculates multiple line items', () => {
    const items = [
      { quantity: 2, unit_price: 100, tax_rate: 0.16 },
      { quantity: 1, unit_price: 50, tax_rate: 0.16 }
    ];

    const results = calculateMultipleLineItems(items);
    expect(results).toHaveLength(2);
    expect(results[0].total).toBe(232.00);
    expect(results[1].total).toBe(58.00);
  });

  test('handles empty array', () => {
    const results = calculateMultipleLineItems([]);
    expect(results).toHaveLength(0);
  });
});

describe('calculateProductPricing', () => {
  const taxConfig: TaxConfiguration = {
    id: 'iva-16',
    name: 'IVA 16%',
    type: 'percentage',
    rate: 0.16,
    is_default: true,
    is_active: true
  };

  test('calculates complete product pricing chain', () => {
    const result = calculateProductPricing(100, 0.30, taxConfig, false);
    expect(result).toEqual({
      cost_price: 100.00,
      profit_margin: 0.30,
      base_price: 130.00,
      public_price: 150.80,
      tax_id: 'iva-16',
      tax_included: false
    });
  });

  test('calculates pricing with tax included', () => {
    const result = calculateProductPricing(100, 0.30, taxConfig, true);
    expect(result).toEqual({
      cost_price: 100.00,
      profit_margin: 0.30,
      base_price: 130.00,
      public_price: 130.00,
      tax_id: 'iva-16',
      tax_included: true
    });
  });
});

// Edge cases and complex scenarios
describe('Edge Cases', () => {
  test('handles very high profit margins', () => {
    expect(calculateBasePrice(100, 5.0)).toBe(600.00); // 500% margin
  });

  test('handles very small amounts', () => {
    const result = calculateLineItem(0.001, 0.01, 0.16);
    expect(result.subtotal).toBe(0.00);
    expect(result.total).toBe(0.00);
  });

  test('handles large amounts', () => {
    const result = calculateLineItem(1000, 10000, 0.16);
    expect(result.subtotal).toBe(10000000.00);
    expect(result.tax_amount).toBe(1600000.00);
    expect(result.total).toBe(11600000.00);
  });

  test('complex rounding scenarios with banker\'s rounding', () => {
    // Test various rounding edge cases specific to Mexican peso with banker's rounding
    expect(roundToPesos(1.005)).toBe(1.00); // Round to even: 0 is even
    expect(roundToPesos(1.015)).toBe(1.02); // Round to even: 2 is even
    expect(roundToPesos(2.225)).toBe(2.22); // Round to even: 22 is even
    expect(roundToPesos(2.235)).toBe(2.24); // Round to even: 24 is even
  });
});