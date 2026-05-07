import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import { useParams, useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import NavbarLogin from '../components/NavbarLogin';
import NavbarNoLogin from '../components/NavbarNoLogin';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './MoreOrderSupportPage.css';
import '../components/MessageDetail.css';

interface TicketDetail {
  ticket_id: number;
  requester_user_id: number;
  message_text: string;
  status: string;
  closed_by_admin_user_id: number | null;
  created_at_formatted: string;
  text_category: string;
  has_photos: boolean;
  requester_email: string;
  photo_urls: string[];
}

const MoreOrderSupportPage: React.FC = () => {
  const { ticket_id: ticketIdParam } = useParams<{ ticket_id: string }>();
  const navigate = useNavigate();
  const { isAuth, is_admin, user_id: currentUserId } = useSelector((state: RootState) => state.auth);
  const hasAccess = isAuth && is_admin;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Управление видимостью email и action-кнопок
  const [showEmail, setShowEmail] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);

  // Photo modal
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Toast
  const [toastState, setToastState] = useState<'hidden' | 'visible' | 'exiting'>('hidden');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const ticketId = Number(ticketIdParam);
  const isAssignedToMe = ticket?.closed_by_admin_user_id === currentUserId;

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastState('visible');
    setTimeout(() => {
      setToastState('exiting');
      setTimeout(() => setToastState('hidden'), 400);
    }, 3000);
  };

  useEffect(() => {
    if (!hasAccess || !ticketId) {
      setLoading(false);
      return;
    }

    const fetchTicket = async () => {
      try {
        const response = await fetch(`http://localhost:8000/support/tickets/${ticketId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Данной заявки нет');
          }
          if (response.status === 403) {
            throw new Error('Доступ запрещен');
          }
          throw new Error('Ошибка загрузки заявки');
        }

        const data: TicketDetail = await response.json();
        setTicket(data);

        // Инициализация видимости email и кнопок на основе загруженного статуса
        const assigned = data.closed_by_admin_user_id === currentUserId;
        if (data.status !== 'created' && assigned) {
          setShowEmail(true);
        }
        if (data.status === 'in_progress' && assigned) {
          setShowActionButtons(true);
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [hasAccess, ticketId, currentUserId]);

  // Закрытие модалки по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && photoModalOpen) {
        handleClosePhotoModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [photoModalOpen]);

  const handlePhotoClick = (url: string) => {
    setSelectedPhoto(url);
    setPhotoModalOpen(true);
  };

  const handleClosePhotoModal = () => {
    setPhotoModalOpen(false);
    setSelectedPhoto(null);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleAccept = async () => {
    if (!ticket || accepting || rejecting || resolving) return;
    setAccepting(true);
    try {
      // Ждём запрос И минимум 1 секунду (имитация реального сервиса)
      const [response] = await Promise.all([
        fetch(`http://localhost:8000/support/tickets/${ticket.ticket_id}/accept`, {
          method: 'PUT',
          credentials: 'include',
        }),
        delay(1000),
      ]);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Ошибка при принятии заявки');
      }

      // Обновляем локальный стейт
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: 'in_progress',
              closed_by_admin_user_id: currentUserId ?? null,
            }
          : null
      );
      setShowEmail(true);

      // Через 3 секунды показываем action-кнопки
      setTimeout(() => {
        setShowActionButtons(true);
      }, 3000);

      showToast('Вы успешно приняли заявку', 'success');
      setAccepting(false);
    } catch (err: any) {
      showToast('Произошла ошибка. Повторите попытку позже', 'error');
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!ticket || accepting || rejecting || resolving) return;
    setRejecting(true);
    try {
      const response = await fetch(`http://localhost:8000/support/tickets/${ticket.ticket_id}/reject`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Ошибка при отказе от заявки');
      }

      showToast('Вы отказались от заявки', 'info');
      setTimeout(() => navigate('/support'), 1500);
    } catch (err: any) {
      showToast('Произошла ошибка. Повторите попытку позже', 'error');
      setRejecting(false);
    }
  };

  const handleResolve = async () => {
    if (!ticket || accepting || rejecting || resolving) return;
    setResolving(true);
    try {
      const response = await fetch(`http://localhost:8000/support/tickets/${ticket.ticket_id}/resolve`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Ошибка при завершении заявки');
      }

      showToast('Вы успешно завершили заявку!', 'success');
      setTimeout(() => navigate('/support'), 1500);
    } catch (err: any) {
      showToast('Произошла ошибка. Повторите попытку позже', 'error');
      setResolving(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="support-detail-page">
        {isAuth ? <NavbarLogin /> : <NavbarNoLogin />}
        <div className="support-detail-page__body">
          <NavBar />
          <main className="support-detail-page__main">
            <div className="support-detail-page__forbidden">Доступ к странице запрещен</div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="support-detail-page">
      {isAuth ? <NavbarLogin /> : <NavbarNoLogin />}

      <div className="support-detail-page__body">
        <NavBar />

        <main className="support-detail-page__main">
          {loading ? (
            <div className="support-detail-page__loading">Загрузка заявки...</div>
          ) : error ? (
            <div className="support-detail-page__error">{error}</div>
          ) : ticket ? (
            <div className="support-detail-card">
              {/* Шапка */}
              <div className="support-detail-card__header">
                <p className="support-detail-card__row">
                  <span className="support-detail-card__label">Обращение №</span>
                  <span className="support-detail-card__value">{ticket.ticket_id}</span>
                </p>
                <p className="support-detail-card__row">
                  <span className="support-detail-card__label">Категория: </span>
                  <span className="support-detail-card__value">{ticket.text_category}</span>
                </p>
                <p className="support-detail-card__row">
                  <span className="support-detail-card__label">Дата обращения: </span>
                  <span className="support-detail-card__value">{ticket.created_at_formatted}</span>
                </p>
                <p className="support-detail-card__row">
                  <span className="support-detail-card__label">Медиафайлы: </span>
                  <span className="support-detail-card__value">
                    {ticket.has_photos ? 'Есть' : 'Отсутствует'}
                  </span>
                </p>
              </div>

              <div className="support-detail-card__divider" />

              {/* Текст обращения */}
              <div className="support-detail-card__message">
                <p className="support-detail-card__message-text">{ticket.message_text}</p>
              </div>

              {/* Фото */}
              {ticket.photo_urls.length > 0 && (
                <div className="support-detail-card__photos">
                  <h3 className="support-detail-card__photos-title">Медиафайлы:</h3>
                  <div className="support-detail-card__photos-grid">
                    {ticket.photo_urls.map((url, index) => (
                      <div
                        key={index}
                        className="support-detail-photo-thumb"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handlePhotoClick(url);
                        }}
                      >
                        <img src={url} alt={`Фото ${index + 1}`} draggable={false} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email для связи */}
              <div className={`support-detail-email ${showEmail ? 'support-detail-email--visible' : ''}`}>
                <p className="support-detail-card__row">
                  <span className="support-detail-card__label">Почта для связи: </span>
                  <span className="support-detail-card__value">{ticket.requester_email}</span>
                </p>
              </div>

              {/* Кнопки действий */}
              <div className="support-detail-actions">
                {ticket.status === 'created' && (
                  <button
                    className="support-detail-card__accept-btn"
                    onClick={handleAccept}
                    disabled={accepting || rejecting || resolving}
                  >
                    {accepting ? 'Принимаем...' : 'Принять'}
                  </button>
                )}

                <div
                  className={`support-detail-actions__secondary ${showActionButtons ? 'support-detail-actions__secondary--visible' : ''}`}
                >
                  <button
                    className="support-detail-card__reject-btn"
                    onClick={handleReject}
                    disabled={accepting || rejecting || resolving}
                  >
                    {rejecting ? 'Отклоняем...' : 'Отказаться'}
                  </button>
                  <button
                    className="support-detail-card__resolve-btn"
                    onClick={handleResolve}
                    disabled={accepting || rejecting || resolving}
                  >
                    {resolving ? 'Завершаем...' : 'Завершить'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="support-detail-page__error">Данной заявки нет</div>
          )}
        </main>
      </div>

      <Footer />

      {/* Toast уведомление */}
      {toastState !== 'hidden' && (
        <div className={`support-detail-toast support-detail-toast--${toastState} support-detail-toast--${toastType}`}>
          <div className="support-detail-toast__content">
            <span className="support-detail-toast__icon">
              {toastType === 'success' ? '✓' : toastType === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className="support-detail-toast__text">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Модалка просмотра фото */}
      {photoModalOpen && selectedPhoto && (
        <div className="photo-modal-overlay" onClick={handleClosePhotoModal}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal__close" onClick={handleClosePhotoModal}>
              <FiX size={24} />
            </button>

            <div className="photo-modal__thumbnails">
              {ticket?.photo_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`photo-${index}`}
                  className={`photo-modal__thumb ${selectedPhoto === url ? 'photo-modal__thumb--active' : ''}`}
                  onClick={() => setSelectedPhoto(url)}
                  draggable={false}
                />
              ))}
            </div>

            <div className="photo-modal__main">
              <img src={selectedPhoto} alt="selected" className="photo-modal__main-img" draggable={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoreOrderSupportPage;
