/**
 * Data Cleanup Utilities for Product Import
 * Handles CSV parsing, data normalization, and validation
 */

export interface RawProductData {
  clave: string
  nombre: string
  categoria: string
  unidad: string
  precio: string
  iva: string
  ganancia: string
  precioPublico: string
}

export interface CleanProductData {
  code: string
  name: string
  category: string
  unit: string
  costPrice: number
  profitMargin: number
  publicPrice: number
  taxIncluded: boolean
  isValid: boolean
  errors: string[]
}

/**
 * Category mapping for cleaning malformed category names
 */
export const CATEGORY_MAPPING: Record<string, string> = {
  'CONDIMENTOS': 'CONDIMENTOS',
  'INSUMOS COCINA': 'INSUMOS COCINA', 
  'FRUTAS Y VERDURAS': 'FRUTAS Y VERDURAS',
  'COCINA': 'COCINA',
  'BEBIDAS ALCOHOLICAS': 'BEBIDAS ALCOHOLICAS',
  'PAPELERIA': 'PAPELERIA',
  'BEBIDAS NO ALCOHOLICAS': 'BEBIDAS NO ALCOHOLICAS',
  'ABARROTES': 'ABARROTES',
  'INSUMOS PARA CUARTOS': 'INSUMOS PARA CUARTOS',
  'LIMPIEZA': 'LIMPIEZA',
  'AMENITIES Y BOUTIQUE': 'AMENITIES Y BOUTIQUE',
  'LACTEOS': 'LACTEOS',
  'SEMILLAS Y GRANOS': 'SEMILLAS Y GRANOS',
  'INSUMOS PARA SPA': 'INSUMOS PARA SPA',
  'CARNES': 'CARNES',
  'LAVANDERIA': 'LAVANDERIA',
  'INSUMOS Y MATERIALES DE SPA': 'INSUMOS Y MATERIALES DE SPA',
  'BOTIQUINES Y PRIMEROS AUXILIOS': 'BOTIQUINES Y PRIMEROS AUXILIOS',
  'HIERBAS FINAS': 'HIERBAS FINAS',
  'PESCADOS Y MARISCOS': 'PESCADOS Y MARISCOS',
  'PANADERIA': 'PANADERIA',
  'CORTES AMERICANOS': 'CORTES AMERICANOS',
  'VEHICULOS': 'VEHICULOS',
  'EMBUTIDOS': 'EMBUTIDOS',
  'ARTESANIAS': 'ARTESANIAS',
  'CRISTALERIA Y OTROS': 'CRISTALERIA Y OTROS',
  'INSUMOS PASTELERIA': 'INSUMOS PASTELERIA',
  'BEBALCOHOLICA': 'BEBIDAS ALCOHOLICAS',
  'VARIOS': 'VARIOS',
  'MARISCOS': 'PESCADOS Y MARISCOS',
  'FRUTAS': 'FRUTAS Y VERDURAS',
  // Default mapping for malformed categories
  '': 'VARIOS',
  'Categoría': 'VARIOS',
  'Prueba': 'VARIOS'
}

/**
 * Unit mapping for cleaning and normalizing unit names
 */
export const UNIT_MAPPING: Record<string, string> = {
  'PIEZA': 'PIEZA',
  'KILO': 'KILO', 
  'KILOGRAMO': 'KILO',
  'KILOGRAMO NETO': 'KILO',
  'BOTELLA': 'BOTELLA',
  'CAJA': 'CAJA',
  'PAQUETE': 'PAQUETE',
  'ATADO': 'PAQUETE',
  'LITRO': 'LITRO',
  'LITROS': 'LITRO',
  'CAJA CON 24 LATAS': 'CAJA',
  'CAJA CON 12 BOTELLAS': 'CAJA',
  'PAQUETE DE 12 PIEZAS': 'PAQUETE',
  'PAQ. DE 6 LATAS': 'PAQUETE',
  'PAQ. DE 12 LATAS': 'PAQUETE',
  'PAQ DE 12 PIEZAS': 'PAQUETE',
  'PAQUETE DE 24 BOTELLAS': 'PAQUETE',
  'ROLLO': 'ROLLO',
  'UNIDAD': 'PIEZA',
  'Unidad': 'PIEZA',
  'PIEZAS': 'PIEZA',
  'GALÓN': 'GALON',
  'GALON': 'GALON',
  'BOLSA': 'BOLSA',
  'BIDON': 'BIDON',
  'MILILITRO': 'LITRO',
  // Clean up malformed units
  '': 'PIEZA',
  'Prueba': 'PIEZA',
  'PIEZA 250 GR': 'PIEZA',
  'BOLSA 250 GR': 'BOLSA',
  'BOTELLA 1 L.': 'BOTELLA',
  'CAJA DE 6 PIEZAS 1.89 L.': 'CAJA',
  'CAJA DE 6 PIEZAS 1 L.': 'CAJA',
  'CAJA DE 6 PIEZAS': 'CAJA',
  '12 PIEZAS': 'PAQUETE',
  // Invalid categories that got into unit field
  'PAPELERIA': 'PIEZA',
  'BEBIDAS ALCOHOLICAS': 'PIEZA',
  'BEBIDAS NO ALCOHOLICAS': 'PIEZA',
  'INSUMOS PASTELERIA': 'PIEZA',
  'INSUMOS PARA SPA': 'PIEZA',
  'INSUMOS COCINA': 'PIEZA',
  'BODY WASH': 'PIEZA',
  'H87': 'PIEZA',
  'C': 'PIEZA'
}

