import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Import calculation utilities
import { roundToPesos } from './calculations'
import { formatMXNCurrency } from './currency'

// Format currency for Mexican pesos (backward compatibility)
export function formatCurrency(amount: number): string {
  return formatMXNCurrency(amount)
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

// Generate folio
export function generateFolio(type: 'quotation' | 'order'): string {
  const prefix = type === 'quotation' ? 'COT' : 'ORD'
  const timestamp = Date.now().toString(16).toUpperCase()
  return `${prefix}-${timestamp.slice(-8)}`
}

// Calculate tax amount (backward compatibility)
export function calculateTax(amount: number, taxRate: number): number {
  return roundToPesos(amount * taxRate)
}

// Calculate total with tax (backward compatibility)
export function calculateTotal(subtotal: number, taxAmount: number): number {
  return roundToPesos(subtotal + taxAmount)
}

// Validate RFC (Mexican tax ID)
export function validateRFC(rfc: string): boolean {
  const rfcPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-V1-9][A-Z1-9][0-9A]$/
  return rfcPattern.test(rfc)
}

// Get status color for UI
export function getStatusColor(status: string, type: 'quotation' | 'order' | 'delivery'): string {
  const statusColors = {
    quotation: {
      draft: 'bg-gray-100 text-gray-800',
      generated: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      converted: 'bg-purple-100 text-purple-800',
    },
    order: {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    },
    delivery: {
      preparing: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    },
  }

  return statusColors[type][status as keyof typeof statusColors[typeof type]] || 'bg-gray-100 text-gray-800'
}

// Get status text in Spanish
export function getStatusText(status: string, type: 'quotation' | 'order' | 'delivery'): string {
  const statusTexts = {
    quotation: {
      draft: 'Borrador',
      generated: 'Generada',
      in_review: 'En Revisión',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      expired: 'Expirada',
      converted: 'Convertida',
    },
    order: {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      in_progress: 'En Proceso',
      ready: 'Lista',
      shipped: 'Enviada',
      delivered: 'Entregada',
      cancelled: 'Cancelada',
    },
    delivery: {
      preparing: 'Preparando',
      in_transit: 'En Camino',
      delivered: 'Entregado',
      failed: 'Fallo en Entrega',
    },
  }

  return statusTexts[type][status as keyof typeof statusTexts[typeof type]] || status
}