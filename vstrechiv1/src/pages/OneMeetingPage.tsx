import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import MeetingExpandedInfo from '../components/MeetingExpandedInfo';
import UserComponent from '../components/UserComponent';
import ProfileModal from '../components/ProfileModal';
import Footer from '../components/Footer';
import './OneMeetingPage.css';
import './MeetingActionModals.css';

// Компонент загрузки
function LoadingSpinner() {
  return (
    <div className="meeting-loading">
      <div className="meeting-loading-spinner"></div>
      <p className="meeting-loading-text">Загрузка...</p>
    </div>
  );
}

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
  onClick: () => void;
  meetingStatus?: string | null;
  userAction?: string | null;
}

function CancelButton({ onClick, meetingStatus, userAction }: CancelButtonProps) {
  // Если пользователь уже пропустил встречу (missed) и она в статусе created — скрываем кнопку
  if (userAction === 'missed' && meetingStatus === 'created') {
    return null;
  }

  // Если встреча уже завершена (in_progress), не показываем кнопку отмены
  if (meetingStatus === 'in_progress') {
    return (
      <div className="meeting-cancel-message">
        Встреча завершена. Ожидайте уведомление о завершении.
      </div>
    );
  }
  
  return (
    <button
      className="meeting-cancel-btn"
      onClick={onClick}
    >
      Отменить запись
    </button>
  );
}

// Компонент кнопок управления встречей для организатора
interface OrganizerActionsProps {
  meeting_id: string | undefined;
  user_id: number | null;
  meetingInfo: MeetingInfo | null;
  onOpenCancelModal: () => void;
  onOpenFinishModal: () => void;
}

function OrganizerActions({ 
  meeting_id, 
  user_id, 
  meetingInfo, 
  onOpenCancelModal, 
  onOpenFinishModal 
}: OrganizerActionsProps) {
  // Проверяем, началась ли встреча
  const isMeetingStarted = meetingInfo?.start_at ? new Date(meetingInfo.start_at) <= new Date() : false;
  
  // Если встреча уже в статусе in_progress, не показываем кнопки управления
  const isInProgress = meetingInfo?.status === 'in_progress';
  
  if (isInProgress) {
    return (
      <div className="organizer-actions">
        <div className="organizer-actions-message">
          Встреча завершена. Ожидается оценка участников.
        </div>
      </div>
    );
  }

  return (
    <div className="organizer-actions">
      <button
        className="organizer-action-btn organizer-action-btn--cancel"
        onClick={onOpenCancelModal}
      >
        Отменить встречу
      </button>
      <button
        className="organizer-action-btn organizer-action-btn--finish"
        onClick={onOpenFinishModal}
        disabled={!isMeetingStarted}
        title={isMeetingStarted ? '' : 'Встреча еще не началась'}
      >
        Завершить встречу
      </button>
    </div>
  );
}

// Модальное окно отмены встречи
interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting_id: string | undefined;
  user_id: number | null;
}

function CancelModal({ isOpen, onClose, meeting_id, user_id }: CancelModalProps) {
  const navigate = useNavigate();
  const [isCanceling, setIsCanceling] = useState(false);

  if (!isOpen) return null;

  const handleCancelConfirm = async () => {
    const meetingIdNum = Number(meeting_id);
    if (!meeting_id || isNaN(meetingIdNum) || meetingIdNum <= 0 || !user_id) {
      console.error('Неверные параметры для отмены встречи');
      return;
    }

    if (isCanceling) return;

    setIsCanceling(true);
    try {
      const response = await fetch(
        `http://localhost:8000/meetings/${meetingIdNum}/cancel`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при отмене встречи');
      }

      const result = await response.json();
      console.log('Встреча отменена:', result);
      
      // Перенаправляем на страницу пользователя
      navigate(`/user/${user_id}`, { replace: true });
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error instanceof Error ? error.message : 'Не удалось отменить встречу');
      setIsCanceling(false);
      onClose();
    }
  };

  const handleModalClose = () => {
    if (isCanceling) return;
    onClose();
  };

  return (
    <div className="action-modal-overlay" onClick={handleModalClose}>
      <div className="action-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="action-modal-title">Вы уверены что хотите отменить встречу?</h3>
        <div className="action-modal-buttons">
          <button
            className="action-modal-btn action-modal-btn--confirm"
            onClick={handleCancelConfirm}
            disabled={isCanceling}
          >
            {isCanceling ? 'Отмена...' : 'Подтвердить'}
          </button>
          <button
            className="action-modal-btn action-modal-btn--cancel"
            onClick={handleModalClose}
            disabled={isCanceling}
          >
            Отменить
          </button>
        </div>
      </div>
    </div>
  );
}

