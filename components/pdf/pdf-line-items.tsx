import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { createPDFStyles, formatCurrency } from '@/lib/pdf';

interface PDFLineItemsProps {
  items: Array<{
    id: string;
    productName: string;
    productCode: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    tax: number;
    total: number;
  }>;
}

export default function PDFLineItems({ items }: PDFLineItemsProps) {
  const styles = createPDFStyles();

  return (
    <View style={styles.table}>
      <Text style={styles.sectionTitle}>DETALLE DE PRODUCTOS</Text>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.productCodeCell]}>Código</Text>
        <Text style={[styles.tableHeaderCell, styles.productNameCell]}>Descripción</Text>
        <Text style={[styles.tableHeaderCell, styles.quantityCell]}>Cant.</Text>
        <Text style={[styles.tableHeaderCell, styles.unitPriceCell]}>P. Unitario</Text>
        <Text style={[styles.tableHeaderCell, styles.subtotalCell]}>Subtotal</Text>
        <Text style={[styles.tableHeaderCell, styles.totalCell]}>Total</Text>
      </View>
      
      {items.map((item, index) => (
        <View key={item.id || index} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.productCodeCell]}>
            {item.productCode}
          </Text>
          <View style={[styles.productNameCell]}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', marginBottom: 2 }]}>
              {item.productName}
            </Text>
            {item.description && (
              <Text style={[styles.tableCell, { fontSize: 8, color: '#6B7280' }]}>
                {item.description}
              </Text>
            )}
          </View>
          <Text style={[styles.tableCell, styles.quantityCell]}>
            {item.quantity}
          </Text>
          <Text style={[styles.tableCell, styles.unitPriceCell]}>
            {formatCurrency(item.unitPrice)}
          </Text>
          <Text style={[styles.tableCell, styles.subtotalCell]}>
            {formatCurrency(item.subtotal)}
          </Text>
          <Text style={[styles.tableCell, styles.totalCell, { fontWeight: 'bold' }]}>
            {formatCurrency(item.total)}
          </Text>
        </View>
      ))}
      
      {items.length === 0 && (
        <View style={[styles.tableRow, { justifyContent: 'center', padding: 20 }]}>
          <Text style={[styles.tableCell, { textAlign: 'center', color: '#9CA3AF' }]}>
            No hay productos en esta cotización
          </Text>
        </View>
      )}
    </View>
  );
}