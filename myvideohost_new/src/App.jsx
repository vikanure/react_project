import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Home from './pages/Home';
import VideoDetails from './pages/VideoDetails';
import Channel from './pages/Channel';

const USERS = [
  { id: 1, username: 'Admin' },
  { id: 2, username: 'Марія' },
  { id: 3, username: 'Олена' }
];

function App() {
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [userNotifications, setUserNotifications] = useState([]);
  //сповіщення
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/notifications/${currentUser.id}`);
      if (Array.isArray(res.data)) {
        setUserNotifications(res.data);
      } else {
        setUserNotifications([]);
      }
    } catch (error) {
      console.error("Помилка завантаження сповіщень:", error);
      setUserNotifications([]);
    }
  };
    const handleNotificationClick = async (notificationId) => {
    try {
      await axios.post('http://localhost:3000/api/notifications/read', {
        id: notificationId
      });
      setUserNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Помилка при читанні сповіщення:", error);
    }
  };
  // виклик при зміні користувача
  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);
  return (
    <div className="app-container">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/"><h1>🎬 Мій Відеохостинг</h1></Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ background: '#e2e8f0', padding: '10px', borderRadius: '8px', minWidth: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔔 Сповіщення: <strong>{userNotifications.length}</strong></span>
              <button
                onClick={fetchNotifications}
                style={{ padding: '2px 5px', fontSize: '12px', marginLeft: '10px' }}
                title="Оновити сповіщення"
              >
                🔄
              </button>
            </div>
            {userNotifications.map(n => (
              <div key={n.id} style={{ fontSize: '12px', color: '#dc2626', marginTop: '5px' }}>
                <Link to={`/video/${n.videoId}`} onClick={() => handleNotificationClick(n.id)}>{n.message}</Link>
              </div>
            ))}
          </div>
          <div>
            <label>Я зараз: </label>
            <select
              value={currentUser.id}
              onChange={(e) => setCurrentUser(USERS.find(u => u.id === parseInt(e.target.value)))}
            >
              {USERS.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<Home currentUser={currentUser} />} />
        <Route path="/video/:id" element={<VideoDetails currentUser={currentUser} />} />
        <Route path="/channel/:authorId" element={<Channel currentUser={currentUser} />} />
      </Routes>
    </div>
  );
}

export default App;
