import React from 'react';
import { render } from '@testing-library/react';
import { QuotationPDFData } from '@/lib/pdf';

interface MockComponentProps {
  children: React.ReactNode
  style?: Record<string, string | number>
}

interface MockPageProps extends MockComponentProps {
  size?: string
}

interface MockTextProps extends MockComponentProps {
  render?: boolean
}

interface MockImageProps {
  src: string
  style?: Record<string, string | number>
}

interface MockPDFViewerProps {
  children: React.ReactNode
  width?: string | number
  height?: string | number
}

interface MockDownloadLinkProps {
  document: React.ReactNode
  fileName: string
  children: React.ReactNode | ((props: { blob: null; url: string; loading: boolean; error: null }) => React.ReactNode)
}

// Mock @react-pdf/renderer
jest.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: MockComponentProps) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children, size }: MockPageProps) => <div data-testid="pdf-page" data-size={size}>{children}</div>,
  Text: ({ children }: MockTextProps) => <span data-testid="pdf-text">{children}</span>,
  View: ({ children }: MockComponentProps) => <div data-testid="pdf-view">{children}</div>,
  Image: ({ src }: MockImageProps) => <img data-testid="pdf-image" src={src} alt="PDF Image" />,
  StyleSheet: {
    create: (styles: Record<string, Record<string, string | number>>) => styles,
  },
  PDFViewer: ({ children, width, height }: MockPDFViewerProps) => (
    <div data-testid="pdf-viewer" style={{ width, height }}>{children}</div>
  ),
  PDFDownloadLink: ({ fileName, children }: MockDownloadLinkProps) => (
    <button data-testid="pdf-download-link" data-filename={fileName}>
      {typeof children === 'function' 
        ? children({ blob: null, url: '', loading: false, error: null })
        : children}
    </button>
  ),
  Font: {
    register: jest.fn(),
  },
}));

// Import after mocking
import QuotationPDF, { QuotationPDFViewer } from '@/components/pdf/quotation-pdf';

