import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home({ currentUser }) {
    const [videos, setVideos] = useState([]);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchVideos();
    }, []);
    //відео
    const fetchVideos = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/videos');
            setVideos(response.data);
        } catch (error) {
            console.error("Помилка завантаження списку відео", error);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Будь ласка, виберіть відеофайл!");
            return;
        }
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        formData.append('authorId', currentUser.id);
        formData.append('authorName', currentUser.username);
        try {
            const response = await axios.post('http://localhost:3000/api/videos', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            fetchVideos();
            setTitle('');
            setFile(null);
            document.querySelector('input[type="file"]').value = '';
            alert('Відео успішно завантажено!');
        } catch (error) {
            console.error("Помилка при завантаженні:", error);
            alert(`Помилка: ${error.message}. Відкрийте консоль (F12) для деталей.`);
        }
    };

    return (
        <div>
            <div className="upload-section">
                <h3>Завантажити нове відео (як {currentUser.username})</h3>
                <form className="upload-form" onSubmit={handleUpload}>
                    <input type="text" placeholder="Назва відео..." value={title} onChange={(e) => setTitle(e.target.value)} required />
                    <label className="custom-file-upload">
                        <input
                            type="file"
                            accept="video/*"
                            style={{ display: 'none' }}
                            onChange={(e) => setFile(e.target.files[0])}
                            required={!file}
                        />
                        {file ? `📎 ${file.name}` : '📁 Оберіть файл відео'}
                    </label>
                    <button type="submit">Завантажити</button>
                </form>
            </div>

            <h2>Останні відео</h2>
            <div className="video-grid">
                {videos.map(video => (
                    <div key={video.id} className="video-card">
                        <h3>{video.title}</h3>
                        <Link to={`/video/${video.id}`}>
                            <video src={video.url} width="100%"></video>
                            <button className="watch-button">Дивитись відео</button>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;