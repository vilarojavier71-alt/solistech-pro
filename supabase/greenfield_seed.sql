-- ============================================================================
-- SOLISTECH PRO - GREENFIELD SEED
-- Datos de referencia esenciales para arranque desde cero
-- EJECUTAR EN SUPABASE SQL EDITOR DESPUÉS DE greenfield_reset.sql
-- ============================================================================
-- DATOS MAESTROS: Beneficios Fiscales Municipales
INSERT INTO municipal_tax_benefits (
        municipality,
        province,
        autonomous_community,
        ibi_percentage,
        ibi_duration_years,
        icio_percentage,
        is_active
    )
VALUES (
        'Valencia',
        'Valencia',
        'Comunidad Valenciana',
        50,
        10,
        95,
        true
    ),
    (
        'Madrid',
        'Madrid',
        'Comunidad de Madrid',
        50,
        5,
        95,
        true
    ),
    (
        'Barcelona',
        'Barcelona',
        'Cataluña',
        50,
        5,
        95,
        true
    ),
    (
        'Sevilla',
        'Sevilla',
        'Andalucía',
        50,
        10,
        95,
        true
    ),
    (
        'Palma',
        'Islas Baleares',
        'Islas Baleares',
        50,
        10,
        95,
        true
    ),
    (
        'Zaragoza',
        'Zaragoza',
        'Aragón',
        50,
        5,
        95,
        true
    ),
    (
        'Málaga',
        'Málaga',
        'Andalucía',
        50,
        10,
        95,
        true
    ),
    (
        'Murcia',
        'Murcia',
        'Región de Murcia',
        50,
        5,
        95,
        true
    ),
    (
        'Alicante',
        'Alicante',
        'Comunidad Valenciana',
        50,
        10,
        95,
        true
    ),
    (
        'Bilbao',
        'Vizcaya',
        'País Vasco',
        50,
        5,
        95,
        true
    ),
    (
        'Las Palmas de Gran Canaria',
        'Las Palmas',
        'Canarias',
        50,
        5,
        95,
        true
    ),
    (
        'Córdoba',
        'Córdoba',
        'Andalucía',
        50,
        10,
        95,
        true
    ),
    (
        'Valladolid',
        'Valladolid',
        'Castilla y León',
        50,
        5,
        95,
        true
    ),
    ('Vigo', 'Pontevedra', 'Galicia', 50, 5, 95, true),
    ('Gijón', 'Asturias', 'Asturias', 50, 5, 95, true) ON CONFLICT DO NOTHING;
-- DATOS MAESTROS: Subsidios IRPF nacionales
INSERT INTO subsidies (
        region,
        autonomous_community,
        subsidy_type,
        name,
        description,
        percentage,
        is_active
    )
VALUES (
        'Nacional',
        'Todas',
        'IRPF',
        'Deducción IRPF por Autoconsumo',
        'Deducción del 40% en la cuota íntegra del IRPF por instalaciones de autoconsumo fotovoltaico',
        40,
        true
    ),
    (
        'Andalucía',
        'Andalucía',
        'SUBVENCION',
        'Programa Andaluz de Energías Renovables',
        'Subvención directa para instalaciones de autoconsumo en Andalucía',
        30,
        true
    ),
    (
        'Comunidad Valenciana',
        'Comunidad Valenciana',
        'SUBVENCION',
        'IVACE Autoconsumo',
        'Programa de incentivos del IVACE para instalaciones de autoconsumo',
        35,
        true
    ) ON CONFLICT DO NOTHING;
-- ✅ SEED COMPLETADO
SELECT '✅ Seed completado con éxito' AS status,
    (
        SELECT COUNT(*)
        FROM municipal_tax_benefits
    ) AS municipios_cargados,
    (
        SELECT COUNT(*)
        FROM subsidies
    ) AS subsidios_cargados;