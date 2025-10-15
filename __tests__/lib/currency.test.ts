/**
 * Unit tests for Mexican peso currency formatting utilities
 * Validates formatting, parsing, and validation functions
 */

import {
  formatMXNCurrency,
  formatMXNNumber,
  formatDecimal,
  parseMXNNumber,
  formatPercentage,
  isValidMXNAmount,
  roundAndValidateMXN,
  formatTableAmount,
  createMXNCurrencyFormatter,
  formatCompactMXN,
  MXN_CURRENCY_CODE,
  MXN_LOCALE,
  MXN_DECIMAL_PLACES,
  MXN_SYMBOL,
  DEFAULT_MXN_FORMAT_OPTIONS
} from '../../lib/currency';

describe('formatMXNCurrency', () => {
  test('formats positive amounts correctly', () => {
    expect(formatMXNCurrency(1234.56)).toBe('$1,234.56');
    expect(formatMXNCurrency(100)).toBe('$100.00');
    expect(formatMXNCurrency(0.99)).toBe('$0.99');
  });

  test('formats zero correctly', () => {
    expect(formatMXNCurrency(0)).toBe('$0.00');
  });

  test('formats negative amounts correctly', () => {
    expect(formatMXNCurrency(-1234.56)).toBe('-$1,234.56');
  });

  test('handles very small amounts', () => {
    expect(formatMXNCurrency(0.01)).toBe('$0.01');
    expect(formatMXNCurrency(0.001)).toBe('$0.00');
  });

  test('handles large amounts', () => {
    expect(formatMXNCurrency(1000000)).toBe('$1,000,000.00');
    expect(formatMXNCurrency(1234567.89)).toBe('$1,234,567.89');
  });

  test('throws error for NaN', () => {
    expect(() => formatMXNCurrency(NaN)).toThrow('Amount must be a valid number');
  });

  test('throws error for non-number input', () => {
    expect(() => formatMXNCurrency('not a number' as unknown as number)).toThrow('Amount must be a valid number');
  });
});

describe('formatMXNNumber', () => {
  test('formats numbers without currency symbol', () => {
    expect(formatMXNNumber(1234.56)).toBe('1,234.56');
    expect(formatMXNNumber(100)).toBe('100.00');
    expect(formatMXNNumber(0)).toBe('0.00');
  });

  test('maintains 2 decimal places', () => {
    expect(formatMXNNumber(100)).toBe('100.00');
    expect(formatMXNNumber(100.1)).toBe('100.10');
    expect(formatMXNNumber(100.123)).toBe('100.12');
  });

  test('throws error for invalid input', () => {
    expect(() => formatMXNNumber(NaN)).toThrow('Amount must be a valid number');
  });
});

describe('formatDecimal', () => {
  test('formats with default 3 decimal places', () => {
    expect(formatDecimal(123.456)).toBe('123.456');
    expect(formatDecimal(100)).toBe('100.000');
  });

  test('formats with custom decimal places', () => {
    expect(formatDecimal(123.456, 2)).toBe('123.46');
    expect(formatDecimal(123.456, 4)).toBe('123.4560');
    expect(formatDecimal(123.456, 0)).toBe('123');
  });

  test('validates decimal places parameter', () => {
    expect(() => formatDecimal(123.456, -1)).toThrow('Decimal places must be between 0 and 10');
    expect(() => formatDecimal(123.456, 11)).toThrow('Decimal places must be between 0 and 10');
  });

  test('throws error for invalid number', () => {
    expect(() => formatDecimal(NaN)).toThrow('Amount must be a valid number');
  });
});

