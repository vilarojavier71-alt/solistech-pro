// Script temporal para reemplazar branding
const fs = require('fs');
const path = require('path');

const files = [
    'src/app/portal/page.tsx',
    'src/app/dashboard/settings/page.tsx',
    'src/app/dashboard/settings/billing/page.tsx',
    'src/app/dashboard/projects/page.tsx',
    'src/app/dashboard/projects/new/page.tsx',
    'src/app/dashboard/projects/[id]/edit/page.tsx',
    'src/app/dashboard/presentations/page.tsx',
    'src/app/dashboard/presentations/new/page.tsx',
    'src/app/dashboard/invoices/[id]/page.tsx',
    'src/app/dashboard/leads/[id]/edit/page.tsx',
    'src/app/dashboard/invoices/page.tsx',
    'src/app/dashboard/leads/page.tsx',
    'src/app/dashboard/invoices/new/page.tsx',
    'src/app/dashboard/leads/new/page.tsx',
    'src/app/dashboard/inventory/import/page.tsx',
    'src/app/dashboard/import/page.tsx',
    'src/app/dashboard/help/page.tsx',
    'src/app/dashboard/customers/new/page.tsx',
    'src/app/dashboard/customers/page.tsx',
    'src/app/dashboard/customers/[id]/edit/page.tsx',
    'src/app/dashboard/components/page.tsx',
    'src/app/dashboard/calculator/page.tsx',
    'src/app/dashboard/benefits-search/page.tsx',
    'src/app/dashboard/crm/layout.tsx'
];

let count = 0;
files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('SolisTech PRO')) {
            content = content.replace(/SolisTech PRO/g, 'MotorGap');
            fs.writeFileSync(filePath, content, 'utf8');
            count++;
            console.log('Updated:', file);
        }
    }
});
console.log('Total updated:', count);
