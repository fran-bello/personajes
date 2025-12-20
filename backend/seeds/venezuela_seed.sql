-- =============================================
-- SEED DE CATEGORÍA: CELEBRIDADES VENEZOLANAS
-- Ejecutar en la base de datos 'personajes'
-- =============================================

-- Insertar la categoría "Celebridades Venezolanas"
-- Nota: Si ya existe una categoría con este nombre, ajusta el ID manualmente
-- El emoji de bandera de Venezuela: U+1F1FB (🇻) + U+1F1EA (🇪)
-- Código hexadecimal: F0 9F 87 BB F0 9F 87 AA
INSERT INTO categories (name, description, icon, isActive, createdAt, updatedAt) VALUES
('Celebridades Venezolanas', 'Cantantes, actores, comediantes y personalidades venezolanas', CONVERT(UNHEX('F09F87BBF09F87AA') USING utf8mb4), 1, NOW(), NOW());

-- Obtener el ID de la categoría recién insertada (ajusta si es necesario)
-- Si ya tienes otras categorías, el ID será el siguiente disponible
-- Por ejemplo, si la última categoría es ID 35, esta será ID 36

-- Insertar celebridades venezolanas
-- Reemplaza [CATEGORY_ID] con el ID real de la categoría "Celebridades Venezolanas"
-- Puedes obtenerlo ejecutando: SELECT id FROM categories WHERE name = 'Celebridades Venezolanas';

-- Eliminar personajes existentes de esta categoría (para poder re-ejecutar el script)
DELETE FROM characters 
WHERE categoryId = (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas');

-- Celebridades Venezolanas (reemplaza [CATEGORY_ID] con el ID real)
INSERT INTO characters (name, categoryId, createdAt, updatedAt) VALUES
('Simón Bolívar', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Ricardo Montaner', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Chyno Miranda', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Nacho ', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Danny Ocean', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Carolina Herrera', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Édgar Ramírez', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('María Conchita Alonso', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Lupita Ferrer', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Daniela Alvarado', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Gaby Espino', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Mariana Torres', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Laureano Márquez', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('José Rafael Guzmán', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Emilio Lovera', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Benny', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('George Harris', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Luis Chataing', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Héctor Manrique', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Leonardo Padrón', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Carlos Oteyza', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Roberto Messuti', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('José Gregorio', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Pedro Lander', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Nanutria', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Leo Rojas', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Chris Andrade', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Nacho Redondo', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('José Luis Rodríguez', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Oscar DeLeón', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Franco De Vita', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Ilan Chester', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Miguel Ángel Landa', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Miguel Cabrera', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Johan Santana', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('José Altuve', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Félix Hernández', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Carlos González', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Andrés Galarraga', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Omar Vizquel', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Luis Aparicio', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Magglio Ordóñez', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Francisco Rodríguez', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Aníbal Sánchez', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Salvador Pérez', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Martín Prado', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Alcides Escobar', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Carlos Zambrano', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Freddy García', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Tomás Pérez', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Marco Scutaro', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Henry Blanco', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Bob Abreu', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Gustavo Dudamel', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Norkys Batista', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Lilibeth Morillo', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Mimi Lazo', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Carolina Perpetuo', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Shasha Fitness', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()),
('Simón Díaz', (SELECT id FROM categories WHERE name = 'Celebridades Venezolanas'), NOW(), NOW()));

-- Actualizar el icono si la categoría ya existe (para corregir si aparece como "VE")
-- Usando el código hexadecimal completo de la bandera de Venezuela
UPDATE categories 
SET icon = CONVERT(UNHEX('F09F87BBF09F87AA') USING utf8mb4), updatedAt = NOW()
WHERE name = 'Celebridades Venezolanas';

-- Verificar la inserción
SELECT 
    c.name as categoria,
    c.icon as icono,
    COUNT(ch.id) as total_personajes
FROM categories c
LEFT JOIN characters ch ON c.id = ch.categoryId
WHERE c.name = 'Celebridades Venezolanas'
GROUP BY c.id, c.name, c.icon;

