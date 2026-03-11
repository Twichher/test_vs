import { useEffect, useState } from 'react';
import NavbarNoLogin from '../components/NavbarNoLogin';
import Footer from '../components/Footer';
import './FaqPage.css'

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
        <NavbarNoLogin />
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
          <a href="/faq/support" className="faq-support-link">поддержку</a>
        </p>

        <Footer />
      </div>
    );
  };


export default FaqPage;
