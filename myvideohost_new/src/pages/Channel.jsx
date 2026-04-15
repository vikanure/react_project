import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function Channel({ currentUser }) {
    const { authorId } = useParams();
    const [videos, setVideos] = useState([]);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const fetchChannelVideos = async () => {
            const response = await axios.get(`http://localhost:3000/api/channel/${authorId}/videos`);
            setVideos(response.data);
        };

        // для перевірки підписки
        const checkSubscriptionStatus = async () => {
            const response = await axios.get(`http://localhost:3000/api/check-subscription?userId=${currentUser.id}&channelId=${authorId}`);
            setIsSubscribed(response.data.isSubscribed); // реальний статус з бази
        };

        fetchChannelVideos();
        checkSubscriptionStatus();

    }, [authorId, currentUser.id]); // щоб статус оновлювався, якщо зміна акаунту
    //підписка
    const handleSubscribe = async () => {
        await axios.post('http://localhost:3000/api/subscribe', {
            userId: currentUser.id,
            channelId: parseInt(authorId)
        });
        setIsSubscribed(true);
    };

    const channelName = videos.length > 0 ? videos[0].authorName : `Користувач #${authorId}`;

    return (
        <div>
            <Link to="/">← Повернутися на головну</Link>
            <h2>📺 Канал користувача {channelName}</h2>
            <button
                onClick={handleSubscribe}
                disabled={isSubscribed}
                style={{
                    marginBottom: '20px',
                    backgroundColor: isSubscribed ? '#94a3b8' : '#3b82f6',
                    cursor: isSubscribed ? 'default' : 'pointer'
                }}
            >
                {isSubscribed ? '✅ Ви підписані' : '🔔 Підписатися на канал'}
            </button>

            <h3>Всі відео каналу:</h3>
            {videos.length === 0 ? <p>На цьому каналі ще немає відео.</p> : (
                <div className="video-grid">
                    {videos.map(video => (
                        <div key={video.id} className="video-card">
                            <h4>{video.title}</h4>
                            <Link to={`/video/${video.id}`}>
                                <video src={video.url} width="100%"></video>
                                <button className="watch-button">Дивитись</button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Channel;