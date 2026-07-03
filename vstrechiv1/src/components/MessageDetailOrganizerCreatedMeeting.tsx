import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import './MessageDetail.css';
import type { NotificationItem } from '../types/notification';


interface MessageDetailOrganizerCreatedMeetingProps {
  notification: NotificationItem;
  onClose: () => void;
}

export default function MessageDetailOrganizerCreatedMeeting({
  notification,
  onClose,
}: MessageDetailOrganizerCreatedMeetingProps) {
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

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
  const endDate = formatMeetingDate(notification.meeting_end_at);

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

      {/* Хедер с зеленым переливающимся градиентом */}
      <div className="message-detail__header message-detail__header--meeting">
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
        {/* Поздравление */}
        <p className="message-detail__text">
          Поздравляем! Вы создали встреу &quot;{notification.meeting_title}&quot;, которая пройдет с {startDate} по {endDate}.
        </p>

        {/* Информация о встрече */}
        <div className="message-detail__info-section">
          <h3 className="message-detail__section-title">Информация о встрече:</h3>
          <div className="message-detail__info-grid">
            {notification.meeting_address && (
              <div className="message-detail__info-row">
                <span className="message-detail__info-label">Адрес:</span>
                <span className="message-detail__info-value">{notification.meeting_address}</span>
              </div>
            )}
            {notification.meeting_district && (
              <div className="message-detail__info-row">
                <span className="message-detail__info-label">Район:</span>
                <span className="message-detail__info-value">{notification.meeting_district}</span>
              </div>
            )}
            {notification.meeting_max_people !== null && (
              <div className="message-detail__info-row">
                <span className="message-detail__info-label">Максимум людей:</span>
                <span className="message-detail__info-value">{notification.meeting_max_people}</span>
              </div>
            )}
            {notification.meeting_adults_only !== null && (
              <div className="message-detail__info-row">
                <span className="message-detail__info-label">18+:</span>
                <span className="message-detail__info-value">
                  {notification.meeting_adults_only ? 'Да' : 'Нет'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Описание встречи */}
        {notification.meeting_description && (
          <div className="message-detail__organizer-message">
            <h3 className="message-detail__section-title">Описание встречи:</h3>
            <p className="message-detail__organizer-text">{notification.meeting_description}</p>
          </div>
        )}

        {/* Сообщение от организатора (для участников) */}
        {notification.notification_text && (
          <div className="message-detail__organizer-message">
            <h3 className="message-detail__section-title">Сообщение для участников:</h3>
            <p className="message-detail__organizer-text">{notification.notification_text}</p>
          </div>
        )}

        {/* Фото от организатора */}
        {notification.photo_urls && notification.photo_urls.length > 0 && (
          <div className="message-detail__photos-section">
            <h3 className="message-detail__section-title">Фотографии:</h3>
            <div className="message-detail__photos-grid">
              {notification.photo_urls.map((url, index) => (
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

        {/* Финальное пожелание */}
        <p className="message-detail__footer-text">
          Надеемся встреча пройдет отлично! Не забудьте отметить участников после завершения.
        </p>
      </div>

      {/* Модальное окно просмотра фото */}
      {photoModalOpen && selectedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setPhotoModalOpen(false)}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            {/* Кнопка закрытия */}
            <button className="photo-modal__close" onClick={() => setPhotoModalOpen(false)}>
              <FiX size={24} />
            </button>

            {/* Список миниатюр слева */}
            <div className="photo-modal__thumbnails">
              {notification.photo_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`photo-${index}`}
                  className={`photo-modal__thumb ${selectedPhoto === url ? 'photo-modal__thumb--active' : ''}`}
                  onClick={() => setSelectedPhoto(url)}
                />
              ))}
            </div>

            {/* Главное фото в центре */}
            <div className="photo-modal__main">
              <img src={selectedPhoto} alt="selected" className="photo-modal__main-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
