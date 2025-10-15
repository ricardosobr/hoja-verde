import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/components/providers/auth-provider'
import { NotificationProvider } from '@/components/providers/notification-provider'

export const metadata: Metadata = {
  title: "Hoja Verde - Sistema de Cotizaciones",
  description: "Sistema integral para gestión de cotizaciones y pedidos",
  keywords: "cotizaciones, pedidos, gestión, hoja verde",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Crimson+Text:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased h-full bg-gray-50">
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
