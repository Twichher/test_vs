import { FiSearch, FiHelpCircle } from 'react-icons/fi';

import './StatsTable.css';

// Цвета для кварталов
const DISTRICT_COLORS: Record<string, { bg: string; text: string }> = {
  'ЦАО': { bg: '#c8e6c9', text: '#2e7d32' },
  'САО': { bg: '#e1bee7', text: '#7b1fa2' },
  'СВАО': { bg: '#b3e5fc', text: '#0288d1' },
  'ВАО': { bg: '#ffccbc', text: '#d84315' },
  'ЮВАО': { bg: '#f0f4c3', text: '#827717' },
  'ЮАО': { bg: '#d1c4e9', text: '#512da8' },
  'ЮЗАО': { bg: '#b2dfdb', text: '#00796b' },
  'ЗАО': { bg: '#ffe0b2', text: '#ef6c00' },
  'СЗАО': { bg: '#f8bbd0', text: '#c2185b' },
  'ЗелАО': { bg: '#dcedc8', text: '#558b2f' },
  'ТАО': { bg: '#cfd8dc', text: '#455a64' },
  'НАО': { bg: '#fff9c4', text: '#f9a825' },
};

export interface UserStat {
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

interface StatsTableProps {
  topUsers: UserStat[];
  currentUserStat: UserStat | null;
  lastPlaceUser: UserStat | null;
  lastPlace: number;
  currentUserId: number | null;
  userType: 'guest' | 'organizer';
  onUserClick: (user: UserStat) => void;
}

function getRankStyle(rank: number): React.CSSProperties {
  if (rank === 1) return { background: '#FFD700', color: '#000' };
  if (rank === 2) return { background: '#C0C0C0', color: '#000' };
  if (rank === 3) return { background: '#CD7F32', color: '#fff' };
  return {};
}

export default function StatsTable({
  topUsers,
  currentUserStat,
  lastPlaceUser,
  lastPlace,
  currentUserId,
  userType: _userType,
  onUserClick,
}: StatsTableProps) {
  const currentDate = new Date().toLocaleDateString('ru-RU');
  const isCurrentUserInTop = topUsers.some(u => u.user_id === currentUserId);

  return (
    <div className="stats-table-wrapper">
      <h2 className="stats-table-title">Статистика на {currentDate}</h2>
      
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
              <tr 
                key={user.user_id} 
                className={user.user_id === currentUserId ? 'stats-current-user' : ''}
              >
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
                    onClick={() => onUserClick(user)}
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
            {currentUserStat && !isCurrentUserInTop && (
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
                      onClick={() => onUserClick(currentUserStat)}
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

            {/* Последнее место - показываем только если есть пропуск между топом и концом списка */}
            {lastPlaceUser && lastPlace > topUsers.length && (
              <>
                <tr className="stats-gap-row">
                  <td colSpan={8} className="stats-gap-cell">...</td>
                </tr>
                <tr className={lastPlaceUser.user_id === currentUserId ? 'stats-current-user' : ''}>
                  <td className="stats-cell-rank">
                    <span className="stats-rank-badge">{lastPlaceUser.rank}</span>
                  </td>
                  <td className="stats-cell-name">
                    <span>{lastPlaceUser.first_name} {lastPlaceUser.last_name}</span>
                  </td>
                  <td className="stats-cell-action">
                    <button 
                      className="stats-user-btn"
                      onClick={() => onUserClick(lastPlaceUser)}
                    >
                      <FiSearch size={14} />
                    </button>
                  </td>
                  <td className="stats-cell-district">
                    <span 
                      className="stats-district-badge"
                      style={{
                        backgroundColor: DISTRICT_COLORS[lastPlaceUser.district]?.bg || '#e0e0e0',
                        color: DISTRICT_COLORS[lastPlaceUser.district]?.text || '#333'
                      }}
                    >
                      {lastPlaceUser.district}
                    </span>
                  </td>
                  <td className="stats-cell-meetings">{lastPlaceUser.meetings_count}</td>
                  <td className="stats-cell-ratings">{lastPlaceUser.ratings_count}</td>
                  <td className="stats-cell-rating">{lastPlaceUser.rating.toFixed(1)}</td>
                  <td className="stats-cell-rvru">{lastPlaceUser.rvru?.toFixed(2)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
