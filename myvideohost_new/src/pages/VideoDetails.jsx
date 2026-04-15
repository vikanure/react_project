import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function VideoDetails({ currentUser }) {
    const { id } = useParams(); //id відео з url
    const [video, setVideo] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        fetchVideo();
    }, [id, currentUser.id]);

    const fetchVideo = async () => {
        try {
            // завантажити відео
            const response = await axios.get(`http://localhost:3000/api/videos/${id}`);
            setVideo(response.data);

            // перевірка статусу підписки на автора цього відео
            const subResponse = await axios.get(`http://localhost:3000/api/check-subscription?userId=${currentUser.id}&channelId=${response.data.authorId}`);
            setIsSubscribed(subResponse.data.isSubscribed); // реальний статус з бази

        } catch (error) {
            console.error("Помилка завантаження відео", error);
        }
    };
    //коментарі
    const handleComment = async () => {
        if (!commentText.trim()) return;
        await axios.post(`http://localhost:3000/api/videos/${id}/comments`, {
            text: commentText,
            user: currentUser.username
        });
        fetchVideo();
        setCommentText('');
    };
    //посилання для поділитися
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Посилання скопійовано в буфер обміну!');
    };
    //підписка
    const handleSubscribe = async () => {
        await axios.post('http://localhost:3000/api/subscribe', {
            userId: currentUser.id,
            channelId: video.authorId
        });
        setIsSubscribed(true);
    };

    if (!video) return <p>Завантаження...</p>;

    return (
        <div>
            <Link to="/">← Повернутися до всіх відео</Link>

            <div className="video-details-container">
                <h2>{video.title}</h2>
                <p style={{ color: '#64748b' }}>
                    Канал: <Link to={`/channel/${video.authorId}`}>{video.authorName || `Користувач #${video.authorId}`}</Link>
                </p>

                <video className="video-player" src={video.url} controls autoPlay></video>

                <div className="video-actions">
                    <button onClick={handleShare}>🔗 Поділитися</button>
                    <button
                        onClick={handleSubscribe}
                        disabled={isSubscribed}
                        style={{
                            backgroundColor: isSubscribed ? '#94a3b8' : '#3b82f6',
                            cursor: isSubscribed ? 'default' : 'pointer'
                        }}
                    >
                        {isSubscribed ? '✅ Ви підписані' : '🔔 Підписатися на канал'}
                    </button>
                </div>

                <div className="comments-section">
                    <h3>Коментарі ({video.comments.length})</h3>

                    <div className="comment-form">
                        <input
                            type="text"
                            placeholder="Додайте коментар..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button onClick={handleComment}>Надіслати</button>
                    </div>

                    {video.comments.map((c, i) => (
                        <div key={i} className="comment-item">
                            <strong>{c.user}</strong>
                            <p style={{ margin: '5px 0 0 0' }}>{c.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default VideoDetails;