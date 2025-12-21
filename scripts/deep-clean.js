// Script de limpieza profunda - Fase 2
const fs = require('fs');
const path = require('path');

const replacements = [
    // Source code files - exact replacements
    { file: 'src/lib/logger.ts', from: 'Centralized Logger - SolisTech Pro', to: 'Centralized Logger - MotorGap' },
    { file: 'src/lib/actions/documents.ts', from: "org_name: 'SolisTech Pro'", to: "org_name: organization?.name || 'MotorGap'" },
    { file: 'src/lib/actions/presentation-generator.ts', from: "|| 'SolisTech'", to: "|| 'MotorGap'" },
    { file: 'src/lib/actions/technical-memory.ts', from: "|| 'SolisTech'", to: "|| 'MotorGap'" },
    { file: 'src/lib/actions/user-actions.ts', from: 'admin.test@solistech.pro', to: 'admin.test@motorgap.es' },
    { file: 'src/lib/actions/user-actions.ts', from: 'tecnico.test@solistech.pro', to: 'tecnico.test@motorgap.es' },
    { file: 'src/lib/actions/user-actions.ts', from: 'ingeniero.test@solistech.pro', to: 'ingeniero.test@motorgap.es' },
    { file: 'src/lib/actions/user-actions.ts', from: 'pica.test@solistech.pro', to: 'pica.test@motorgap.es' },
    { file: 'src/lib/actions/municipal-benefits.ts', from: "'User-Agent': 'SolisTech PRO'", to: "'User-Agent': 'MotorGap'" },
    { file: 'src/components/settings/profile-form.tsx', from: 'placeholder="juan@solistech.es"', to: 'placeholder="juan@motorgap.es"' },
    { file: 'src/components/settings/organization-form.tsx', from: 'placeholder="SolisTech Solutions S.L."', to: 'placeholder="Mi Empresa S.L."' },
    { file: 'src/components/settings/organization-form.tsx', from: 'placeholder="contacto@solistech.es"', to: 'placeholder="contacto@motorgap.es"' },
    { file: 'src/components/team/advanced-member-wizard.tsx', from: 'placeholder="juan@solistech.pro"', to: 'placeholder="juan@motorgap.es"' },
    { file: 'src/components/team/new-member-dialog.tsx', from: 'placeholder="ana@solistech.pro"', to: 'placeholder="ana@motorgap.es"' },
    { file: 'src/components/quotes/quote-builder.tsx', from: "setOrgProfile({ name: 'SolisTech'", to: "setOrgProfile({ name: 'MotorGap'" },
    { file: 'src/components/quotes/quote-builder.tsx', from: "|| 'SolisTech'", to: "|| 'MotorGap'" },
    { file: 'src/app/portal/page.tsx', from: 'soporte@solistech.com', to: 'soporte@motorgap.es' },
    { file: 'src/components/help/help-data.ts', from: 'Solistech Pro', to: 'MotorGap' },
    { file: 'src/components/help/quick-help-cards.tsx', from: 'Solistech Pro', to: 'MotorGap' },
    { file: 'src/app/api/chat/route.ts', from: 'experto en energía solar de SolisTech', to: 'experto en energía solar de MotorGap' },
    { file: 'src/app/dashboard/settings/page.tsx', from: 'potenciar SolisTech', to: 'potenciar MotorGap' },
    { file: 'src/app/dashboard/crm/layout.tsx', from: 'SolisTech Pro', to: 'MotorGap' },
    { file: 'src/app/dashboard/client/page.tsx', from: 'soporte@solistech.es', to: 'soporte@motorgap.es' },
    { file: 'src/components/admin/add-employee-dialog.tsx', from: 'placeholder="juan@solistech.com"', to: 'placeholder="juan@motorgap.es"' },
];

let count = 0;
replacements.forEach(({ file, from, to }) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(from)) {
            content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
            fs.writeFileSync(filePath, content, 'utf8');
            count++;
            console.log('✓', file);
        }
    } else {
        console.log('✗ Not found:', file);
    }
});
console.log('\\nTotal updated:', count);
