'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { formatDate, formatCurrency } from '@/lib/utils'
import { 
  ArrowLeft, 
  Edit, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Users,
  CreditCard,
  Calendar,
  UserCheck,
  Settings,
  FileText,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      last_login: string | null
    }
  }[]
}

interface CompanyStats {
  total_quotations: number
  total_orders: number
  total_revenue: number
  active_quotations: number
  recent_activity: {
    id: string
    type: 'quotation' | 'order'
    folio: string
    total: number
    created_at: string
    quotation_status?: string
    order_status?: string
  }[]
}

interface CompanyDetailPageProps {
  params: {
    id: string
  }
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview')
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  useEffect(() => {
    if (resolvedParams.id) {
      fetchCompanyDetails()
      fetchCompanyStats()
    }
  }, [resolvedParams.id])

  const fetchCompanyDetails = async () => {
    try {
      const { data, error } = await supabase
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
              status,
              last_login
            )
          )
        `)
        .eq('id', resolvedParams.id)
        .single()

      if (error) throw error

      setCompany(data)
    } catch (error) {
      console.error('Error fetching company:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch company details'
      })
      router.push('/admin/clients')
    }
  }

  const fetchCompanyStats = async () => {
    setIsLoading(true)
    
    try {
      // Fetch quotations and orders statistics
      const [quotationsRes, ordersRes, activityRes] = await Promise.all([
        // Quotations stats
        supabase
          .from('quotations')
          .select('total, status')
          .eq('company_id', resolvedParams.id),
        
        // Orders stats  
        supabase
          .from('orders')
          .select('total, status')
          .eq('company_id', resolvedParams.id),
        
        // Recent activity
        supabase
          .from('quotations')
          .select('id, folio, total, created_at, status')
          .eq('company_id', params.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      const quotations = quotationsRes.data || []
      const orders = ordersRes.data || []
      const recentQuotations = activityRes.data || []

      // Calculate statistics
      const total_quotations = quotations.length
      const total_orders = orders.length
      const total_revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
      const active_quotations = quotations.filter(q => 
        ['draft', 'generated', 'in_review', 'approved'].includes(q.status)
      ).length

      // Format recent activity
      const recent_activity = recentQuotations.map(q => ({
        id: q.id,
        type: 'quotation' as const,
        folio: q.folio,
        total: q.total,
        created_at: q.created_at,
        quotation_status: q.status
      }))

      setStats({
        total_quotations,
        total_orders,
        total_revenue,
        active_quotations,
        recent_activity
      })
    } catch (error) {
      console.error('Error fetching company stats:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch company statistics'
      })
    } finally {
      setIsLoading(false)
    }
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

  if (!company && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Company not found</p>
        <Button
          onClick={() => router.push('/admin/clients')}
          className="mt-4"
        >
          Back to Clients
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/clients')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clients</span>
          </Button>
        </div>

        {company && (
          <Button
            onClick={() => router.push(`/admin/clients/${company.id}/edit`)}
            className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Company</span>
          </Button>
        )}
      </div>

      {company && (
        <>
          {/* Company Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <Building className="w-8 h-8 text-gray-400" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                    <div className="flex items-center space-x-3 mt-1">
                      {company.rfc && (
                        <span className="text-gray-600">RFC: {company.rfc}</span>
                      )}
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        getStatusColor(company.status)
                      }`}>
                        {getStatusText(company.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {company.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{company.email}</span>
                    </div>
                  )}
                  
                  {company.phone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{company.phone}</span>
                    </div>
                  )}
                  
                  {company.website && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Globe className="w-4 h-4" />
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Website
                      </a>
                    </div>
                  )}

                  {company.address && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {company.city}, {company.state}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_quotations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Quotations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active_quotations}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users ({company.client_profiles?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recent Activity
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border border-gray-200">
            {activeTab === 'overview' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Details</h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500">Company Name</dt>
                        <dd className="text-sm font-medium text-gray-900">{company.name}</dd>
                      </div>
                      {company.rfc && (
                        <div>
                          <dt className="text-sm text-gray-500">RFC</dt>
                          <dd className="text-sm font-medium text-gray-900">{company.rfc}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm text-gray-500">Status</dt>
                        <dd>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getStatusColor(company.status)
                          }`}>
                            {getStatusText(company.status)}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Created</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatDate(company.created_at)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Address</h4>
                    <div className="text-sm text-gray-900">
                      {company.address ? (
                        <>
                          <p>{company.address}</p>
                          <p>{company.city}, {company.state} {company.postal_code}</p>
                          <p>{company.country}</p>
                        </>
                      ) : (
                        <p className="text-gray-500 italic">No address information</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Associated Users</h3>
                  <Button
                    onClick={() => {
                      // TODO: Implement add user functionality
                      addNotification({
                        type: 'info',
                        title: 'Feature Coming Soon',
                        message: 'User management will be available in the next update'
                      })
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Add User
                  </Button>
                </div>

                {company.client_profiles && company.client_profiles.length > 0 ? (
                  <div className="space-y-4">
                    {company.client_profiles.map((profile) => (
                      <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {profile.users.full_name}
                                </h4>
                                <p className="text-sm text-gray-500">{profile.users.email}</p>
                              </div>
                              {profile.is_primary_contact && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Primary Contact
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Position:</span>
                                <span className="ml-1 text-gray-900">{profile.position || 'Not specified'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Department:</span>
                                <span className="ml-1 text-gray-900">{profile.department || 'Not specified'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Phone:</span>
                                <span className="ml-1 text-gray-900">{profile.phone || 'Not specified'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Credit Limit:</span>
                                <span className="ml-1 text-gray-900">{formatCurrency(profile.credit_limit)}</span>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center space-x-4 text-xs">
                              <span className={`inline-flex px-2 py-1 rounded-full ${
                                profile.can_create_quotations
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {profile.can_create_quotations ? 'Can Create Quotations' : 'No Quotation Rights'}
                              </span>
                              <span className={`inline-flex px-2 py-1 rounded-full ${
                                profile.can_approve_orders
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {profile.can_approve_orders ? 'Can Approve Orders' : 'No Approval Rights'}
                              </span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-500">
                            Last login: {profile.users.last_login ? formatDate(profile.users.last_login) : 'Never'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users assigned to this company</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                
                {stats && stats.recent_activity.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recent_activity.map((activity) => (
                      <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {activity.type === 'quotation' ? 'Quotation' : 'Order'}: {activity.folio}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(activity.total)} • {formatDate(activity.created_at)}
                              </p>
                            </div>
                          </div>
                          
                          {activity.quotation_status && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {activity.quotation_status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}