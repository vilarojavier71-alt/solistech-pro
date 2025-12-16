-- DATOS DE PRUEBA PARA CRM DE TRAMITACIÓN
-- Ejecutar DESPUÉS de las migraciones de subsidy_applications

-- Nota: Necesitas reemplazar los UUIDs con valores reales de tu base de datos:
-- - organization_id: tu organización
-- - customer_id: IDs de clientes existentes
-- - assigned_to: ID de un usuario

-- Expediente 1: Recopilando Documentos (Valencia, cliente activo)
INSERT INTO subsidy_applications (
    organization_id,
    customer_id,
    region,
    subsidy_type,
    estimated_amount,
    status,
    submission_deadline,
    required_docs,
    notes
) VALUES (
    (SELECT id FROM organizations LIMIT 1), -- Reemplazar con tu org_id
    (SELECT id FROM customers LIMIT 1 OFFSET 0), -- Primer cliente
    'Comunidad Valenciana',
    'direct_grant',
    4500.00,
    'collecting_docs',
    CURRENT_DATE + INTERVAL '5 days', -- URGENTE: 5 días
    '[
        {"type": "dni", "name": "DNI/CIF", "uploaded": false},
        {"type": "ibi", "name": "Recibo IBI", "uploaded": true},
        {"type": "escrituras", "name": "Escrituras", "uploaded": false},
        {"type": "certificado_energetico", "name": "Certificado Energético", "uploaded": false}
    ]'::jsonb,
    'Cliente muy interesado. Recordar llamar antes del viernes.'
);

-- Expediente 2: Listo para Presentar (Madrid)
INSERT INTO subsidy_applications (
    organization_id,
    customer_id,
    region,
    subsidy_type,
    estimated_amount,
    status,
    submission_deadline,
    required_docs
) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    (SELECT id FROM customers LIMIT 1 OFFSET 1), -- Segundo cliente
    'Madrid',
    'direct_grant',
    3200.00,
    'ready_to_submit',
    CURRENT_DATE + INTERVAL '15 days',
    '[
        {"type": "dni", "name": "DNI/CIF", "uploaded": true},
        {"type": "ibi", "name": "Recibo IBI", "uploaded": true},
        {"type": "proyecto_tecnico", "name": "Proyecto Técnico", "uploaded": true}
    ]'::jsonb
);

-- Expediente 3: Ya Presentado (Cataluña)
INSERT INTO subsidy_applications (
    organization_id,
    customer_id,
    region,
    subsidy_type,
    estimated_amount,
    status,
    submission_deadline,
    submitted_at,
    required_docs
) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    (SELECT id FROM customers LIMIT 1 OFFSET 2), -- Tercer cliente
    'Cataluña',
    'direct_grant',
    5800.00,
    'submitted',
    CURRENT_DATE - INTERVAL '10 days', -- Ya pasó el deadline
    CURRENT_DATE - INTERVAL '12 days',
    '[
        {"type": "dni", "name": "DNI/CIF", "uploaded": true},
        {"type": "ibi", "name": "Recibo IBI", "uploaded": true},
        {"type": "factura", "name": "Factura", "uploaded": true}
    ]'::jsonb
);

-- Expediente 4: Aprobado (Andalucía)
INSERT INTO subsidy_applications (
    organization_id,
    customer_id,
    region,
    subsidy_type,
    estimated_amount,
    status,
    submission_deadline,
    submitted_at,
    approved_at,
    required_docs,
    notes
) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    (SELECT id FROM customers LIMIT 1 OFFSET 3), -- Cuarto cliente
    'Andalucía',
    'direct_grant',
    4100.00,
    'approved',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '32 days',
    CURRENT_DATE - INTERVAL '5 days',
    '[
        {"type": "dni", "name": "DNI/CIF", "uploaded": true},
        {"type": "ibi", "name": "Recibo IBI", "uploaded": true},
        {"type": "justificante_pago", "name": "Justificante de Pago", "uploaded": true}
    ]'::jsonb,
    '¡Aprobado! Pendiente de recibir el pago.'
);

-- Expediente 5: Rechazado (Valencia)
INSERT INTO subsidy_applications (
    organization_id,
    customer_id,
    region,
    subsidy_type,
    estimated_amount,
    status,
    submission_deadline,
    submitted_at,
    required_docs,
    notes
) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    (SELECT id FROM customers LIMIT 1 OFFSET 4), -- Quinto cliente
    'Comunidad Valenciana',
    'irpf_deduction',
    2500.00,
    'rejected',
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '22 days',
    '[
        {"type": "dni", "name": "DNI/CIF", "uploaded": true}
    ]'::jsonb,
    'Rechazado: No cumplía requisito de ahorro energético mínimo.'
);

-- Expediente 6: Recopilando Documentos (URGENTE - 2 días)
INSERT INTO subsidy_applications (
    organization_id,
    customer_id,
    region,
    subsidy_type,
    estimated_amount,
    status,
    submission_deadline,
    required_docs,
    notes
) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    (SELECT id FROM customers LIMIT 1 OFFSET 5), -- Sexto cliente
    'Islas Baleares',
    'direct_grant',
    7200.00,
    'collecting_docs',
    CURRENT_DATE + INTERVAL '2 days', -- MUY URGENTE
    '[
        {"type": "dni", "name": "DNI/CIF", "uploaded": true},
        {"type": "ibi", "name": "Recibo IBI", "uploaded": false},
        {"type": "escrituras", "name": "Escrituras", "uploaded": false}
    ]'::jsonb,
    'URGENTE: Convocatoria cierra en 2 días. Llamar al cliente YA.'
);

-- Verificar que se crearon correctamente
SELECT 
    application_number,
    customers.full_name as cliente,
    region,
    status,
    estimated_amount,
    submission_deadline
FROM subsidy_applications
LEFT JOIN customers ON customers.id = subsidy_applications.customer_id
ORDER BY created_at DESC;
