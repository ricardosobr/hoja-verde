import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { createPDFStyles } from '@/lib/pdf';

interface PDFClientInfoProps {
  company: {
    id: string;
    name: string;
    rfc: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
    contactName?: string;
  };
}

export default function PDFClientInfo({ company }: PDFClientInfoProps) {
  const styles = createPDFStyles();

  return (
    <View style={styles.clientSection}>
      <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
      
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.boldText}>Razón Social:</Text>
          <Text style={styles.text}>{company.name}</Text>
          
          <Text style={[styles.boldText, { marginTop: 5 }]}>RFC:</Text>
          <Text style={styles.text}>{company.rfc}</Text>
          
          {company.contactName && (
            <>
              <Text style={[styles.boldText, { marginTop: 5 }]}>Contacto:</Text>
              <Text style={styles.text}>{company.contactName}</Text>
            </>
          )}
        </View>
        
        <View style={styles.column}>
          <Text style={styles.boldText}>Dirección:</Text>
          <Text style={styles.text}>{company.address}</Text>
          <Text style={styles.text}>
            {company.city}, {company.state} C.P. {company.zip}
          </Text>
          
          <Text style={[styles.boldText, { marginTop: 5 }]}>Teléfono:</Text>
          <Text style={styles.text}>{company.phone}</Text>
          
          <Text style={[styles.boldText, { marginTop: 5 }]}>Email:</Text>
          <Text style={styles.text}>{company.email}</Text>
        </View>
      </View>
    </View>
  );
}