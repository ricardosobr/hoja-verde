/**
 * Main Product Import Script
 * Imports products from CSV to Supabase database
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { ProductCSVParser, type DatabaseReadyProduct, type ImportBatch } from './csv-parser'

// Supabase configuration - these should be environment variables in production
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iiejyugnljdwfntbcnjc.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export class ProductImporter {
  private parser: ProductCSVParser
  private BATCH_SIZE = 50 // Insert products in batches to avoid timeouts
  
  constructor() {
    this.parser = new ProductCSVParser()
  }

  /**
   * Create missing categories in the database
   */
  async createCategories(categoryNames: string[]): Promise<Map<string, string>> {
    console.log(`📂 Creating ${categoryNames.length} missing categories...`)
    
    const categoriesToCreate = this.parser.getCategoriesNeedingCreation(categoryNames)
    const categoryIdMap = new Map<string, string>()
    
    for (const category of categoriesToCreate) {
      try {
        const { data, error } = await supabase
          .from('product_categories')
          .insert({
            name: category.name,
            description: category.description,
            is_active: true
          })
          .select('id, name')
          .single()
        
        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            console.warn(`⚠️  Category "${category.name}" already exists, fetching ID...`)
            
            const { data: existingData, error: fetchError } = await supabase
              .from('product_categories')
              .select('id, name')
              .eq('name', category.name)
              .single()
            
            if (fetchError) {
              throw fetchError
            }
            
            categoryIdMap.set(category.name, existingData.id)
            console.log(`✅ Found existing category: ${category.name} (${existingData.id})`)
          } else {
            throw error
          }
        } else {
          categoryIdMap.set(category.name, data.id)
          console.log(`✅ Created category: ${category.name} (${data.id})`)
        }
      } catch (error) {
        console.error(`❌ Failed to create category "${category.name}":`, error)
        throw error
      }
    }
    
    return categoryIdMap
  }

  /**
   * Update product category IDs after categories are created
   */
  private updateProductCategoryIds(products: DatabaseReadyProduct[], categoryIdMap: Map<string, string>): void {
    products.forEach(product => {
      if (product.category_id === null && categoryIdMap.has(product.category_name)) {
        product.category_id = categoryIdMap.get(product.category_name)!
      }
    })
  }

  /**
   * Insert products in batches
   */
  async insertProducts(products: DatabaseReadyProduct[]): Promise<{
    successful: number
    failed: Array<{ product: DatabaseReadyProduct; error: any }>
  }> {
    console.log(`📦 Inserting ${products.length} products in batches of ${this.BATCH_SIZE}...`)
    
    const failed: Array<{ product: DatabaseReadyProduct; error: any }> = []
    let successful = 0
    
    // Process in batches
    for (let i = 0; i < products.length; i += this.BATCH_SIZE) {
      const batch = products.slice(i, i + this.BATCH_SIZE)
      console.log(`📦 Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(products.length / this.BATCH_SIZE)} (${batch.length} products)`)
      
      try {
        // Prepare batch data for insertion
        const insertData = batch.map(product => ({
          code: product.code,
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          unit: product.unit,
          cost_price: product.cost_price,
          profit_margin: product.profit_margin,
          base_price: product.base_price,
          public_price: product.public_price,
          tax_id: product.tax_id,
          tax_included: product.tax_included,
          stock_quantity: product.stock_quantity,
          min_stock_level: product.min_stock_level,
          is_active: product.is_active
        }))
        
        const { data, error } = await supabase
          .from('products')
          .insert(insertData)
          .select('id, code')
        
        if (error) {
          // If batch insert fails, try individual inserts to identify problematic records
          console.warn(`⚠️  Batch insert failed, trying individual inserts...`)
          
          for (const product of batch) {
            try {
              const { error: individualError } = await supabase
                .from('products')
                .insert([{
                  code: product.code,
                  name: product.name,
                  description: product.description,
                  category_id: product.category_id,
                  unit: product.unit,
                  cost_price: product.cost_price,
                  profit_margin: product.profit_margin,
                  base_price: product.base_price,
                  public_price: product.public_price,
                  tax_id: product.tax_id,
                  tax_included: product.tax_included,
                  stock_quantity: product.stock_quantity,
                  min_stock_level: product.min_stock_level,
                  is_active: product.is_active
                }])
              
              if (individualError) {
                console.error(`❌ Failed to insert product ${product.code}:`, individualError.message)
                failed.push({ product, error: individualError })
              } else {
                successful++
                console.log(`✅ Inserted product: ${product.code}`)
              }
            } catch (error) {
              console.error(`❌ Unexpected error inserting product ${product.code}:`, error)
              failed.push({ product, error })
            }
          }
        } else {
          successful += batch.length
          console.log(`✅ Batch inserted successfully: ${batch.length} products`)
        }
      } catch (error) {
        console.error('❌ Batch processing error:', error)
        batch.forEach(product => failed.push({ product, error }))
      }
      
      // Small delay between batches to avoid rate limiting
      if (i + this.BATCH_SIZE < products.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return { successful, failed }
  }

  /**
   * Generate import report
   */
  private generateImportReport(
    batch: ImportBatch,
    insertResults: { successful: number; failed: Array<{ product: DatabaseReadyProduct; error: any }> },
    outputDir: string
  ): void {
    const reportPath = path.join(outputDir, `import-report-${Date.now()}.txt`)
    const failedProductsPath = path.join(outputDir, `failed-products-${Date.now()}.csv`)
    
    const report = `
PRODUCT IMPORT REPORT
====================
Date: ${new Date().toISOString()}
CSV File: Products export

PARSING RESULTS:
📊 Total products in CSV: ${batch.summary.totalProcessed}
✅ Valid products parsed: ${batch.summary.validCount}
❌ Invalid products: ${batch.summary.invalidCount}
🔄 Duplicates removed: ${batch.summary.duplicateCount}
📂 Categories created: ${batch.summary.categoriesCount}

DATABASE INSERTION RESULTS:
✅ Successfully inserted: ${insertResults.successful}
❌ Failed to insert: ${insertResults.failed.length}

FINAL STATUS:
${insertResults.successful === batch.summary.validCount 
  ? '🎉 ALL PRODUCTS IMPORTED SUCCESSFULLY!' 
  : `⚠️  ${batch.summary.validCount - insertResults.successful} products failed to import`
}

CATEGORIES CREATED:
${batch.categoriesNeeded.map(cat => `- ${cat}`).join('\n')}

DUPLICATE CODES FOUND:
${batch.duplicateCodes.length > 0 
  ? batch.duplicateCodes.map(code => `- ${code}`).join('\n')
  : 'None'
}

${insertResults.failed.length > 0 ? `
FAILED PRODUCTS:
${insertResults.failed.map(({ product, error }) => 
  `- ${product.code}: ${error.message || error}`
).join('\n')}
` : ''}
`
    
    fs.writeFileSync(reportPath, report)
    console.log(`📄 Import report saved to: ${reportPath}`)
    
    // Export failed products if any
    if (insertResults.failed.length > 0) {
      const failedCSV = [
        'Code,Name,Category,Unit,CostPrice,PublicPrice,Error',
        ...insertResults.failed.map(({ product, error }) =>
          `"${product.code}","${product.name}","${product.category_name}","${product.unit}",${product.cost_price},${product.public_price},"${error.message || error}"`
        )
      ].join('\n')
      
      fs.writeFileSync(failedProductsPath, failedCSV)
      console.log(`📄 Failed products exported to: ${failedProductsPath}`)
    }
  }

  /**
   * Main import function
   */
  async importFromCSV(csvFilePath: string, options: {
    dryRun?: boolean
    batchSize?: number
    outputDir?: string
  } = {}): Promise<void> {
    const { 
      dryRun = false, 
      batchSize = this.BATCH_SIZE,
      outputDir = process.cwd()
    } = options
    
    this.BATCH_SIZE = batchSize
    
    console.log(`🚀 Starting product import${dryRun ? ' (DRY RUN)' : ''}...`)
    console.log(`📂 CSV File: ${csvFilePath}`)
    console.log(`📦 Batch Size: ${batchSize}`)
    
    try {
      // Step 1: Parse CSV
      console.log('\n🔄 Step 1: Parsing CSV...')
      const batch = await this.parser.parseCSVFile(csvFilePath)
      
      // Export invalid products for review
      if (batch.invalidProducts.length > 0) {
        const invalidPath = path.join(outputDir, `invalid-products-${Date.now()}.csv`)
        this.parser.exportInvalidProducts(batch.invalidProducts, invalidPath)
      }
      
      if (dryRun) {
        console.log('\n🏃 DRY RUN COMPLETE - No data was inserted')
        console.log(`✅ ${batch.validProducts.length} products would be imported`)
        console.log(`📂 ${batch.categoriesNeeded.length} categories would be created`)
        return
      }
      
      // Step 2: Create missing categories
      console.log('\n🔄 Step 2: Creating missing categories...')
      const categoryIdMap = await this.createCategories(batch.categoriesNeeded)
      
      // Step 3: Update product category IDs
      this.updateProductCategoryIds(batch.validProducts, categoryIdMap)
      
      // Step 4: Insert products
      console.log('\n🔄 Step 3: Inserting products...')
      const insertResults = await this.insertProducts(batch.validProducts)
      
      // Step 5: Generate report
      console.log('\n🔄 Step 4: Generating report...')
      this.generateImportReport(batch, insertResults, outputDir)
      
      console.log('\n🎉 IMPORT COMPLETE!')
      console.log(`✅ Successfully imported: ${insertResults.successful}/${batch.validProducts.length} products`)
      
      if (insertResults.failed.length > 0) {
        console.log(`❌ Failed imports: ${insertResults.failed.length}`)
        console.log('📄 Check the failed products CSV for details')
      }
      
    } catch (error) {
      console.error('❌ Import failed:', error)
      throw error
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const csvFile = args[0]
  const dryRun = args.includes('--dry-run')
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '50')
  
  if (!csvFile) {
    console.error('Usage: ts-node import-products.ts <csv-file> [--dry-run] [--batch-size=50]')
    console.error('Example: ts-node import-products.ts ../productos_export.csv --dry-run')
    process.exit(1)
  }
  
  const importer = new ProductImporter()
  
  importer.importFromCSV(csvFile, { 
    dryRun, 
    batchSize,
    outputDir: path.join(process.cwd(), 'import-results')
  })
  .then(() => {
    console.log('✅ Import process completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Import process failed:', error)
    process.exit(1)
  })
}