const { DataTypes } = require('sequelize');
const sequelize = require('./database');

// 1. ТАБЛИЦЯ: КОРИСТУВАЧІ 
const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false },
});

// 2. ТАБЛИЦЯ: ВІДЕО 
const Video = sequelize.define('Video', {
    title: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
});

// 3. ТАБЛИЦЯ: КОМЕНТАРІ 
const Comment = sequelize.define('Comment', {
    text: { type: DataTypes.STRING, allowNull: false },
});

// 4. ТАБЛИЦЯ: ЛАЙКИ 
const Like = sequelize.define('Like', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
});

// 5. ТАБЛИЦЯ: ПІДПИСКИ
const Subscription = sequelize.define('Subscription', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
});

// 6. ТАБЛИЦЯ: СПОВІЩЕННЯ (Notifications)
const Notification = sequelize.define('Notification', {
    message: { type: DataTypes.STRING, allowNull: false },
    videoId: { type: DataTypes.INTEGER, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// ЗВ'ЯЗКИ 
// Один-до-багатьох (Користувач -> Відео)
User.hasMany(Video, { foreignKey: 'authorId' });
Video.belongsTo(User, { foreignKey: 'authorId' });

// Один-до-багатьох (Відео -> Коментарі, Користувач -> Коментарі)
Video.hasMany(Comment, { foreignKey: 'videoId' });
Comment.belongsTo(Video, { foreignKey: 'videoId' });
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// Зв'язки для Лайків
User.hasMany(Like, { foreignKey: 'userId' });
Like.belongsTo(User, { foreignKey: 'userId' });
Video.hasMany(Like, { foreignKey: 'videoId' });
Like.belongsTo(Video, { foreignKey: 'videoId' });
User.belongsToMany(Video, { through: Like, as: 'LikedVideos', foreignKey: 'userId' });
Video.belongsToMany(User, { through: Like, as: 'Likers', foreignKey: 'videoId' });

// Зв'язки для Підписок 
User.hasMany(Subscription, { foreignKey: 'subscriberId', as: 'OutgoingSubs' });
Subscription.belongsTo(User, { foreignKey: 'subscriberId', as: 'Subscriber' });
User.hasMany(Subscription, { foreignKey: 'channelId', as: 'IncomingSubs' });
Subscription.belongsTo(User, { foreignKey: 'channelId', as: 'Channel' });

// Зв'язки для Сповіщень 
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Video, Comment, Like, Subscription, Notification };