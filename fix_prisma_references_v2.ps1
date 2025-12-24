$files = Get-ChildItem -Path "src" -Recurse -Include *.ts, *.tsx

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        
        # Regex replace
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, "prisma\.User\b", "prisma.users")
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, "prisma\.user\b", "prisma.users")
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, "prisma\.RolePermission\b", "prisma.rolePermission")
        
        if ($content -ne $originalContent) {
            Write-Host "Updating $($file.FullName)"
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        }
    }
    catch {
        Write-Host "Error processing $($file.FullName): $_"
    }
}
