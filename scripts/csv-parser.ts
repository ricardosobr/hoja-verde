/**
 * CSV Parser and Data Mapper for Product Import
 * Converts CSV data to database-ready format using category mapping
 */

import fs from 'fs'
import path from 'path'
import { 
  parseCSVContent, 
  cleanProductData, 
  generateCleanupReport, 
  getUniqueCategories,
  type RawProductData, 
  type CleanProductData 
} from './data-cleanup'

// Import category mapping
interface CategoryMapping {
  existingCategories: Record<string, {
    id: string
    name: string
    description: string
    csvMapping: string[]
  }>
  newCategoriesToCreate: Record<string, {
    name: string
    description: string
    csvMapping: string[]
  }>
  csvCategoryMapping: Record<string, string>
}

export interface DatabaseReadyProduct {
  code: string
  name: string
  description: string | null
  category_id: string | null
  category_name: string
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
}

export interface ImportBatch {
  validProducts: DatabaseReadyProduct[]
  invalidProducts: Array<{
    data: CleanProductData
    errors: string[]
  }>
  categoriesNeeded: string[]
  duplicateCodes: string[]
  summary: {
    totalProcessed: number
    validCount: number
    invalidCount: number
    duplicateCount: number
    categoriesCount: number
  }
}

export class ProductCSVParser {
  private categoryMapping: CategoryMapping
  private readonly IVA_TAX_ID = '9f7820b4-687e-4a14-8a76-7218cab27f8f'
  private readonly DEFAULT_STOCK = 0
  private readonly DEFAULT_MIN_STOCK = 1

  constructor() {
    this.loadCategoryMapping()
  }

  private loadCategoryMapping(): void {
    try {
      const mappingPath = path.join(process.cwd(), 'data', 'category-mapping.json')
      const mappingContent = fs.readFileSync(mappingPath, 'utf-8')
      this.categoryMapping = JSON.parse(mappingContent)
      console.log('📂 Category mapping loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load category mapping:', error)
      throw new Error('Category mapping file not found or invalid')
    }
  }

  /**
   * Map CSV category to database category
   */
  private mapCategory(csvCategory: string): { categoryName: string; categoryId: string | null; needsCreation: boolean } {
    const mappedCategoryName = this.categoryMapping.csvCategoryMapping[csvCategory] || 'VARIOS'
    
    // Check if it exists in database
    const existingCategory = this.categoryMapping.existingCategories[mappedCategoryName]
    if (existingCategory) {
      return {
        categoryName: mappedCategoryName,
        categoryId: existingCategory.id,
        needsCreation: false
      }
    }
    
    // Check if it needs to be created
    const newCategory = this.categoryMapping.newCategoriesToCreate[mappedCategoryName]
    if (newCategory) {
      return {
        categoryName: mappedCategoryName,
        categoryId: null, // Will be created during import
        needsCreation: true
      }
    }
    
    // Fallback to VARIOS
    console.warn(`⚠️  Unknown category "${csvCategory}" -> "${mappedCategoryName}" -> fallback to VARIOS`)
    const variosCategory = this.categoryMapping.existingCategories.VARIOS || this.categoryMapping.newCategoriesToCreate.VARIOS
    
    return {
      categoryName: 'VARIOS',
      categoryId: variosCategory ? null : null,
      needsCreation: !this.categoryMapping.existingCategories.VARIOS
    }
  }

  /**
   * Convert cleaned product data to database format
   */
  private mapToDatabase(cleanProduct: CleanProductData): DatabaseReadyProduct {
    const categoryMapping = this.mapCategory(cleanProduct.category)
    
    // Calculate base price using business rule
    const basePrice = cleanProduct.costPrice * (1 + cleanProduct.profitMargin)
    
    return {
      code: cleanProduct.code.toUpperCase().trim(),
      name: cleanProduct.name.trim(),
      description: cleanProduct.name.length > 50 ? cleanProduct.name : null,
      category_id: categoryMapping.categoryId,
      category_name: categoryMapping.categoryName,
      unit: cleanProduct.unit,
      cost_price: Math.round(cleanProduct.costPrice * 100) / 100,
      profit_margin: Math.round(cleanProduct.profitMargin * 10000) / 10000, // 4 decimal places
      base_price: Math.round(basePrice * 100) / 100,
      public_price: Math.round(cleanProduct.publicPrice * 100) / 100,
      tax_id: cleanProduct.taxIncluded ? this.IVA_TAX_ID : null,
      tax_included: cleanProduct.taxIncluded,
      stock_quantity: this.DEFAULT_STOCK,
      min_stock_level: this.DEFAULT_MIN_STOCK,
      is_active: true
    }
  }