// Модальное окно завершения встречи
interface FinishModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting_id: string | undefined;
  user_id: number | null;
}

function FinishModal({ isOpen, onClose, meeting_id, user_id }: FinishModalProps) {
  const [isFinishing, setIsFinishing] = useState(false);

  if (!isOpen) return null;

  const handleFinishConfirm = async () => {
    const meetingIdNum = Number(meeting_id);
    if (!meeting_id || isNaN(meetingIdNum) || meetingIdNum <= 0 || !user_id) {
      console.error('Неверные параметры для завершения встречи');
      return;
    }

    if (isFinishing) return;

    setIsFinishing(true);
    try {
      const response = await fetch(
        `http://localhost:8000/meetings/${meetingIdNum}/finish`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при завершении встречи');
      }

      const result = await response.json();
      console.log('Встреча завершена:', result);
      
      // Перенаправляем на страницу пользователя
      window.location.href = `/user/${user_id}`;
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error instanceof Error ? error.message : 'Не удалось завершить встречу');
      setIsFinishing(false);
    }
  };

  const handleModalClose = () => {
    if (isFinishing) return;
    onClose();
  };

  return (
    <div className="action-modal-overlay" onClick={handleModalClose}>
      <div className="action-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="action-modal-title">Завершить встречу?</h3>
        <div className="action-modal-buttons">
          <button
            className="action-modal-btn action-modal-btn--confirm"
            onClick={handleFinishConfirm}
            disabled={isFinishing}
          >
            {isFinishing ? 'Завершение...' : 'Подтвердить'}
          </button>
          <button
            className="action-modal-btn action-modal-btn--cancel"
            onClick={handleModalClose}
            disabled={isFinishing}
          >
            Отменить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OneMeetingPage() {
  const { meeting_id } = useParams<{ meeting_id: string }>();
  const { user_id } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const [regedUsers, setRegedUsers] = useState<MeetingRegedMissedUser[]>([]);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [usersOpen, setUsersOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [pageVisible, setPageVisible] = useState(false);
  
  // Состояния для модальных окон
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  
  // Состояние для модального окна профиля пользователя (из списка)
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MeetingRegedMissedUser | null>(null);
  
  // Состояние для модального окна профиля организатора
  const [organizerModalOpen, setOrganizerModalOpen] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState<{userId: number, firstName: string, lastName: string} | null>(null);
  
  // Состояние для модального окна отмены записи (для не-организатора)
  const [cancelRegModalOpen, setCancelRegModalOpen] = useState(false);
  const [isCancelingReg, setIsCancelingReg] = useState(false);
  
  const handleUserClick = (user: MeetingRegedMissedUser) => {
    return () => {
      setSelectedUser(user);
      setProfileModalOpen(true);
    };
  };
  
  const handleOrganizerClick = (userId: number, firstName: string, lastName: string) => {
    setSelectedOrganizer({ userId, firstName, lastName });
    setOrganizerModalOpen(true);
  };
  
  const handleCancelRegClick = () => {
    setCancelRegModalOpen(true);
  };
  
  const handleCancelRegConfirm = async () => {
    const meetingIdNum = Number(meeting_id);
    if (!meeting_id || isNaN(meetingIdNum) || meetingIdNum <= 0 || !user_id) {
      console.error('Неверные параметры для отмены записи');
      return;
    }

    if (isCancelingReg) return;

    setIsCancelingReg(true);
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
      navigate(`/user/${user_id}`, { replace: true });
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось отменить запись');
      setIsCancelingReg(false);
      setCancelRegModalOpen(false);
    }
  };

  useEffect(() => {
    // Плавное появление страницы
    const timer = setTimeout(() => setPageVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!meeting_id) return;
    
    setIsLoading(true);
    
    Promise.all([
      // Загружаем список записанных пользователей
      fetch(`http://localhost:8000/meetings/${meeting_id}/reged_users`, {
        credentials: 'include',
      }).then((res) => res.json()),
      // Загружаем информацию о встрече
      fetch(`http://localhost:8000/meetings/${meeting_id}/info`, {
        credentials: 'include',
      }).then((res) => res.json()),
    ])
      .then(([usersData, infoData]) => {
        setRegedUsers(usersData);
        setMeetingInfo(infoData);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, [meeting_id]);

  // Проверяем является ли текущий пользователь создателем встречи
  const isCreator = meetingInfo?.creator_user_id === user_id;

  return (
    <div className={`meeting-page ${pageVisible ? 'meeting-page--visible' : ''}`}>
      <NavbarLogin />
      <NavBar onChange={() => {}} />

      <main className="meeting-page-content">
        <div className="meeting-page-inner">

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="meeting-fade-in meeting-fade-in--1">
                <MeetingExpandedInfo 
                  meeting_id={Number(meeting_id)} 
                  onOrganizerClick={handleOrganizerClick}
                  userAction={regedUsers.find(u => u.user_id === user_id)?.user_action ?? null}
                />
              </div>

              <div className="meeting-fade-in meeting-fade-in--2">
                {/* Показываем разные кнопки в зависимости от того, создатель ли пользователь */}
                {isCreator ? (
                  <OrganizerActions 
                    meeting_id={meeting_id} 
                    user_id={user_id} 
                    meetingInfo={meetingInfo}
                    onOpenCancelModal={() => setCancelModalOpen(true)}
                    onOpenFinishModal={() => setFinishModalOpen(true)}
                  />
                ) : (
                  <CancelButton 
                    onClick={handleCancelRegClick} 
                    meetingStatus={meetingInfo?.status}
                    userAction={regedUsers.find(u => u.user_id === user_id)?.user_action ?? null}
                  />
                )}
              </div>

              <div className="meeting-fade-in meeting-fade-in--3">
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
                      {regedUsers.map((u, index) => (
                        <div 
                          key={u.user_id} 
                          className="meeting-user-item"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <UserComponent
                            user_id={u.user_id}
                            first_name={u.first_name}
                            last_name={u.last_name}
                            is_organizer={u.is_organizer}
                            user_action={u.user_action}
                            photo_url={u.photo_url}
                            isCurrentUser={u.user_id === user_id}
                            onClick={handleUserClick(u)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      <Footer />

      {/* Модальные окна рендерим на уровне страницы, вне анимированных контейнеров */}
      <CancelModal 
        isOpen={cancelModalOpen} 
        onClose={() => setCancelModalOpen(false)} 
        meeting_id={meeting_id}
        user_id={user_id}
      />
      <FinishModal 
        isOpen={finishModalOpen} 
        onClose={() => setFinishModalOpen(false)} 
        meeting_id={meeting_id}
        user_id={user_id}
      />
      
      {/* Модальное окно профиля пользователя (из списка) */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={selectedUser?.user_id ?? null}
        firstName={selectedUser?.first_name ?? ''}
        lastName={selectedUser?.last_name ?? ''}
      />
      
      {/* Модальное окно профиля организатора */}
      <ProfileModal
        isOpen={organizerModalOpen}
        onClose={() => setOrganizerModalOpen(false)}
        userId={selectedOrganizer?.userId ?? null}
        firstName={selectedOrganizer?.firstName ?? ''}
        lastName={selectedOrganizer?.lastName ?? ''}
      />
      
      {/* Модальное окно подтверждения отмены записи */}
      {cancelRegModalOpen && (
        <div className="action-modal-overlay" onClick={() => !isCancelingReg && setCancelRegModalOpen(false)}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="action-modal-title">Вы уверены что хотите отменить запись?</h3>
            <div className="action-modal-buttons">
              <button
                className="action-modal-btn action-modal-btn--danger"
                onClick={handleCancelRegConfirm}
                disabled={isCancelingReg}
              >
                {isCancelingReg ? 'Отмена...' : 'Подтвердить'}
              </button>
              <button
                className="action-modal-btn action-modal-btn--cancel"
                onClick={() => setCancelRegModalOpen(false)}
                disabled={isCancelingReg}
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
