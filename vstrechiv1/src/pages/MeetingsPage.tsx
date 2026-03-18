import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';
import NavbarNoLogin from '../components/NavbarNoLogin';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import MeetingAsItem from '../components/MeetingAsItem';
import FilterPanel from '../components/FilterPanel';
import { FiCalendar, FiUser, FiSearch, FiX } from 'react-icons/fi';
import './MeetingsPage.css';
import { PiUsersFill } from 'react-icons/pi';
import ProfileCard from '../components/ProfileCard';

interface MeetingTypeOne {
  meeting_id: number;
  meeting_title: string;
  registered_users_count: number;
  max_people_allowed: number;
  district: string;
  adults_only_18plus: boolean;
  category_ids: number[];
}

interface MeetingInfo {
  meeting_id: number;
  status: string;
  meeting_title: string;
  meeting_start_at: string;
  creator_user_id: number;
  creator_first_name: string;
  creator_last_name: string;
  registered_users_count: number;
  max_people: number;
  district: string;
  adults_only: boolean;
  warnings: string;
  meeting_description: string;
}

const MeetingsPage: React.FC = () => {
  const { isAuth, district , user_id} = useSelector((state: RootState) => state.auth);

  const [regedMeetingIds, setRegedMeetingIds] = useState<number[]>([]);
  const [meetings, setMeetings] = useState<MeetingTypeOne[]>([]);
  const [originalMeetings, setOriginalMeetings] = useState<MeetingTypeOne[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [expandedInfo, setExpandedInfo] = useState<MeetingInfo | null>(null);

  const [profileModalUserId, setProfileModalUserId] = useState<number | null>(null); // state для модалки и открытие по клику
  const [profileModalfirstname, setProfileModalFirstName] = useState<string | undefined>(undefined)
  const [profileModallastname, setProfileModalLastName] = useState<string | undefined>(undefined)

  useEffect(() => {
    // 1. Получаем id встреч, куда уже записан пользователь
    fetch(`http://localhost:8000/users/${user_id}/reged_meetings`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((regedIds: number[]) => {
        setRegedMeetingIds(regedIds);
  
        // 2. Только после этого запрашиваем список встреч
        return fetch('http://localhost:8000/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ district: district ?? '' }),
          credentials: 'include',
        });
      })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          setAuthError(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data: MeetingTypeOne[] | null) => {
        if (!data) return;
        if (!Array.isArray(data)) {
          console.error('Unexpected /meetings response:', data);
          return;
        }
  
        // 3. Фильтруем — убираем встречи куда уже записан
        setRegedMeetingIds((currentReged) => {
          const filtered = data.filter(
            (m) => !currentReged.includes(m.meeting_id)
          );
          setMeetings(filtered);
          setOriginalMeetings(filtered);
          return currentReged;
        });
  
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [district]);
  

  

  const handleSort = (filters?: {
    districts: string[];
    categories: number[];
    max_people: number | null;
  }) => {
    const hasFilters = filters && (
      filters.districts.length > 0 ||
      filters.categories.length > 0 ||
      filters.max_people !== null
    );
  
    if (!search.trim() && !hasFilters) {
      setMeetings(originalMeetings);
      return;
    }
  
    fetch('http://localhost:8000/meetings/sort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetings: originalMeetings,
        meeting_title: search.trim() || null,
        districts: filters?.districts.length ? filters.districts : null,
        categories: filters?.categories.length ? filters.categories : null,
        max_people: filters?.max_people ?? null,
      }),
      credentials: 'include',
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          setAuthError(true);
          return null;
        }
        return res.json();
      })
      .then((data: MeetingTypeOne[] | null) => {
        if (!data) return;
        if (!Array.isArray(data)) {
          console.error('Unexpected /meetings/sort response:', data);
          return;
        }
        setMeetings(data);
      })
      .catch(console.error);
  };

  const COLUMNS = 4;

  // Считаем сколько плейсхолдеров нужно
  const remainder = meetings.length % COLUMNS;
  const placeholdersInLastRow = remainder === 0 ? 0 : COLUMNS - remainder;
  // +COLUMNS для пустой строки снизу
  const totalPlaceholders = placeholdersInLastRow + COLUMNS;

  const getExpandedStyle = (index: number): React.CSSProperties => {
    if (expandedId !== meetings[index].meeting_id) return {};
    
    const positionInRow = index % COLUMNS;
    const rowIndex = Math.floor(index / COLUMNS) + 1; // 1-based номер строки
  
    if (positionInRow === COLUMNS - 1) {
      return {
        gridColumn: `${COLUMNS - 1} / ${COLUMNS + 1}`, // 3 / 5
        gridRow: `${rowIndex} / span 2`,                // ← явно фиксируем строку
      };
    }
  
    return {
      gridColumn: 'span 2',
      gridRow: `span 2`,                  // ← тоже фиксируем для остальных
    };
  };

  const [isClosing, setIsClosing] = useState(false);

  const handleCardClick = (meetingId: number) => {
    if (expandedId === meetingId) {
      // Запускаем анимацию закрытия, потом убираем карточку
      setIsClosing(true);
      setTimeout(() => {
        setExpandedId(null);
        setExpandedInfo(null);
        setIsClosing(false);
      }, 250); // должно совпадать с длительностью анимации
    } else {
      setExpandedId(meetingId);
      setExpandedInfo(null);
      fetch(`http://localhost:8000/meetings/${meetingId}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data: MeetingInfo) => setExpandedInfo(data))
        .catch(console.error);
    }
  };
  
  
  return (
    <div className="meetings-page">
      {isAuth ? <NavbarLogin /> : <NavbarNoLogin />}

      <main className="meetings-content">
        {authError ? (
          <p className="meetings-status">
            🔒 Войдите в аккаунт, чтобы просматривать встречи
          </p>
        ) : (
          <>
            <div className="meetings-settings-panel">
              <NavBar onChange={() => {}} />
            </div>

            <div className="meetings-toolbar">
              <div className="meetings-search">
                <button className="meetings-search-icon" onClick={() => handleSort()}>
                  🔍
                </button>
                <input
                  type="text"
                  placeholder="Поиск встреч"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort()}
                />
              </div>
              <FilterPanel onApply={(filters) => handleSort(filters)} />
            </div>

            {loading ? (
              <p className="meetings-status">Загрузка...</p>
            ) : (
              <div className="meetings-grid">
              {meetings.map((meeting, index) => (
                <div
                  key={meeting.meeting_id}
                  className="meeting-wrapper"
                  style={getExpandedStyle(index)}
                  onClick={() => handleCardClick(meeting.meeting_id)}
                >
                {expandedId === meeting.meeting_id ? (
                <div className={`meeting-expanded-card ${isClosing ? 'closing' : ''}`}>
                {expandedInfo ? (
                  <>
                    <div className="meeting-expanded-header">
                      {expandedInfo.adults_only && (
                        <span className="meeting-badge">18+</span>
                      )}
                      <h2 className="meeting-expanded-title">{expandedInfo.meeting_title}</h2>
                    </div>

                    <div className="meeting-expanded-body">
                      <div className="meeting-expanded-row">
                        <FiCalendar size={20} />
                        <span>
                          {new Date(expandedInfo.meeting_start_at).toLocaleString('ru-RU', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="meeting-expanded-row">
                        <FiUser size={20} />
                        <span>
                          {expandedInfo.creator_first_name} {expandedInfo.creator_last_name?.charAt(0)}.
                        </span>
                        <button
                          className="meeting-expanded-search-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileModalUserId(expandedInfo.creator_user_id);
                            setProfileModalLastName(expandedInfo.creator_last_name)
                            setProfileModalFirstName(expandedInfo.creator_first_name)
                          }}
                        >
                          <FiSearch size={20} />
                        </button>
                      </div>

                      <div className="meeting-expanded-row">
                        <PiUsersFill size={20} />
                        <span>{expandedInfo.registered_users_count}/{expandedInfo.max_people}</span>
                        <span className="meeting-expanded-district">{expandedInfo.district}</span>
                      </div>

                      {expandedInfo.warnings && (
                        <div className="meeting-expanded-warnings">
                          <span className="meeting-expanded-warning-label">Важно:</span> {expandedInfo.warnings}
                        </div>
                      )}

                      {expandedInfo.meeting_description && (
                        <p className="meeting-expanded-description">
                          {expandedInfo.meeting_description}
                        </p>
                      )}

                      <button
                        className="meeting-join-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('meeting_id:', expandedInfo.meeting_id, 'user_id:', user_id);
                        }}
                      >
                        Участвовать!
                      </button>

                    </div>
                  </>
                ) : (
                  <p className="meeting-expanded-loading">Загрузка...</p>
                )}
              </div>
                    ) : (
                      <MeetingAsItem
                        meeting_title={meeting.meeting_title}
                        registered_users_count={meeting.registered_users_count}
                        max_people_allowed={meeting.max_people_allowed}
                        district={meeting.district}
                        adults_only_18plus={meeting.adults_only_18plus}
                      />
                    )}
                  </div>
                ))}
                {Array.from({ length: totalPlaceholders }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="meeting-placeholder" />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {profileModalUserId !== null && (
        <div className="profile-modal-overlay" onClick={() => setProfileModalUserId(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="profile-modal-close" onClick={() => setProfileModalUserId(null)}>
              <FiX size={24} />
            </button>
            <ProfileCard userId={profileModalUserId} firstname={profileModalfirstname} lastname={profileModallastname} isOrganizer={true} />
          </div>
        </div>
      )}


      <Footer />
    </div>
  );
};

export default MeetingsPage;
