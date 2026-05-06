import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import './MessageDetail.css';

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

interface MessageDetailUserIsMissedByOrgProps {
  notification: NotificationItem;
  onClose: () => void;
  onRateSuccess?: (record_id: number) => void;
}

export default function MessageDetailUserIsMissedByOrg({
  notification,
  onClose,
  onRateSuccess,
}: MessageDetailUserIsMissedByOrgProps) {
  const [choice, setChoice] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localIsrated, setLocalIsrated] = useState(notification.israted ?? 0);

  const formattedSentDate = new Date(notification.sent_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSubmit = async () => {
    if (choice === null) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:8000/notifications/${notification.record_id}/conflict-respond`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attended: choice }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка при отправке ответа');
      }

      setLocalIsrated(1);
      onRateSuccess?.(notification.record_id);
    } catch (error) {
      console.error('Error responding to conflict:', error);
      alert(error instanceof Error ? error.message : 'Не удалось отправить ответ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="message-detail">
      {/* Кнопка закрытия */}
      <button className="message-detail__close" onClick={onClose}>
        <FiX size={24} />
      </button>

      {/* Хедер с оранжевым переливающимся градиентом */}
      <div className="message-detail__header message-detail__header--orange">
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

        {localIsrated === 1 ? (
          <div className="message-detail__already-rated">
            <p>Спасибо за ответ!</p>
          </div>
        ) : (
          <>
            <div className="message-detail__section-title">Вы были на этой встречи?</div>

            <div className="message-detail__attendance-buttons" style={{ marginBottom: 24 }}>
              <button
                className={`message-detail__attend-btn ${
                  choice === true ? 'message-detail__attend-btn--yes-active' : ''
                }`}
                onClick={() => setChoice(true)}
                style={choice !== true ? { borderColor: '#3ecfaa', color: '#3ecfaa' } : undefined}
              >
                Да, я был
              </button>
              <button
                className={`message-detail__attend-btn ${
                  choice === false ? 'message-detail__attend-btn--no-active' : ''
                }`}
                onClick={() => setChoice(false)}
                style={choice !== false ? { borderColor: '#e74c3c', color: '#e74c3c' } : undefined}
              >
                Нет, я не был
              </button>
            </div>

            <button
              className="message-detail__submit-btn message-detail__submit-btn--orange"
              onClick={handleSubmit}
              disabled={choice === null || isSubmitting}
            >
              {isSubmitting ? 'Отправка...' : 'Отправить ответ'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
