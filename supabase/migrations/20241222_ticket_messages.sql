-- ============================================================================
-- MIGRATION: Support Tickets Enhancement + Ticket Messages
-- Date: 2025-12-22
-- Description: Extends support_tickets with SLA fields and adds ticket_messages for chat
-- ============================================================================
-- Add new columns to support_tickets
ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE
SET NULL,
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE
SET NULL,
    ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority ON support_tickets(status, priority);
-- Create ticket_messages table for real-time chat
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL DEFAULT 'client',
    -- client, technician, admin, system
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create indexes for ticket_messages
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON ticket_messages(sender_id);
-- Update status enum values (if using check constraint)
-- Note: PostgreSQL doesn't support altering enum values easily, so we use varchar
-- Insert system notification for existing open tickets
-- (Optional: Run this to add a system message to existing tickets)
-- INSERT INTO ticket_messages (ticket_id, sender_id, sender_role, content, is_internal)
-- SELECT id, user_id, 'system', 'Sistema de chat habilitado para este ticket.', false
-- FROM support_tickets WHERE status = 'open';
-- Grant permissions (adjust based on your RLS setup)
-- GRANT SELECT, INSERT ON ticket_messages TO authenticated;
COMMENT ON TABLE ticket_messages IS 'Real-time chat messages for support tickets';
COMMENT ON COLUMN ticket_messages.sender_role IS 'Role of sender: client, technician, admin, system';
COMMENT ON COLUMN ticket_messages.is_internal IS 'Internal notes not visible to client';
COMMENT ON COLUMN support_tickets.sla_deadline IS 'SLA deadline for first response';
COMMENT ON COLUMN support_tickets.source_type IS 'Origin: manual, import_excel, system_alert';