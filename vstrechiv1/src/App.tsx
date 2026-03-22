import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from './slices/authSlice';
import type { AppDispatch } from './slices/store';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FaqPage from './pages/FaqPage';
import MeetingsPage from './pages/MeetingsPage';
import ProfilePage from './pages/ProfilePage';
import OneMeetingPage from './pages/OneMeetingPage';
import OneMeetingPageHistory from './pages/OneMeetingPageHistory';
import SettingsPage from './pages/SettingsPage';

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    fetch('http://localhost:8000/me', {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Не авторизован');
        return res.json();
      })
      .then((data) => {
        dispatch(setUser(data));
      })
      .catch(() => {
        dispatch(clearUser());
      });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/meetings" element={<MeetingsPage />} />
      <Route path="/user/:user_id" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/meetings/info_reged/:meeting_id" element={<OneMeetingPage />} />
      <Route path="/meetings/info_history/:meeting_id" element={<OneMeetingPageHistory />} />
    </Routes>
  );
}

export default App;
