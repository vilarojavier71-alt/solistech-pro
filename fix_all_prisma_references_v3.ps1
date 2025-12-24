
$targetDir = "src"
$replacements = @{
    "prisma.users"                   = "prisma.user";
    "prisma.organizations"           = "prisma.organization";
    "prisma.subscriptions"           = "prisma.subscription";
    "prisma.customers"               = "prisma.customer";
    "prisma.leads"                   = "prisma.lead";
    "prisma.projects"                = "prisma.project";
    "prisma.time_entries"            = "prisma.timeEntry";
    "prisma.invoices"                = "prisma.invoice";
    "prisma.invoice_lines"           = "prisma.invoiceLine";
    "prisma.operating_expenses"      = "prisma.operatingExpense";
    "prisma.inventory_items"         = "prisma.inventoryItem";
    "prisma.permissions"             = "prisma.permission";
    "prisma.role_permissions"        = "prisma.rolePermission";
    "prisma.accounting_accounts"     = "prisma.accountingAccount";
    "prisma.accounting_journals"     = "prisma.accountingJournal";
    "prisma.accounting_transactions" = "prisma.accountingTransaction";
    "prisma.gmail_tokens"            = "prisma.gmailToken";
    "prisma.project_phase_history"   = "prisma.projectPhaseHistory";
    "prisma.project_transactions"    = "prisma.projectTransaction";
    "prisma.project_documents"       = "prisma.projectDocument";
    "prisma.sales"                   = "prisma.sale";
    "prisma.appointments"            = "prisma.appointment";
    "prisma.client_notifications"    = "prisma.clientNotification";
    "prisma.invitations"             = "prisma.invitation";
    "prisma.payment_methods"         = "prisma.paymentMethod";
    "prisma.calculations"            = "prisma.calculation";
    "prisma.presentations"           = "prisma.presentation";
    "prisma.support_tickets"         = "prisma.supportTicket";
    "prisma.ticket_messages"         = "prisma.ticketMessage";
    "prisma.employee_leave_balances" = "prisma.employeeLeaveBalance";
    "prisma.leave_requests"          = "prisma.leaveRequest";
    "prisma.audit_logs"              = "prisma.auditLog";
    "prisma.import_jobs"             = "prisma.importJob";
    "prisma.organization_settings"   = "prisma.organizationSettings";
    "prisma.Account"                 = "prisma.account";
    "prisma.Session"                 = "prisma.session";
    "prisma.VerificationToken"       = "prisma.verificationToken";
    "prisma.User"                    = "prisma.user";
    "prisma.Organization"            = "prisma.organization";
    "prisma.Customer"                = "prisma.customer";
    "prisma.Sale"                    = "prisma.sale";
    "prisma.Project"                 = "prisma.project";
    "prisma.Appointment"             = "prisma.appointment";
    "prisma.InventoryItem"           = "prisma.inventoryItem";
    "prisma.Analysis"                = "prisma.analysis";
    "prisma.Calculation"             = "prisma.calculation";
    "prisma.Presentation"            = "prisma.presentation";
    "prisma.Quote"                   = "prisma.quote";
    "prisma.Component"               = "prisma.component";
}

Get-ChildItem -Path $targetDir -Recurse -Include *.ts, *.tsx | ForEach-Object {
    $fileContent = [System.IO.File]::ReadAllText($_.FullName)
    $originalContent = $fileContent

    foreach ($key in $replacements.Keys) {
        $pattern = [Regex]::Escape($key)
        # Avoid replacing if it's already correct (though simpler regex is just replace all instances of key)
        # We need to be careful with things like 'prisma.users' matching 'prisma.usersXYZ' if that existed.
        # But properties are usually distinct.
        # Use word boundary at the end?
        $regex = $pattern + "(?![a-zA-Z0-9_])"
        $fileContent = [Regex]::Replace($fileContent, $regex, $replacements[$key])
    }

    if ($fileContent -ne $originalContent) {
        [System.IO.File]::WriteAllText($_.FullName, $fileContent)
        Write-Host "Updated $($_.FullName)"
    }
}
Write-Host "Done fixing Prisma references."
