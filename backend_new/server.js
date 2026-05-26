const express = require('express');
const cors = require('cors');
const multer = require('multer');
const compression = require('compression');
const path = require('path');

const { sequelize, User, Video, Comment, Like, Subscription, Notification } = require('./models');

const app = express();
const PORT = 3000;

app.use(compression());// стиск даних перед відправкою
app.use(cors()); // запити з будь-якого порту клієнта 
app.use(express.json());// формат JSON у запитах
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// збереження відео за допомогою multer у папку uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // унікальний час до назви файлу, щоб вони не перезаписували одне одного
    }
});
const upload = multer({ storage });

// форматування відео
const formatVideo = (v) => ({
    id: v.id,
    title: v.title,
    url: v.url,
    authorId: v.User ? v.User.id : 0,
    authorName: v.User ? v.User.username : "Анонім",
    likes: v.Likers ? v.Likers.map(l => l.id) : [],
    comments: v.Comments ? v.Comments.map(c => ({
        user: c.User ? c.User.username : "Анонім",
        text: c.text
    })) : []
});

// запуск сервера + синхронізація БД
sequelize.sync().then(async () => {
    console.log("База даних SQLite підключена!");

    const usersCount = await User.count();
    if (usersCount === 0) {
        await User.bulkCreate([
            { id: 1, username: "Олександр" },
            { id: 2, username: "Марія" },
            { id: 3, username: "Іван" }
        ]);
        console.log("Початкові користувачі створені!");
    }

    app.listen(PORT, () => {
        console.log(`Сервер запущено на http://localhost:${PORT}`);
    });
}).catch(err => console.error("Помилка БД:", err));


// Отримати список відео
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await Video.findAll({
            include: [User, { model: User, as: 'Likers' }, { model: Comment, include: [User] }]
        });
        res.json(videos.map(formatVideo));
    } catch (err) { res.status(500).send("Помилка БД"); }
});

// Отримати конкретне відео за ID
app.get('/api/videos/:id', async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.id, {
            include: [User, { model: User, as: 'Likers' }, { model: Comment, include: [User] }]
        });
        if (video) res.json(formatVideo(video));
        else res.status(404).send("Відео не знайдено");
    } catch (err) { res.status(500).send("Помилка БД"); }
});

// Завантажити нове відео
app.post('/api/videos', upload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).send("Файл не обрано");

    try {
        const authorId = parseInt(req.body.authorId);

        const newVideo = await Video.create({
            title: req.body.title || "Без назви",
            url: `http://localhost:3000/uploads/${req.file.filename}`,
            authorId: authorId || 1
        });

        const subscriptions = await Subscription.findAll({ where: { channelId: authorId } });
        const author = await User.findByPk(authorId);
        const authorName = author ? author.username : "Анонім";

        for (const sub of subscriptions) {
            await Notification.create({
                userId: sub.subscriberId,
                message: `Нове відео від ${authorName}: ${newVideo.title}`,
                videoId: newVideo.id,
                isRead: false
            });
        }
        const fullVideo = await Video.findByPk(newVideo.id, {
            include: [User, { model: User, as: 'Likers' }, { model: Comment, include: [User] }]
        });

        res.status(201).json(formatVideo(fullVideo));
    } catch (err) {
        console.error("ПОМИЛКА ПРИ ЗАВАНТАЖЕННІ ВІДЕО:", err);
        res.status(500).json({ error: "Помилка бази даних", details: err.message });
    }
});

// Лайк/Дизлайк 
app.post('/api/videos/:id/like', async (req, res) => {
    try {
        const videoId = parseInt(req.params.id);
        const userId = parseInt(req.body.userId);

        const video = await Video.findByPk(videoId);
        if (!video) return res.status(404).send("Відео не знайдено");

        const existingLike = await Like.findOne({ where: { videoId, userId } });

        if (existingLike) {
            await existingLike.destroy();
        } else {
            await Like.create({ videoId, userId });
        }

        const likesCount = await Like.count({ where: { videoId } });
        res.json({ likesCount, isLiked: !existingLike });
    } catch (err) { res.status(500).send("Помилка БД"); }
});

// Додати коментар
app.post('/api/videos/:id/comments', async (req, res) => {
    try {
        const videoId = parseInt(req.params.id);
        const user = await User.findOne({ where: { username: req.body.user } });

        if (!user) return res.status(404).send("Користувача не знайдено");

        await Comment.create({
            text: req.body.text,
            videoId: videoId,
            userId: user.id
        });

        const video = await Video.findByPk(videoId, {
            include: [User, { model: User, as: 'Likers' }, { model: Comment, include: [User] }]
        });
        res.json(formatVideo(video));
    } catch (err) { res.status(500).send("Помилка БД"); }
});

// Підписка на канал
app.post('/api/subscribe', async (req, res) => {
    try {
        const { userId, channelId } = req.body;

        const existingSub = await Subscription.findOne({
            where: { subscriberId: userId, channelId: channelId }
        });

        if (existingSub) {
            await existingSub.destroy();
            res.json({ isSubscribed: false });
        } else {
            await Subscription.create({ subscriberId: userId, channelId: channelId });
            res.json({ isSubscribed: true });
        }
    } catch (err) {
        res.status(500).send("Помилка БД");
    }
});
// Перевірка статусу підписки
app.get('/api/check-subscription', async (req, res) => {
    try {
        const userId = parseInt(req.query.userId);
        const channelId = parseInt(req.query.channelId);

        if (!userId || !channelId || isNaN(userId) || isNaN(channelId)) {
            return res.json({ isSubscribed: false });
        }

        const sub = await Subscription.findOne({
            where: { subscriberId: userId, channelId: channelId }
        });
        res.json({ isSubscribed: !!sub });
    } catch (err) { res.status(500).send("Помилка БД"); }
});

// Отримати відео конкретного автора
app.get('/api/channel/:authorId/videos', async (req, res) => {
    try {
        const videos = await Video.findAll({
            where: { authorId: req.params.authorId },
            include: [User, { model: User, as: 'Likers' }, { model: Comment, include: [User] }]
        });
        res.json(videos.map(formatVideo));
    } catch (err) { res.status(500).send("Помилка БД"); }
});

// Отримати список користувачів
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll({ attributes: ['id', 'username'] });
        res.json(users.map(u => ({ id: u.id, name: u.username })));
    } catch (err) { res.status(500).send("Помилка БД"); }
});

// Отримати сповіщення
app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const notes = await Notification.findAll({
            where: { userId: userId, isRead: false }
        });
        res.json(notes);
    } catch (err) { res.status(500).send("Помилка БД"); }
});

// Позначити повідомлення як прочитані
app.post('/api/notifications/read', async (req, res) => {
    try {
        const noteId = req.body.id ? parseInt(req.body.id) : null;
        const userId = req.body.userId ? parseInt(req.body.userId) : null;
        if (noteId) {
            await Notification.update({ isRead: true }, { where: { id: noteId } });
        } else if (userId) {
            await Notification.update({ isRead: true }, { where: { userId: userId, isRead: false } });
        }
        res.sendStatus(200);
    } catch (err) { res.status(500).send("Помилка БД"); }
});
