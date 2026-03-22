import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import MeetingExpandedInfo from '../components/MeetingExpandedInfo';
import UserComponent from '../components/UserComponent';
import Footer from '../components/Footer';
import './OneMeetingPage.css';

interface MeetingRegedMissedUser {
  user_id: number;
  first_name: string;
  last_name: string;
  is_organizer: boolean;
  user_action: string;
  photo_url: string | null;
}

// Компонент кнопки отмены записи
interface CancelButtonProps {
  meeting_id: string | undefined;
  user_id: number | null;
}

function CancelButton({ meeting_id, user_id }: CancelButtonProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!meeting_id || !user_id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/meetings/${meeting_id}/canceledby/${user_id}`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при отмене записи');
      }

      // Перенаправляем на страницу пользователя
      navigate(`/user/${user_id}`);
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось отменить запись');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="meeting-cancel-btn"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? 'Отмена...' : 'Отменить запись'}
    </button>
  );
}

export default function OneMeetingPage() {
  const { meeting_id } = useParams<{ meeting_id: string }>();
  const { user_id } = useSelector((state: RootState) => state.auth);

  const [regedUsers, setRegedUsers] = useState<MeetingRegedMissedUser[]>([]);
  const [usersOpen, setUsersOpen] = useState(true);

  useEffect(() => {
    if (!meeting_id) return;
    fetch(`http://localhost:8000/meetings/${meeting_id}/reged_users`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: MeetingRegedMissedUser[]) => setRegedUsers(data))
      .catch(console.error);
  }, [meeting_id]);

  return (
    <div className="meeting-page">
      <NavbarLogin />
      <div className="meetings-settings-panel">
        <NavBar onChange={() => {}} />
      </div>

      <main className="meeting-page-content">
        <div className="meeting-page-inner">

          <MeetingExpandedInfo meeting_id={Number(meeting_id)} />

          <CancelButton meeting_id={meeting_id} user_id={user_id} />

          {/* Секция записанных пользователей */}
          <div className="meeting-users-section">
            <button
              className="meeting-users-header"
              onClick={() => setUsersOpen((prev) => !prev)}
            >
              <span>Записаны</span>
              {usersOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
            </button>

            {usersOpen && (
              <div className="meeting-users-grid">
                {regedUsers.map((u) => (
                  <UserComponent
                    key={u.user_id}
                    user_id={u.user_id}
                    first_name={u.first_name}
                    last_name={u.last_name}
                    is_organizer={u.is_organizer}
                    user_action={u.user_action}
                    photo_url={u.photo_url}
                    isCurrentUser={u.user_id === user_id}

                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