  /**
   * Detect duplicate product codes
   */
  private detectDuplicates(products: CleanProductData[]): { 
    unique: CleanProductData[], 
    duplicates: string[] 
  } {
    const codeMap = new Map<string, CleanProductData[]>()
    const duplicateCodes: string[] = []
    
    // Group by code
    products.forEach(product => {
      const code = product.code.toUpperCase().trim()
      if (!codeMap.has(code)) {
        codeMap.set(code, [])
      }
      codeMap.get(code)!.push(product)
    })
    
    // Find duplicates and keep best version of each
    const unique: CleanProductData[] = []
    
    codeMap.forEach((productVersions, code) => {
      if (productVersions.length > 1) {
        duplicateCodes.push(code)
        console.warn(`🔄 Duplicate code "${code}" found ${productVersions.length} times`)
        
        // Keep the version with the highest public price (assuming it's most up-to-date)
        const bestVersion = productVersions.reduce((best, current) => 
          current.publicPrice > best.publicPrice ? current : best
        )
        unique.push(bestVersion)
      } else {
        unique.push(productVersions[0])
      }
    })
    
    return { unique, duplicates: duplicateCodes }
  }

  /**
   * Parse CSV file and return import-ready batch
   */
  async parseCSVFile(csvFilePath: string): Promise<ImportBatch> {
    console.log(`📂 Reading CSV file: ${csvFilePath}`)
    
    try {
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
      return this.parseCSVContent(csvContent)
    } catch (error) {
      console.error('❌ Failed to read CSV file:', error)
      throw new Error(`Failed to read CSV file: ${error.message}`)
    }
  }

  /**
   * Parse CSV content and return import-ready batch
   */
  async parseCSVContent(csvContent: string): Promise<ImportBatch> {
    console.log('🔄 Starting CSV parsing and data mapping...')
    
    // Step 1: Parse CSV into raw data
    const rawData = parseCSVContent(csvContent)
    console.log(`📊 Parsed ${rawData.length} raw products`)
    
    // Step 2: Clean and validate data
    const cleanedData = rawData.map(cleanProductData)
    
    // Step 3: Generate cleanup report
    const cleanupReport = generateCleanupReport(rawData, cleanedData)
    
    // Step 4: Filter valid products
    const validCleanProducts = cleanedData.filter(p => p.isValid)
    const invalidProducts = cleanedData
      .filter(p => !p.isValid)
      .map(data => ({ data, errors: data.errors }))
    
    // Step 5: Detect and handle duplicates
    const { unique: uniqueProducts, duplicates: duplicateCodes } = this.detectDuplicates(validCleanProducts)
    console.log(`🔄 After deduplication: ${uniqueProducts.length} unique products`)
    
    // Step 6: Map to database format
    const validProducts = uniqueProducts.map(product => this.mapToDatabase(product))
    
    // Step 7: Determine categories that need creation
    const categoriesNeeded = [...new Set(
      validProducts
        .filter(p => p.category_id === null)
        .map(p => p.category_name)
    )]
    
    const summary = {
      totalProcessed: rawData.length,
      validCount: validProducts.length,
      invalidCount: invalidProducts.length,
      duplicateCount: duplicateCodes.length,
      categoriesCount: categoriesNeeded.length
    }
    
    console.log(`
✅ PARSING COMPLETE
===================
📊 Total processed: ${summary.totalProcessed}
✅ Valid products: ${summary.validCount}
❌ Invalid products: ${summary.invalidCount}  
🔄 Duplicates found: ${summary.duplicateCount}
📂 Categories to create: ${summary.categoriesCount}

📂 New categories needed:
${categoriesNeeded.map(cat => `   - ${cat}`).join('\n')}
`)
    
    return {
      validProducts,
      invalidProducts,
      categoriesNeeded,
      duplicateCodes,
      summary
    }
  }

  /**
   * Get categories that need to be created
   */
  getCategoriesNeedingCreation(categoryNames: string[]): Array<{
    name: string
    description: string
  }> {
    return categoryNames
      .map(name => this.categoryMapping.newCategoriesToCreate[name])
      .filter(Boolean)
      .map(category => ({
        name: category.name,
        description: category.description
      }))
  }

  /**
   * Export invalid products to CSV for review
   */
  exportInvalidProducts(invalidProducts: Array<{ data: CleanProductData; errors: string[] }>, outputPath: string): void {
    const header = 'Code,Name,Category,Unit,CostPrice,PublicPrice,Errors\n'
    const rows = invalidProducts.map(({ data, errors }) => 
      `"${data.code}","${data.name}","${data.category}","${data.unit}",${data.costPrice},${data.publicPrice},"${errors.join('; ')}"`
    ).join('\n')
    
    fs.writeFileSync(outputPath, header + rows)
    console.log(`📄 Exported ${invalidProducts.length} invalid products to ${outputPath}`)
  }
}