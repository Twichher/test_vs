import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';
import NavbarNoLogin from '../components/NavbarNoLogin';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import MeetingAsItem from '../components/MeetingAsItem';
import FilterPanel from '../components/FilterPanel';
import './MeetingsPage.css';

interface MeetingTypeOne {
  meeting_id: number;
  meeting_title: string;
  registered_users_count: number;
  max_people_allowed: number;
  district: string;
  adults_only_18plus: boolean;
  category_ids: number[];
}

const MeetingsPage: React.FC = () => {
  const { isAuth, district } = useSelector((state: RootState) => state.auth);

  const [meetings, setMeetings] = useState<MeetingTypeOne[]>([]);
  const [originalMeetings, setOriginalMeetings] = useState<MeetingTypeOne[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);

  useEffect(() => {
    fetch('http://localhost:8000/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district: district ?? '' }),
      credentials: 'include',
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
        setMeetings(data);
        setOriginalMeetings(data);
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
                {meetings.map((meeting) => (
                  <MeetingAsItem
                    key={meeting.meeting_id}
                    meeting_title={meeting.meeting_title}
                    registered_users_count={meeting.registered_users_count}
                    max_people_allowed={meeting.max_people_allowed}
                    district={meeting.district}
                    adults_only_18plus={meeting.adults_only_18plus}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MeetingsPage;
