import { useEffect, useState } from 'react';
import NavbarNoLogin from '../components/NavbarNoLogin';
import Footer from '../components/Footer';
import SupportModalWindow from '../components/SupportModalWindow';
import './FaqPage.css'
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';

interface FaqItem {
  question_id: number;
  question_text: string;
  question_answer: string;
}

const FaqPage: React.FC = () => {
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [openId, setOpenId] = useState<number | null>(null); // ← ID открытого вопроса
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [toastState, setToastState] = useState<'hidden' | 'visible' | 'exiting'>('hidden');
    const [toastMessage, setToastMessage] = useState('');
    const { isAuth } = useSelector((state: RootState) => state.auth);
  
    useEffect(() => {
      fetch('http://localhost:8000/faq')
        .then((res) => {
          if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
          return res.json();
        })
        .then((data: FaqItem[]) => {
          setFaqs(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }, []);
  
    const handleToggle = (id: number): void => {
      // Если кликнули на уже открытый — закрыть, иначе открыть новый
      setOpenId((prev) => (prev === id ? null : id));
    };
  
    return (
      <div className="faq-page">
        {isAuth ? <NavbarLogin /> : <NavbarNoLogin />}
        <main className="faq-content">
          {loading && <p className="faq-status">Загрузка...</p>}
          {error && <p className="faq-status faq-error">Ошибка: {error}</p>}
  
          {faqs.map((faq) => (
            <div
              className={`faq-item ${openId === faq.question_id ? 'faq-item--open' : ''}`}
              key={faq.question_id}
            >
              <button
                className="faq-question"
                onClick={() => handleToggle(faq.question_id)}
              >
                <span>{faq.question_text}</span>
                <span className={`faq-arrow ${openId === faq.question_id ? 'faq-arrow--up' : ''}`}>
                  &#8964;
                </span>
              </button>
  
              {openId === faq.question_id && (
                <div className="faq-answer">
                  <p>{faq.question_answer}</p>
                </div>
              )}
            </div>
          ))}
        </main>

        <p className="faq-support">
          Не нашли ответа или столкнулись с проблемами? Обратитесь в{' '}
          <button
            type="button"
            className="faq-support-link"
            onClick={(e) => {
              e.preventDefault();
              setIsSupportModalOpen(true);
            }}
          >
            поддержку
          </button>
        </p>

        <SupportModalWindow
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
          onSuccess={() => {
            setToastMessage('Заявка успешно отправлена. Мы ответим вам в ближайшее время.');
            setToastState('visible');
            setTimeout(() => {
              setToastState('exiting');
              setTimeout(() => {
                setToastState('hidden');
              }, 400);
            }, 4000);
          }}
        />

        {toastState !== 'hidden' && (
          <div className={`support-toast support-toast--${toastState}`}>
            <div className="support-toast-content">
              <span className="support-toast-icon">✓</span>
              <span className="support-toast-text">{toastMessage}</span>
            </div>
          </div>
        )}

        <Footer />
      </div>
    );
  };


export default FaqPage;
