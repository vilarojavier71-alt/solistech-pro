import {
    User,
    Organization,
    Lead,
    Customer,
    Project,
    Calculation
} from '@prisma/client'

export type { User, Organization, Lead, Customer, Project, Calculation }

// Temporary placeholders for missing Prisma models to unblock build
// These tables exist in Supabase types but not yet in Prisma schema
export type Quote = any
export type Component = any

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