describe('parseMXNNumber', () => {
  test('parses formatted currency strings', () => {
    expect(parseMXNNumber('$1,234.56')).toBe(1234.56);
    expect(parseMXNNumber('$ 1,234.56')).toBe(1234.56);
    expect(parseMXNNumber('1,234.56')).toBe(1234.56);
  });

  test('parses simple number strings', () => {
    expect(parseMXNNumber('100')).toBe(100);
    expect(parseMXNNumber('100.50')).toBe(100.50);
    expect(parseMXNNumber('0')).toBe(0);
  });

  test('handles negative numbers', () => {
    expect(parseMXNNumber('-$1,234.56')).toBe(-1234.56);
    expect(parseMXNNumber('-1,234.56')).toBe(-1234.56);
  });

  test('throws error for invalid strings', () => {
    expect(() => parseMXNNumber('not a number')).toThrow('Invalid number format');
    expect(() => parseMXNNumber('')).toThrow('Invalid number format');
    expect(() => parseMXNNumber('abc')).toThrow('Invalid number format');
  });

  test('throws error for non-string input', () => {
    expect(() => parseMXNNumber(123 as unknown as string)).toThrow('Value must be a string');
  });
});

describe('formatPercentage', () => {
  test('formats percentages with default 2 decimal places', () => {
    expect(formatPercentage(0.16)).toBe('16.00%');
    expect(formatPercentage(0.30)).toBe('30.00%');
    expect(formatPercentage(1.0)).toBe('100.00%');
  });

  test('formats percentages with custom decimal places', () => {
    expect(formatPercentage(0.16, 0)).toBe('16%');
    expect(formatPercentage(0.16, 3)).toBe('16.000%');
    expect(formatPercentage(0.166, 1)).toBe('16.6%');
  });

  test('handles zero and negative percentages', () => {
    expect(formatPercentage(0)).toBe('0.00%');
    expect(formatPercentage(-0.05)).toBe('-5.00%');
  });

  test('throws error for invalid input', () => {
    expect(() => formatPercentage(NaN)).toThrow('Value must be a valid number');
  });
});

describe('isValidMXNAmount', () => {
  test('validates correct peso amounts', () => {
    expect(isValidMXNAmount(100.00)).toBe(true);
    expect(isValidMXNAmount(100.12)).toBe(true);
    expect(isValidMXNAmount(0.01)).toBe(true);
    expect(isValidMXNAmount(0)).toBe(true);
  });

  test('rejects amounts with more than 2 decimal places', () => {
    expect(isValidMXNAmount(100.123)).toBe(false);
    expect(isValidMXNAmount(100.001)).toBe(false);
  });

  test('rejects invalid numbers', () => {
    expect(isValidMXNAmount(NaN)).toBe(false);
    expect(isValidMXNAmount('not a number' as unknown as number)).toBe(false);
  });

  test('handles edge cases with floating point precision', () => {
    // 0.1 + 0.2 results in 0.30000000000000004 due to floating point precision
    // Our function should handle this correctly by using proper precision checking
    const result = 0.1 + 0.2;
    expect(isValidMXNAmount(result)).toBe(true); // Our function handles floating point precision
    expect(isValidMXNAmount(100.12)).toBe(true);
  });
});

describe('roundAndValidateMXN', () => {
  test('rounds and validates correct amounts', () => {
    expect(roundAndValidateMXN(100.123)).toBe(100.12);
    expect(roundAndValidateMXN(100.126)).toBe(100.13);
    expect(roundAndValidateMXN(100)).toBe(100.00);
  });

  test('handles negative amounts', () => {
    expect(roundAndValidateMXN(-100.123)).toBe(-100.12);
  });

  test('throws error for invalid input', () => {
    expect(() => roundAndValidateMXN(NaN)).toThrow('Amount must be a valid number');
    expect(() => roundAndValidateMXN('not a number' as unknown as number)).toThrow('Amount must be a valid number');
  });
});

describe('formatTableAmount', () => {
  test('formats amounts for table display with currency symbol', () => {
    const result = formatTableAmount(100.50, true);
    expect(result).toContain('$100.50');
    expect(result.length).toBeGreaterThanOrEqual(12); // Padded for alignment
  });

  test('formats amounts for table display without currency symbol', () => {
    const result = formatTableAmount(100.50, false);
    expect(result).toContain('100.50');
    expect(result).not.toContain('$');
    expect(result.length).toBeGreaterThanOrEqual(12);
  });

  test('defaults to showing currency symbol', () => {
    const result = formatTableAmount(100.50);
    expect(result).toContain('$100.50');
  });
});

describe('createMXNCurrencyFormatter', () => {
  test('creates formatter with correct configuration', () => {
    const formatter = createMXNCurrencyFormatter();
    expect(formatter.format(1234.56)).toBe('$1,234.56');
  });

  test('formatter is reusable', () => {
    const formatter = createMXNCurrencyFormatter();
    expect(formatter.format(100)).toBe('$100.00');
    expect(formatter.format(200)).toBe('$200.00');
  });
});

describe('formatCompactMXN', () => {
  test('formats large amounts in compact notation', () => {
    // Note: Compact notation varies by locale and Node.js version
    // Testing the key aspects: currency symbol and compact format
    const result1k = formatCompactMXN(1000);
    const result1_5k = formatCompactMXN(1500);
    const result1m = formatCompactMXN(1000000);
    const result1_5m = formatCompactMXN(1500000);
    
    expect(result1k).toMatch(/.*1.*k.*\$|.*\$.*1.*k/i); // Contains 1, k, and $ in any order
    expect(result1_5k).toMatch(/.*1\.5.*k.*\$|.*\$.*1\.5.*k/i); // Contains 1.5, k, and $
    expect(result1m).toMatch(/.*1.*m.*\$|.*\$.*1.*m/i); // Contains 1, m, and $
    expect(result1_5m).toMatch(/.*1\.5.*m.*\$|.*\$.*1\.5.*m/i); // Contains 1.5, m, and $
  });

  test('formats small amounts normally', () => {
    const result100 = formatCompactMXN(100);
    const result500 = formatCompactMXN(500);
    
    // For small amounts, should contain $ and the number
    expect(result100).toMatch(/\$.*100/);
    expect(result500).toMatch(/\$.*500/);
  });

  test('throws error for invalid input', () => {
    expect(() => formatCompactMXN(NaN)).toThrow('Amount must be a valid number');
  });
});

describe('Constants', () => {
  test('exports correct constants', () => {
    expect(MXN_CURRENCY_CODE).toBe('MXN');
    expect(MXN_LOCALE).toBe('es-MX');
    expect(MXN_DECIMAL_PLACES).toBe(2);
    expect(MXN_SYMBOL).toBe('$');
  });

  test('default format options are correct', () => {
    expect(DEFAULT_MXN_FORMAT_OPTIONS).toEqual({
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  });
});

// Integration tests with real-world scenarios
describe('Real-world formatting scenarios', () => {
  test('quotation line item formatting', () => {
    const unitPrice = 125.50;
    const quantity = 3.5;
    const subtotal = unitPrice * quantity;
    const taxRate = 0.16;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    expect(formatMXNCurrency(unitPrice)).toBe('$125.50');
    expect(formatDecimal(quantity)).toBe('3.500');
    expect(formatMXNCurrency(subtotal)).toBe('$439.25');
    expect(formatMXNCurrency(taxAmount)).toBe('$70.28');
    expect(formatMXNCurrency(total)).toBe('$509.53');
  });

  test('profit margin display formatting', () => {
    const margins = [0.15, 0.25, 0.30, 0.50];
    const formatted = margins.map(m => formatPercentage(m, 0));
    
    expect(formatted).toEqual(['15%', '25%', '30%', '50%']);
  });

  test('bulk pricing calculations with formatting', () => {
    const prices = [100.33, 250.67, 399.99];
    const taxRate = 0.16;
    
    const results = prices.map(price => {
      const tax = price * taxRate;
      const total = price + tax;
      return {
        price: formatMXNCurrency(price),
        tax: formatMXNCurrency(tax),
        total: formatMXNCurrency(total)
      };
    });

    expect(results[0]).toEqual({
      price: '$100.33',
      tax: '$16.05',
      total: '$116.38'
    });
  });

  test('currency parsing and re-formatting consistency', () => {
    const originalAmount = 1234.56;
    const formatted = formatMXNCurrency(originalAmount);
    const parsed = parseMXNNumber(formatted);
    const reformatted = formatMXNCurrency(parsed);
    
    expect(parsed).toBe(originalAmount);
    expect(reformatted).toBe(formatted);
  });
});