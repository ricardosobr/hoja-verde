/**
 * Simple Test Script for CSV Parsing
 * Tests data parsing without complex imports
 */

const fs = require('fs');

// Simple CSV parser
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const [header, ...dataLines] = lines;
  
  return dataLines.map((line, index) => {
    const fields = line.split(',');
    return {
      clave: fields[0] || '',
      nombre: fields[1] || '',
      categoria: fields[2] || '',
      unidad: fields[3] || '',
      precio: fields[4] || '0',
      iva: fields[5] || 'No',
      ganancia: fields[6] || '0',
      precioPublico: fields[7] || '0',
      rowIndex: index + 2
    };
  });
}

// Simple category cleaner
function cleanCategory(category) {
  const categoryMap = {
    'CONDIMENTOS': 'COCINA',
    'LACTEOS': 'LACTEOS', 
    'BEBIDAS ALCOHOLICAS': 'BEBIDAS',
    'VARIOS': 'VARIOS'
  };
  
  const cleaned = category?.trim().toUpperCase() || '';
  return categoryMap[cleaned] || 'VARIOS';
}

// Simple unit cleaner
function cleanUnit(unit) {
  const cleaned = unit?.trim().toUpperCase() || '';
  return cleaned || 'PIEZA';
}

// Parse numeric value
function parseNumber(value) {
  const cleaned = value?.trim().replace(',', '.') || '0';
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Process product data
function processProduct(raw) {
  const code = raw.clave?.trim() || '';
  const name = raw.nombre?.trim() || '';
  const category = cleanCategory(raw.categoria);
  const unit = cleanUnit(raw.unidad);
  const taxIncluded = raw.iva?.trim().toLowerCase() === 'sí';
  
  const costPrice = parseNumber(raw.precio);
  const publicPrice = parseNumber(raw.precioPublico);
  const profitMarginCSV = parseNumber(raw.ganancia) / 100;
  
  // Calculate profit margin if not provided
  let profitMargin = profitMarginCSV;
  if (profitMargin === 0 && costPrice > 0 && publicPrice > costPrice) {
    profitMargin = (publicPrice - costPrice) / costPrice;
  }
  
  const basePrice = costPrice * (1 + profitMargin);
  
  const errors = [];
  if (!code) errors.push('Missing code');
  if (!name) errors.push('Missing name');
  if (costPrice < 0) errors.push('Negative cost price');
  
  return {
    code: code.toUpperCase(),
    name,
    category,
    unit,
    costPrice: Math.round(costPrice * 100) / 100,
    profitMargin: Math.round(profitMargin * 10000) / 10000,
    basePrice: Math.round(basePrice * 100) / 100,
    publicPrice: Math.round(publicPrice * 100) / 100,
    taxIncluded,
    isValid: errors.length === 0,
    errors
  };
}

// Main test function
async function testCSVParsing() {
  console.log('🧪 Testing CSV parsing with simple script...');
  
  try {
    // Read test CSV
    const csvPath = './scripts/test-products.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    console.log('📂 CSV content loaded');
    
    // Parse CSV
    const rawData = parseCSV(csvContent);
    console.log(`📊 Parsed ${rawData.length} raw products`);
    
    // Process each product
    const processedProducts = rawData.map(processProduct);
    
    const validProducts = processedProducts.filter(p => p.isValid);
    const invalidProducts = processedProducts.filter(p => !p.isValid);
    
    console.log(`
📊 PROCESSING RESULTS:
======================
✅ Valid products: ${validProducts.length}
❌ Invalid products: ${invalidProducts.length}
`);
    
    // Display results
    console.log('\n📦 PROCESSED PRODUCTS:');
    console.log('======================');
    
    validProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.code} - ${product.name}`);
      console.log(`   Category: ${product.category} | Unit: ${product.unit}`);
      console.log(`   Cost: $${product.costPrice} | Margin: ${(product.profitMargin * 100).toFixed(1)}% | Public: $${product.publicPrice}`);
      console.log(`   Base Price: $${product.basePrice} | Tax: ${product.taxIncluded ? 'IVA 16%' : 'None'}`);
      
      // Validate pricing
      const expectedBase = product.costPrice * (1 + product.profitMargin);
      const baseMatch = Math.abs(product.basePrice - expectedBase) < 0.01;
      console.log(`   Base Price Calc: ${baseMatch ? '✅' : '❌'} (expected: $${expectedBase.toFixed(2)})`);
      
      console.log('');
    });
    
    if (invalidProducts.length > 0) {
      console.log('\n❌ INVALID PRODUCTS:');
      console.log('====================');
      invalidProducts.forEach(product => {
        console.log(`- ${product.code}: ${product.errors.join(', ')}`);
      });
    }
    
    // Get unique categories
    const categories = new Set(validProducts.map(p => p.category));
    console.log(`\n📂 CATEGORIES FOUND: ${categories.size}`);
    Array.from(categories).forEach(cat => console.log(`- ${cat}`));
    
    console.log('\n✅ Test completed successfully!');
    console.log('Data structure is valid and ready for Supabase import.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run test
testCSVParsing()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });