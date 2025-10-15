/**
 * Test Import Script using MCP Supabase Tools
 * For testing the import process without service role key
 */

import fs from 'fs'
import { ProductCSVParser } from './csv-parser'

async function testImportWithMCP() {
  console.log('🧪 Testing product import using MCP tools...')
  
  try {
    // Step 1: Parse the test CSV
    const parser = new ProductCSVParser()
    const csvPath = './scripts/test-products.csv'
    
    console.log('\n📂 Parsing test CSV...')
    const batch = await parser.parseCSVFile(csvPath)
    
    console.log(`
📊 PARSING RESULTS:
===================
✅ Valid products: ${batch.validProducts.length}
❌ Invalid products: ${batch.invalidProducts.length}
🔄 Duplicates: ${batch.duplicateCodes.length}
📂 Categories needed: ${batch.categoriesNeeded.length}
`)
    
    // Display parsed products
    console.log('\n📦 PARSED PRODUCTS:')
    console.log('===================')
    batch.validProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.code} - ${product.name}`)
      console.log(`   Category: ${product.category_name} (ID: ${product.category_id || 'needs creation'})`)
      console.log(`   Unit: ${product.unit}`)
      console.log(`   Cost: $${product.cost_price} | Margin: ${(product.profit_margin * 100).toFixed(1)}% | Public: $${product.public_price}`)
      console.log(`   Tax: ${product.tax_included ? 'IVA 16%' : 'None'} | Base Price: $${product.base_price}`)
      console.log('')
    })
    
    // Display categories needed
    if (batch.categoriesNeeded.length > 0) {
      console.log('\n📂 CATEGORIES TO CREATE:')
      console.log('========================')
      batch.categoriesNeeded.forEach(category => {
        console.log(`- ${category}`)
      })
    }
    
    // Display invalid products if any
    if (batch.invalidProducts.length > 0) {
      console.log('\n❌ INVALID PRODUCTS:')
      console.log('====================')
      batch.invalidProducts.forEach(({ data, errors }) => {
        console.log(`- ${data.code}: ${errors.join(', ')}`)
      })
    }
    
    console.log('\n✅ Test parsing completed successfully!')
    console.log('This data is ready for import to Supabase.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Execute test
testImportWithMCP()
  .then(() => {
    console.log('🎉 Test completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })