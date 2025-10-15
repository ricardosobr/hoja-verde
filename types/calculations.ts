/**
 * TypeScript type definitions for calculation system
 * Re-exports from calculations module for centralized type management
 */

// Re-export calculation interfaces from the main calculations module
export type {
  TaxConfiguration,
  ProductPricing,
  LineItemCalculation,
  DocumentTotals
} from '../lib/calculations'

// Additional database-related types for calculations
export interface DatabaseProduct {
  id: string;
  name: string;
  code: string;
  description?: string;
  unit: string;
  cost_price: number;
  profit_margin: number;
  base_price: number;
  public_price: number;
  tax_id: string;
  tax_included: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTax {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_amount';
  rate?: number;
  amount?: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseQuotationItem {
  id: string;
  quotation_id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  product_description?: string;
  unit: string;
  quantity: number;
  unit_price: number; // Snapshot price at quotation time
  tax_rate: number;   // Snapshot tax rate at quotation time
  tax_amount: number; // Calculated
  subtotal: number;   // Calculated
  total: number;      // Calculated
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseQuotation {
  id: string;
  folio: string;
  company_id: string;
  user_id: string;
  subtotal: number;   // Calculated
  tax_amount: number; // Calculated
  total: number;      // Calculated
  status: 'draft' | 'generated' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'converted';
  valid_until: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Calculation validation types
export interface CalculationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PriceCalculationInput {
  cost_price: number;
  profit_margin: number;
  tax_config: TaxConfiguration;
  tax_included?: boolean;
}

export interface LineItemCalculationInput {
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

// UI-specific calculation types
export interface FormattedLineItem extends LineItemCalculation {
  formatted_unit_price: string;
  formatted_subtotal: string;
  formatted_tax_amount: string;
  formatted_total: string;
}

export interface FormattedDocumentTotals extends DocumentTotals {
  formatted_subtotal: string;
  formatted_tax_amount: string;
  formatted_total: string;
}

// Calculation error types
export class CalculationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'CalculationError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public violations: string[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Constants for calculations
export const CALCULATION_CONSTANTS = {
  DEFAULT_IVA_RATE: 0.16,
  MXN_DECIMAL_PLACES: 2,
  QUANTITY_DECIMAL_PLACES: 3,
  MAX_PROFIT_MARGIN: 10, // 1000%
  MIN_PROFIT_MARGIN: 0,
  MAX_TAX_RATE: 1, // 100%
  MIN_TAX_RATE: 0
} as const;

// Type guards
export function isTaxConfiguration(obj: unknown): obj is TaxConfiguration {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    (obj.type === 'percentage' || obj.type === 'fixed_amount') &&
    typeof obj.is_default === 'boolean' &&
    typeof obj.is_active === 'boolean'
  );
}

export function isLineItemCalculation(obj: unknown): obj is LineItemCalculation {
  return (
    typeof obj === 'object' &&
    typeof obj.quantity === 'number' &&
    typeof obj.unit_price === 'number' &&
    typeof obj.tax_rate === 'number' &&
    typeof obj.tax_amount === 'number' &&
    typeof obj.subtotal === 'number' &&
    typeof obj.total === 'number'
  );
}

export function isDocumentTotals(obj: unknown): obj is DocumentTotals {
  return (
    typeof obj === 'object' &&
    typeof obj.subtotal === 'number' &&
    typeof obj.tax_amount === 'number' &&
    typeof obj.total === 'number'
  );
}