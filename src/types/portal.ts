// Types for Portal Cliente


export interface SaleDocument {
    id: string
    sale_id: string
    document_type: 'catastro' | 'instalaciones' | 'factura_electrica' | 'dni' | 'escrituras' | 'other'
    file_name: string
    file_size: number | null
    mime_type: string | null
    storage_url: string
    // drive_url: string | null -- Deprecated
    status: 'pending' | 'validated' | 'rejected'
    validation_notes: string | null
    validated_by: string | null
    validated_at: string | null
    uploaded_by: string
    uploaded_at: string
}

export interface User {
    id: string
    email: string
    full_name: string
    avatar_url?: string
    role: 'owner' | 'admin' | 'commercial' | 'engineer' | 'installer' | 'canvasser' | 'user'
    organization_id: string
    created_at: string
}

export interface Sale {
    id: string
    organization_id: string
    customer_id: string | null
    dni: string
    customer_name: string
    customer_email: string
    customer_phone: string
    sale_number: string
    sale_date: string
    amount: number
    material: string
    access_code: string

    // Payment Status
    payment_status: 'pending' | 'confirmed' | 'rejected'
    payment_date: string | null
    payment_method: 'transfer' | 'card' | 'cash' | 'financing' | null

    // Enhanced Payment Control
    payment_20_status?: 'pending' | 'requested' | 'received'
    payment_20_date?: string | null
    payment_60_status?: 'pending' | 'requested' | 'received'
    payment_60_date?: string | null
    payment_final_status?: 'pending' | 'requested' | 'received'
    payment_final_date?: string | null

    // Documentation (Native Storage)
    documentation_status: 'pending' | 'uploaded' | 'approved' | 'rejected'
    documents_uploaded_at: string | null
    documentation_notes: string | null

    // Engineering
    engineering_status: 'pending' | 'in_review' | 'approved' | 'rejected'
    engineering_feedback: string | null
    engineer_id: string | null
    reviewed_at: string | null

    // Process
    process_status: 'not_started' | 'presented' | 'in_progress' | 'completed'
    process_notes: string | null

    // Installation
    installation_status: 'pending' | 'scheduled' | 'in_progress' | 'completed'
    installation_date: string | null

    // Metadata
    created_by: string | null
    assigned_to: string | null
    created_at: string
    updated_at: string
}


export interface SaleStatusHistory {
    id: string
    sale_id: string
    status_type: 'payment' | 'documentation' | 'engineering' | 'process' | 'installation'
    old_status: string | null
    new_status: string
    notes: string | null
    visible_to_client: boolean
    changed_by: string | null
    created_at: string
}

export interface ClientNotification {
    id: string
    sale_id: string
    title: string
    message: string
    notification_type: 'info' | 'success' | 'warning' | 'error' | 'action_required'
    action_label: string | null
    action_url: string | null
    read: boolean
    read_at: string | null
    sent_email: boolean
    sent_sms: boolean
    sent_push: boolean
    created_at: string
}

// Timeline step for client portal
export interface TimelineStep {
    id: number
    title: string
    description: string
    status: 'completed' | 'in_progress' | 'pending' | 'rejected'
    date: string | null
    icon: string
    actionLabel?: string
    actionUrl?: string
}

// Document requirement for upload
export interface DocumentRequirement {
    type: SaleDocument['document_type']
    label: string
    description: string
    required: boolean
    uploaded: boolean
    file?: SaleDocument
}
