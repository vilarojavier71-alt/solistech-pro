export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    logo_url: string | null
                    tax_id: string | null
                    address: Json | null
                    phone: string | null
                    email: string | null
                    subscription_status: 'trial' | 'active' | 'cancelled' | 'past_due'
                    subscription_plan: 'pro'
                    stripe_customer_id: string | null
                    stripe_subscription_id: string | null
                    trial_ends_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    logo_url?: string | null
                    tax_id?: string | null
                    address?: Json | null
                    phone?: string | null
                    email?: string | null
                    subscription_status?: 'trial' | 'active' | 'cancelled' | 'past_due'
                    subscription_plan?: 'pro'
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    trial_ends_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    logo_url?: string | null
                    tax_id?: string | null
                    address?: Json | null
                    phone?: string | null
                    email?: string | null
                    subscription_status?: 'trial' | 'active' | 'cancelled' | 'past_due'
                    subscription_plan?: 'pro'
                    stripe_customer_id?: string | null
                    stripe_subscription_id?: string | null
                    trial_ends_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            users: {
                Row: {
                    id: string
                    organization_id: string | null
                    role: 'owner' | 'admin' | 'user'
                    full_name: string | null
                    email: string
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    organization_id?: string | null
                    role?: 'owner' | 'admin' | 'user'
                    full_name?: string | null
                    email: string
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string | null
                    role?: 'owner' | 'admin' | 'user'
                    full_name?: string | null
                    email?: string
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            leads: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    email: string | null
                    phone: string | null
                    company: string | null
                    source: 'web' | 'referral' | 'cold_call' | 'social_media' | 'other' | null
                    status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
                    estimated_value: number | null
                    notes: string | null
                    lost_reason: string | null
                    created_by: string | null
                    assigned_to: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    company?: string | null
                    source?: 'web' | 'referral' | 'cold_call' | 'social_media' | 'other' | null
                    status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
                    estimated_value?: number | null
                    notes?: string | null
                    lost_reason?: string | null
                    created_by?: string | null
                    assigned_to?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    company?: string | null
                    source?: 'web' | 'referral' | 'cold_call' | 'social_media' | 'other' | null
                    status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
                    estimated_value?: number | null
                    notes?: string | null
                    lost_reason?: string | null
                    created_by?: string | null
                    assigned_to?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            customers: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    email: string | null
                    phone: string | null
                    company: string | null
                    address: Json | null
                    tax_id: string | null
                    converted_from_lead: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    company?: string | null
                    address?: Json | null
                    tax_id?: string | null
                    converted_from_lead?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    company?: string | null
                    address?: Json | null
                    tax_id?: string | null
                    converted_from_lead?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    organization_id: string
                    customer_id: string
                    name: string
                    status: 'quote' | 'approved' | 'installation' | 'completed' | 'cancelled'
                    installation_type: 'residential' | 'commercial' | 'industrial' | null
                    location: Json | null
                    system_size_kwp: number | null
                    estimated_production_kwh: number | null
                    estimated_savings: number | null
                    notes: string | null
                    created_by: string | null
                    assigned_to: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    customer_id: string
                    name: string
                    status?: 'quote' | 'approved' | 'installation' | 'completed' | 'cancelled'
                    installation_type?: 'residential' | 'commercial' | 'industrial' | null
                    location?: Json | null
                    system_size_kwp?: number | null
                    estimated_production_kwh?: number | null
                    estimated_savings?: number | null
                    notes?: string | null
                    created_by?: string | null
                    assigned_to?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    customer_id?: string
                    name?: string
                    status?: 'quote' | 'approved' | 'installation' | 'completed' | 'cancelled'
                    installation_type?: 'residential' | 'commercial' | 'industrial' | null
                    location?: Json | null
                    system_size_kwp?: number | null
                    estimated_production_kwh?: number | null
                    estimated_savings?: number | null
                    notes?: string | null
                    created_by?: string | null
                    assigned_to?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            calculations: {
                Row: {
                    id: string
                    organization_id: string
                    project_id: string | null
                    annual_consumption_kwh: number
                    location: Json
                    roof_orientation: 'south' | 'southeast' | 'southwest' | 'east' | 'west' | 'north' | 'flat' | null
                    roof_tilt: number | null
                    system_size_kwp: number | null
                    estimated_production_kwh: number | null
                    roi_percentage: number | null
                    payback_years: number | null
                    components: Json | null
                    pvgis_data: Json | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    project_id?: string | null
                    annual_consumption_kwh: number
                    location: Json
                    roof_orientation?: 'south' | 'southeast' | 'southwest' | 'east' | 'west' | 'north' | 'flat' | null
                    roof_tilt?: number | null
                    system_size_kwp?: number | null
                    estimated_production_kwh?: number | null
                    roi_percentage?: number | null
                    payback_years?: number | null
                    components?: Json | null
                    pvgis_data?: Json | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    project_id?: string | null
                    annual_consumption_kwh?: number
                    location?: Json
                    roof_orientation?: 'south' | 'southeast' | 'southwest' | 'east' | 'west' | 'north' | 'flat' | null
                    roof_tilt?: number | null
                    system_size_kwp?: number | null
                    estimated_production_kwh?: number | null
                    roi_percentage?: number | null
                    payback_years?: number | null
                    components?: Json | null
                    pvgis_data?: Json | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            quotes: {
                Row: {
                    id: string
                    organization_id: string
                    project_id: string
                    quote_number: string
                    version: number
                    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
                    line_items: Json
                    subtotal: number
                    tax_rate: number
                    tax_amount: number | null
                    total: number
                    valid_until: string | null
                    notes: string | null
                    terms_and_conditions: string | null
                    pdf_url: string | null
                    sent_at: string | null
                    viewed_at: string | null
                    accepted_at: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    project_id: string
                    quote_number: string
                    version?: number
                    status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
                    line_items: Json
                    subtotal: number
                    tax_rate?: number
                    tax_amount?: number | null
                    total: number
                    valid_until?: string | null
                    notes?: string | null
                    terms_and_conditions?: string | null
                    pdf_url?: string | null
                    sent_at?: string | null
                    viewed_at?: string | null
                    accepted_at?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    project_id?: string
                    quote_number?: string
                    version?: number
                    status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
                    line_items?: Json
                    subtotal?: number
                    tax_rate?: number
                    tax_amount?: number | null
                    total?: number
                    valid_until?: string | null
                    notes?: string | null
                    terms_and_conditions?: string | null
                    pdf_url?: string | null
                    sent_at?: string | null
                    viewed_at?: string | null
                    accepted_at?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            components: {
                Row: {
                    id: string
                    type: 'panel' | 'inverter' | 'battery' | 'mounting' | 'optimizer' | 'other'
                    manufacturer: string
                    model: string
                    specs: Json | null
                    price: number | null
                    currency: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    type: 'panel' | 'inverter' | 'battery' | 'mounting' | 'optimizer' | 'other'
                    manufacturer: string
                    model: string
                    specs?: Json | null
                    price?: number | null
                    currency?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    type?: 'panel' | 'inverter' | 'battery' | 'mounting' | 'optimizer' | 'other'
                    manufacturer?: string
                    model?: string
                    specs?: Json | null
                    price?: number | null
                    currency?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            accounting_accounts: {
                Row: {
                    id: string
                    organization_id: string
                    code: string
                    name: string
                    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
                    parent_id: string | null
                    is_group: boolean
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    code: string
                    name: string
                    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
                    parent_id?: string | null
                    is_group?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    code?: string
                    name?: string
                    type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
                    parent_id?: string | null
                    is_group?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            accounting_journals: {
                Row: {
                    id: string
                    organization_id: string
                    date: string
                    description: string
                    reference: string | null
                    status: 'draft' | 'posted' | 'void'
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    date: string
                    description: string
                    reference?: string | null
                    status?: 'draft' | 'posted' | 'void'
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    date?: string
                    description?: string
                    reference?: string | null
                    status?: 'draft' | 'posted' | 'void'
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            accounting_transactions: {
                Row: {
                    id: string
                    journal_id: string
                    account_id: string
                    debit: number
                    credit: number
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    journal_id: string
                    account_id: string
                    debit?: number
                    credit?: number
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    journal_id?: string
                    account_id?: string
                    debit?: number
                    credit?: number
                    description?: string | null
                    created_at?: string
                }
            }
            gmail_tokens: {
                Row: {
                    id: string
                    user_id: string
                    access_token: string
                    refresh_token: string
                    scope: string
                    email: string
                    expires_at: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    access_token: string
                    refresh_token: string
                    scope: string
                    email: string
                    expires_at: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    access_token?: string
                    refresh_token?: string
                    scope?: string
                    email?: string
                    expires_at?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            generate_quote_number: {
                Args: {
                    org_id: string
                }
                Returns: string
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
