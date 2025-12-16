-- DATOS INICIALES: BONIFICACIONES MUNICIPALES
-- Aragón y comunidades cercanas (Madrid, Navarra, Cataluña, Valencia, Castilla-La Mancha, La Rioja)

-- ============================================
-- ARAGÓN
-- ============================================

INSERT INTO municipal_tax_benefits (
    municipality, province, autonomous_community,
    latitude, longitude,
    ibi_percentage, ibi_duration_years, ibi_conditions,
    icio_percentage, icio_conditions,
    source_url, last_verified
) VALUES
    -- Zaragoza (Capital)
    ('Zaragoza', 'Zaragoza', 'Aragón',
     41.6488, -0.8891,
     50.00, 3, 'Instalaciones de autoconsumo fotovoltaico con potencia ≥3kW',
     95.00, 'Instalaciones de energías renovables',
     'https://www.zaragoza.es/sede/portal/hacienda/ordenanzas-fiscales', '2024-12-10'),
    
    -- Huesca
    ('Huesca', 'Huesca', 'Aragón',
     42.1401, -0.4080,
     50.00, 3, 'Instalaciones fotovoltaicas de autoconsumo',
     95.00, 'Instalaciones de energías renovables',
     'https://www.huesca.es/ordenanzas', '2024-12-10'),
    
    -- Teruel
    ('Teruel', 'Teruel', 'Aragón',
     40.3456, -1.1065,
     50.00, 3, 'Instalaciones de energía solar',
     95.00, 'Energías renovables',
     'https://www.teruel.es/ordenanzas', '2024-12-10'),
    
    -- Calatayud
    ('Calatayud', 'Zaragoza', 'Aragón',
     41.3524, -1.6436,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Ejea de los Caballeros
    ('Ejea de los Caballeros', 'Zaragoza', 'Aragón',
     42.1264, -1.1361,
     50.00, 3, 'Instalaciones de autoconsumo',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),

-- ============================================
-- COMUNIDAD DE MADRID
-- ============================================

    -- Madrid (Capital)
    ('Madrid', 'Madrid', 'Comunidad de Madrid',
     40.4168, -3.7038,
     50.00, 3, 'Instalaciones de autoconsumo fotovoltaico',
     95.00, 'Instalaciones sostenibles y energías renovables',
     'https://www.madrid.es/portales/munimadrid/es/Inicio/Ayuntamiento/Hacienda-y-Administracion-Publica/Ordenanzas-Fiscales', '2024-12-10'),
    
    -- Alcalá de Henares
    ('Alcalá de Henares', 'Madrid', 'Comunidad de Madrid',
     40.4818, -3.3639,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Getafe
    ('Getafe', 'Madrid', 'Comunidad de Madrid',
     40.3057, -3.7329,
     50.00, 3, 'Instalaciones de autoconsumo',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Móstoles
    ('Móstoles', 'Madrid', 'Comunidad de Madrid',
     40.3230, -3.8650,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),

-- ============================================
-- NAVARRA
-- ============================================

    -- Pamplona
    ('Pamplona', 'Navarra', 'Navarra',
     42.8125, -1.6458,
     50.00, 3, 'Instalaciones de autoconsumo fotovoltaico',
     95.00, 'Instalaciones de energías renovables',
     'https://www.pamplona.es/ordenanzas', '2024-12-10'),
    
    -- Tudela
    ('Tudela', 'Navarra', 'Navarra',
     42.0667, -1.6000,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),

-- ============================================
-- CATALUÑA (BARCELONA)
-- ============================================

    -- Barcelona (Capital)
    ('Barcelona', 'Barcelona', 'Cataluña',
     41.3851, 2.1734,
     50.00, 3, 'Instalaciones fotovoltaicas de autoconsumo',
     95.00, 'Instalaciones de energías renovables',
     'https://www.barcelona.cat/ca/ordenances-fiscals', '2024-12-10'),
    
    -- Hospitalet de Llobregat
    ('Hospitalet de Llobregat', 'Barcelona', 'Cataluña',
     41.3599, 2.1006,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Badalona
    ('Badalona', 'Barcelona', 'Cataluña',
     41.4502, 2.2445,
     50.00, 3, 'Instalaciones de autoconsumo',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Terrassa
    ('Terrassa', 'Barcelona', 'Cataluña',
     41.5644, 2.0089,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Sabadell
    ('Sabadell', 'Barcelona', 'Cataluña',
     41.5431, 2.1089,
     50.00, 3, 'Instalaciones de autoconsumo',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Lleida
    ('Lleida', 'Lleida', 'Cataluña',
     41.6176, 0.6200,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Tarragona
    ('Tarragona', 'Tarragona', 'Cataluña',
     41.1189, 1.2445,
     50.00, 3, 'Instalaciones de autoconsumo',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Girona
    ('Girona', 'Girona', 'Cataluña',
     41.9794, 2.8214,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),

-- ============================================
-- COMUNIDAD VALENCIANA
-- ============================================

    -- Valencia (Capital)
    ('Valencia', 'Valencia', 'Comunidad Valenciana',
     39.4699, -0.3763,
     50.00, 3, 'Instalaciones de autoconsumo con potencia ≥5kW',
     95.00, 'Instalaciones de energías renovables',
     'https://www.valencia.es/ayuntamiento/ordenanzas.nsf', '2024-12-10'),
    
    -- Alicante
    ('Alicante', 'Alicante', 'Comunidad Valenciana',
     38.3452, -0.4810,
     50.00, 3, 'Instalaciones fotovoltaicas de autoconsumo',
     95.00, 'Energías renovables',
     'https://www.alicante.es/ordenanzas', '2024-12-10'),
    
    -- Castellón
    ('Castellón de la Plana', 'Castellón', 'Comunidad Valenciana',
     39.9864, -0.0513,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Elche
    ('Elche', 'Alicante', 'Comunidad Valenciana',
     38.2699, -0.6983,
     50.00, 3, 'Instalaciones de autoconsumo',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Torrent
    ('Torrent', 'Valencia', 'Comunidad Valenciana',
     39.4370, -0.4664,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),

-- ============================================
-- CASTILLA-LA MANCHA
-- ============================================

    -- Toledo
    ('Toledo', 'Toledo', 'Castilla-La Mancha',
     39.8628, -4.0273,
     50.00, 3, 'Instalaciones de autoconsumo fotovoltaico',
     95.00, 'Instalaciones de energías renovables',
     'https://www.toledo.es/ordenanzas', '2024-12-10'),
    
    -- Albacete
    ('Albacete', 'Albacete', 'Castilla-La Mancha',
     38.9943, -1.8585,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Guadalajara
    ('Guadalajara', 'Guadalajara', 'Castilla-La Mancha',
     40.6331, -3.1672,
     50.00, 3, 'Instalaciones de autoconsumo',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Cuenca
    ('Cuenca', 'Cuenca', 'Castilla-La Mancha',
     40.0704, -2.1374,
     50.00, 3, 'Instalaciones fotovoltaicas',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),
    
    -- Ciudad Real
    ('Ciudad Real', 'Ciudad Real', 'Castilla-La Mancha',
     38.9848, -3.9275,
     50.00, 3, 'Instalaciones de autoconsumo',
     95.00, 'Energías renovables',
     NULL, '2024-12-10'),

-- ============================================
-- LA RIOJA
-- ============================================

    -- Logroño
    ('Logroño', 'La Rioja', 'La Rioja',
     42.4627, -2.4450,
     50.00, 3, 'Instalaciones de autoconsumo fotovoltaico',
     95.00, 'Instalaciones de energías renovables',
     'https://www.logro no.es/ordenanzas', '2024-12-10');

-- Verificar inserción
SELECT 
    autonomous_community,
    COUNT(*) as municipios
FROM municipal_tax_benefits
GROUP BY autonomous_community
ORDER BY autonomous_community;
