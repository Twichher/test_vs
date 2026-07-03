import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import './MessageDetail.css';
import type { NotificationItem } from '../types/notification';


interface MessageDetailUserRegMeetingsProps {
  notification: NotificationItem;
  onClose: () => void;
}

export default function MessageDetailUserRegMeetings({ notification, onClose }: MessageDetailUserRegMeetingsProps) {
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const formattedSentDate = new Date(notification.sent_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Форматируем даты встречи
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

  // Формируем текст сообщения
  const messageText = notification.meeting_title
    ? `Вы записались на встречу "${notification.meeting_title}", которая пройдет с ${startDate} по ${endDate}.`
    : '';

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
        <p className="message-detail__text">{messageText}</p>

        {/* Сообщение от организатора */}
        {notification.notification_text && (
          <div className="message-detail__organizer-message">
            <h3 className="message-detail__section-title">Сообщение от организатора:</h3>
            <p className="message-detail__organizer-text">{notification.notification_text}</p>
          </div>
        )}

        {/* Фото от организатора */}
        {notification.photo_urls && notification.photo_urls.length > 0 && (
          <div className="message-detail__photos-section">
            <h3 className="message-detail__section-title">Фотографии от организатора:</h3>
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
          Мы желаем Вам отлично провести время! После встречи не забудьте поставить оценку!
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
