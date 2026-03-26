import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiX, FiSearch, FiHelpCircle } from 'react-icons/fi';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';
import NavbarNoLogin from '../components/NavbarNoLogin';
import NavBar from '../components/NavBar';
import ProfileCard from '../components/ProfileCard';
import Footer from '../components/Footer';
import './StatsPage.css';

// Список районов Москвы
const MOSCOW_DISTRICTS = [
  'ЦАО', 'САО', 'СВАО', 'ВАО',
  'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО',
  'СЗАО', 'ЗелАО', 'ТАО', 'НАО'
];

interface UserStat {
  user_id: number;
  first_name: string;
  last_name: string;
  district: string;
  meetings_count: number;
  ratings_count: number;
  rating: number;
  rank: number;
  rvru?: number;
}

// Цвета для кварталов
const DISTRICT_COLORS: Record<string, { bg: string; text: string }> = {
  'ЦАО': { bg: '#c8e6c9', text: '#2e7d32' },      // Зеленый
  'САО': { bg: '#e1bee7', text: '#7b1fa2' },      // Фиолетовый
  'СВАО': { bg: '#b3e5fc', text: '#0288d1' },     // Голубой
  'ВАО': { bg: '#ffccbc', text: '#d84315' },      // Оранжевый
  'ЮВАО': { bg: '#f0f4c3', text: '#827717' },     // Лайм
  'ЮАО': { bg: '#d1c4e9', text: '#512da8' },      // Фиолетово-синий
  'ЮЗАО': { bg: '#b2dfdb', text: '#00796b' },     // Бирюзовый
  'ЗАО': { bg: '#ffe0b2', text: '#ef6c00' },      // Янтарный
  'СЗАО': { bg: '#f8bbd0', text: '#c2185b' },     // Розовый
  'ЗелАО': { bg: '#dcedc8', text: '#558b2f' },    // Светло-зеленый
  'ТАО': { bg: '#cfd8dc', text: '#455a64' },      // Серо-синий
  'НАО': { bg: '#fff9c4', text: '#f9a825' },      // Желтый
};

