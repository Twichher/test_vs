import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';
import NavbarNoLogin from '../components/NavbarNoLogin';
import NavBar from '../components/NavBar';
import ServiceItem from '../components/ServiceItem';
import Footer from '../components/Footer';
import './ShopPage.css';

interface Service {
  service_id: number;
  service_name: string;
  service_description: string | null;
  service_price: number;
}

const getColumns = () => {
  const w = window.innerWidth;
  if (w <= 480) return 1;
  if (w <= 768) return 2;
  if (w <= 1024) return 3;
  return 4;
};

const ShopPage: React.FC = () => {
  const { isAuth } = useSelector((state: RootState) => state.auth);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<number>(getColumns());

  useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/services')
      .then((res) => {
        if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
        return res.json();
      })
      .then((data: { services: Service[] }) => {
        setServices(data.services);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="shop-page">
      {isAuth ? <NavbarLogin /> : <NavbarNoLogin />}

      {isAuth && <NavBar />}

      <main className={`shop-page__content ${isAuth ? 'shop-page__content--with-nav' : ''}`}>
        <div className="shop-page__wrapper">
          {loading && <p className="shop-page__status">Загрузка...</p>}
          {error && <p className="shop-page__status shop-page__status--error">Ошибка: {error}</p>}

          {!loading && !error && services.length === 0 && (
            <p className="shop-page__status">Услуги пока недоступны</p>
          )}

          {!loading && !error && services.length > 0 && (
            <div className="shop-page__grid">
              {services.map((service, index) => (
                <ServiceItem
                  key={service.service_id}
                  service_id={service.service_id}
                  service_name={service.service_name}
                  service_description={service.service_description}
                  service_price={service.service_price}
                  style={{ animationDelay: `${Math.floor(index / columns) * 0.05}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShopPage;
