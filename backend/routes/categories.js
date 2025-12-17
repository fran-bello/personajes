const express = require('express');
const router = express.Router();
const { Category, Character } = require('../models');

// Obtener todas las categorías activas con conteo de personajes
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'description', 'icon'],
      include: [{
        model: Character,
        as: 'characters',
        attributes: ['id']
      }],
      order: [['name', 'ASC']]
    });
    
    const categoriesWithCount = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      characterCount: cat.characters?.length || 0
    }));
    
    res.json(categoriesWithCount);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Obtener una categoría con sus personajes
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{
        model: Character,
        as: 'characters',
        attributes: ['id', 'name']
      }]
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      characters: category.characters.map(c => c.name)
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
});

// Crear una nueva categoría con personajes
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, characters } = req.body;
    
    if (!name || !characters || characters.length === 0) {
      return res.status(400).json({ error: 'Nombre y personajes son requeridos' });
    }
    
    // Crear la categoría
    const category = await Category.create({
      name,
      description,
      icon: icon || '📚'
    });
    
    // Crear los personajes asociados
    const characterRecords = characters.map(charName => ({
      name: charName,
      categoryId: category.id
    }));
    
    await Character.bulkCreate(characterRecords);
    
    res.status(201).json({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      characterCount: characters.length
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// Agregar personajes a una categoría existente
router.post('/:id/characters', async (req, res) => {
  try {
    const { characters } = req.body;
    const categoryId = req.params.id;
    
    if (!characters || characters.length === 0) {
      return res.status(400).json({ error: 'Se requieren personajes' });
    }
    
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    const characterRecords = characters.map(charName => ({
      name: charName,
      categoryId: parseInt(categoryId)
    }));
    
    await Character.bulkCreate(characterRecords, { ignoreDuplicates: true });
    
    const count = await Character.count({ where: { categoryId } });
    
    res.json({
      message: `Personajes agregados a ${category.name}`,
      characterCount: count
    });
  } catch (error) {
    console.error('Error adding characters:', error);
    res.status(500).json({ error: 'Error al agregar personajes' });
  }
});

// Seed de categorías iniciales
router.post('/seed', async (req, res) => {
  try {
    const defaultCategories = [
      {
        name: 'Harry Potter',
        description: 'Personajes del mundo mágico de Harry Potter',
        icon: '⚡',
        characters: [
          'Harry Potter', 'Hermione Granger', 'Ron Weasley', 'Albus Dumbledore',
          'Lord Voldemort', 'Severus Snape', 'Draco Malfoy', 'Hagrid',
          'Sirius Black', 'Dobby', 'Bellatrix Lestrange', 'Neville Longbottom',
          'Luna Lovegood', 'Ginny Weasley', 'Fred Weasley', 'George Weasley',
          'Minerva McGonagall', 'Lucius Malfoy', 'Remus Lupin', 'Cedric Diggory',
          'Cho Chang', 'Nymphadora Tonks', 'Alastor Moody', 'Peter Pettigrew'
        ]
      },
      {
        name: 'Disney',
        description: 'Personajes clásicos de Disney',
        icon: '🏰',
        characters: [
          'Mickey Mouse', 'Minnie Mouse', 'Donald Duck', 'Goofy',
          'Elsa', 'Anna', 'Simba', 'Mufasa', 'Scar', 'Woody',
          'Buzz Lightyear', 'Cenicienta', 'Blancanieves', 'Ariel',
          'Bella', 'Bestia', 'Aladdín', 'Jasmine', 'Mulán', 'Pocahontas',
          'Rapunzel', 'Moana', 'Maui', 'Stitch'
        ]
      },
      {
        name: 'Marvel',
        description: 'Superhéroes y villanos de Marvel',
        icon: '🦸',
        characters: [
          'Iron Man', 'Capitán América', 'Thor', 'Hulk', 'Black Widow',
          'Spider-Man', 'Doctor Strange', 'Black Panther', 'Ant-Man',
          'Scarlet Witch', 'Vision', 'Hawkeye', 'Loki', 'Thanos',
          'Groot', 'Rocket Raccoon', 'Star-Lord', 'Gamora', 'Drax',
          'Deadpool', 'Wolverine', 'Professor X', 'Magneto', 'Jean Grey'
        ]
      },
      {
        name: 'Series de TV',
        description: 'Personajes de series populares',
        icon: '📺',
        characters: [
          'Walter White', 'Jesse Pinkman', 'Jon Snow', 'Daenerys Targaryen',
          'Sheldon Cooper', 'Michael Scott', 'Rachel Green', 'Ross Geller',
          'Eleven', 'Hopper', 'Pablo Escobar', 'El Profesor',
          'Tokio', 'Nairobi', 'Don Draper', 'Dexter Morgan',
          'Rick Grimes', 'Tyrion Lannister', 'Cersei Lannister', 'Arya Stark',
          'Homer Simpson', 'Bart Simpson', 'SpongeBob', 'Patrick Star'
        ]
      },
      {
        name: 'Videojuegos',
        description: 'Personajes icónicos de videojuegos',
        icon: '🎮',
        characters: [
          'Mario', 'Luigi', 'Princess Peach', 'Bowser', 'Link',
          'Zelda', 'Ganondorf', 'Pikachu', 'Charizard', 'Mewtwo',
          'Sonic', 'Tails', 'Kratos', 'Master Chief', 'Lara Croft',
          'Nathan Drake', 'Ellie', 'Joel', 'Cloud Strife', 'Sephiroth',
          'Geralt de Rivia', 'Steve (Minecraft)', 'Creeper', 'Sans'
        ]
      },
      {
        name: 'Anime',
        description: 'Personajes de anime popular',
        icon: '🎌',
        characters: [
          'Goku', 'Vegeta', 'Naruto', 'Sasuke', 'Sakura',
          'Luffy', 'Zoro', 'Ichigo Kurosaki', 'Light Yagami', 'L',
          'Eren Jaeger', 'Mikasa', 'Levi', 'Gon Freecss', 'Killua',
          'Saitama', 'Tanjiro Kamado', 'Nezuko', 'Deku', 'All Might',
          'Edward Elric', 'Spike Spiegel', 'Sailor Moon', 'Totoro'
        ]
      },
      {
        name: 'Deportistas',
        description: 'Atletas famosos de diferentes deportes',
        icon: '⚽',
        characters: [
          'Lionel Messi', 'Cristiano Ronaldo', 'Neymar', 'Mbappé',
          'Michael Jordan', 'LeBron James', 'Kobe Bryant', 'Stephen Curry',
          'Roger Federer', 'Rafael Nadal', 'Serena Williams', 'Usain Bolt',
          'Michael Phelps', 'Tiger Woods', 'Tom Brady', 'Muhammad Ali',
          'Mike Tyson', 'Floyd Mayweather', 'Conor McGregor', 'Lewis Hamilton',
          'Diego Maradona', 'Pelé', 'Zinedine Zidane', 'Ronaldinho'
        ]
      },
      {
        name: 'Músicos',
        description: 'Artistas y bandas famosas',
        icon: '🎵',
        characters: [
          'Michael Jackson', 'Madonna', 'Elvis Presley', 'The Beatles',
          'Freddie Mercury', 'David Bowie', 'Prince', 'Whitney Houston',
          'Beyoncé', 'Taylor Swift', 'Rihanna', 'Drake',
          'Ed Sheeran', 'Bad Bunny', 'J Balvin', 'Shakira',
          'Daddy Yankee', 'Eminem', 'Kanye West', 'Lady Gaga',
          'Bruno Mars', 'Ariana Grande', 'Justin Bieber', 'BTS'
        ]
      }
    ];
    
    let createdCategories = 0;
    let createdCharacters = 0;
    let skippedCategories = 0;
    
    for (const catData of defaultCategories) {
      // Verificar si la categoría ya existe
      let category = await Category.findOne({ where: { name: catData.name } });
      
      if (!category) {
        // Crear la categoría
        category = await Category.create({
          name: catData.name,
          description: catData.description,
          icon: catData.icon
        });
        createdCategories++;
        
        // Crear los personajes
        const characterRecords = catData.characters.map(charName => ({
          name: charName,
          categoryId: category.id
        }));
        
        await Character.bulkCreate(characterRecords);
        createdCharacters += catData.characters.length;
      } else {
        skippedCategories++;
        
        // Verificar si hay personajes nuevos que agregar
        const existingChars = await Character.findAll({
          where: { categoryId: category.id },
          attributes: ['name']
        });
        const existingNames = existingChars.map(c => c.name);
        
        const newChars = catData.characters.filter(name => !existingNames.includes(name));
        
        if (newChars.length > 0) {
          const newRecords = newChars.map(charName => ({
            name: charName,
            categoryId: category.id
          }));
          await Character.bulkCreate(newRecords);
          createdCharacters += newChars.length;
        }
      }
    }
    
    res.json({ 
      message: `Seed completado`,
      createdCategories,
      createdCharacters,
      skippedCategories
    });
  } catch (error) {
    console.error('Error seeding categories:', error);
    res.status(500).json({ error: 'Error al crear categorías iniciales' });
  }
});

module.exports = router;
