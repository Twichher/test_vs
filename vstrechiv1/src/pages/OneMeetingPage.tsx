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
import './MeetingActionModals.css';

interface MeetingRegedMissedUser {
  user_id: number;
  first_name: string;
  last_name: string;
  is_organizer: boolean;
  user_action: string;
  photo_url: string | null;
}

interface MeetingInfo {
  meeting_id: number;
  creator_user_id: number;
  start_at: string;
  status: string;
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
    // Валидация: проверяем что meeting_id - валидное число
    const meetingIdNum = Number(meeting_id);
    if (!meeting_id || isNaN(meetingIdNum) || meetingIdNum <= 0 || !user_id) {
      console.error('Неверные параметры для отмены записи');
      return;
    }

    // Предотвращаем повторные клики
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/meetings/${meetingIdNum}/canceledby/${user_id}`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при отмене записи');
      }

      // Перенаправляем на страницу пользователя с replace: true
      // чтобы нельзя было вернуться назад кнопкой браузера
      navigate(`/user/${user_id}`, { replace: true });
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось отменить запись');
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

// Компонент кнопок управления встречей для организатора
interface OrganizerActionsProps {
  meeting_id: string | undefined;
  user_id: number | null;
  meetingInfo: MeetingInfo | null;
}

function OrganizerActions({ meeting_id, user_id, meetingInfo }: OrganizerActionsProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);

  const handleCancelClick = () => {
    setCancelModalOpen(true);
  };

  const handleFinishClick = () => {
    setFinishModalOpen(true);
  };

  const handleCancelConfirm = () => {
    console.log('Отмена встречи:', { meeting_id, user_id });
    setCancelModalOpen(false);
  };

  const handleFinishConfirm = () => {
    console.log('Завершение встречи:', { meeting_id, user_id });
    setFinishModalOpen(false);
  };

  const handleModalClose = () => {
    setCancelModalOpen(false);
    setFinishModalOpen(false);
  };

  // Проверяем, началась ли встреча
  const isMeetingStarted = meetingInfo?.start_at ? new Date(meetingInfo.start_at) <= new Date() : false;

  return (
    <>
      <div className="organizer-actions">
        <button
          className="organizer-action-btn organizer-action-btn--cancel"
          onClick={handleCancelClick}
        >
          Отменить встречу
        </button>
        <button
          className="organizer-action-btn organizer-action-btn--finish"
          onClick={handleFinishClick}
          disabled={!isMeetingStarted}
          title={isMeetingStarted ? '' : 'Встреча еще не началась'}
        >
          Завершить встречу
        </button>
      </div>

      {/* Модальное окно отмены встречи */}
      {cancelModalOpen && (
        <div className="action-modal-overlay" onClick={handleModalClose}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="action-modal-title">Вы уверены что хотите отменить встречу?</h3>
            <div className="action-modal-buttons">
              <button
                className="action-modal-btn action-modal-btn--confirm"
                onClick={handleCancelConfirm}
              >
                Подтвердить
              </button>
              <button
                className="action-modal-btn action-modal-btn--cancel"
                onClick={handleModalClose}
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно завершения встречи */}
      {finishModalOpen && (
        <div className="action-modal-overlay" onClick={handleModalClose}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="action-modal-title">Завершить встречу?</h3>
            <div className="action-modal-buttons">
              <button
                className="action-modal-btn action-modal-btn--confirm"
                onClick={handleFinishConfirm}
              >
                Подтвердить
              </button>
              <button
                className="action-modal-btn action-modal-btn--cancel"
                onClick={handleModalClose}
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function OneMeetingPage() {
  const { meeting_id } = useParams<{ meeting_id: string }>();
  const { user_id } = useSelector((state: RootState) => state.auth);

  const [regedUsers, setRegedUsers] = useState<MeetingRegedMissedUser[]>([]);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [usersOpen, setUsersOpen] = useState(true);

  useEffect(() => {
    if (!meeting_id) return;
    
    // Загружаем список записанных пользователей
    fetch(`http://localhost:8000/meetings/${meeting_id}/reged_users`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: MeetingRegedMissedUser[]) => setRegedUsers(data))
      .catch(console.error);

    // Загружаем информацию о встрече (creator_user_id, start_at, status)
    fetch(`http://localhost:8000/meetings/${meeting_id}/info`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: MeetingInfo) => setMeetingInfo(data))
      .catch(console.error);
  }, [meeting_id]);

  // Проверяем является ли текущий пользователь создателем встречи
  const isCreator = meetingInfo?.creator_user_id === user_id;

  return (
    <div className="meeting-page">
      <NavbarLogin />
      <NavBar onChange={() => {}} />

      <main className="meeting-page-content">
        <div className="meeting-page-inner">

          <MeetingExpandedInfo meeting_id={Number(meeting_id)} />

          {/* Показываем разные кнопки в зависимости от того, создатель ли пользователь */}
          {isCreator ? (
            <OrganizerActions 
              meeting_id={meeting_id} 
              user_id={user_id} 
              meetingInfo={meetingInfo}
            />
          ) : (
            <CancelButton meeting_id={meeting_id} user_id={user_id} />
          )}

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
