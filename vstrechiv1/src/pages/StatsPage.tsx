import { useSelector } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';
import { FiX } from 'react-icons/fi';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';
import NavbarNoLogin from '../components/NavbarNoLogin';
import NavBar from '../components/NavBar';
import ProfileCard from '../components/ProfileCard';
import StatsTable, { type UserStat } from '../components/StatsTable';
import Footer from '../components/Footer';
import './StatsPage.css';

// Список районов Москвы
const MOSCOW_DISTRICTS = [
  'ЦАО', 'САО', 'СВАО', 'ВАО',
  'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО',
  'СЗАО', 'ЗелАО', 'ТАО', 'НАО'
];

// Моковые данные
const MOCK_USERS: UserStat[] = [
  { user_id: 1, first_name: 'Иван', last_name: 'Иванов', district: 'ЦАО', meetings_count: 99, ratings_count: 85, rating: 9.9, rank: 1 },
  { user_id: 2, first_name: 'Петр', last_name: 'Петров', district: 'САО', meetings_count: 95, ratings_count: 80, rating: 9.8, rank: 2 },
  { user_id: 3, first_name: 'Сергей', last_name: 'Сергеев', district: 'СВАО', meetings_count: 92, ratings_count: 78, rating: 9.7, rank: 3 },
  { user_id: 4, first_name: 'Алексей', last_name: 'Алексеев', district: 'ВАО', meetings_count: 88, ratings_count: 75, rating: 9.6, rank: 4 },
  { user_id: 5, first_name: 'Дмитрий', last_name: 'Дмитриев', district: 'ЮВАО', meetings_count: 85, ratings_count: 72, rating: 9.5, rank: 5 },
  { user_id: 6, first_name: 'Андрей', last_name: 'Андреев', district: 'ЮАО', meetings_count: 82, ratings_count: 70, rating: 9.4, rank: 6 },
  { user_id: 7, first_name: 'Михаил', last_name: 'Михайлов', district: 'ЮЗАО', meetings_count: 78, ratings_count: 68, rating: 9.3, rank: 7 },
  { user_id: 8, first_name: 'Николай', last_name: 'Николаев', district: 'ЗАО', meetings_count: 75, ratings_count: 65, rating: 9.2, rank: 8 },
  { user_id: 9, first_name: 'Владимир', last_name: 'Владимиров', district: 'СЗАО', meetings_count: 72, ratings_count: 62, rating: 9.1, rank: 9 },
  { user_id: 10, first_name: 'Александр', last_name: 'Александров', district: 'ЗелАО', meetings_count: 70, ratings_count: 60, rating: 9.0, rank: 10 },
  { user_id: 11, first_name: 'Елена', last_name: 'Еленова', district: 'ТАО', meetings_count: 65, ratings_count: 55, rating: 8.9, rank: 11 },
  { user_id: 12, first_name: 'Мария', last_name: 'Мариева', district: 'НАО', meetings_count: 60, ratings_count: 50, rating: 8.8, rank: 12 },
];

// Моковые данные используются только при ошибке сервера

