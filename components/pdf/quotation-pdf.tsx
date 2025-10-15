import React from 'react';
import { Document, Page, Text, View, PDFViewer } from '@react-pdf/renderer';
import {
  QuotationPDFData,
  createPDFStyles,
  formatCurrency,
  formatDate,
  getStatusLabel,
  getStatusColor,
  shouldShowWatermark,
  DEFAULT_ISSUER,
} from '@/lib/pdf';
import PDFHeader from './pdf-header';
import PDFClientInfo from './pdf-client-info';
import PDFLineItems from './pdf-line-items';
import PDFTotals from './pdf-totals';

interface QuotationPDFProps {
  data: QuotationPDFData;
}

export default function QuotationPDF({ data }: QuotationPDFProps) {
  const styles = createPDFStyles();
  const issuer = data.issuer || DEFAULT_ISSUER;
  const showWatermark = shouldShowWatermark(data.status);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {showWatermark && (
          <Text style={styles.watermark}>{getStatusLabel(data.status)}</Text>
        )}

        <PDFHeader
          issuer={issuer}
          folio={data.folio}
          status={data.status}
          createdAt={data.createdAt}
          validUntil={data.validUntil}
        />

        <PDFClientInfo company={data.company} />

        <PDFLineItems items={data.items} />

        <PDFTotals
          subtotal={data.subtotal}
          tax={data.tax}
          discount={data.discount}
          total={data.total}
        />

        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notas y Observaciones:</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Este documento no constituye un comprobante fiscal
          </Text>
          <Text style={styles.footerText}>
            Cotización válida hasta: {formatDate(data.validUntil)}
          </Text>
          <Text style={styles.footerText}>
            Para cualquier aclaración, favor de contactarnos al teléfono {issuer.phone} o al correo {issuer.email}
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

interface QuotationPDFViewerProps {
  data: QuotationPDFData;
  width?: string | number;
  height?: string | number;
}

export function QuotationPDFViewer({ data, width = '100%', height = '600px' }: QuotationPDFViewerProps) {
  return (
    <PDFViewer width={width} height={height}>
      <QuotationPDF data={data} />
    </PDFViewer>
  );
}