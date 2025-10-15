import type { Metadata } from "next";
import { Inter, Playfair_Display, Crimson_Text } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/components/providers/auth-provider'
import { NotificationProvider } from '@/components/providers/notification-provider'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: 'swap',
});

const crimson = Crimson_Text({
  subsets: ["latin"],
  weight: ['400', '600', '700'],
  variable: "--font-crimson",
  display: 'swap',
});

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
      <body
        className={`${inter.variable} ${playfair.variable} ${crimson.variable} font-sans antialiased h-full bg-gray-50`}
      >
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
