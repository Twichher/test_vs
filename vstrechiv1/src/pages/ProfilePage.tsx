import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../slices/store';
import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import ProfileCard from '../components/ProfileCard';
import Footer from '../components/Footer';
import RegHistoryMeet from '../components/RegHistoryMeet'
import './ProfilePage.css';

export default function ProfilePage() {
  const { isAuth } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);

  const handlePhotoClick = (photoUrl: string, photos: string[]) => {
    setSelectedPhoto(photoUrl);
    setAllPhotos(photos);
    setPhotoModalOpen(true);
  };

  if (!isAuth) {
    navigate('/');
    return null;
  }

  return (
    <div className="profile-page">
      <NavbarLogin />
      <NavBar onChange={() => {}} />
      <main className="profile-page-content">
        <div className="profile-animate-block profile-animate-block--center">
          <ProfileCard onPhotoClick={handlePhotoClick} />
        </div>
        <div className="profile-animate-block profile-animate-block--left">
          <RegHistoryMeet />
        </div>
      </main>

      {/* Модальное окно фото - рендерится ВНЕ анимированных блоков */}
      {photoModalOpen && (
        <div className="photo-modal-overlay" onClick={() => setPhotoModalOpen(false)}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setPhotoModalOpen(false)}>
              <FiX size={24} />
            </button>

            {/* Список миниатюр — слева (самые новые сверху) */}
            <div className="photo-modal-thumbnails">
              {[...allPhotos].reverse().map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`photo-${index}`}
                  className={`photo-modal-thumb ${selectedPhoto === url ? 'photo-modal-thumb--active' : ''}`}
                  onClick={() => setSelectedPhoto(url)}
                />
              ))}
            </div>

            {/* Главное фото — справа */}
            <div className="photo-modal-main">
              {selectedPhoto && (
                <img src={selectedPhoto} alt="selected" className="photo-modal-main-img" />
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
