import { Database } from './database.types'

export type Organization = Database['public']['Tables']['organizations']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Calculation = Database['public']['Tables']['calculations']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type Component = Database['public']['Tables']['components']['Row']

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
export type ProjectStatus = 'quote' | 'approved' | 'installation' | 'completed' | 'cancelled'
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
export type InstallationType = 'residential' | 'commercial' | 'industrial'
export type ComponentType = 'panel' | 'inverter' | 'battery' | 'mounting' | 'optimizer' | 'other'
export type UserRole = 'owner' | 'admin' | 'user'
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'past_due'

export interface QuoteLineItem {
    description: string
    quantity: number
    unit_price: number
    total: number
}

export interface Address {
    street?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
}

export interface Location {
    lat: number
    lng: number
    address?: string
    city?: string
    postal_code?: string
}

export interface ComponentSpecs {
    // Panel specs
    power_wp?: number
    efficiency?: number
    warranty_years?: number
    dimensions?: {
        length: number
        width: number
        height: number
    }
    weight?: number

    // Inverter specs
    max_power?: number
    mppt_inputs?: number

    // Battery specs
    capacity_kwh?: number
    cycles?: number

    [key: string]: any
}
