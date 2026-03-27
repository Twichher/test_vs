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
import './WithdrawModal.css';

export default function ProfilePage() {
  const { isAuth, user_id } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  
  // Модальное окно вывода валюты
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const [earnedCurrency, setEarnedCurrency] = useState<number>(0);

  const handlePhotoClick = (photoUrl: string, photos: string[]) => {
    setSelectedPhoto(photoUrl);
    setAllPhotos(photos);
    setPhotoModalOpen(true);
  };

  const handleWithdrawClick = () => {
    // Загружаем earned_currency только при открытии модалки
    fetch('http://localhost:8000/users/me/earned_currency', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { user_id: number; earned_currency: number }) => {
        setEarnedCurrency(data.earned_currency);
        setWithdrawModalOpen(true);
      })
      .catch(console.error);
  };

  const handleWithdrawConfirm = () => {
    // Отправляем запрос на обнуление earned_currency
    fetch('http://localhost:8000/users/me/earned_currency/withdraw', {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { user_id: number; earned_currency: number; success: boolean }) => {
        if (data.success) {
          setEarnedCurrency(0);
          setWithdrawConfirmed(true);
          console.log('Вывод валюты выполнен:', {
            user_id: user_id,
            earned_currency: data.earned_currency
          });
        }
      })
      .catch(console.error);
  };

  const handleWithdrawCancel = () => {
    setWithdrawModalOpen(false);
    setWithdrawConfirmed(false);
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
          
          {/* Кнопка вывода валюты - под ProfileCard */}
          <div className="withdraw-currency-section">
            <button 
              className="withdraw-currency-btn"
              onClick={handleWithdrawClick}
            >
              Вывести заработанную валюту
            </button>
          </div>
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

      {/* Модальное окно вывода валюты */}
      {withdrawModalOpen && (
        <div className="withdraw-modal-overlay" onClick={handleWithdrawCancel}>
          <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="withdraw-modal-title">
              Вывести {earnedCurrency}
            </h3>
            <div className="withdraw-modal-buttons">
              <button
                className="withdraw-modal-btn withdraw-modal-btn--confirm"
                onClick={handleWithdrawConfirm}
                disabled={earnedCurrency === 0 || withdrawConfirmed}
              >
                Подтвердить
              </button>
              <button
                className="withdraw-modal-btn withdraw-modal-btn--cancel"
                onClick={handleWithdrawCancel}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
