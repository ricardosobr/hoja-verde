'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { getClientQuotations, getStatusBadgeColor, getStatusLabel, canClientUpdateStatus } from '@/lib/client-quotations'
import type { ClientQuotation } from '@/lib/client-quotations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Search, Eye, Download, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

type QuotationStatus = 'all' | 'generated' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'converted'

export default function ClientQuotationsPage() {
  const { user } = useAuthStore()
  const [quotations, setQuotations] = useState<ClientQuotation[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<ClientQuotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuotationStatus>('all')

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id || !user?.companyId) return
      
      try {
        setLoading(true)
        setError(null)
        const data = await getClientQuotations(user.id, user.companyId)
        setQuotations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading quotations')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [user?.id, user?.companyId])

  useEffect(() => {
    let filtered = quotations

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(q => 
        q.folio.toLowerCase().includes(term) ||
        q.contact_name.toLowerCase().includes(term) ||
        q.companies?.name?.toLowerCase().includes(term)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.quotation_status === statusFilter)
    }

    setFilteredQuotations(filtered)
  }, [quotations, searchTerm, statusFilter])

  const loadQuotations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getClientQuotations(user!.id, user!.companyId)
      setQuotations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading quotations')
    } finally {
      setLoading(false)
    }
  }


  const getStatusCounts = () => {
    const counts = {
      all: quotations.length,
      generated: quotations.filter(q => q.quotation_status === 'generated').length,
      in_review: quotations.filter(q => q.quotation_status === 'in_review').length,
      approved: quotations.filter(q => q.quotation_status === 'approved').length,
      rejected: quotations.filter(q => q.quotation_status === 'rejected').length,
      expired: quotations.filter(q => q.quotation_status === 'expired').length,
      converted: quotations.filter(q => q.quotation_status === 'converted').length,
    }
    return counts
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadQuotations}>Intentar de Nuevo</Button>
        </div>
      </div>
    )
  }

  const counts = getStatusCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Mis Cotizaciones</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadQuotations}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className={statusFilter === 'all' ? 'ring-2 ring-green-500' : ''}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{counts.all}</div>
              <div className="text-sm text-gray-600">Todas</div>
            </div>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'generated' ? 'ring-2 ring-blue-500' : ''}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{counts.generated}</div>
              <div className="text-sm text-gray-600">Nuevas</div>
            </div>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'in_review' ? 'ring-2 ring-yellow-500' : ''}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{counts.in_review}</div>
              <div className="text-sm text-gray-600">En Revisión</div>
            </div>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'approved' ? 'ring-2 ring-green-500' : ''}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
              <div className="text-sm text-gray-600">Aprobadas</div>
            </div>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
              <div className="text-sm text-gray-600">Rechazadas</div>
            </div>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'expired' ? 'ring-2 ring-gray-500' : ''}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{counts.expired}</div>
              <div className="text-sm text-gray-600">Expiradas</div>
            </div>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'converted' ? 'ring-2 ring-purple-500' : ''}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{counts.converted}</div>
              <div className="text-sm text-gray-600">Convertidas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por folio, contacto o empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: QuotationStatus) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="generated">Nuevas</SelectItem>
                <SelectItem value="in_review">En Revisión</SelectItem>
                <SelectItem value="approved">Aprobadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
                <SelectItem value="converted">Convertidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {quotations.length === 0 ? 'No hay cotizaciones' : 'No se encontraron cotizaciones'}
              </h3>
              <p className="text-gray-600 mb-4">
                {quotations.length === 0 
                  ? 'Aún no tienes cotizaciones registradas.'
                  : 'Intenta ajustar los filtros de búsqueda.'
                }
              </p>
              {searchTerm || statusFilter !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                >
                  Limpiar Filtros
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuotations.map((quotation) => (
            <Card key={quotation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {quotation.folio}
                      </h3>
                      <Badge className={getStatusBadgeColor(quotation.quotation_status)}>
                        {getStatusLabel(quotation.quotation_status)}
                      </Badge>
                      {canClientUpdateStatus(quotation.quotation_status) && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          Acción Requerida
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Contacto</p>
                        <p className="font-medium">{quotation.contact_name}</p>
                        <p className="text-sm text-gray-600">{quotation.contact_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Empresa</p>
                        <p className="font-medium">{quotation.companies?.name}</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              Fecha
                            </div>
                            <p className="font-medium">
                              {new Date(quotation.issue_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <DollarSign className="h-4 w-4 mr-1" />
                              Total
                            </div>
                            <p className="font-bold text-green-600">
                              {formatCurrency(quotation.total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {quotation.expiry_date && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          Válida hasta: {new Date(quotation.expiry_date).toLocaleDateString()}
                          {new Date(quotation.expiry_date) < new Date() && (
                            <span className="text-red-600 ml-2">(Expirada)</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <Button asChild>
                      <Link href={`/client/quotations/${quotation.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}