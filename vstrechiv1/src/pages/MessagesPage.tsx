import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import MessageDetailUserRegMeetings from '../components/MessageDetailUserRegMeetings';
import MessageDetailUserCancelMeeting from '../components/MessageDetailUserCancelMeeting';
import MessageDetailOrganizerCancelMeeting from '../components/MessageDetailOrganizerCancelMeeting';
import MessageDetailMeetinCanceledByOrganizer from '../components/MessageDetailMeetinCanceledByOrganizer';
import MessageDetailOrganizerFinishedMeet from '../components/MessageDetailOrganizerFinishedMeet';
import MessageDetailOrganizerCreatedMeeting from '../components/MessageDetailOrganizerCreatedMeeting';
import MessageDetailUserRateMeetNUsers from '../components/MessageDetailUserRateMeetNUsers';
import './MessagesPage.css';

interface NotificationItem {
  record_id: number;
  notification_id: number;
  user_id: number;
  notification_type: string;
  sent_at: string;
  status: 'read' | 'unread';
  israted?: number; // 0 - не оценено, 1 - оценено (для уведомлений с оценкой)
  meeting_id: number | null;
  meeting_title: string | null;
  meeting_start_at: string | null;
  meeting_end_at: string | null;
  meeting_address: string | null;
  meeting_max_people: number | null;
  meeting_district: string | null;
  meeting_adults_only: boolean | null;
  meeting_description: string | null;
  notification_text: string;
  photo_urls: string[];
}

// Компонент кнопки уведомления
interface NotificationButtonProps {
  notification: NotificationItem;
  isSelected: boolean;
  onClick: () => void;
}

