/**
 * Import Validation Script
 * Validates imported products against original CSV data
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { ProductCSVParser, type DatabaseReadyProduct } from './csv-parser'

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iiejyugnljdwfntbcnjc.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface DatabaseProduct {
  id: string
  code: string
  name: string
  description: string | null
  category_id: string | null
  unit: string
  cost_price: number
  profit_margin: number
  base_price: number
  public_price: number
  tax_id: string | null
  tax_included: boolean
  stock_quantity: number
  min_stock_level: number
  is_active: boolean
  created_at: string
  updated_at: string
  product_categories?: {
    name: string
  }
  taxes?: {
    name: string
    rate: number
  }
}

interface ValidationResult {
  totalInCSV: number
  totalInDatabase: number
  matched: number
  missingInDB: string[]
  unexpectedInDB: string[]
  dataDiscrepancies: Array<{
    code: string
    field: string
    expected: any
    actual: any
  }>
  pricingErrors: Array<{
    code: string
    error: string
    expected: number
    actual: number
  }>
  categoryMappingIssues: Array<{
    code: string
    expectedCategory: string
    actualCategory: string | null
  }>
}

export class ImportValidator {
  private parser: ProductCSVParser
  
  constructor() {
    this.parser = new ProductCSVParser()
  }

  /**
   * Fetch all products from database
   */
  async fetchDatabaseProducts(): Promise<DatabaseProduct[]> {
    console.log('📊 Fetching products from database...')
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(name),
        taxes(name, rate)
      `)
      .order('code')
    
    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }
    
    console.log(`✅ Fetched ${data.length} products from database`)
    return data as DatabaseProduct[]
  }

  /**
   * Validate pricing calculations
   */
  private validatePricing(csvProduct: DatabaseReadyProduct, dbProduct: DatabaseProduct): string[] {
    const errors: string[] = []
    const tolerance = 0.01 // 1 cent tolerance for floating point precision
    
    // Validate base price calculation: base_price = cost_price * (1 + profit_margin)
    const expectedBasePrice = csvProduct.cost_price * (1 + csvProduct.profit_margin)
    if (Math.abs(dbProduct.base_price - expectedBasePrice) > tolerance) {
      errors.push(`Base price mismatch: expected ${expectedBasePrice.toFixed(2)}, got ${dbProduct.base_price}`)
    }
    
    // Validate cost price
    if (Math.abs(dbProduct.cost_price - csvProduct.cost_price) > tolerance) {
      errors.push(`Cost price mismatch: expected ${csvProduct.cost_price}, got ${dbProduct.cost_price}`)
    }
    
    // Validate public price
    if (Math.abs(dbProduct.public_price - csvProduct.public_price) > tolerance) {
      errors.push(`Public price mismatch: expected ${csvProduct.public_price}, got ${dbProduct.public_price}`)
    }
    
    // Validate profit margin
    const marginTolerance = 0.0001 // 0.01% tolerance
    if (Math.abs(dbProduct.profit_margin - csvProduct.profit_margin) > marginTolerance) {
      errors.push(`Profit margin mismatch: expected ${(csvProduct.profit_margin * 100).toFixed(2)}%, got ${(dbProduct.profit_margin * 100).toFixed(2)}%`)
    }
    
    return errors
  }

  /**
   * Validate tax configuration
   */
  private validateTaxes(csvProduct: DatabaseReadyProduct, dbProduct: DatabaseProduct): string[] {
    const errors: string[] = []
    
    // Check tax inclusion
    if (dbProduct.tax_included !== csvProduct.tax_included) {
      errors.push(`Tax included mismatch: expected ${csvProduct.tax_included}, got ${dbProduct.tax_included}`)
    }
    
    // Check tax ID assignment
    const expectedTaxId = csvProduct.tax_included ? '9f7820b4-687e-4a14-8a76-7218cab27f8f' : null
    if (dbProduct.tax_id !== expectedTaxId) {
      errors.push(`Tax ID mismatch: expected ${expectedTaxId || 'null'}, got ${dbProduct.tax_id || 'null'}`)
    }
    
    return errors
  }

  /**
   * Validate product against CSV data
   */
  async validateImport(csvFilePath: string): Promise<ValidationResult> {
    console.log(`🔍 Starting import validation...`)
    console.log(`📂 CSV File: ${csvFilePath}`)
    
    // Parse CSV to get expected data
    console.log('\n🔄 Step 1: Parsing CSV...')
    const csvBatch = await this.parser.parseCSVFile(csvFilePath)
    const csvProducts = csvBatch.validProducts
    
    // Fetch database products
    console.log('\n🔄 Step 2: Fetching database products...')
    const dbProducts = await this.fetchDatabaseProducts()
    
    // Create lookup maps
    const csvProductMap = new Map(csvProducts.map(p => [p.code, p]))
    const dbProductMap = new Map(dbProducts.map(p => [p.code, p]))
    
    console.log('\n🔄 Step 3: Comparing data...')
    
    // Find missing and unexpected products
    const csvCodes = new Set(csvProducts.map(p => p.code))
    const dbCodes = new Set(dbProducts.map(p => p.code))
    
    const missingInDB = Array.from(csvCodes).filter(code => !dbCodes.has(code))
    const unexpectedInDB = Array.from(dbCodes).filter(code => !csvCodes.has(code))
    const commonCodes = Array.from(csvCodes).filter(code => dbCodes.has(code))
    
    // Validate common products
    const dataDiscrepancies: ValidationResult['dataDiscrepancies'] = []
    const pricingErrors: ValidationResult['pricingErrors'] = []
    const categoryMappingIssues: ValidationResult['categoryMappingIssues'] = []
    
    for (const code of commonCodes) {
      const csvProduct = csvProductMap.get(code)!
      const dbProduct = dbProductMap.get(code)!
      
      // Basic field validation
      const basicChecks = [
        { field: 'name', expected: csvProduct.name, actual: dbProduct.name },
        { field: 'unit', expected: csvProduct.unit, actual: dbProduct.unit },
        { field: 'is_active', expected: csvProduct.is_active, actual: dbProduct.is_active },
        { field: 'stock_quantity', expected: csvProduct.stock_quantity, actual: dbProduct.stock_quantity },
        { field: 'min_stock_level', expected: csvProduct.min_stock_level, actual: dbProduct.min_stock_level }
      ]
      
      basicChecks.forEach(({ field, expected, actual }) => {
        if (expected !== actual) {
          dataDiscrepancies.push({ code, field, expected, actual })
        }
      })
      
      // Pricing validation
      const pricingErrors_ = this.validatePricing(csvProduct, dbProduct)
      pricingErrors_.forEach(error => {
        pricingErrors.push({
          code,
          error,
          expected: 0, // Will be filled with specific values in error message
          actual: 0
        })
      })
      
      // Tax validation
      const taxErrors = this.validateTaxes(csvProduct, dbProduct)
      taxErrors.forEach(error => {
        pricingErrors.push({
          code,
          error,
          expected: 0,
          actual: 0
        })
      })
      
      // Category mapping validation
      const expectedCategoryName = csvProduct.category_name
      const actualCategoryName = dbProduct.product_categories?.name || null
      
      if (expectedCategoryName !== actualCategoryName) {
        categoryMappingIssues.push({
          code,
          expectedCategory: expectedCategoryName,
          actualCategory: actualCategoryName
        })
      }
    }
    
    const result: ValidationResult = {
      totalInCSV: csvProducts.length,
      totalInDatabase: dbProducts.length,
      matched: commonCodes.length,
      missingInDB,
      unexpectedInDB,
      dataDiscrepancies,
      pricingErrors,
      categoryMappingIssues
    }
    
    this.generateValidationReport(result)
    
    return result
  }

  /**
   * Generate validation report
   */
  private generateValidationReport(result: ValidationResult): void {
    const reportPath = path.join(process.cwd(), `validation-report-${Date.now()}.txt`)
    
    const isValid = (
      result.missingInDB.length === 0 &&
      result.dataDiscrepancies.length === 0 &&
      result.pricingErrors.length === 0 &&
      result.categoryMappingIssues.length === 0
    )
    
    const report = `
IMPORT VALIDATION REPORT
========================
Date: ${new Date().toISOString()}

SUMMARY:
📊 Products in CSV: ${result.totalInCSV}
📊 Products in Database: ${result.totalInDatabase}
✅ Matched products: ${result.matched}
${isValid ? '🎉 VALIDATION PASSED - All data is correct!' : '⚠️  VALIDATION ISSUES FOUND'}

MISSING IN DATABASE (${result.missingInDB.length}):
${result.missingInDB.length > 0 
  ? result.missingInDB.map(code => `❌ ${code}`).join('\n')
  : '✅ None - All CSV products were imported'
}

UNEXPECTED IN DATABASE (${result.unexpectedInDB.length}):
${result.unexpectedInDB.length > 0
  ? result.unexpectedInDB.map(code => `⚠️  ${code} (not in CSV)`).join('\n')
  : '✅ None - No unexpected products'
}

DATA DISCREPANCIES (${result.dataDiscrepancies.length}):
${result.dataDiscrepancies.length > 0
  ? result.dataDiscrepancies.map(({ code, field, expected, actual }) =>
      `❌ ${code}: ${field} - expected "${expected}", got "${actual}"`
    ).join('\n')
  : '✅ None - All basic data matches'
}

PRICING ERRORS (${result.pricingErrors.length}):
${result.pricingErrors.length > 0
  ? result.pricingErrors.map(({ code, error }) =>
      `❌ ${code}: ${error}`
    ).join('\n')
  : '✅ None - All pricing calculations are correct'
}

CATEGORY MAPPING ISSUES (${result.categoryMappingIssues.length}):
${result.categoryMappingIssues.length > 0
  ? result.categoryMappingIssues.map(({ code, expectedCategory, actualCategory }) =>
      `❌ ${code}: expected category "${expectedCategory}", got "${actualCategory || 'null'}"`
    ).join('\n')
  : '✅ None - All categories mapped correctly'
}

VALIDATION RESULT: ${isValid ? '✅ PASSED' : '❌ FAILED'}
${isValid 
  ? 'All products were imported correctly with no data integrity issues.'
  : 'Issues found - please review the errors above and take corrective action.'
}
`
    
    fs.writeFileSync(reportPath, report)
    console.log(`📄 Validation report saved to: ${reportPath}`)
    
    // Console summary
    console.log(`
🔍 VALIDATION COMPLETE
=====================
📊 Products validated: ${result.matched}/${result.totalInCSV}
${isValid ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED'}

Issues found:
❌ Missing in DB: ${result.missingInDB.length}
⚠️  Data discrepancies: ${result.dataDiscrepancies.length}
💰 Pricing errors: ${result.pricingErrors.length}
📂 Category issues: ${result.categoryMappingIssues.length}

📄 Full report: ${reportPath}
`)
  }

  /**
   * Quick database health check
   */
  async healthCheck(): Promise<void> {
    console.log('🏥 Running database health check...')
    
    try {
      // Count products
      const { count: productCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      if (countError) throw countError
      
      // Count categories
      const { count: categoryCount, error: categoryError } = await supabase
        .from('product_categories')
        .select('*', { count: 'exact', head: true })
      
      if (categoryError) throw categoryError
      
      // Check for products without categories
      const { count: orphanCount, error: orphanError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .is('category_id', null)
      
      if (orphanError) throw orphanError
      
      // Check for invalid prices
      const { count: invalidPriceCount, error: priceError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .or('cost_price.lt.0,public_price.lt.0,base_price.lt.0')
      
      if (priceError) throw priceError
      
      console.log(`
✅ HEALTH CHECK RESULTS
=======================
📦 Total products: ${productCount}
📂 Total categories: ${categoryCount}
🏷️  Products without category: ${orphanCount}
💸 Products with invalid prices: ${invalidPriceCount}

${(orphanCount || 0) === 0 && (invalidPriceCount || 0) === 0 
  ? '🎉 Database is healthy!' 
  : '⚠️  Issues found - check orphaned/invalid products'
}
`)
      
    } catch (error) {
      console.error('❌ Health check failed:', error)
      throw error
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const validator = new ImportValidator()
  
  if (command === 'health') {
    validator.healthCheck()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Health check failed:', error)
        process.exit(1)
      })
  } else if (command === 'validate' && args[1]) {
    const csvFile = args[1]
    validator.validateImport(csvFile)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Validation failed:', error)
        process.exit(1)
      })
  } else {
    console.error('Usage:')
    console.error('  ts-node validate-import.ts health')
    console.error('  ts-node validate-import.ts validate <csv-file>')
    console.error('')
    console.error('Examples:')
    console.error('  ts-node validate-import.ts health')
    console.error('  ts-node validate-import.ts validate ../productos_export.csv')
    process.exit(1)
  }
}