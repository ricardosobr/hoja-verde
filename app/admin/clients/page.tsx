'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Building,
  Mail,
  Phone,
  UserPlus,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CompanyForm } from '@/components/admin/company-form'
import { UserForm } from '@/components/admin/user-form'
import { CompanyDetails } from '@/components/admin/company-details'
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Company {
  id: string
  name: string
  rfc: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  client_profiles?: {
    id: string
    user_id: string
    position: string | null
    department: string | null
    phone: string | null
    whatsapp: string | null
    is_primary_contact: boolean
    can_create_quotations: boolean
    can_approve_orders: boolean
    credit_limit: number
    users: {
      id: string
      email: string
      full_name: string
      status: string
    }
  }[]
}

export default function ClientsPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  useEffect(() => {
    fetchCompanies()
  }, [currentPage, searchTerm, statusFilter])

  const fetchCompanies = async () => {
    setIsLoading(true)
    
    try {
      let query = supabase
        .from('companies')
        .select(`
          *,
          client_profiles (
            id,
            user_id,
            position,
            department,
            phone,
            whatsapp,
            is_primary_contact,
            can_create_quotations,
            can_approve_orders,
            credit_limit,
            users (
              id,
              email,
              full_name,
              status
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchTerm) {
        // Optimize search with more specific queries and proper indexing
        // Use textSearch for better performance on larger datasets
        const searchValue = searchTerm.trim()
        
        // If search looks like RFC format (alphanumeric), prioritize RFC search
        if (/^[A-Z0-9&Ñ]+$/i.test(searchValue)) {
          query = query.or(`rfc.ilike.%${searchValue}%,name.ilike.%${searchValue}%`)
        }
        // If search contains @ symbol, prioritize email search  
        else if (searchValue.includes('@')) {
          query = query.or(`email.ilike.%${searchValue}%,name.ilike.%${searchValue}%`)
        }
        // Otherwise search name first (most common search)
        else {
          query = query.or(`name.ilike.%${searchValue}%,rfc.ilike.%${searchValue}%,email.ilike.%${searchValue}%`)
        }
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error, count } = await query

      if (error) throw error

      setCompanies(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching companies:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch companies'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (company: Company) => {
    if (!confirm(`Are you sure you want to delete "${company.name}"? This will also remove all associated users and data.`)) return

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id)

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'Company Deleted',
        message: `"${company.name}" has been deleted successfully`
      })

      fetchCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete company'
      })
    }
  }

  const handleToggleStatus = async (company: Company) => {
    try {
      const newStatus = company.status === 'active' ? 'inactive' : 'active'
      
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', company.id)

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'Company Updated',
        message: `Company ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      })

      fetchCompanies()
    } catch (error) {
      console.error('Error updating company:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update company'
      })
    }
  }

  const handleFormSubmit = () => {
    setShowCompanyForm(false)
    setShowUserForm(false)
    setEditingCompany(null)
    setSelectedCompany(null)
    fetchCompanies()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'pending':
        return 'Pending'
      default:
        return status
    }
  }

  if (isLoading && companies.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-hoja-verde-800">Gestión de Clientes</h1>
          <p className="text-hoja-verde-600 mt-2 font-medium">
            Administra empresas cliente y permisos de usuarios
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => router.push('/admin/clients/new')}
            className="bg-hoja-verde-700 hover:bg-hoja-verde-800 text-brand-cream font-semibold px-6 py-3 rounded-xl shadow-brand hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span>Agregar Empresa</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-hoja-verde-200/50 shadow-brand">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-hoja-verde-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar empresas por nombre, RFC o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl border-hoja-verde-200 focus:border-hoja-verde-500 focus:ring-hoja-verde-500/20 placeholder:text-hoja-verde-400"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-hoja-verde-200 rounded-xl text-sm font-medium text-hoja-verde-700 focus:outline-none focus:ring-2 focus:ring-hoja-verde-500/20 focus:border-hoja-verde-500 bg-white"
          >
            <option value="">Todos los Estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Building className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getStatusColor(company.status)
                  }`}>
                    {getStatusText(company.status)}
                  </span>
                </div>
                
                {company.rfc && (
                  <p className="text-sm text-gray-600">RFC: {company.rfc}</p>
                )}
                
                {company.address && (
                  <p className="text-sm text-gray-600 mt-1">
                    {company.address}, {company.city}, {company.state} {company.postal_code}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/clients/${company.id}`)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/clients/${company.id}/edit`)}
                  className="text-green-600 hover:text-green-900"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(company)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              {company.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{company.email}</span>
                </div>
              )}
              
              {company.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{company.phone}</span>
                </div>
              )}
            </div>

            {/* Users */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Users ({company.client_profiles?.length || 0})
                  </span>
                </div>
                
                <Dialog open={showUserForm && selectedCompany?.id === company.id} onOpenChange={(open) => {
                  if (!open) {
                    setShowUserForm(false)
                    setSelectedCompany(null)
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCompany(company)
                        setShowUserForm(true)
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  {selectedCompany?.id === company.id && (
                    <UserForm
                      company={selectedCompany}
                      onSubmit={handleFormSubmit}
                    />
                  )}
                </Dialog>
              </div>
              
              {company.client_profiles && company.client_profiles.length > 0 ? (
                <div className="space-y-2">
                  {company.client_profiles.slice(0, 3).map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {profile.users.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {profile.users.email} • {profile.position || 'No position'}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {profile.is_primary_contact && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                        
                        <span className={`text-xs px-2 py-1 rounded ${
                          profile.users.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {profile.users.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {company.client_profiles.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{company.client_profiles.length - 3} more users
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No users assigned</p>
              )}
            </div>

            {/* Created Date */}
            <div className="text-xs text-gray-400 mt-4 pt-2 border-t">
              Created {formatDate(company.created_at)}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, companies.length)} of{' '}
              {companies.length} companies
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && companies.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No companies found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first client company'}
          </p>
          <Dialog open={showCompanyForm} onOpenChange={setShowCompanyForm}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <CompanyForm
              company={editingCompany}
              onSubmit={handleFormSubmit}
            />
          </Dialog>
        </div>
      )}

      {/* Company Details Modal */}
      {showCompanyDetails && selectedCompany && (
        <CompanyDetails
          company={selectedCompany}
          onClose={() => {
            setShowCompanyDetails(false)
            setSelectedCompany(null)
          }}
          onEdit={() => {
            setEditingCompany(selectedCompany)
            setShowCompanyDetails(false)
            setShowCompanyForm(true)
          }}
        />
      )}
    </div>
  )
}