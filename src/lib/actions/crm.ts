'use server'

import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// NOTE: Las tablas 'contacts', 'opportunities', 'activities' no existen en Docker schema.
// Este archivo está stub-eado hasta que se migren esas tablas.

export interface Contact {
    id: string
    organization_id: string
    customer_id: string
    first_name: string
    last_name: string | null
    email: string | null
    phone: string | null
    role: string | null
    is_primary: boolean
    notes: string | null
}

export interface Opportunity {
    id: string
    organization_id: string
    customer_id: string
    title: string
    stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
    amount: number
    currency: string
    probability: number
    expected_close_date: string | null
    source: string | null
    assigned_to: string | null
    notes: string | null
    priority: 'low' | 'medium' | 'high'
    created_at: string
}

export interface Activity {
    id: string
    organization_id: string
    opportunity_id: string | null
    customer_id: string | null
    user_id: string | null
    type: 'call' | 'email' | 'meeting' | 'note' | 'task'
    subject: string
    description: string | null
    status: 'pending' | 'completed' | 'cancelled'
    due_date: string | null
    completed_at: string | null
    created_at: string
}

// CONTACTS (stub)
export async function getContacts(customerId: string) {
    console.log('getContacts stub called', customerId)
    return { success: true, data: [] as Contact[] }
}

export async function createContact(data: Partial<Contact>) {
    console.log('createContact stub called', data)
    return { success: false, error: 'CRM no migrado aún a Docker.' }
}

export async function updateContact(id: string, data: Partial<Contact>) {
    console.log('updateContact stub called', id, data)
    return { success: false, error: 'CRM no migrado aún a Docker.' }
}

export async function deleteContact(id: string) {
    console.log('deleteContact stub called', id)
    return { success: false, error: 'CRM no migrado aún a Docker.' }
}

// OPPORTUNITIES (stub)
export async function getOpportunities(filters: { customerId?: string, stage?: string } = {}) {
    console.log('getOpportunities stub called', filters)
    return { success: true, data: [] }
}

export async function createOpportunity(data: Partial<Opportunity>) {
    console.log('createOpportunity stub called', data)
    return { success: false, error: 'CRM no migrado aún a Docker.' }
}

export async function updateOpportunity(id: string, data: Partial<Opportunity>) {
    console.log('updateOpportunity stub called', id, data)
    return { success: false, error: 'CRM no migrado aún a Docker.' }
}

// ACTIVITIES (stub)
export async function getActivities(filters: { opportunityId?: string, customerId?: string, limit?: number } = {}) {
    console.log('getActivities stub called', filters)
    return { success: true, data: [] }
}

export async function createActivity(data: Partial<Activity>) {
    console.log('createActivity stub called', data)
    return { success: false, error: 'CRM no migrado aún a Docker.' }
}

export async function updateActivity(id: string, data: Partial<Activity>) {
    console.log('updateActivity stub called', id, data)
    return { success: false, error: 'CRM no migrado aún a Docker.' }
}

// METRICS (stub)
export async function getCrmMetrics() {
    return {
        success: true,
        data: {
            totalPipelineValue: 0,
            valueByStage: {},
            recentActivitiesCount: 0
        }
    }
}
