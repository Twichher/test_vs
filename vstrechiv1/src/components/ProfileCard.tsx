import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import { BsPerson } from 'react-icons/bs';
import { FiHelpCircle } from 'react-icons/fi';
import { FiX } from 'react-icons/fi';
import './ProfileCard.css';

interface UserStats {
  meetings_visited_as_guest: number;
  count_period_meetings_guest: number;
  rating_as_guest: number;
  count_all_rating_guest: number;
  intermediate_rating_as_guest: number;
  count_period_rating_guest: number;
  meetings_created_as_organizer: number;
  rating_as_organizer: number;
  count_period_meetings_as_organizer: number;
  intermediate_rating_as_organizer: number;
  photo_urls: string[];
}

interface ProfileCardProps {
  userId?: number; // если не передан — берём из Redux (своя страница)
  firstname?: string
  lastname?: string
  isOrganizer? : boolean
}

export default function ProfileCard({ userId, firstname , lastname, isOrganizer}: ProfileCardProps) {

  const { user_id, first_name, last_name, district, is_organizer } = useSelector(
    (state: RootState) => state.auth
  );

  const targetId = userId ?? user_id;
  const targetfirstname = firstname ?? first_name
  const targetlastname = lastname ?? last_name
  const targetisOrganizer = isOrganizer ?? is_organizer

  const [stats, setStats] = useState<UserStats | null>(null);

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user_id) return;
    fetch(`http://localhost:8000/users/${targetId}/stats`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: UserStats) => setStats(data))
      .catch(console.error);
  }, [user_id]);

  // Последняя загруженная фотография (ASC → последний элемент)
  const avatarUrl =
    stats && stats.photo_urls.length > 0
      ? stats.photo_urls[stats.photo_urls.length - 1]
      : null;

  const role = targetisOrganizer 

  return (
    <div className="profile-card">

      {/* Аватар */}
      <div className="profile-avatar" onClick={() => {
        if (stats && stats.photo_urls.length > 0) {
          setSelectedPhoto(avatarUrl);
          setPhotoModalOpen(true);
        }
        }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="profile-avatar-img" />
        ) : (
          <BsPerson size={48} className="profile-avatar-icon" />
        )}
      </div>

      {/* Имя */}
      <p className="profile-name">
        {targetlastname} {targetfirstname}
      </p>

      <hr className="profile-divider" />

      {/* Роль */}
      <p className="profile-role">Визитёр</p>

      {/* Статистика */}
      {stats && (
        <div className="profile-stats">

          <div className="profile-stat-row">
            <span
              className="profile-stat-label profile-tooltip"
              data-tooltip={`В промежуточный период посещено встреч: ${stats.count_period_meetings_guest}`}
            >
              Встреч <FiHelpCircle size={14} className="profile-hint-icon" />
            </span>
            <span className="profile-stat-value">{stats.meetings_visited_as_guest}</span>
          </div>

          <div className="profile-stat-row">
            <span 
              className="profile-stat-label profile-tooltip"
              data-tooltip={`За все время оценили: ${stats.count_all_rating_guest} раз`}
              >
              Рейтинг <FiHelpCircle size={14} className="profile-hint-icon" />
            </span>
            <span className="profile-stat-value">{stats.rating_as_guest}</span>
          </div>

          <div className="profile-stat-row">
            <span 
            className="profile-stat-label profile-tooltip"
            data-tooltip={`В промежуточный период оценили: ${stats.count_period_rating_guest} раз`}
            >
              Промежуточный <FiHelpCircle size={14} className="profile-hint-icon" />
            </span>
            <span className="profile-stat-value">{stats.intermediate_rating_as_guest}</span>
          </div>

          <div className="profile-stat-row">
            <span className="profile-stat-label">Район</span>
            <span className="profile-stat-value">{district}</span>
          </div>
        </div>
      )}
      {role && stats &&(
        <>
        <p className="profile-role organaizer">Организатор</p>
        <div className="profile-stats">
        <div className="profile-stat-row">
            <span
              className="profile-stat-label profile-tooltip"
              data-tooltip={`В промежуточный создано встреч: ${stats.count_period_meetings_as_organizer}`}
            >
              Встреч <FiHelpCircle size={14} className="profile-hint-icon" />
            </span>
            <span className="profile-stat-value">{stats.meetings_created_as_organizer}</span>
          </div>

          <div className="profile-stat-row">
            <span 
              className="profile-stat-label profile-tooltip"
              data-tooltip={`Средняя оценка созданных встреч`}
              >
              Рейтинг <FiHelpCircle size={14} className="profile-hint-icon" />
            </span>
            <span className="profile-stat-value">{stats.rating_as_organizer}</span>
          </div>

          <div className="profile-stat-row">
            <span 
            className="profile-stat-label profile-tooltip"
            data-tooltip={`Средняя оценка созданных встреч в промежуточный период`}
            >
              Промежуточный <FiHelpCircle size={14} className="profile-hint-icon" />
            </span>
            <span className="profile-stat-value">{stats.intermediate_rating_as_organizer}</span>
          </div>
        </div>
        </>

        )}
      {photoModalOpen && stats && (
        <div className="photo-modal-overlay" onClick={() => setPhotoModalOpen(false)}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>

          <button className="photo-modal-close" onClick={() => setPhotoModalOpen(false)}>
            <FiX size={24} />
          </button>

          {/* Список миниатюр — теперь слева */}
          <div className="photo-modal-thumbnails">
            {stats.photo_urls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`photo-${index}`}
                className={`photo-modal-thumb ${selectedPhoto === url ? 'photo-modal-thumb--active' : ''}`}
                onClick={() => setSelectedPhoto(url)}
              />
            ))}
          </div>

          {/* Главное фото — теперь справа */}
          <div className="photo-modal-main">
            {selectedPhoto && (
              <img src={selectedPhoto} alt="selected" className="photo-modal-main-img" />
            )}
          </div>

          </div>
        </div>
      )}
    </div>
  );
}