export default function StatsPage() {
  const { isAuth, user_id } = useSelector((state: RootState) => state.auth);

  // Фильтры
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [ratingType, setRatingType] = useState<'overall' | 'intermediate'>('overall');
  const [userType, setUserType] = useState<'guest' | 'organizer'>('guest');

  // Данные и состояние загрузки
  const [data, setData] = useState<{ topUsers: UserStat[]; currentUserStat: UserStat | null; lastPlaceUser: UserStat | null; lastPlace: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  // Модальное окно профиля
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<{ first: string; last: string } | null>(null);

  // Фото модалка
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);

  // Функция расчета RVRU
  const calculateRVRU = (user: UserStat): number => {
    const V = user.meetings_count;
    const O = user.ratings_count;
    const R = user.rating;
    return R * Math.log(V + 1) * Math.log(O + 1);
  };

  // Загрузка данных с бэкенда
  const loadData = useCallback(async () => {
    setLoading(true);
    setData(null); // Скрываем старую таблицу

    try {
      const response = await fetch('http://localhost:8000/stats_data', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: selectedDistrict,
          rating_type: ratingType,
          user_type: userType
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки статистики');
      }

      const result = await response.json();

      setData({
        topUsers: result.top_users,
        currentUserStat: result.current_user,
        lastPlaceUser: result.last_place_user,
        lastPlace: result.last_place
      });

      setTableKey(prev => prev + 1);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      // При ошибке используем моковые данные с реальным user_id
      if (!user_id) return;
      const currentUserStat: UserStat = {
        user_id: user_id,
        first_name: 'Вы',
        last_name: '',
        district: selectedDistrict || 'ЦАО',
        meetings_count: 45,
        ratings_count: 40,
        rating: 8.5,
        rank: 15
      };
      let filteredUsers = [...MOCK_USERS];
      if (selectedDistrict) {
        filteredUsers = filteredUsers.filter(u => u.district === selectedDistrict);
      }
      if (!filteredUsers.find(u => u.user_id === user_id)) {
        filteredUsers.push(currentUserStat);
      }
      const usersWithRVRU = filteredUsers.map(user => ({
        ...user,
        rvru: calculateRVRU(user)
      })).sort((a, b) => (b.rvru || 0) - (a.rvru || 0));
      const rankedUsers = usersWithRVRU.map((user, index) => ({...user, rank: index + 1}));
      const currentUserWithRank = rankedUsers.find(u => u.user_id === user_id) || null;
      const lastPlaceUser = rankedUsers[rankedUsers.length - 1] || null;
      setData({
        topUsers: rankedUsers.slice(0, 10),
        currentUserStat: currentUserWithRank,
        lastPlaceUser: lastPlaceUser,
        lastPlace: rankedUsers.length
      });
      setTableKey(prev => prev + 1);
    }

    setLoading(false);
  }, [selectedDistrict, ratingType, userType, user_id]);

  // Загружаем данные при изменении фильтров
  useEffect(() => {
    if (!isAuth) return;
    loadData();
  }, [isAuth, loadData]);

  const handleUserClick = (user: UserStat) => {
    setSelectedUserId(user.user_id);
    setSelectedUserName({ first: user.first_name, last: user.last_name });
    setProfileModalOpen(true);
  };

  const handlePhotoClick = (photoUrl: string, photos: string[]) => {
    setSelectedPhoto(photoUrl);
    setAllPhotos(photos);
    setPhotoModalOpen(true);
  };

  if (!isAuth) {
    return (
      <div className="stats-page">
        <NavbarNoLogin />
        <main className="stats-page-content">
          <p className="stats-unauthorized">Вы не авторизованы</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="stats-page">
      <NavbarLogin />
      <NavBar onChange={() => {}} />

      <main className="stats-page-content">
        <div className="stats-content-wrapper">
          {/* Блок фильтров */}
          <div className="stats-filters">
            {/* Квартал */}
            <div className="stats-filter-row">
              <span className="stats-filter-label">Квартал</span>
              <select 
                className="stats-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="">Все районы</option>
                {MOSCOW_DISTRICTS.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* Рейтинг */}
            <div className="stats-filter-row">
              <span className="stats-filter-label">Рейтинг</span>
              <div className="stats-radio-group">
                <label className="stats-radio">
                  <input
                    type="radio"
                    name="rating"
                    checked={ratingType === 'overall'}
                    onChange={() => setRatingType('overall')}
                  />
                  <span className="stats-radio-dot"></span>
                  Общий
                </label>
                <label className="stats-radio">
                  <input
                    type="radio"
                    name="rating"
                    checked={ratingType === 'intermediate'}
                    onChange={() => setRatingType('intermediate')}
                  />
                  <span className="stats-radio-dot"></span>
                  Промежуточный
                </label>
              </div>
            </div>

            {/* Цель */}
            <div className="stats-filter-row">
              <span className="stats-filter-label">Цель</span>
              <div className="stats-radio-group">
                <label className="stats-radio">
                  <input
                    type="radio"
                    name="userType"
                    checked={userType === 'guest'}
                    onChange={() => setUserType('guest')}
                  />
                  <span className="stats-radio-dot"></span>
                  Визитёры
                </label>
                <label className="stats-radio">
                  <input
                    type="radio"
                    name="userType"
                    checked={userType === 'organizer'}
                    onChange={() => setUserType('organizer')}
                  />
                  <span className="stats-radio-dot"></span>
                  Организаторы
                </label>
              </div>
            </div>
          </div>

          {/* Skeleton loader */}
          {loading && (
            <div className="stats-skeleton-container">
              <div className="stats-skeleton-title"></div>
              <div className="stats-skeleton-table">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="stats-skeleton-row">
                    <div className="stats-skeleton-rank"></div>
                    <div className="stats-skeleton-name"></div>
                    <div className="stats-skeleton-action"></div>
                    <div className="stats-skeleton-district"></div>
                    <div className="stats-skeleton-number"></div>
                    <div className="stats-skeleton-number"></div>
                    <div className="stats-skeleton-number"></div>
                    <div className="stats-skeleton-number"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Таблица с анимацией перехода */}
          {data && !loading && (
            <div 
              key={tableKey} 
              className="stats-table-animated"
            >
              <StatsTable
                topUsers={data.topUsers}
                currentUserStat={data.currentUserStat}
                lastPlaceUser={data.lastPlaceUser}
                lastPlace={data.lastPlace}
                currentUserId={user_id}
                userType={userType}
                onUserClick={handleUserClick}
              />
            </div>
          )}
        </div>
      </main>

      {/* Модальное окно профиля */}
      {profileModalOpen && selectedUserId && (
        <div className="stats-profile-modal-overlay" onClick={() => setProfileModalOpen(false)}>
          <div className="stats-profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="stats-profile-modal-close" onClick={() => setProfileModalOpen(false)}>
              <FiX size={24} />
            </button>
            <ProfileCard 
              userId={selectedUserId} 
              firstname={selectedUserName?.first} 
              lastname={selectedUserName?.last} 
              onPhotoClick={handlePhotoClick}
            />
          </div>
        </div>
      )}

      {/* Модальное окно фото */}
      {photoModalOpen && (
        <div className="photo-modal-overlay" onClick={() => setPhotoModalOpen(false)}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setPhotoModalOpen(false)}>
              <FiX size={24} />
            </button>

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