/**
 * Clean and normalize a category name
 */
export function cleanCategory(category: string): string {
  const cleaned = category?.trim().toUpperCase() || ''
  
  // Check if it's a known good category
  if (CATEGORY_MAPPING[cleaned]) {
    return CATEGORY_MAPPING[cleaned]
  }
  
  // Check if it looks like a product name (contains numbers, specific patterns)
  const looksLikeProductName = (
    cleaned.includes('750 ML') ||
    cleaned.includes('KG') ||
    cleaned.includes('GR') ||
    cleaned.includes('LITRO') ||
    cleaned.includes('SOBRES') ||
    cleaned.includes('PIEZAS') ||
    /\d/.test(cleaned) ||
    cleaned.length > 50
  )
  
  if (looksLikeProductName) {
    console.warn(`⚠️  Category looks like product name: "${cleaned}" -> mapped to VARIOS`)
    return 'VARIOS'
  }
  
  // Return as is for unrecognized but valid-looking categories
  return cleaned || 'VARIOS'
}

/**
 * Clean and normalize a unit name
 */
export function cleanUnit(unit: string): string {
  const cleaned = unit?.trim().toUpperCase() || ''
  
  if (UNIT_MAPPING[cleaned]) {
    return UNIT_MAPPING[cleaned]
  }
  
  console.warn(`⚠️  Unknown unit: "${cleaned}" -> mapped to PIEZA`)
  return 'PIEZA'
}

/**
 * Parse and validate a numeric value from string
 */
export function parseNumber(value: string, fieldName: string): { value: number; isValid: boolean; error?: string } {
  const cleaned = value?.trim().replace(',', '.') || '0'
  const parsed = parseFloat(cleaned)
  
  if (isNaN(parsed)) {
    return { 
      value: 0, 
      isValid: false, 
      error: `Invalid number in ${fieldName}: "${value}"` 
    }
  }
  
  if (parsed < 0) {
    return { 
      value: 0, 
      isValid: false, 
      error: `Negative value in ${fieldName}: ${parsed}` 
    }
  }
  
  return { value: parsed, isValid: true }
}

/**
 * Calculate profit margin from prices
 */
export function calculateProfitMargin(costPrice: number, publicPrice: number): number {
  if (costPrice <= 0) return 0
  return Math.max(0, (publicPrice - costPrice) / costPrice)
}

/**
 * Validate IVA calculation
 */
export function validateIVACalculation(precio: number, precioPublico: number, ivaIncluded: boolean): boolean {
  if (!ivaIncluded) return Math.abs(precio - precioPublico) < 0.01
  
  const expectedPublicPrice = precio * 1.16
  return Math.abs(expectedPublicPrice - precioPublico) < 0.01
}

/**
 * Clean and validate a single product record
 */
