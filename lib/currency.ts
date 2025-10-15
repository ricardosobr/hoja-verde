/**
 * Currency Formatting Utilities for Mexican Peso
 * Handles all currency display and formatting requirements
 */

/**
 * Format amount as Mexican peso currency with proper localization
 */
export function formatMXNCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format amount as Mexican peso without currency symbol (for input fields)
 */
export function formatMXNNumber(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format amount with custom decimal places (for quantity fields)
 */
export function formatDecimal(amount: number, decimalPlaces: number = 3): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  if (decimalPlaces < 0 || decimalPlaces > 10) {
    throw new Error('Decimal places must be between 0 and 10');
  }
  
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(amount);
}

/**
 * Parse Mexican formatted number string to number
 */
export function parseMXNNumber(value: string): number {
  if (typeof value !== 'string') {
    throw new Error('Value must be a string');
  }
  
  // Remove currency symbols and spaces
  const cleanValue = value
    .replace(/[$\s]/g, '')  // Remove $ and spaces
    .replace(/,/g, '');     // Remove thousands separators
  
  const parsed = parseFloat(cleanValue);
  
  if (isNaN(parsed)) {
    throw new Error('Invalid number format');
  }
  
  return parsed;
}

/**
 * Format percentage with Mexican locale
 */
export function formatPercentage(value: number, decimalPlaces: number = 2): string {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('Value must be a valid number');
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
}

/**
 * Validate that a number represents a valid Mexican peso amount
 */
export function isValidMXNAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }
  
  // Check if amount has more than 2 decimal places (invalid for peso)
  // Use a more generous epsilon to handle floating point precision issues
  const rounded = Math.round(amount * 100) / 100;
  return Math.abs(amount - rounded) < 1e-10;
}

/**
 * Round to Mexican peso precision and validate
 */
export function roundAndValidateMXN(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  
  if (!isValidMXNAmount(rounded)) {
    throw new Error('Invalid Mexican peso amount');
  }
  
  return rounded;
}

/**
 * Format amount for display in data tables with proper alignment
 */
export function formatTableAmount(amount: number, showSymbol: boolean = true): string {
  const formatted = showSymbol ? formatMXNCurrency(amount) : formatMXNNumber(amount);
  
  // Ensure consistent width for table alignment
  return formatted.padStart(12, ' ');
}

/**
 * Create currency formatter instance for repeated use
 */
export function createMXNCurrencyFormatter() {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format compact currency for summary displays (K, M notation)
 */
export function formatCompactMXN(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount);
}

/**
 * Constants for Mexican peso formatting
 */
export const MXN_CURRENCY_CODE = 'MXN';
export const MXN_LOCALE = 'es-MX';
export const MXN_DECIMAL_PLACES = 2;
export const MXN_SYMBOL = '$';

/**
 * Default formatting options
 */
export const DEFAULT_MXN_FORMAT_OPTIONS = {
  style: 'currency' as const,
  currency: MXN_CURRENCY_CODE,
  minimumFractionDigits: MXN_DECIMAL_PLACES,
  maximumFractionDigits: MXN_DECIMAL_PLACES
} as const;