function NotificationButton({ notification, isSelected, onClick }: NotificationButtonProps) {
  const formattedDate = new Date(notification.sent_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isMeetingType = notification.notification_type === 'Встреча';
  const isCanceledType = notification.notification_type === 'вы отменили';
  const isOrganizerCanceledType = notification.notification_type === 'организатор отменил';
  const isMeetingCanceledByOrganizerType = notification.notification_type === 'встреча отменена организатором';
  const isMeetingFinishedType = notification.notification_type === 'завершение встречи для организатора';
  const isRateMeetingType = notification.notification_type === 'оценка встречи';

  return (
    <button
      className={`notification-button ${notification.status === 'unread' ? 'notification-button--unread' : 'notification-button--read'} ${isMeetingType ? 'notification-button--meeting' : ''} ${isCanceledType ? 'notification-button--canceled' : ''} ${isOrganizerCanceledType || isMeetingCanceledByOrganizerType ? 'notification-button--black' : ''} ${isMeetingFinishedType ? 'notification-button--blue' : ''} ${isRateMeetingType ? 'notification-button--purple' : ''} ${isSelected ? 'notification-button--selected' : ''}`}
      onClick={onClick}
    >
      <div className="notification-button__type">{notification.notification_type}</div>
      {notification.meeting_title && (
        <div className="notification-button__title">{notification.meeting_title}</div>
      )}
      <div className="notification-button__date">{formattedDate}</div>
      {notification.status === 'unread' && <div className="notification-button__glow"></div>}
    </button>
  );
}

// Фабрика компонентов для отображения разных типов сообщений
function MessageDetailFactory({ 
  notification, 
  onClose,
  onRateSuccess,
}: { 
  notification: NotificationItem; 
  onClose: () => void;
  onRateSuccess?: (record_id: number) => void;
}) {
  // Выбираем компонент в зависимости от типа уведомления
  switch (notification.notification_type) {
    case 'Встреча':
      return <MessageDetailUserRegMeetings notification={notification} onClose={onClose} />;
    case 'вы отменили':
      return <MessageDetailUserCancelMeeting notification={notification} onClose={onClose} />;
    case 'организатор отменил':
      return <MessageDetailOrganizerCancelMeeting notification={notification} onClose={onClose} />;
    case 'встреча отменена организатором':
      return <MessageDetailMeetinCanceledByOrganizer notification={notification} onClose={onClose} />;
    case 'завершение встречи для организатора':
      return <MessageDetailOrganizerFinishedMeet notification={notification} onClose={onClose} onRateSuccess={onRateSuccess} />;
    case 'создание встречи':
      return <MessageDetailOrganizerCreatedMeeting notification={notification} onClose={onClose} />;
    case 'оценка встречи':
      return <MessageDetailUserRateMeetNUsers notification={notification} onClose={onClose} onRateSuccess={onRateSuccess} />;
    default:
      // Для остальных типов используем базовый компонент регистрации
      return <MessageDetailUserRegMeetings notification={notification} onClose={onClose} />;
  }
}

export default function MessagesPage() {
  const { user_id, isAuth } = useSelector((state: RootState) => state.auth);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageVisible, setPageVisible] = useState(false);

  // Обновляем israted в уведомлении после успешной оценки участников
  const handleRateSuccess = (record_id: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.record_id === record_id ? { ...n, israted: 1 } : n
      )
    );
    setSelectedNotification((prev) =>
      prev && prev.record_id === record_id ? { ...prev, israted: 1 } : prev
    );
  };

  // Плавное появление страницы
  useEffect(() => {
    const timer = setTimeout(() => setPageVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Загрузка уведомлений
  useEffect(() => {
    if (!user_id) return;

    setIsLoading(true);
    fetch(`http://localhost:8000/users/${user_id}/notifications`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: NotificationItem[]) => {
        setNotifications(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading notifications:', error);
        setIsLoading(false);
      });
  }, [user_id]);

  if (!isAuth) {
    return (
      <div className="messages-page">
        <NavbarLogin />
        <NavBar onChange={() => {}} />
        <main className="messages-page__content">
          <div className="messages-page__login-required">
            <p>Войдите в аккаунт, чтобы просматривать сообщения</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`messages-page ${pageVisible ? 'messages-page--visible' : ''}`}>
      <NavbarLogin />
      <NavBar onChange={() => {}} />

      <main className="messages-page__content">
        {/* Сайдбар со списком уведомлений (30% ширины) */}
        <aside className={`messages-sidebar ${selectedNotification ? 'messages-sidebar--hidden-mobile' : ''}`}>
          <div className="messages-sidebar__header">
            <h2 className="messages-sidebar__title">Сообщения</h2>
            {notifications.filter(n => n.status === 'unread').length > 0 && (
              <span className="messages-sidebar__unread-count">
                {notifications.filter(n => n.status === 'unread').length}
              </span>
            )}
          </div>
          
          <div className="messages-sidebar__list">
            {isLoading ? (
              <div className="messages-sidebar__loading">
                <div className="messages-loading-spinner"></div>
                <p>Загрузка...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="messages-sidebar__empty">
                <p>Нет сообщений</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationButton
                  key={notification.record_id}
                  notification={notification}
                  isSelected={selectedNotification?.record_id === notification.record_id}
                  onClick={() => {
                    // Если уведомление непрочитанное, отмечаем его как прочитанное
                    if (notification.status === 'unread') {
                      fetch(`http://localhost:8000/notifications/${notification.record_id}/read`, {
                        method: 'PUT',
                        credentials: 'include',
                      })
                        .then((res) => {
                          if (res.ok) {
                            // Обновляем локальное состояние
                            setNotifications((prev) =>
                              prev.map((n) =>
                                n.record_id === notification.record_id ? { ...n, status: 'read' } : n
                              )
                            );
                            setSelectedNotification({ ...notification, status: 'read' });
                          } else {
                            setSelectedNotification(notification);
                          }
                        })
                        .catch(() => setSelectedNotification(notification));
                    } else {
                      setSelectedNotification(notification);
                    }
                  }}
                />
              ))
            )}
          </div>
        </aside>

        {/* Основная область для отображения сообщения (70% ширины) */}
        <section className={`messages-content ${selectedNotification ? 'messages-content--active' : ''}`}>
          {selectedNotification ? (
            <MessageDetailFactory
              notification={selectedNotification}
              onClose={() => setSelectedNotification(null)}
              onRateSuccess={handleRateSuccess}
            />
          ) : (
            <div className="message-detail--empty">
              <p>Выберите сообщение для просмотра</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
