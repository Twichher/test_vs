import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiX } from 'react-icons/fi';
import type { RootState } from '../slices/store';
import './MessageDetail.css';

interface AttendedUser {
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
  israted?: number;
}

interface MessageDetailUserRateMeetNUsersProps {
  notification: NotificationItem;
  onClose: () => void;
  onRateSuccess?: (record_id: number) => void;
}

export default function MessageDetailUserRateMeetNUsers({
  notification,
  onClose,
  onRateSuccess,
}: MessageDetailUserRateMeetNUsersProps) {
  const { user_id: currentUserId } = useSelector((state: RootState) => state.auth);
  const [attendedUsers, setAttendedUsers] = useState<AttendedUser[]>([]);
  const [missedByOrgUsers, setMissedByOrgUsers] = useState<AttendedUser[]>([]);
  const [hasExtraPeople, setHasExtraPeople] = useState<boolean | null>(null);
  const [meetingRating, setMeetingRating] = useState<number | null>(null);
  const [userRatings, setUserRatings] = useState<Record<number, number | null>>({});
  const [hoveredMeetingRating, setHoveredMeetingRating] = useState<number | null>(null);
  const [hoveredUserRating, setHoveredUserRating] = useState<Record<number, number | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localIsrated, setLocalIsrated] = useState(notification.israted ?? 0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const formattedSentDate = new Date(notification.sent_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatMeetingDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const startDate = formatMeetingDate(notification.meeting_start_at);

  // Загружаем список attended и missedbyorg пользователей
  useEffect(() => {
    const meetingId = notification.meeting_id;
    if (!meetingId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`http://localhost:8000/meetings/${meetingId}/atted_users`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: AttendedUser[]) => {
        const attended = data.filter(
          (u) => u.user_action === 'attended' && u.user_id !== currentUserId
        );
        const missedbyorg = data.filter(
          (u) => u.user_action === 'missedbyorg' && u.user_id !== currentUserId
        );
        setAttendedUsers(attended);
        setMissedByOrgUsers(missedbyorg);

        const initialRatings: Record<number, number | null> = {};
        attended.forEach((user) => {
          initialRatings[user.user_id] = null;
        });
        missedbyorg.forEach((user) => {
          initialRatings[user.user_id] = null;
        });
        setUserRatings(initialRatings);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading users:', error);
        setIsLoading(false);
      });
  }, [notification]);

  const handleMeetingRatingClick = (rating: number) => {
    setMeetingRating(rating);
  };

  const handleUserRatingClick = (userId: number, rating: number) => {
    setUserRatings((prev) => ({ ...prev, [userId]: rating }));
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    const meetingId = notification.meeting_id;
    const recordId = notification.record_id;
    if (!meetingId || !recordId) return;

    const userRatingsList = Object.entries(userRatings)
      .filter(([, rating]) => rating !== null)
      .map(([userId, rating]) => ({
        rated_user_id: Number(userId),
        rating_value: rating!,
      }));

    // Проверяем, что есть хотя бы одна оценка (встречи или пользователей)
    if (meetingRating === null && userRatingsList.length === 0) {
      alert('Поставьте хотя бы одну оценку');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/meetings/save-user-ratings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_id: recordId,
          meeting_id: meetingId,
          meeting_rating: meetingRating,
          user_ratings: userRatingsList,
          has_extra_people: hasExtraPeople,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка при сохранении оценок');
      }

      setLocalIsrated(1);
      onRateSuccess?.(notification.record_id);
    } catch (error) {
      console.error('Error saving ratings:', error);
      alert(error instanceof Error ? error.message : 'Не удалось сохранить оценки');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Кнопка активна, если есть хотя бы одна оценка (кнопки да/нет для missedbyorg не влияют)
  const hasAnyRating = meetingRating !== null || Object.values(userRatings).some((r) => r !== null);

  return (
    <div className="message-detail">
      {/* Кнопка закрытия */}
      <button className="message-detail__close" onClick={onClose}>
        <FiX size={24} />
      </button>

      {/* Хедер с фиолетовым переливающимся градиентом */}
      <div className="message-detail__header message-detail__header--purple">
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
        {/* Текст уведомления */}
        <p className="message-detail__text">
          Встреча от {startDate} &quot;{notification.meeting_title}&quot; закончилась! Мы надеемся тебе
          понравилось. Теперь ты можешь оценить саму встречу, а также всех визитеров, что там
          были.
        </p>

        {localIsrated === 1 ? (
          <div className="message-detail__already-rated">
            <p>Вы уже всех оценили.</p>
          </div>
        ) : (
          <>
            {/* Оценка встречи */}
            <div className="message-detail__users-section">
              <h3 className="message-detail__section-title">Оцените встречу:</h3>
              <div className="message-detail__rating-scale">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
                  const currentRating = meetingRating || 0;
                  const hovered = hoveredMeetingRating || 0;
                  const isHighlighted = rating <= Math.max(currentRating, hovered);
                  return (
                    <button
                      key={rating}
                      className={`message-detail__rating-number ${
                        isHighlighted ? 'message-detail__rating-number--highlighted' : ''
                      } ${rating <= currentRating ? 'message-detail__rating-number--selected' : ''}`}
                      onClick={() => handleMeetingRatingClick(rating)}
                      onMouseEnter={() => setHoveredMeetingRating(rating)}
                      onMouseLeave={() => setHoveredMeetingRating(null)}
                    >
                      {rating}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Оценка attended пользователей */}
            <div className="message-detail__users-section">
              <h3 className="message-detail__section-title">Оцените участников:</h3>

              {isLoading ? (
                <div className="message-detail__loading">Загрузка...</div>
              ) : attendedUsers.length === 0 ? (
                <p className="message-detail__solo-text">
                  Вы единственный участник встречи!
                </p>
              ) : (
                <div className="message-detail__users-list">
                  {attendedUsers.map((user) => (
                    <div key={user.user_id} className="message-detail__user-row">
                      <div className="message-detail__user-info">
                        <span className="message-detail__user-name">
                          {user.last_name} {user.first_name}
                        </span>
                      </div>

                      <div className="message-detail__rating-scale">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
                          const currentRating = userRatings[user.user_id] || 0;
                          const hovered = hoveredUserRating[user.user_id] || 0;
                          const isHighlighted = rating <= Math.max(currentRating, hovered);
                          return (
                            <button
                              key={rating}
                              className={`message-detail__rating-number ${
                                isHighlighted ? 'message-detail__rating-number--highlighted' : ''
                              } ${rating <= currentRating ? 'message-detail__rating-number--selected' : ''}`}
                              onClick={() => handleUserRatingClick(user.user_id, rating)}
                              onMouseEnter={() =>
                                setHoveredUserRating((prev) => ({ ...prev, [user.user_id]: rating }))
                              }
                              onMouseLeave={() =>
                                setHoveredUserRating((prev) => ({ ...prev, [user.user_id]: null }))
                              }
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
            </div>

            {/* Блок missedbyorg — только если есть такие пользователи */}
            {!isLoading && missedByOrgUsers.length > 0 && (
              <div className="message-detail__users-section">
                <div className="message-detail__extra-people-row">
                  <span className="message-detail__extra-people-text">
                    Был ли кто-то еще на встречи?
                  </span>
                  <div className="message-detail__extra-people-buttons">
                    <button
                      className={`message-detail__extra-btn message-detail__extra-btn--yes ${
                        hasExtraPeople === true ? 'message-detail__extra-btn--yes-active' : ''
                      }`}
                      onClick={() => setHasExtraPeople(true)}
                    >
                      да
                    </button>
                    <button
                      className={`message-detail__extra-btn message-detail__extra-btn--no ${
                        hasExtraPeople === false ? 'message-detail__extra-btn--no-active' : ''
                      }`}
                      onClick={() => setHasExtraPeople(false)}
                    >
                      нет
                    </button>
                  </div>
                </div>

                {hasExtraPeople === true && (
                  <div className="message-detail__users-list">
                    {missedByOrgUsers.map((user) => (
                      <div key={user.user_id} className="message-detail__user-row">
                        <div className="message-detail__user-info">
                          <span className="message-detail__user-name">
                            {user.last_name} {user.first_name}
                          </span>
                        </div>

                        <div className="message-detail__rating-scale">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
                            const currentRating = userRatings[user.user_id] || 0;
                            const hovered = hoveredUserRating[user.user_id] || 0;
                            const isHighlighted = rating <= Math.max(currentRating, hovered);
                            return (
                              <button
                                key={rating}
                                className={`message-detail__rating-number ${
                                  isHighlighted ? 'message-detail__rating-number--highlighted' : ''
                                } ${rating <= currentRating ? 'message-detail__rating-number--selected' : ''}`}
                                onClick={() => handleUserRatingClick(user.user_id, rating)}
                                onMouseEnter={() =>
                                  setHoveredUserRating((prev) => ({ ...prev, [user.user_id]: rating }))
                                }
                                onMouseLeave={() =>
                                  setHoveredUserRating((prev) => ({ ...prev, [user.user_id]: null }))
                                }
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

                {hasExtraPeople === false && (
                  <p className="message-detail__thanks-text">Спасибо за помощь!</p>
                )}
              </div>
            )}

            {/* Кнопка отправки */}
            {!isLoading && (
              <button
                className="message-detail__submit-btn"
                onClick={() => setShowConfirmModal(true)}
                disabled={!hasAnyRating || isSubmitting}
              >
                {isSubmitting ? 'Сохранение...' : 'Отправить результаты'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Модальное окно подтверждения */}
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
    </div>
  );
}
