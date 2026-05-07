import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';
import NavbarNoLogin from '../components/NavbarNoLogin';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import SupportOrderComponent from '../components/SupportOrderComponent';
import './SupportAdminPage.css';

interface SupportTicket {
  ticket_id: number;
  requester_user_id: number;
  message_text: string;
  status: string;
  created_at_formatted: string;
  text_category: string;
  has_photos: boolean;
}

type TabType = 'new' | 'in-progress' | 'resolved';

const POLLING_INTERVAL = 60000;

const TAB_CONFIG: Record<TabType, { label: string; endpoint: string; emptyMsg: string }> = {
  new: {
    label: 'Новые',
    endpoint: '/support/tickets/new',
    emptyMsg: 'Нет новых обращений',
  },
  'in-progress': {
    label: 'Принятые',
    endpoint: '/support/tickets/in-progress',
    emptyMsg: 'Нет принятых обращений',
  },
  resolved: {
    label: 'Завершенные',
    endpoint: '/support/tickets/resolved',
    emptyMsg: 'Нет завершенных обращений',
  },
};

const SupportAdminPage: React.FC = () => {
  const { isAuth, is_admin } = useSelector((state: RootState) => state.auth);
  const hasAccess = isAuth && is_admin;

  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevTicketIdsRef = useRef<Set<number>>(new Set());

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:8000${TAB_CONFIG[activeTab].endpoint}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Доступ запрещен');
        }
        throw new Error('Ошибка загрузки обращений');
      }

      const data = await response.json();
      const newTickets: SupportTicket[] = data.tickets || [];

      // Умный polling: сравниваем набор ticket_id только для вкладки "Новые"
      if (activeTab === 'new') {
        const newIds = new Set(newTickets.map((t: SupportTicket) => t.ticket_id));
        const prevIds = prevTicketIdsRef.current;

        const hasChanges =
          newIds.size !== prevIds.size ||
          [...newIds].some((id) => !prevIds.has(id)) ||
          [...prevIds].some((id) => !newIds.has(id));

        if (hasChanges) {
          setTickets(newTickets);
          prevTicketIdsRef.current = newIds;
        }
      } else {
        setTickets(newTickets);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    // Сбрасываем стейт при смене вкладки
    setTickets([]);
    setLoading(true);
    prevTicketIdsRef.current = new Set();

    // Первоначальная загрузка
    fetchTickets();

    // Polling только для вкладки "Новые"
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (activeTab === 'new') {
      intervalId = setInterval(fetchTickets, POLLING_INTERVAL);
    }

    // Обновляем при возвращении на вкладку
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTickets();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasAccess, activeTab, fetchTickets]);

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  return (
    <div className="support-admin-page">
      {isAuth ? <NavbarLogin /> : <NavbarNoLogin />}

      <div className="support-admin-page__body">
        <NavBar />

        <main className="support-admin-page__main">
          {!hasAccess ? (
            <div className="support-admin-page__forbidden">
              Доступ к странице запрещен
            </div>
          ) : (
            <div className="support-admin-page__content">
              <h1 className="support-admin-page__title">
                Обращения в поддержку
              </h1>

              <div className="support-admin-page__tabs">
                <button
                  className={`support-tab-btn support-tab-btn--new ${activeTab === 'new' ? 'support-tab-btn--active' : ''}`}
                  onClick={() => handleTabChange('new')}
                >
                  Новые
                </button>
                <button
                  className={`support-tab-btn support-tab-btn--in-progress ${activeTab === 'in-progress' ? 'support-tab-btn--active' : ''}`}
                  onClick={() => handleTabChange('in-progress')}
                >
                  Принятые
                </button>
                <button
                  className={`support-tab-btn support-tab-btn--resolved ${activeTab === 'resolved' ? 'support-tab-btn--active' : ''}`}
                  onClick={() => handleTabChange('resolved')}
                >
                  Завершенные
                </button>
              </div>

              {loading && tickets.length === 0 ? (
                <div className="support-admin-page__loading">
                  Загрузка обращений...
                </div>
              ) : error ? (
                <div className="support-admin-page__error">{error}</div>
              ) : tickets.length === 0 ? (
                <div className="support-admin-page__empty">
                  {TAB_CONFIG[activeTab].emptyMsg}
                </div>
              ) : (
                <div className="support-admin-page__grid">
                  {tickets.map((ticket, index) => (
                    <SupportOrderComponent
                      key={ticket.ticket_id}
                      ticket_id={ticket.ticket_id}
                      text_category={ticket.text_category}
                      created_at_formatted={ticket.created_at_formatted}
                      has_photos={ticket.has_photos}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default SupportAdminPage;