export function cleanProductData(raw: RawProductData): CleanProductData {
  const errors: string[] = []
  let isValid = true
  
  // Clean basic fields
  const code = raw.clave?.trim() || ''
  const name = raw.nombre?.trim() || ''
  const category = cleanCategory(raw.categoria)
  const unit = cleanUnit(raw.unidad)
  const taxIncluded = raw.iva?.trim().toLowerCase() === 'sí'
  
  // Validate required fields
  if (!code) {
    errors.push('Missing product code')
    isValid = false
  }
  
  if (!name) {
    errors.push('Missing product name')
    isValid = false
  }
  
  // Parse numeric fields
  const costPriceResult = parseNumber(raw.precio, 'precio')
  const publicPriceResult = parseNumber(raw.precioPublico, 'precio público')
  const profitMarginCSV = parseNumber(raw.ganancia, 'ganancia %')
  
  if (!costPriceResult.isValid) {
    errors.push(costPriceResult.error!)
    isValid = false
  }
  
  if (!publicPriceResult.isValid) {
    errors.push(publicPriceResult.error!)
    isValid = false
  }
  
  const costPrice = costPriceResult.value
  const publicPrice = publicPriceResult.value
  
  // Calculate profit margin (prefer calculated over CSV value which is often 0)
  let profitMargin = profitMarginCSV.value / 100
  
  if (profitMargin === 0 && costPrice > 0 && publicPrice > costPrice) {
    profitMargin = calculateProfitMargin(costPrice, publicPrice)
  }
  
  // Validate IVA calculation
  if (costPrice > 0 && publicPrice > 0) {
    const ivaValid = validateIVACalculation(costPrice, publicPrice, taxIncluded)
    if (!ivaValid) {
      errors.push(`IVA calculation mismatch: ${costPrice} -> ${publicPrice} (IVA: ${taxIncluded})`)
      // Don't mark as invalid, just warn
    }
  }
  
  // Validate profit margin bounds
  if (profitMargin > 5) {
    errors.push(`Profit margin too high: ${(profitMargin * 100).toFixed(2)}%`)
    profitMargin = 5 // Cap at 500%
  }
  
  return {
    code,
    name,
    category,
    unit,
    costPrice,
    profitMargin,
    publicPrice,
    taxIncluded,
    isValid,
    errors
  }
}

/**
 * Parse CSV content into raw data objects
 */
export function parseCSVContent(csvContent: string): RawProductData[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  const [header, ...dataLines] = lines
  
  console.log(`📊 Parsing CSV: ${dataLines.length} product rows`)
  
  return dataLines.map((line, index) => {
    // Simple CSV parsing - assumes no commas in quoted fields for this data
    const fields = line.split(',')
    
    if (fields.length < 8) {
      console.warn(`⚠️  Row ${index + 2}: Expected 8 fields, got ${fields.length}`)
    }
    
    return {
      clave: fields[0] || '',
      nombre: fields[1] || '',
      categoria: fields[2] || '',
      unidad: fields[3] || '',
      precio: fields[4] || '0',
      iva: fields[5] || 'No',
      ganancia: fields[6] || '0', 
      precioPublico: fields[7] || '0'
    }
  })
}

/**
 * Get unique categories from cleaned data
 */
export function getUniqueCategories(cleanedData: CleanProductData[]): string[] {
  const categories = new Set<string>()
  
  cleanedData.forEach(product => {
    if (product.category && product.isValid) {
      categories.add(product.category)
    }
  })
  
  return Array.from(categories).sort()
}

/**
 * Generate cleanup report
 */
export function generateCleanupReport(rawData: RawProductData[], cleanedData: CleanProductData[]) {
  const validProducts = cleanedData.filter(p => p.isValid)
  const invalidProducts = cleanedData.filter(p => !p.isValid)
  
  const categoryCount = getUniqueCategories(cleanedData).length
  const unitTypes = new Set(cleanedData.map(p => p.unit)).size
  
  const allErrors = cleanedData.reduce((acc, product) => acc.concat(product.errors), [] as string[])
  const errorSummary = allErrors.reduce((acc, error) => {
    acc[error] = (acc[error] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log(`
📋 DATA CLEANUP REPORT
======================
📊 Total products processed: ${rawData.length}
✅ Valid products: ${validProducts.length}
❌ Invalid products: ${invalidProducts.length}
📂 Unique categories: ${categoryCount}  
📦 Unit types: ${unitTypes}

🚨 ERROR SUMMARY:
${Object.entries(errorSummary)
  .sort(([,a], [,b]) => b - a)
  .map(([error, count]) => `   ${count}x ${error}`)
  .join('\n')
}

🔢 PRICE STATISTICS:
   Average cost: $${(validProducts.reduce((sum, p) => sum + p.costPrice, 0) / validProducts.length).toFixed(2)}
   Average margin: ${(validProducts.reduce((sum, p) => sum + p.profitMargin, 0) / validProducts.length * 100).toFixed(1)}%
   Tax included: ${validProducts.filter(p => p.taxIncluded).length} products
`)
  
  return {
    totalProcessed: rawData.length,
    validProducts: validProducts.length,
    invalidProducts: invalidProducts.length,
    uniqueCategories: categoryCount,
    errors: errorSummary
  }
}