import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import ProfileCard from '../components/ProfileCard';
import Footer from '../components/Footer';
import RegHistoryMeet from '../components/RegHistoryMeet'
import './ProfilePage.css';

export default function ProfilePage() {
  const { isAuth } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  if (!isAuth) {
    navigate('/');
    return null;
  }

  return (
    <div className="profile-page">
      <NavbarLogin />
      <div className="meetings-settings-panel">
              <NavBar onChange={() => {}} />
        </div>
        <main className="profile-page-content">
          <ProfileCard />
          <RegHistoryMeet />
        </main>

      <Footer />
    </div>
  );
}
