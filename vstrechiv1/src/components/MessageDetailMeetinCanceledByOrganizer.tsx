import { FiX } from 'react-icons/fi';
import './MessageDetail.css';
import type { NotificationItem } from '../types/notification';


interface MessageDetailMeetinCanceledByOrganizerProps {
  notification: NotificationItem;
  onClose: () => void;
}

export default function MessageDetailMeetinCanceledByOrganizer({ notification, onClose }: MessageDetailMeetinCanceledByOrganizerProps) {
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

  // Формируем текст сообщения из notification_text или генерируем
  const messageText = notification.notification_text || 
    (notification.meeting_title
      ? `Мы сожалеем, но встреча "${notification.meeting_title}", которая должна была пройти с ${startDate} по ${endDate}, была отменена организатором. Приносим извинений.`
      : 'Мы сожалеем, но встреча была отменена организатором. Приносим извинений.');

  return (
    <div className="message-detail">
      {/* Кнопка закрытия */}
      <button className="message-detail__close" onClick={onClose}>
        <FiX size={24} />
      </button>

      {/* Хедер с черным переливающимся градиентом */}
      <div className="message-detail__header message-detail__header--black">
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
      </div>
    </div>
  );
}
