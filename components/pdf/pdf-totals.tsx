import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { createPDFStyles, formatCurrency } from '@/lib/pdf';

interface PDFTotalsProps {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export default function PDFTotals({ subtotal, tax, discount, total }: PDFTotalsProps) {
  const styles = createPDFStyles();

  return (
    <View style={styles.totalsSection}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal:</Text>
        <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
      </View>
      
      {discount > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Descuento:</Text>
          <Text style={styles.totalValue}>-{formatCurrency(discount)}</Text>
        </View>
      )}
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>IVA (16%):</Text>
        <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
      </View>
      
      <View style={styles.grandTotalRow}>
        <Text style={styles.grandTotalLabel}>TOTAL:</Text>
        <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
      </View>
      
      <View style={{ marginTop: 10 }}>
        <Text style={[styles.text, { fontSize: 8, fontStyle: 'italic' }]}>
          * Todos los precios incluyen IVA del 16%
        </Text>
        <Text style={[styles.text, { fontSize: 8, fontStyle: 'italic' }]}>
          * Precios expresados en Pesos Mexicanos (MXN)
        </Text>
      </View>
    </View>
  );
}