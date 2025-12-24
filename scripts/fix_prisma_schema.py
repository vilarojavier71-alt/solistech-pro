
import re

file_path = 'c:\\Projects\\DOS ANTIGRAVITY\\solistech-pro\\prisma\\schema.prisma'

replacements = {
    'users': 'User',
    'organizations': 'Organization',
    'subscriptions': 'Subscription',
    'customers': 'Customer',
    'leads': 'Lead',
    'projects': 'Project',
    'time_entries': 'TimeEntry',
    'invoices': 'Invoice',
    'invoice_lines': 'InvoiceLine',
    'operating_expenses': 'OperatingExpense',
    'inventory_items': 'InventoryItem',
    'permissions': 'Permission',
    'role_permissions': 'RolePermission',
    'accounting_accounts': 'AccountingAccount',
    'accounting_journals': 'AccountingJournal',
    'accounting_transactions': 'AccountingTransaction',
    'gmail_tokens': 'GmailToken',
    'project_phase_history': 'ProjectPhaseHistory',
    'project_transactions': 'ProjectTransaction',
    'project_documents': 'ProjectDocument',
    'sales': 'Sale',
    'appointments': 'Appointment',
    'client_notifications': 'ClientNotification',
    'invitations': 'Invitation',
    'payment_methods': 'PaymentMethod',
    'calculations': 'Calculation',
    'presentations': 'Presentation',
    'support_tickets': 'SupportTicket',
    'ticket_messages': 'TicketMessage',
    'employee_leave_balances': 'EmployeeLeaveBalance',
    'leave_requests': 'LeaveRequest',
    'audit_logs': 'AuditLog',
    'import_jobs': 'ImportJob',
    'organization_settings': 'OrganizationSettings'
}

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # We want to replace the type part of the field definition.
    # Field definition: name Type modifiers attributes
    # We ignore empty lines, comments, and lines starting with model/enum (handled separately or not needing change if I already renamed models)
    # I already renamed 'model xyz', so I just need to fix references.
    
    clean_line = line.strip()
    if not clean_line or clean_line.startswith('//') or clean_line.startswith('@@'):
        new_lines.append(line)
        continue
    
    if clean_line.startswith('model ') or clean_line.startswith('enum '):
         new_lines.append(line)
         continue

    # Simple heuristic: Look for the pattern " fieldName Type "
    # But it might be " fieldName Type?" or " fieldName Type[]"
    
    words = line.split()
    if len(words) >= 2:
        field_name = words[0]
        field_type_raw = words[1]
        
        # Remove ?, [] from type to check against replacements
        field_type_base = field_type_raw.replace('?', '').replace('[]', '')
        
        if field_type_base in replacements:
            new_type_base = replacements[field_type_base]
            new_type_raw = field_type_raw.replace(field_type_base, new_type_base)
            
            # Replace only the type part in the line
            # We must be careful not to replace field name if it matches type name (e.g. "users users")
            # The type is the second word.
            
            # Construct the new line
            # Preserve indentation
            indent = line[:line.find(field_name)]
            
            # There might be spaces between name and type
            # Find end of field name
            idx_name_end = line.find(field_name) + len(field_name)
            
            # Find start of type (skip whitespace)
            remainder = line[idx_name_end:]
            idx_type_start = -1
            for i, char in enumerate(remainder):
                if not char.isspace():
                    idx_type_start = i
                    break
            
            if idx_type_start != -1:
                idx_type_start += idx_name_end
                # Reconstruct
                # Check if it really matches exactly field_type_raw
                if line[idx_type_start:].startswith(field_type_raw):
                     new_line = line[:idx_type_start] + new_type_raw + line[idx_type_start+len(field_type_raw):]
                     new_lines.append(new_line)
                else:
                     new_lines.append(line)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Schema types updated.")
