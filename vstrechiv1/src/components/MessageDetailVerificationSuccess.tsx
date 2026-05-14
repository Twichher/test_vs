import { FiX, FiCheck } from 'react-icons/fi';
import './MessageDetailVerificationSuccess.css';

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

interface MessageDetailVerificationSuccessProps {
  notification: NotificationItem;
  onClose: () => void;
}

export default function MessageDetailVerificationSuccess({ notification, onClose }: MessageDetailVerificationSuccessProps) {
  const formattedSentDate = new Date(notification.sent_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="message-detail message-detail--verification-success">
      {/* Кнопка закрытия */}
      <button className="message-detail__close" onClick={onClose}>
        <FiX size={24} />
      </button>

      {/* Хедер с зелёным градиентом */}
      <div className="message-detail__header message-detail__header--success">
        <div className="message-detail__meta">
          <span className="message-detail__date">{formattedSentDate}</span>
          <span className="message-detail__separator">•</span>
          <span className="message-detail__type">{notification.notification_type}</span>
        </div>
      </div>

      {/* Разделитель */}
      <div className="message-detail__divider"></div>

      {/* Содержимое */}
      <div className="message-detail__content verification-success-content">
        <div className="verification-success-icon">
          <FiCheck size={64} />
        </div>
        <h2 className="verification-success-title">Поздравляем!</h2>
        <p className="verification-success-text">
          {notification.notification_text}
        </p>
      </div>
    </div>
  );
}
