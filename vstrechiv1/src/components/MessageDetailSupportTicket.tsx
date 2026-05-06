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
  notification_text: string;
  photo_urls: string[];
}

interface MessageDetailSupportTicketProps {
  notification: NotificationItem;
  onClose: () => void;
}

export default function MessageDetailSupportTicket({
  notification,
  onClose,
}: MessageDetailSupportTicketProps) {
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const formattedSentDate = new Date(notification.sent_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Защита: если backend вернул photo_urls как массив односимвольных строк (Pydantic list(string)),
  // собираем их обратно в нормальные URL
  let rawUrls = notification.photo_urls;
  if (
    Array.isArray(rawUrls) &&
    rawUrls.length > 10 &&
    rawUrls.every((u) => typeof u === 'string' && u.length === 1)
  ) {
    const joined = rawUrls.join('');
    // PostgreSQL array literal может содержать фигурные скобки и запятые
    const cleaned = joined.replace(/^\{|\}$/g, '');
    rawUrls = cleaned
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  const photoUrls = Array.isArray(rawUrls)
    ? rawUrls.filter(
        (url): url is string => typeof url === 'string' && url.startsWith('http')
      )
    : [];

  const handlePhotoClick = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setPhotoModalOpen(true);
  };

  return (
    <div className="message-detail">
      {/* Кнопка закрытия */}
      <button className="message-detail__close" onClick={onClose}>
        <FiX size={24} />
      </button>

      {/* Хедер с красным переливающимся градиентом */}
      <div className="message-detail__header message-detail__header--canceled">
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

        {/* Медиафайлы из обращения */}
        {photoUrls.length > 0 && (
          <div className="message-detail__photos-section">
            <h3 className="message-detail__section-title">Медиафайлы:</h3>
            <div className="message-detail__photos-grid">
              {photoUrls.map((url, index) => (
                <div
                  key={index}
                  className="message-detail__photo-thumb"
                  onClick={() => handlePhotoClick(url)}
                >
                  <img src={url} alt={`Фото ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Финальное сообщение */}
        <p className="message-detail__footer-text">
          Спасибо за ваше обращение! Ответ придет вам на почту, на которую вы зарегистрировали аккаунт.
        </p>
      </div>

      {/* Модальное окно просмотра фото */}
      {photoModalOpen && selectedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setPhotoModalOpen(false)}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal__close" onClick={() => setPhotoModalOpen(false)}>
              <FiX size={24} />
            </button>

            <div className="photo-modal__thumbnails">
              {photoUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`photo-${index}`}
                  className={`photo-modal__thumb ${selectedPhoto === url ? 'photo-modal__thumb--active' : ''}`}
                  onClick={() => setSelectedPhoto(url)}
                />
              ))}
            </div>

            <div className="photo-modal__main">
              <img src={selectedPhoto} alt="selected" className="photo-modal__main-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