export default function StatsPage() {
  const { isAuth, user_id } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // Фильтры
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [ratingType, setRatingType] = useState<'overall' | 'intermediate'>('overall');
  const [userType, setUserType] = useState<'guest' | 'organizer'>('guest');

  // Данные статистики
  const [topUsers, setTopUsers] = useState<UserStat[]>([]);
  const [currentUserStat, setCurrentUserStat] = useState<UserStat | null>(null);
  const [lastPlace, setLastPlace] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Модальное окно профиля
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<{ first: string; last: string } | null>(null);

  // Фото модалка
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);

  const currentDate = new Date().toLocaleDateString('ru-RU');

  // Загрузка статистики
  useEffect(() => {
    if (!isAuth) return;
    
    setLoading(true);
    // TODO: заменить на реальный endpoint
    // Заглушка данных для демонстрации
    const mockData: UserStat[] = [
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

    // Текущий пользователь (например, на 15 месте)
    const currentUser: UserStat = {
      user_id: user_id || 999,
      first_name: 'Текущий',
      last_name: 'Пользователь',
      district: 'ЦАО',
      meetings_count: 45,
      ratings_count: 40,
      rating: 8.5,
      rank: 15
    };

    // Функция расчета RVRU: R × ln(V + 1) × ln(O + 1)
    const calculateRVRU = (user: UserStat): number => {
      const V = user.meetings_count;
      const O = user.ratings_count;
      const R = user.rating;
      return R * Math.log(V + 1) * Math.log(O + 1);
    };

    // Добавляем RVRU к пользователям и сортируем
    const usersWithRVRU = [...mockData, currentUser].map(user => ({
      ...user,
      rvru: calculateRVRU(user)
    })).sort((a, b) => (b.rvru || 0) - (a.rvru || 0));

    // Пересчитываем rank
    const rankedUsers = usersWithRVRU.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    setTopUsers(rankedUsers.slice(0, 10));
    const currentUserWithRank = rankedUsers.find(u => u.user_id === (user_id || 999));
    setCurrentUserStat(currentUserWithRank || null);
    setLastPlace(rankedUsers.length);
    setLoading(false);
  }, [isAuth, selectedDistrict, ratingType, userType, user_id]);

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

  const getRankStyle = (rank: number): React.CSSProperties => {
    if (rank === 1) return { background: '#FFD700', color: '#000' }; // Золото
    if (rank === 2) return { background: '#C0C0C0', color: '#000' }; // Серебро
    if (rank === 3) return { background: '#CD7F32', color: '#fff' }; // Бронза
    return {};
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

          {/* Дата статистики */}
          <h2 className="stats-date-title">Статистика на {currentDate}</h2>

          {/* Таблица */}
          {loading ? (
            <div className="stats-loading">
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
          ) : (
            <div className="stats-table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th className="stats-col-rank">№</th>
                    <th className="stats-col-name">Имя и Фамилия</th>
                    <th className="stats-col-action"></th>
                    <th className="stats-col-district">Квартал</th>
                    <th className="stats-col-meetings">Встреч</th>
                    <th className="stats-col-ratings">Оценок</th>
                    <th className="stats-col-rating">Рейтинг</th>
                    <th className="stats-col-rvru">
                      RVRU
                      <span className="stats-rvru-tooltip" title="Это наш рейтинг, чтобы выявлять лучших пользователей">
                        <FiHelpCircle size={14} className="stats-rvru-icon" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Топ-10 */}
                  {topUsers.map((user) => (
                    <tr key={user.user_id} className={user.user_id === user_id ? 'stats-current-user' : ''}>
                      <td className="stats-cell-rank">
                        <span className="stats-rank-badge" style={getRankStyle(user.rank)}>
                          {user.rank}
                        </span>
                      </td>
                      <td className="stats-cell-name">
                        <span>{user.first_name} {user.last_name}</span>
                      </td>
                      <td className="stats-cell-action">
                        <button 
                          className="stats-user-btn"
                          onClick={() => handleUserClick(user)}
                        >
                          <FiSearch size={14} />
                        </button>
                      </td>
                      <td className="stats-cell-district">
                        <span 
                          className="stats-district-badge"
                          style={{
                            backgroundColor: DISTRICT_COLORS[user.district]?.bg || '#e0e0e0',
                            color: DISTRICT_COLORS[user.district]?.text || '#333'
                          }}
                        >
                          {user.district}
                        </span>
                      </td>
                      <td className="stats-cell-meetings">{user.meetings_count}</td>
                      <td className="stats-cell-ratings">{user.ratings_count}</td>
                      <td className="stats-cell-rating">{user.rating.toFixed(1)}</td>
                      <td className="stats-cell-rvru">{user.rvru?.toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Пропуск и текущий пользователь, если он не в топ-10 */}
                  {currentUserStat && !topUsers.find(u => u.user_id === currentUserStat.user_id) && (
                    <>
                      <tr className="stats-gap-row">
                        <td colSpan={8} className="stats-gap-cell">...</td>
                      </tr>
                      <tr className="stats-current-user">
                        <td className="stats-cell-rank">
                          <span className="stats-rank-badge">{currentUserStat.rank}</span>
                        </td>
                        <td className="stats-cell-name">
                          <span>{currentUserStat.first_name} {currentUserStat.last_name}</span>
                        </td>
                        <td className="stats-cell-action">
                          <button 
                            className="stats-user-btn"
                            onClick={() => handleUserClick(currentUserStat)}
                          >
                            <FiSearch size={14} />
                          </button>
                        </td>
                        <td className="stats-cell-district">
                          <span 
                            className="stats-district-badge"
                            style={{
                              backgroundColor: DISTRICT_COLORS[currentUserStat.district]?.bg || '#e0e0e0',
                              color: DISTRICT_COLORS[currentUserStat.district]?.text || '#333'
                            }}
                          >
                            {currentUserStat.district}
                          </span>
                        </td>
                        <td className="stats-cell-meetings">{currentUserStat.meetings_count}</td>
                        <td className="stats-cell-ratings">{currentUserStat.ratings_count}</td>
                        <td className="stats-cell-rating">{currentUserStat.rating.toFixed(1)}</td>
                        <td className="stats-cell-rvru">{currentUserStat.rvru?.toFixed(2)}</td>
                      </tr>
                    </>
                  )}

                  {/* Последнее место (всегда показываем после текущего пользователя или топ-10) */}
                  <tr className="stats-gap-row">
                    <td colSpan={8} className="stats-gap-cell">...</td>
                  </tr>
                  <tr>
                    <td className="stats-cell-rank">
                      <span className="stats-rank-badge">{lastPlace}</span>
                    </td>
                    <td className="stats-cell-name">—</td>
                    <td className="stats-cell-action">—</td>
                    <td className="stats-cell-district">—</td>
                    <td className="stats-cell-meetings">—</td>
                    <td className="stats-cell-ratings">—</td>
                    <td className="stats-cell-rating">—</td>
                    <td className="stats-cell-rvru">—</td>
                  </tr>
                </tbody>
              </table>
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
              isOrganizer={userType === 'organizer'}
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
