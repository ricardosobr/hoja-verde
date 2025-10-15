/**
 * Pricing and Tax Calculation Utilities
 * Handles all financial calculations for the Hoja Verde quotation system
 */

export interface TaxConfiguration {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_amount';
  rate?: number; // For percentage taxes (0.16 = 16%)
  amount?: number; // For fixed amount taxes
  is_default: boolean;
  is_active: boolean;
}

export interface ProductPricing {
  cost_price: number;
  profit_margin: number;
  base_price: number;
  public_price: number;
  tax_id: string;
  tax_included: boolean;
}

export interface LineItemCalculation {
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  total: number;
}

export interface DocumentTotals {
  subtotal: number;
  tax_amount: number;
  total: number;
}

/**
 * Calculate base price from cost price and profit margin
 * Formula: cost_price * (1 + profit_margin)
 */
export function calculateBasePrice(cost_price: number, profit_margin: number): number {
  if (cost_price < 0) {
    throw new Error('Cost price cannot be negative');
  }
  if (profit_margin < 0) {
    throw new Error('Profit margin cannot be negative');
  }
  
  const basePrice = cost_price * (1 + profit_margin);
  return roundToPesos(basePrice);
}

/**
 * Calculate public price based on base price and tax configuration
 */
export function calculatePublicPrice(
  base_price: number, 
  tax_config: TaxConfiguration, 
  tax_included: boolean
): number {
  if (base_price < 0) {
    throw new Error('Base price cannot be negative');
  }
  
  if (tax_included) {
    // If tax is included, public price = base price
    return roundToPesos(base_price);
  }
  
  // If tax is not included, add tax to base price
  const tax_amount = calculateTaxAmount(base_price, tax_config);
  return roundToPesos(base_price + tax_amount);
}

/**
 * Calculate tax amount based on base amount and tax configuration
 */
export function calculateTaxAmount(base_amount: number, tax_config: TaxConfiguration): number {
  if (base_amount < 0) {
    throw new Error('Base amount cannot be negative');
  }
  
  if (!tax_config.is_active) {
    return 0;
  }
  
  let tax_amount = 0;
  
  if (tax_config.type === 'percentage') {
    const rate = tax_config.rate || 0;
    tax_amount = base_amount * rate;
  } else if (tax_config.type === 'fixed_amount') {
    tax_amount = tax_config.amount || 0;
  }
  
  return roundToPesos(tax_amount);
}

/**
 * Calculate line item totals for quotation items
 */
export function calculateLineItem(
  quantity: number,
  unit_price: number,
  tax_rate: number
): LineItemCalculation {
  if (quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }
  if (unit_price < 0) {
    throw new Error('Unit price cannot be negative');
  }
  if (tax_rate < 0) {
    throw new Error('Tax rate cannot be negative');
  }
  
  const subtotal = roundToPesos(quantity * unit_price);
  const tax_amount = roundToPesos(subtotal * tax_rate);
  const total = roundToPesos(subtotal + tax_amount);
  
  return {
    quantity,
    unit_price,
    tax_rate,
    tax_amount,
    subtotal,
    total
  };
}

/**
 * Calculate document-level totals from array of line items
 */
export function calculateDocumentTotals(line_items: LineItemCalculation[]): DocumentTotals {
  if (!Array.isArray(line_items)) {
    throw new Error('Line items must be an array');
  }
  
  const subtotal = line_items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax_amount = line_items.reduce((sum, item) => sum + item.tax_amount, 0);
  const total = subtotal + tax_amount;
  
  return {
    subtotal: roundToPesos(subtotal),
    tax_amount: roundToPesos(tax_amount),
    total: roundToPesos(total)
  };
}

/**
 * Round amount to Mexican peso precision (2 decimal places)
 * Uses banker's rounding (round-half-to-even) for financial accuracy
 */
export function roundToPesos(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Amount must be a valid number');
  }
  
  // Banker's rounding: round-half-to-even for financial accuracy
  // Use parseFloat and toFixed to avoid floating point precision issues
  const multiplied = parseFloat((amount * 100).toFixed(10));
  const floored = Math.floor(multiplied);
  const fractional = multiplied - floored;
  
  // Use a small epsilon for comparison due to floating point precision
  const epsilon = 1e-10;
  
  if (fractional < 0.5 - epsilon) {
    return floored / 100;
  } else if (fractional > 0.5 + epsilon) {
    return Math.ceil(multiplied) / 100;
  } else {
    // Exactly 0.5: round to even
    return (floored % 2 === 0 ? floored : floored + 1) / 100;
  }
}

/**
 * Validate that document totals match constraint: total = subtotal + tax_amount
 */
export function validateDocumentTotals(totals: DocumentTotals): boolean {
  const calculated_total = roundToPesos(totals.subtotal + totals.tax_amount);
  return calculated_total === totals.total;
}

/**
 * Create default Mexican tax configuration (16% IVA)
 */
export function createDefaultTaxConfig(): TaxConfiguration {
  return {
    id: 'default-iva-16',
    name: 'IVA 16%',
    type: 'percentage',
    rate: 0.16,
    is_default: true,
    is_active: true
  };
}

/**
 * Batch calculate multiple line items
 */
export function calculateMultipleLineItems(
  items: Array<{
    quantity: number;
    unit_price: number;
    tax_rate: number;
  }>
): LineItemCalculation[] {
  return items.map(item => 
    calculateLineItem(item.quantity, item.unit_price, item.tax_rate)
  );
}

/**
 * Calculate pricing for product catalog (cost -> base -> public price chain)
 */
export function calculateProductPricing(
  cost_price: number,
  profit_margin: number,
  tax_config: TaxConfiguration,
  tax_included: boolean = false
): ProductPricing {
  const base_price = calculateBasePrice(cost_price, profit_margin);
  const public_price = calculatePublicPrice(base_price, tax_config, tax_included);
  
  return {
    cost_price: roundToPesos(cost_price),
    profit_margin,
    base_price,
    public_price,
    tax_id: tax_config.id,
    tax_included
  };
}