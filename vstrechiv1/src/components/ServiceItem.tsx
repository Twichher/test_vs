import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../slices/store';
import { refreshUser } from '../slices/authSlice';
import './ServiceItem.css';
import ServicePurchaseModal from './ServicePurchaseModal';

export interface ServiceItemProps {
  service_id: number;
  service_name: string;
  service_description: string | null;
  service_price: number;
  style?: React.CSSProperties;
}

const ServiceItem: React.FC<ServiceItemProps> = ({
  service_id,
  service_name,
  service_description,
  service_price,
  style,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { is_organizer } = useSelector((state: RootState) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [toastState, setToastState] = useState<'hidden' | 'visible' | 'exiting'>('hidden');
  const [toastMessage, setToastMessage] = useState('');

  const isMeetingService = service_name.toLowerCase().includes('встреч');
  const isOrganizerRole = service_name === 'Роль организатора';

  const gradientClass = isOrganizerRole
    ? 'service-item--purple'
    : isMeetingService
    ? 'service-item--green'
    : 'service-item--default';

  const handleConfirmPurchase = async () => {
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const response = await fetch('http://localhost:8000/services/buy', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.detail || result.message || 'Ошибка при покупке');
      }

      // Имитация задержки 1 секунда
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Формируем сообщение toast
      const message =
        result.buy_type === 'role'
          ? `Покупка "${result.service_name}" успешно завершена. Ваша роль изменится в течении минуты. Спасибо!`
          : `Покупка "${result.service_name}" успешно завершена. Ваш баланс пополнится в течении минуты. Спасибо!`;

      setToastMessage(message);
      setToastState('visible');
      setIsModalOpen(false);

      // Обновляем данные пользователя
      dispatch(refreshUser());

      // Начинаем плавное исчезновение через 4 секунды
      setTimeout(() => {
        setToastState('exiting');
        // Убираем из DOM после завершения анимации (0.4s)
        setTimeout(() => {
          setToastState('hidden');
        }, 400);
      }, 4000);
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Ошибка при покупке');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <>
      <div className={`service-item ${gradientClass}`} style={style}>
        <div className="service-item__content">
          <h3 className="service-item__name">{service_name}</h3>
          <p className="service-item__price">{Math.round(service_price)} руб</p>
          <button
            className="service-item__buy-btn"
            onClick={() => {
              setPurchaseError(null);
              setIsModalOpen(true);
            }}
          >
            Купить
          </button>
        </div>
      </div>

      <ServicePurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPurchase}
        service_name={service_name}
        service_description={service_description}
        service_price={service_price}
        isPurchasing={isPurchasing}
        error={purchaseError}
        isOrganizer={isOrganizerRole && !!is_organizer}
      />

      {toastState !== 'hidden' && (
        <div className={`shop-toast shop-toast--${toastState}`}>
          <div className="shop-toast-content">
            <span className="shop-toast-icon">✓</span>
            <span className="shop-toast-text">{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceItem;
