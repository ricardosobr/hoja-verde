import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Database types - these will be generated from your Supabase schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'client'
          status: 'active' | 'inactive' | 'pending'
          created_at: string
          updated_at: string
          last_login: string | null
          created_by: string | null
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'admin' | 'client'
          status?: 'active' | 'inactive' | 'pending'
          created_by?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          role?: 'admin' | 'client'
          status?: 'active' | 'inactive' | 'pending'
          last_login?: string | null
        }
      }
      companies: {
        Row: {
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
          updated_at: string
          created_by: string
        }
        Insert: {
          name: string
          rfc?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_by: string
        }
        Update: {
          name?: string
          rfc?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          status?: 'active' | 'inactive' | 'pending'
        }
      }
      products: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          category_id: string | null
          unit: string
          cost_price: number
          profit_margin: number
          base_price: number
          public_price: number
          tax_id: string | null
          tax_included: boolean
          stock_quantity: number
          min_stock_level: number
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          code: string
          name: string
          description?: string | null
          category_id?: string | null
          unit: string
          cost_price: number
          profit_margin?: number
          base_price: number
          public_price: number
          tax_id?: string | null
          tax_included?: boolean
          stock_quantity?: number
          min_stock_level?: number
          is_active?: boolean
          created_by: string
        }
        Update: {
          code?: string
          name?: string
          description?: string | null
          category_id?: string | null
          unit?: string
          cost_price?: number
          profit_margin?: number
          base_price?: number
          public_price?: number
          tax_id?: string | null
          tax_included?: boolean
          stock_quantity?: number
          min_stock_level?: number
          is_active?: boolean
        }
      }
      documents: {
        Row: {
          id: string
          folio: string
          type: 'quotation' | 'order'
          company_id: string
          client_id: string
          contact_name: string
          contact_email: string
          contact_phone: string | null
          issue_date: string
          validity_days: number
          expiry_date: string
          terms: string | null
          delivery_terms: string | null
          payment_terms: string | null
          quotation_status: 'draft' | 'generated' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'converted' | null
          order_status: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | null
          delivery_status: 'preparing' | 'in_transit' | 'delivered' | 'failed' | null
          subtotal: number
          tax_amount: number
          total: number
          created_at: string
          updated_at: string
          created_by: string
          quotation_id: string | null
        }
        Insert: {
          folio: string
          type: 'quotation' | 'order'
          company_id: string
          client_id: string
          contact_name: string
          contact_email: string
          contact_phone?: string | null
          issue_date?: string
          validity_days?: number
          terms?: string | null
          delivery_terms?: string | null
          payment_terms?: string | null
          quotation_status?: 'draft' | 'generated' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'converted' | null
          order_status?: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | null
          delivery_status?: 'preparing' | 'in_transit' | 'delivered' | 'failed' | null
          subtotal?: number
          tax_amount?: number
          total?: number
          created_by: string
          quotation_id?: string | null
        }
        Update: {
          folio?: string
          type?: 'quotation' | 'order'
          company_id?: string
          client_id?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string | null
          issue_date?: string
          validity_days?: number
          terms?: string | null
          delivery_terms?: string | null
          payment_terms?: string | null
          quotation_status?: 'draft' | 'generated' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'converted' | null
          order_status?: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | null
          delivery_status?: 'preparing' | 'in_transit' | 'delivered' | 'failed' | null
          subtotal?: number
          tax_amount?: number
          total?: number
          quotation_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'client'
      user_status: 'active' | 'inactive' | 'pending'
      document_type: 'quotation' | 'order'
      quotation_status: 'draft' | 'generated' | 'in_review' | 'approved' | 'rejected' | 'expired' | 'converted'
      order_status: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'shipped' | 'delivered' | 'cancelled'
      delivery_status: 'preparing' | 'in_transit' | 'delivered' | 'failed'
    }
  }
}

// Client-side Supabase client (browser)
export const createClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client
export const createSupabaseServerClient = () => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get() { return undefined },
      set() {},
      remove() {}
    }
  })
}