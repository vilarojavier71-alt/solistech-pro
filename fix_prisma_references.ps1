$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # helper for specific replacements
    $content = $content -replace "prisma\.User\b", "prisma.users"
    $content = $content -replace "prisma\.user\b", "prisma.users"
    $content = $content -replace "prisma\.RolePermission\b", "prisma.rolePermission"
    
    if ($content -ne $originalContent) {
        Write-Host "Updating $($file.FullName)"
        Set-Content $file.FullName $content -Encoding UTF8
    }
}
