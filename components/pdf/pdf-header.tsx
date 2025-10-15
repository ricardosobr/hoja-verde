import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import {
  createPDFStyles,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from '@/lib/pdf';

interface PDFHeaderProps {
  issuer: {
    name: string;
    rfc: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    logo?: string;
  };
  folio: string;
  status: string;
  createdAt: string;
  validUntil: string;
}

export default function PDFHeader({ issuer, folio, status, createdAt, validUntil }: PDFHeaderProps) {
  const styles = createPDFStyles();
  const statusColor = getStatusColor(status);

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.companyInfo}>
          {issuer.logo && (
            <Image style={styles.logo} src={issuer.logo} />
          )}
          <Text style={styles.title}>{issuer.name}</Text>
          <Text style={styles.boldText}>RFC: {issuer.rfc}</Text>
          <Text style={styles.text}>{issuer.address}</Text>
          <Text style={styles.text}>
            {issuer.city}, {issuer.state} C.P. {issuer.zip}
          </Text>
          <Text style={styles.text}>Tel: {issuer.phone}</Text>
          <Text style={styles.text}>Email: {issuer.email}</Text>
        </View>

        <View style={styles.documentInfo}>
          <Text style={styles.title}>COTIZACIÓN</Text>
          <Text style={styles.boldText}>Folio: {folio}</Text>
          <Text style={styles.text}>Fecha: {formatDate(createdAt)}</Text>
          <Text style={styles.text}>Vigencia: {formatDate(validUntil)}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}