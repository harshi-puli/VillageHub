import { useState } from 'react';
import logo from './assets/logo.png';
import './App.css';
import { useNavigate, BrowserRouter, Routes, Route } from 'react-router-dom';
import { handleImageClick } from './services/announcementService'
import { addAnnouncement } from './services/announcementService' 
import Login from './pages/LogIn';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute  from './ProtectedRoute';

function MainAppContent() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };
  
  const testAddAnnouncement = async () => {
    try {
      const announcement = await addAnnouncement({
        title: 'Test Announcement',
        description: 'This is a test',
        dueDate: new Date(),
        category: 'general'
      })
      setResult(announcement)
      console.log('✅ Success:', announcement) //makes an announcement!!
    } catch (err) {
      setError(err.message)
      console.error('❌ Error:', err)
    }
  }

  return (
    <>
      <div>
        <h1 className="greeting-message">Welcome folks.</h1>
        <img src={logo} alt="Description of my image" onClick={handleImageClick} />
        <p>test that announcement!</p>
        {/*Takes you to the log in Page*/}
        <button onClick={handleLoginClick}>Log In</button>
        <button onClick={testAddAnnouncement}>Test addAnnouncement</button> 
        {result && <pre style={{ background: '#d4edda', padding: '10px' }}>{JSON.stringify(result, null, 2)}</pre>}
        {error && <pre style={{ background: '#f8d7da', padding: '10px' }}>{error}</pre>}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* The path for the main content (e.g., home page) */}
        <Route path="/" element={<MainAppContent />} />

        {/* The path for the login page + dashboards*/}
        <Route path="/login" element={<Login />} />
        <Route path="/AdminDashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/UserDashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
