const User = require('./User');
const Game = require('./Game');
const Category = require('./Category');
const Character = require('./Character');

// Definir relaciones
Category.hasMany(Character, { foreignKey: 'categoryId', as: 'characters' });
Character.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

module.exports = {
  User,
  Game,
  Category,
  Character
};
