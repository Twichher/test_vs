import { useEffect, useState } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import './MessageDetail.css';
import ProfileModal from './ProfileModal';

interface RegisteredUser {
  user_id: number;
  first_name: string;
  last_name: string;
  is_organizer: boolean;
  user_action: string;
  photo_url: string | null;
}

interface NotificationItem {
  record_id: number;
  notification_id: number;
  user_id: number;
  notification_type: string;
  sent_at: string;
  status: 'read' | 'unread';
  meeting_id: number | null;
  meeting_title: string | null;
  meeting_start_at: string | null;
  meeting_end_at: string | null;
  notification_text: string;
  photo_urls: string[];
  israted?: number; // 0 - не оценено, 1 - оценено (только для уведомлений с оценкой)
}

interface UserRating {
  user_id: number;
  attended: boolean | null;
  rating: number | null;
}

interface MessageDetailOrganizerFinishedMeetProps {
  notification: NotificationItem;
  onClose: () => void;
  onRateSuccess?: (record_id: number) => void;
}

export default function MessageDetailOrganizerFinishedMeet({ notification, onClose, onRateSuccess }: MessageDetailOrganizerFinishedMeetProps) {
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [userRatings, setUserRatings] = useState<Record<number, UserRating>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localIsrated, setLocalIsrated] = useState(notification.israted ?? 0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{userId: number, firstName: string, lastName: string} | null>(null);
  const [hoveredRating, setHoveredRating] = useState<Record<number, number | null>>({});

  const formattedSentDate = new Date(notification.sent_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Загружаем список зарегистрированных пользователей
  useEffect(() => {
    // Получаем meeting_id из notification
    const meetingId = notification.meeting_id;
    
    if (!meetingId) {
      console.error('meeting_id not found in notification');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    fetch(`http://localhost:8000/meetings/${meetingId}/registered_only`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: RegisteredUser[]) => {
        setRegisteredUsers(data);
        // Инициализируем состояние оценок
        const initialRatings: Record<number, UserRating> = {};
        data.forEach((user) => {
          initialRatings[user.user_id] = { user_id: user.user_id, attended: null, rating: null };
        });
        setUserRatings(initialRatings);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading registered users:', error);
        setIsLoading(false);
      });
  }, [notification]);

  const handleUserClick = (user: RegisteredUser) => {
    setSelectedUser({ 
      userId: user.user_id, 
      firstName: user.first_name, 
      lastName: user.last_name 
    });
    setProfileModalOpen(true);
  };

  const handleAttendedClick = (userId: number, attended: boolean) => {
    setUserRatings((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], attended, rating: attended ? prev[userId]?.rating : null },
    }));
  };

  const handleRatingClick = (userId: number, rating: number) => {
    setUserRatings((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], rating },
    }));
  };

  const handleRatingHover = (userId: number, rating: number | null) => {
    setHoveredRating((prev) => ({
      ...prev,
      [userId]: rating,
    }));
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    const meetingId = notification.meeting_id;
    const recordId = notification.record_id;
    if (!meetingId) {
      console.error('meeting_id not found');
      return;
    }
    if (!recordId) {
      console.error('record_id not found');
      return;
    }
    
    const results = Object.values(userRatings).map((ur) => ({
      user_id: ur.user_id,
      user_action: ur.attended === true ? 'attended' : ur.attended === false ? 'missed' : null,
      rating_value: ur.rating,
      meeting_id: meetingId,
    }));

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/meetings/save-ratings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record_id: recordId,
          meeting_id: meetingId,
          ratings: results,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка при сохранении оценок');
      }

      // Успешно сохранено — плавно переключаемся на состояние "уже оценено"
      setLocalIsrated(1);
      // Обновляем родительское состояние, чтобы при повторном открытии уведомление оставалось отмеченным
      onRateSuccess?.(notification.record_id);
    } catch (error) {
      console.error('Error saving ratings:', error);
      alert(error instanceof Error ? error.message : 'Не удалось сохранить оценки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = Object.values(userRatings).some(
    (ur) => ur.attended === null || (ur.attended === true && ur.rating === null)
  );

  return (
    <div className="message-detail">
      {/* Кнопка закрытия */}
      <button className="message-detail__close" onClick={onClose}>
        <FiX size={24} />
      </button>

      {/* Хедер с синим переливающимся градиентом */}
      <div className="message-detail__header message-detail__header--blue">
        {notification.meeting_title && (
          <h2 className="message-detail__meeting-title">{notification.meeting_title}</h2>
        )}
        <div className="message-detail__meta">
          <span className="message-detail__date">{formattedSentDate}</span>
          <span className="message-detail__separator">•</span>
          <span className="message-detail__type">{notification.notification_type}</span>
        </div>
      </div>

      {/* Разделитель */}
      <div className="message-detail__divider"></div>

      {/* Содержимое */}
      <div className="message-detail__content">
        <p className="message-detail__text">{notification.notification_text}</p>

        {/* Проверка: если пользователь уже оценил, показываем сообщение */}
        {localIsrated === 1 ? (
          <div className="message-detail__already-rated">
            <p>Вы уже оценили пользователей.</p>
          </div>
        ) : (
          /* Список пользователей для оценки */
        <div className="message-detail__users-section">
          <h3 className="message-detail__section-title">Зарегистрированные участники:</h3>
          
          {isLoading ? (
            <div className="message-detail__loading">Загрузка...</div>
          ) : (
            <div className="message-detail__users-list">
              {registeredUsers.map((user) => (
                <div key={user.user_id} className="message-detail__user-row">
                  {/* Информация о пользователе */}
                  <div className="message-detail__user-info">
                    <span className="message-detail__user-name">
                      {user.last_name} {user.first_name}
                    </span>
                    <button
                      className="message-detail__search-btn"
                      onClick={() => handleUserClick(user)}
                      title="Просмотреть профиль"
                    >
                      <FiSearch size={16} />
                    </button>
                  </div>

                  {/* Кнопки был/не был */}
                  <div className="message-detail__attendance-buttons">
                    <button
                      className={`message-detail__attend-btn ${
                        userRatings[user.user_id]?.attended === true ? 'message-detail__attend-btn--yes-active' : ''
                      }`}
                      onClick={() => handleAttendedClick(user.user_id, true)}
                    >
                      Был
                    </button>
                    <button
                      className={`message-detail__attend-btn ${
                        userRatings[user.user_id]?.attended === false ? 'message-detail__attend-btn--no-active' : ''
                      }`}
                      onClick={() => handleAttendedClick(user.user_id, false)}
                    >
                      Не был
                    </button>
                  </div>

                  {/* Шкала оценки 1-10 */}
                  <div
                    className={`message-detail__rating-scale ${
                      userRatings[user.user_id]?.attended !== true ? 'message-detail__rating-scale--disabled' : ''
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
                      const currentRating = userRatings[user.user_id]?.rating || 0;
                      const hovered = hoveredRating[user.user_id] || 0;
                      const isHighlighted = rating <= Math.max(currentRating, hovered);
                      
                      return (
                        <button
                          key={rating}
                          className={`message-detail__rating-number ${
                            isHighlighted ? 'message-detail__rating-number--highlighted' : ''
                          } ${rating <= currentRating ? 'message-detail__rating-number--selected' : ''}`}
                          onClick={() => handleRatingClick(user.user_id, rating)}
                          onMouseEnter={() => handleRatingHover(user.user_id, rating)}
                          onMouseLeave={() => handleRatingHover(user.user_id, null)}
                          disabled={userRatings[user.user_id]?.attended !== true}
                        >
                          {rating}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Кнопка отправки результатов */}
          {!isLoading && (
            <button
              className="message-detail__submit-btn"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitDisabled || isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Отправить результаты'}
            </button>
          )}
        </div>
        )}
      </div>

      {/* Модальное окно подтверждения отправки */}
      {showConfirmModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal__title">Вы уверены?</h3>
            <p className="confirm-modal__text">Вы уверены, что хотите отправить результаты?</p>
            <div className="confirm-modal__buttons">
              <button className="confirm-modal__btn confirm-modal__btn--yes" onClick={handleConfirmSubmit}>
                Да
              </button>
              <button className="confirm-modal__btn confirm-modal__btn--no" onClick={() => setShowConfirmModal(false)}>
                Нет
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно профиля пользователя */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={selectedUser?.userId ?? null}
        firstName={selectedUser?.firstName ?? ''}
        lastName={selectedUser?.lastName ?? ''}
      />
    </div>
  );
}
