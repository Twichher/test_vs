import { FiX } from 'react-icons/fi';
import './MessageDetail.css';

interface NotificationItem {
  record_id: number;
  notification_id: number;
  user_id: number;
  notification_type: string;
  sent_at: string;
  status: 'read' | 'unread';
  meeting_title: string | null;
  meeting_start_at: string | null;
  meeting_end_at: string | null;
  notification_text: string;
  photo_urls: string[];
}

interface MessageDetailUserCancelMeetingProps {
  notification: NotificationItem;
  onClose: () => void;
}

export default function MessageDetailUserCancelMeeting({ notification, onClose }: MessageDetailUserCancelMeetingProps) {
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

  // Формируем текст сообщения об отмене
  const messageText = notification.meeting_title
    ? `Вы отменили встречу "${notification.meeting_title}", которая должна была пройти с ${startDate} по ${endDate}. Мы сожалеем что вы не сможете посетить эту встречу.`
    : 'Вы отменили запись на встречу. Мы сожалеем что вы не сможете посетить эту встречу.';

  return (
    <div className="message-detail">
      {/* Кнопка закрытия */}
      <button className="message-detail__close" onClick={onClose}>
        <FiX size={24} />
      </button>

      {/* Хедер с красным переливающимся градиентом */}
      <div className="message-detail__header message-detail__header--canceled">
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
