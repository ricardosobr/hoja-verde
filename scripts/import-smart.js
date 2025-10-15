/**
 * Smart Product Import Script - Handles Duplicates Intelligently
 * - Same code + same name = true duplicate (keep best)
 * - Same code + different name = different products (rename code)
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iiejyugnljdwfntbcnjc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

console.log('🔑 Service key configured:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Category mapping
const CATEGORY_MAPPING = {
  'CONDIMENTOS': 'COCINA',
  'INSUMOS COCINA': 'COCINA', 
  'FRUTAS Y VERDURAS': 'FRUTAS_VERDURAS',
  'COCINA': 'COCINA',
  'BEBIDAS ALCOHOLICAS': 'BEBIDAS',
  'PAPELERIA': 'PAPELERIA',
  'BEBIDAS NO ALCOHOLICAS': 'BEBIDAS', 
  'ABARROTES': 'ABARROTES',
  'INSUMOS PARA CUARTOS': 'HOTELERIA',
  'LIMPIEZA': 'LIMPIEZA',
  'AMENITIES Y BOUTIQUE': 'AMENIDADES',
  'LACTEOS': 'LACTEOS',
  'SEMILLAS Y GRANOS': 'SEMILLAS_GRANOS',
  'INSUMOS PARA SPA': 'SPA_WELLNESS',
  'CARNES': 'CARNES',
  'LAVANDERIA': 'LIMPIEZA',
  'INSUMOS Y MATERIALES DE SPA': 'SPA_WELLNESS', 
  'BOTIQUINES Y PRIMEROS AUXILIOS': 'SALUD',
  'HIERBAS FINAS': 'COCINA',
  'PESCADOS Y MARISCOS': 'PESCADOS_MARISCOS',
  'PANADERIA': 'COCINA',
  'CORTES AMERICANOS': 'CARNES',
  'VEHICULOS': 'VEHICULOS',
  'EMBUTIDOS': 'CARNES',
  'ARTESANIAS': 'ARTESANIAS',
  'CRISTALERIA Y OTROS': 'CRISTALERIA',
  'INSUMOS PASTELERIA': 'COCINA',
  'BEBALCOHOLICA': 'BEBIDAS',
  'VARIOS': 'VARIOS',
  'MARISCOS': 'PESCADOS_MARISCOS',
  'FRUTAS': 'FRUTAS_VERDURAS',
  '': 'VARIOS',
  'Categoría': 'VARIOS',
  'Prueba': 'VARIOS'
};

// Unit mapping
const UNIT_MAPPING = {
  'KILO': 'KILO', 
  'KILOGRAMO': 'KILO',
  'KILOGRAMO NETO': 'KILO',
  'PIEZA': 'PIEZA',
  'UNIDAD': 'PIEZA',
  'Unidad': 'PIEZA',
  'PIEZAS': 'PIEZA',
  'BOTELLA': 'BOTELLA',
  'CAJA': 'CAJA',
  'PAQUETE': 'PAQUETE',
  'LITRO': 'LITRO',
  'LITROS': 'LITRO',
  'GALÓN': 'GALON',
  'GALON': 'GALON',
  'BOLSA': 'BOLSA',
  'ROLLO': 'ROLLO',
  'ATADO': 'PAQUETE',
  'BIDON': 'BIDON',
  'GARRAFA 2.83 L.': 'LITRO',
  '': 'PIEZA'
};

const IVA_TAX_ID = '9f7820b4-687e-4a14-8a76-7218cab27f8f';
const ADMIN_USER_ID = 'f799fa9a-2525-409f-afc1-e794600759a2';

// Parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const [header, ...dataLines] = lines;
  
  console.log(`📊 Found ${dataLines.length} product rows in CSV`);
  
  return dataLines.map(line => {
    const fields = line.split(',');
    return {
      clave: fields[0] || '',
      nombre: fields[1] || '',
      categoria: fields[2] || '',
      unidad: fields[3] || '',
      precio: fields[4] || '0',
      iva: fields[5] || 'No',
      ganancia: fields[6] || '0',
      precioPublico: fields[7] || '0'
    };
  });
}

// Clean data
function cleanProduct(raw) {
  const code = raw.clave?.trim().toUpperCase() || '';
  const name = raw.nombre?.trim() || '';
  const category = CATEGORY_MAPPING[raw.categoria?.trim().toUpperCase()] || 'VARIOS';
  const unit = UNIT_MAPPING[raw.unidad?.trim().toUpperCase()] || 'PIEZA';
  const taxIncluded = raw.iva?.trim().toLowerCase() === 'sí';
  
  const costPrice = parseFloat(raw.precio?.replace(',', '.')) || 0;
  const publicPrice = parseFloat(raw.precioPublico?.replace(',', '.')) || 0;
  let profitMargin = parseFloat(raw.ganancia?.replace(',', '.')) / 100 || 0;
  
  // Calculate margin if missing
  if (profitMargin === 0 && costPrice > 0 && publicPrice > costPrice) {
    profitMargin = (publicPrice - costPrice) / costPrice;
  }
  
  const errors = [];
  if (!code) errors.push('Missing code');
  if (!name) errors.push('Missing name');
  // Allow cost price of 0 for free products
  if (costPrice < 0) errors.push('Negative cost price');
  
  return {
    code,
    name,
    category,
    unit,
    costPrice: Math.round(costPrice * 100) / 100,
    profitMargin: Math.round(profitMargin * 10000) / 10000,
    publicPrice: Math.round(publicPrice * 100) / 100,
    taxIncluded,
    isValid: errors.length === 0,
    errors,
    originalCode: code // Keep original for reference
  };
}

// Normalize name for comparison (remove extra spaces, punctuation, etc.)
function normalizeName(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Smart deduplication - handles same code with different names
function smartDeduplicateProducts(products) {
  console.log('🧠 Smart deduplication starting...');
  
  const codeGroups = new Map();
  
  // Group products by code
  products.forEach(product => {
    if (!codeGroups.has(product.code)) {
      codeGroups.set(product.code, []);
    }
    codeGroups.get(product.code).push(product);
  });
  
  const finalProducts = [];
  const renamedProducts = [];
  const trueDuplicatesRemoved = [];
  
  codeGroups.forEach((productGroup, code) => {
    if (productGroup.length === 1) {
      // No duplicates for this code
      finalProducts.push(productGroup[0]);
      return;
    }
    
    // Multiple products with same code - analyze names
    console.log(`\n🔍 Analyzing code: ${code} (${productGroup.length} products)`);
    
    // Group by normalized name
    const nameGroups = new Map();
    productGroup.forEach(product => {
      const normalizedName = normalizeName(product.name);
      if (!nameGroups.has(normalizedName)) {
        nameGroups.set(normalizedName, []);
      }
      nameGroups.get(normalizedName).push(product);
    });
    
    console.log(`   Names found: ${nameGroups.size}`);
    
    let suffixCounter = 11;
    
    nameGroups.forEach((sameNameProducts, normalizedName) => {
      if (sameNameProducts.length === 1) {
        // Only one product with this name
        if (nameGroups.size === 1) {
          // All products had same name - keep the best one
          const bestProduct = sameNameProducts.reduce((best, current) => 
            current.publicPrice > best.publicPrice ? current : best
          );
          finalProducts.push(bestProduct);
          
          // Log removed duplicates
          sameNameProducts.filter(p => p !== bestProduct).forEach(removed => {
            trueDuplicatesRemoved.push({
              code: removed.code,
              name: removed.name,
              reason: 'Same code and name, lower price'
            });
          });
        } else {
          // Different names exist, this one gets original code
          finalProducts.push(sameNameProducts[0]);
        }
      } else {
        // Multiple products with same code AND same name
        // Keep the best one, remove others
        const bestProduct = sameNameProducts.reduce((best, current) => 
          current.publicPrice > best.publicPrice ? current : best
        );
        
        if (nameGroups.size === 1) {
          // All had same name
          finalProducts.push(bestProduct);
        } else {
          // Mixed names - this name group gets original or renamed code
          if (finalProducts.some(p => p.code === code)) {
            // Code already used, rename this one
            bestProduct.code = `${code}${suffixCounter}`;
            renamedProducts.push({
              original: code,
              new: bestProduct.code,
              name: bestProduct.name,
              reason: 'Same code, different name'
            });
            suffixCounter++;
          }
          finalProducts.push(bestProduct);
        }
        
        // Log removed duplicates
        sameNameProducts.filter(p => p !== bestProduct).forEach(removed => {
          trueDuplicatesRemoved.push({
            code: removed.originalCode,
            name: removed.name,
            reason: 'Same code and name, lower price'
          });
        });
      }
    });
    
    // Handle all name groups (different names with same original code)
    let isFirstNameGroup = true;
    nameGroups.forEach((sameNameProducts, normalizedName) => {
      if (sameNameProducts.length > 0) {
        const bestProduct = sameNameProducts[0];
        
        if (isFirstNameGroup && nameGroups.size > 1) {
          // First different name keeps original code only if there are multiple different names
          finalProducts.push(bestProduct);
          isFirstNameGroup = false;
        } else if (nameGroups.size > 1) {
          // Subsequent different names get renamed codes
          bestProduct.code = `${code}${suffixCounter}`;
          finalProducts.push(bestProduct);
          
          renamedProducts.push({
            original: code,
            new: bestProduct.code,
            name: bestProduct.name,
            reason: 'Same code, different name'
          });
          suffixCounter++;
        } else if (nameGroups.size === 1) {
          // Only one name group, keep best product with original code
          finalProducts.push(bestProduct);
        }
      }
    });
  });
  
  // Report results
  console.log(`
📊 SMART DEDUPLICATION RESULTS:
===============================
📥 Original products: ${products.length}
📤 Final products: ${finalProducts.length}
🔄 Products renamed: ${renamedProducts.length}
❌ True duplicates removed: ${trueDuplicatesRemoved.length}
`);
  
  if (renamedProducts.length > 0) {
    console.log('\n🏷️  RENAMED PRODUCTS:');
    renamedProducts.forEach(renamed => {
      console.log(`   ${renamed.original} → ${renamed.new}: ${renamed.name}`);
    });
  }
  
  if (trueDuplicatesRemoved.length > 0) {
    console.log(`\n🗑️  TRUE DUPLICATES REMOVED: ${trueDuplicatesRemoved.length}`);
    trueDuplicatesRemoved.slice(0, 10).forEach(removed => {
      console.log(`   ${removed.code}: ${removed.name} (${removed.reason})`);
    });
    if (trueDuplicatesRemoved.length > 10) {
      console.log(`   ... and ${trueDuplicatesRemoved.length - 10} more`);
    }
  }
  
  return finalProducts;
}

// Get or create categories
async function ensureCategories(products) {
  console.log('📂 Checking categories...');
  
  // Get existing categories
  const { data: existing, error } = await supabase
    .from('product_categories')
    .select('id, name');
    
  if (error) throw error;
  
  const existingMap = new Map();
  existing.forEach(cat => existingMap.set(cat.name, cat.id));
  
  // Find needed categories
  const needed = [...new Set(products.map(p => p.category))]
    .filter(cat => !existingMap.has(cat));
    
  console.log(`✅ Found ${existing.length} existing categories`);
  console.log(`📝 Need to create ${needed.length} categories:`, needed);
  
  // Create missing categories
  const newCategories = [
    { name: 'PESCADOS_MARISCOS', description: 'Pescados y mariscos frescos' },
    { name: 'PAPELERIA', description: 'Artículos de papelería y oficina' },
    { name: 'SEMILLAS_GRANOS', description: 'Semillas y granos' },
    { name: 'SPA_WELLNESS', description: 'Insumos para spa y bienestar' },
    { name: 'HOTELERIA', description: 'Insumos para cuartos y hotelería' },
    { name: 'SALUD', description: 'Botiquín y primeros auxilios' },
    { name: 'VEHICULOS', description: 'Productos para vehículos' },
    { name: 'ARTESANIAS', description: 'Productos artesanales' },
    { name: 'CRISTALERIA', description: 'Cristalería y artículos de mesa' }
  ].filter(cat => needed.includes(cat.name));
  
  for (const category of newCategories) {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert(category)
        .select('id, name')
        .single();
        
      if (error && error.code !== '23505') throw error; // Ignore duplicates
      
      if (data) {
        existingMap.set(data.name, data.id);
        console.log(`✅ Created category: ${data.name}`);
      }
    } catch (err) {
      console.warn(`⚠️ Category ${category.name} may already exist`);
    }
  }
  
  // Refresh categories
  const { data: allCategories } = await supabase
    .from('product_categories')
    .select('id, name');
    
  const finalMap = new Map();
  allCategories.forEach(cat => finalMap.set(cat.name, cat.id));
  
  return finalMap;
}

// Insert products
async function insertProducts(products, categoryMap, dryRun = false) {
  const valid = products.filter(p => p.isValid);
  console.log(`📦 Processing ${valid.length} valid products...`);
  
  if (dryRun) {
    console.log('🏃 DRY RUN - No data will be inserted');
    console.log('\nSample products that would be inserted:');
    valid.slice(0, 10).forEach((p, i) => {
      console.log(`${i+1}. ${p.code} - ${p.name}`);
      console.log(`   Category: ${p.category} | Cost: $${p.costPrice} | Public: $${p.publicPrice}`);
      if (p.code !== p.originalCode) {
        console.log(`   ⚠️  Code renamed: ${p.originalCode} → ${p.code}`);
      }
    });
    return { successful: valid.length, failed: [] };
  }
  
  const batchSize = 50;
  let successful = 0;
  const failed = [];
  
  for (let i = 0; i < valid.length; i += batchSize) {
    const batch = valid.slice(i, i + batchSize);
    console.log(`📦 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(valid.length/batchSize)}: ${batch.length} products`);
    
    const insertData = batch.map(product => ({
      code: product.code, // Use the potentially renamed code
      name: product.name,
      description: product.name.length > 100 ? product.name.substring(0, 100) : null,
      category_id: categoryMap.get(product.category) || null,
      unit: product.unit,
      cost_price: product.costPrice,
      profit_margin: product.profitMargin,
      public_price: product.publicPrice,
      tax_id: product.taxIncluded ? IVA_TAX_ID : null,
      tax_included: product.taxIncluded,
      stock_quantity: 0,
      min_stock_level: 1,
      is_active: true,
      created_by: ADMIN_USER_ID
    }));
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(insertData);
        
      if (error) throw error;
      
      successful += batch.length;
      console.log(`✅ Inserted ${batch.length} products`);
      
    } catch (error) {
      console.error(`❌ Batch failed:`, error.message);
      batch.forEach(p => failed.push({ product: p, error: error.message }));
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return { successful, failed };
}

// Main function
async function importProducts(csvPath, dryRun = false) {
  console.log(`🚀 Starting smart product import${dryRun ? ' (DRY RUN)' : ''}...`);
  console.log(`📂 CSV File: ${csvPath}`);
  
  try {
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rawData = parseCSV(csvContent);
    
    // Clean data
    console.log('🧹 Cleaning data...');
    const cleanedData = rawData.map(cleanProduct);
    
    const validProducts = cleanedData.filter(p => p.isValid);
    const invalidProducts = cleanedData.filter(p => !p.isValid);
    
    console.log(`✅ Valid products: ${validProducts.length}`);
    console.log(`❌ Invalid products: ${invalidProducts.length}`);
    
    // Smart deduplication
    const smartDeduplicatedProducts = smartDeduplicateProducts(validProducts);
    
    if (invalidProducts.length > 0) {
      console.log('\n❌ INVALID PRODUCTS:');
      invalidProducts.forEach(p => {
        console.log(`- ${p.code || 'NO_CODE'}: ${p.errors.join(', ')}`);
      });
    }
    
    // Ensure categories exist
    const categoryMap = await ensureCategories(smartDeduplicatedProducts);
    
    // Insert products
    const results = await insertProducts(smartDeduplicatedProducts, categoryMap, dryRun);
    
    console.log(`
🎉 IMPORT COMPLETE!
===================
✅ Successful: ${results.successful}
❌ Failed: ${results.failed.length}
📊 Total processed: ${smartDeduplicatedProducts.length}
`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED PRODUCTS:');
      results.failed.slice(0, 10).forEach(f => {
        console.log(`- ${f.product.code}: ${f.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// CLI execution
const args = process.argv.slice(2);
const csvFile = args[0];
const dryRun = args.includes('--dry-run');

if (!csvFile) {
  console.error('Usage: node import-smart.js <csv-file> [--dry-run]');
  console.error('Example: node import-smart.js "../products-export.csv" --dry-run');
  process.exit(1);
}

importProducts(csvFile, dryRun)
  .then(() => {
    console.log('✅ Process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });