'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useNotificationStore } from '@/lib/store'
import { formatDate, formatCurrency } from '@/lib/utils'
import { 
  X, 
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
  UserX,
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

interface CompanyDetailsProps {
  company: Company
  onClose: () => void
  onEdit: () => void
}

export function CompanyDetails({ company, onClose, onEdit }: CompanyDetailsProps) {
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview')
  
  const { addNotification } = useNotificationStore()
  const supabase = createClient()

  useEffect(() => {
    fetchCompanyStats()
  }, [company.id])

  const fetchCompanyStats = async () => {
    setIsLoading(true)
    
    try {
      // Fetch quotations and orders statistics
      const [quotationsResult, ordersResult, recentActivityResult] = await Promise.all([
        supabase
          .from('documents')
          .select('id, total, quotation_status')
          .eq('company_id', company.id)
          .eq('type', 'quotation'),
        
        supabase
          .from('documents')
          .select('id, total, order_status')
          .eq('company_id', company.id)
          .eq('type', 'order'),
        
        supabase
          .from('documents')
          .select('id, type, folio, total, created_at, quotation_status, order_status')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      const quotations = quotationsResult.data || []
      const orders = ordersResult.data || []
      const recentActivity = recentActivityResult.data || []

      const totalRevenue = orders
        .filter(order => ['delivered', 'shipped'].includes(order.order_status || ''))
        .reduce((sum, order) => sum + order.total, 0)

      const activeQuotations = quotations
        .filter(q => ['generated', 'in_review'].includes(q.quotation_status || ''))
        .length

      setStats({
        total_quotations: quotations.length,
        total_orders: orders.length,
        total_revenue: totalRevenue,
        active_quotations: activeQuotations,
        recent_activity: recentActivity
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

  const handleUserStatusToggle = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId)

      if (error) throw error

      addNotification({
        type: 'success',
        title: 'User Updated',
        message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      })

      // Refresh company data
      window.location.reload()
    } catch (error) {
      console.error('Error updating user:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update user status'
      })
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

  const getDocumentStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    switch (status) {
      case 'generated':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'in_review':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  getStatusColor(company.status)
                }`}>
                  {company.status}
                </span>
                {company.rfc && (
                  <span className="text-sm text-gray-500">RFC: {company.rfc}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={onEdit}
              className="text-green-600 hover:text-green-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Company
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Building },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'activity', label: 'Recent Activity', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Quotations</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-blue-900">
                      {stats?.total_quotations || 0}
                    </span>
                    <p className="text-xs text-blue-700">
                      {stats?.active_quotations || 0} active
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Orders</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-green-900">
                      {stats?.total_orders || 0}
                    </span>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Revenue</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-purple-900">
                      {formatCurrency(stats?.total_revenue || 0)}
                    </span>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Users</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-orange-900">
                      {company.client_profiles?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {company.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{company.email}</span>
                      </div>
                    )}
                    
                    {company.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{company.phone}</span>
                      </div>
                    )}
                    
                    {company.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                    
                    {company.address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-sm text-gray-900">
                          <div>{company.address}</div>
                          {(company.city || company.state || company.postal_code) && (
                            <div>
                              {company.city && company.city}
                              {company.city && company.state && ', '}
                              {company.state && company.state}
                              {company.postal_code && ` ${company.postal_code}`}
                            </div>
                          )}
                          <div>{company.country}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">Created:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {formatDate(company.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                          getStatusColor(company.status)
                        }`}>
                          {company.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Company Users ({company.client_profiles?.length || 0})
                </h3>
              </div>

              {company.client_profiles && company.client_profiles.length > 0 ? (
                <div className="space-y-4">
                  {company.client_profiles.map((profile) => (
                    <div key={profile.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-base font-medium text-gray-900">
                              {profile.users.full_name}
                            </h4>
                            {profile.is_primary_contact && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Primary Contact
                              </span>
                            )}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              getStatusColor(profile.users.status)
                            }`}>
                              {profile.users.status}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Email: {profile.users.email}</div>
                            {profile.position && <div>Position: {profile.position}</div>}
                            {profile.department && <div>Department: {profile.department}</div>}
                            {profile.phone && <div>Phone: {profile.phone}</div>}
                            {profile.whatsapp && <div>WhatsApp: {profile.whatsapp}</div>}
                            <div>Credit Limit: {formatCurrency(profile.credit_limit)}</div>
                            {profile.users.last_login && (
                              <div>Last Login: {formatDate(profile.users.last_login)}</div>
                            )}
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            {profile.can_create_quotations && (
                              <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Can Create Quotations
                              </span>
                            )}
                            {profile.can_approve_orders && (
                              <span className="inline-flex px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                                Can Approve Orders
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserStatusToggle(profile.user_id, profile.users.status)}
                            className={profile.users.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {profile.users.status === 'active' ? (
                              <>
                                <UserX className="w-4 h-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">This company doesn't have any users assigned yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>

              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_activity.map((activity) => (
                    <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            activity.type === 'quotation' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            <FileText className={`w-4 h-4 ${
                              activity.type === 'quotation' ? 'text-blue-600' : 'text-green-600'
                            }`} />
                          </div>
                          
                          <div>
                            <div className="font-medium text-gray-900">
                              {activity.type === 'quotation' ? 'Quotation' : 'Order'} {activity.folio}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(activity.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(activity.total)}
                          </div>
                          {(activity.quotation_status || activity.order_status) && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              getDocumentStatusColor(activity.quotation_status || activity.order_status)
                            }`}>
                              {activity.quotation_status || activity.order_status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                  <p className="text-gray-600">
                    This company doesn't have any quotations or orders yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}