-- =============================================
-- SEED DE CATEGORÍA: CLÁSICOS DE NAVIDAD
-- Ejecutar en la base de datos 'personajes'
-- =============================================

-- Insertar la categoría "Clásicos de Navidad"
-- Nota: Si ya existe una categoría con este nombre, ajusta el ID manualmente
INSERT INTO categories (name, description, icon, isActive, createdAt, updatedAt) VALUES
('Clásicos de Navidad', 'Personajes clásicos de películas y cuentos navideños', '🎄', 1, NOW(), NOW());

-- Obtener el ID de la categoría recién insertada (ajusta si es necesario)
-- Si ya tienes otras categorías, el ID será el siguiente disponible
-- Por ejemplo, si la última categoría es ID 35, esta será ID 36

-- Insertar personajes navideños clásicos
-- Reemplaza [CATEGORY_ID] con el ID real de la categoría "Clásicos de Navidad"
-- Puedes obtenerlo ejecutando: SELECT id FROM categories WHERE name = 'Clásicos de Navidad';

-- Clásicos de Navidad (reemplaza [CATEGORY_ID] con el ID real)
INSERT INTO characters (name, categoryId, createdAt, updatedAt) VALUES
('Santa Claus', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('El Grinch (El Grinch)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Max (El Grinch)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Rudolph (Rudolph el reno)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Frosty (Frosty el muñeco)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Scrooge (Cuento de Navidad)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Fantasmas (Cuento de Navidad)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Buddy (Elf)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Jack (Pesadilla antes de Navidad)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Sally (Pesadilla antes de Navidad)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Kevin (Mi pobre angelito)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Harry y Marv (Mi pobre angelito)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Clark (Vacaciones)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('George (Qué bello es vivir)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Clarence (Qué bello es vivir)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Hermey (Rudolph)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Yukon (Rudolph)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Abominable (Rudolph)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Charlie Brown (Snoopy)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Snoopy (Snoopy)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Woodstock (Snoopy)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Cascanueces (El cascanueces)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Clara (El cascanueces)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Rey Ratón (El cascanueces)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Olaf (Frozen)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Jovie (Elf)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Buzz (Mi pobre angelito)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Kate (Mi pobre angelito)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Marley (Mi pobre angelito)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Ralphie (Un cuento de Navidad)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Randy (Un cuento de Navidad)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Conductor (Polar Express)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Cindy Lou (El Grinch)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Oogie Boogie (Pesadilla antes de Navidad)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Zero (Pesadilla antes de Navidad)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Walter (Elf)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Elsa (Frozen)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()),
('Anna (Frozen)', (SELECT id FROM categories WHERE name = 'Clásicos de Navidad'), NOW(), NOW()));

-- Verificar la inserción
SELECT 
    c.name as categoria,
    COUNT(ch.id) as total_personajes
FROM categories c
LEFT JOIN characters ch ON c.id = ch.categoryId
WHERE c.name = 'Clásicos de Navidad'
GROUP BY c.id, c.name;

