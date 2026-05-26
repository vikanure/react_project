const { Sequelize } = require('sequelize');

// підключення до SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './video_hosting.sqlite',
    logging: false
});

module.exports = sequelize;