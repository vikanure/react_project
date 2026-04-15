const express = require('express');
const cors = require('cors');
const multer = require('multer');
const compression = require('compression');
const path = require('path');

const app = express();

app.use(compression());// стиск даних перед відправкою
app.use(cors()); // запити з будь-якого порту клієнта 
app.use(express.json());// формат JSON у запитах

// збереження відео за допомогою multer у папку uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // унікальний час до назви файлу, щоб вони не перезаписували одне одного
    }
});
const upload = multer({ storage });
app.use('/uploads', express.static('uploads'));// папка uploads публічна 

let videos = [];
let subscriptions = [];
let notifications = [];

// отримати список усіх відео 
app.get('/api/videos', (req, res) => {
    res.json(videos);
});

// отримати одне конкретне відео за його id
app.get('/api/videos/:id', (req, res) => {
    const video = videos.find(v => v.id === parseInt(req.params.id));
    if (video) {
        res.json(video);
    } else {
        res.status(404).send('Відео не знайдено');
    }
});

// завантажити нове відео
app.post('/api/videos', upload.single('video'), (req, res) => {
    const authorId = parseInt(req.body.authorId);

    const newVideo = {
        id: Date.now(),
        title: req.body.title,
        url: `http://localhost:3000/uploads/${req.file.filename}`,
        authorId: authorId,
        authorName: req.body.authorName,
        comments: []
    };
    videos.push(newVideo);
    const subscribers = subscriptions.filter(sub => sub.channelId === authorId);// пошук підписників
    // для кожного підписника - сповіщення
    subscribers.forEach(sub => {
        notifications.push({
            id: Date.now() + Math.random(),
            userId: sub.userId,
            message: `Нове відео від ${req.body.authorName}: ${req.body.title}`,
            videoId: newVideo.id
        });
    });

    res.status(201).json(newVideo);
});

// додати коментар до відео
app.post('/api/videos/:id/comments', (req, res) => {
    const video = videos.find(v => v.id === parseInt(req.params.id));
    if (video) {
        video.comments.push({
            text: req.body.text,
            user: req.body.user
        });
        res.json(video);
    } else {
        res.status(404).send('Відео не знайдено');
    }
});

// підписатися на канал
app.post('/api/subscribe', (req, res) => {
    const userId = parseInt(req.body.userId);
    const channelId = parseInt(req.body.channelId);
    const isAlreadySubscribed = subscriptions.some(
        sub => sub.userId === userId && sub.channelId === channelId
    );
    if (!isAlreadySubscribed) {
        subscriptions.push({ userId, channelId });
    }
    res.send('Підписка оформлена');
});

// отримати сповіщення конкретного користувача
app.get('/api/notifications/:userId', (req, res) => {
    const userNotifs = notifications.filter(n => n.userId === parseInt(req.params.userId));
    res.json(userNotifs);
});

// отримати всі відео конкретного каналу (автора)
app.get('/api/channel/:authorId/videos', (req, res) => {
    const channelVideos = videos.filter(v => v.authorId === parseInt(req.params.authorId));
    res.json(channelVideos);
});
// перевірка статусу підписки
app.get('/api/check-subscription', (req, res) => {
    // ID користувача та каналу з URL-параметрів 
    const userId = parseInt(req.query.userId);
    const channelId = parseInt(req.query.channelId);
    // пошук такого запису у масиві підписок
    const isSub = subscriptions.some(
        sub => sub.userId === userId && sub.channelId === channelId
    );
    res.json({ isSubscribed: isSub });
});

app.listen(3000, () => {
    console.log("Backend сервер успішно запущено!");
});