describe('QuotationPDF Component', () => {
  const mockData: QuotationPDFData = {
    id: '1',
    folio: 'FOL-001',
    status: 'generated',
    createdAt: '2024-01-01',
    validUntil: '2024-01-31',
    subtotal: 1000,
    tax: 160,
    discount: 50,
    total: 1110,
    notes: 'Test notes',
    company: {
      id: '1',
      name: 'Test Company',
      rfc: 'RFC123456',
      address: '123 Main St',
      city: 'Mexico City',
      state: 'CDMX',
      zip: '12345',
      phone: '555-1234',
      email: 'test@company.com',
      contactName: 'John Doe',
    },
    items: [
      {
        id: '1',
        productName: 'Product 1',
        productCode: 'P001',
        description: 'Test product description',
        quantity: 2,
        unitPrice: 500,
        subtotal: 1000,
        tax: 160,
        total: 1160,
      },
    ],
    issuer: {
      name: 'Issuer Company',
      rfc: 'ISS123456',
      address: '456 Business Ave',
      city: 'Mexico City',
      state: 'CDMX',
      zip: '54321',
      phone: '555-5678',
      email: 'issuer@company.com',
    },
  };

  it('should render PDF document with all sections', () => {
    const { getByTestId, getAllByTestId } = render(
      <QuotationPDF data={mockData} />
    );

    expect(getByTestId('pdf-document')).toBeInTheDocument();
    expect(getByTestId('pdf-page')).toBeInTheDocument();
    
    // Check for multiple views (sections)
    const views = getAllByTestId('pdf-view');
    expect(views.length).toBeGreaterThan(0);
    
    // Check for text elements
    const texts = getAllByTestId('pdf-text');
    expect(texts.length).toBeGreaterThan(0);
  });

  it('should show watermark for draft status', () => {
    const draftData = { ...mockData, status: 'draft' };
    const { getAllByTestId } = render(
      <QuotationPDF data={draftData} />
    );

    const texts = getAllByTestId('pdf-text');
    const watermarkText = texts.find(text => 
      text.textContent?.includes('BORRADOR')
    );
    expect(watermarkText).toBeTruthy();
  });

  it('should show watermark for rejected status', () => {
    const rejectedData = { ...mockData, status: 'rejected' };
    const { getAllByTestId } = render(
      <QuotationPDF data={rejectedData} />
    );

    const texts = getAllByTestId('pdf-text');
    const watermarkText = texts.find(text => 
      text.textContent?.includes('RECHAZADA')
    );
    expect(watermarkText).toBeTruthy();
  });

  it('should show watermark for expired status', () => {
    const expiredData = { ...mockData, status: 'expired' };
    const { getAllByTestId } = render(
      <QuotationPDF data={expiredData} />
    );

    const texts = getAllByTestId('pdf-text');
    const watermarkText = texts.find(text => 
      text.textContent?.includes('EXPIRADA')
    );
    expect(watermarkText).toBeTruthy();
  });

  it('should not show watermark for approved status', () => {
    const approvedData = { ...mockData, status: 'approved' };
    const { getAllByTestId } = render(
      <QuotationPDF data={approvedData} />
    );

    const texts = getAllByTestId('pdf-text');
    const watermarkText = texts.find(text => 
      text.textContent?.includes('APROBADA') && 
      text.getAttribute('style')?.includes('watermark')
    );
    expect(watermarkText).toBeFalsy();
  });

  it('should render notes section when notes are provided', () => {
    const { getAllByTestId } = render(
      <QuotationPDF data={mockData} />
    );

    const texts = getAllByTestId('pdf-text');
    const notesText = texts.find(text => 
      text.textContent?.includes('Test notes')
    );
    expect(notesText).toBeTruthy();
  });

  it('should not render notes section when notes are empty', () => {
    const dataWithoutNotes = { ...mockData, notes: undefined };
    const { getAllByTestId } = render(
      <QuotationPDF data={dataWithoutNotes} />
    );

    const texts = getAllByTestId('pdf-text');
    const notesTitle = texts.find(text => 
      text.textContent?.includes('Notas y Observaciones')
    );
    expect(notesTitle).toBeFalsy();
  });

  it('should use default issuer when not provided', () => {
    const dataWithoutIssuer = { ...mockData, issuer: undefined };
    const { getAllByTestId } = render(
      <QuotationPDF data={dataWithoutIssuer} />
    );

    const texts = getAllByTestId('pdf-text');
    const issuerText = texts.find(text => 
      text.textContent?.includes('Hoja Verde')
    );
    expect(issuerText).toBeTruthy();
  });
});

describe('QuotationPDFViewer Component', () => {
  const mockData: QuotationPDFData = {
    id: '1',
    folio: 'FOL-001',
    status: 'generated',
    createdAt: '2024-01-01',
    validUntil: '2024-01-31',
    subtotal: 1000,
    tax: 160,
    discount: 0,
    total: 1160,
    company: {
      id: '1',
      name: 'Test Company',
      rfc: 'RFC123456',
      address: '123 Main St',
      city: 'City',
      state: 'State',
      zip: '12345',
      phone: '555-1234',
      email: 'test@company.com',
    },
    items: [],
  };

  it('should render PDF viewer with default dimensions', () => {
    const { getByTestId } = render(
      <QuotationPDFViewer data={mockData} />
    );

    const viewer = getByTestId('pdf-viewer');
    expect(viewer).toBeInTheDocument();
    expect(viewer).toHaveStyle({ width: '100%', height: '600px' });
  });

  it('should render PDF viewer with custom dimensions', () => {
    const { getByTestId } = render(
      <QuotationPDFViewer data={mockData} width="800px" height="1000px" />
    );

    const viewer = getByTestId('pdf-viewer');
    expect(viewer).toHaveStyle({ width: '800px', height: '1000px' });
  });
});