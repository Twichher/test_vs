import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import './ServicePurchaseModal.css';

interface ServicePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  service_name: string;
  service_description: string | null;
  service_price: number;
  isPurchasing: boolean;
  error: string | null;
  isOrganizer: boolean;
}

const ServicePurchaseModal: React.FC<ServicePurchaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  service_name,
  service_description,
  service_price,
  isPurchasing,
  error,
  isOrganizer,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen && !isClosing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing]);

  // Отслеживаем изменение isOpen с true → false для анимации закрытия
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      // Родитель закрыл модалку — даём 300ms на анимацию, потом убираем из DOM
      const timer = setTimeout(() => {
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    if (isOpen) {
      setIsClosing(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    if (isClosing || isPurchasing) return;
    setIsClosing(true);
    onClose();
  };

  const confirmDisabled = isPurchasing || isOrganizer;

  return (
    <div className={`service-purchase-overlay ${isClosing ? 'service-purchase-overlay--closing' : ''}`} onClick={handleClose}>
      <div className={`service-purchase-modal ${isClosing ? 'service-purchase-modal--closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="service-purchase-close" onClick={handleClose} disabled={isPurchasing}>
          <FiX size={24} />
        </button>

        <h2 className="service-purchase-title">
          Покупка услуги &quot;{service_name}&quot;
        </h2>

        <div className="service-purchase-info">
          <div className="service-purchase-row">
            <span className="service-purchase-label">Описание</span>
            <span className="service-purchase-value">
              {service_description || '—'}
            </span>
          </div>

          <div className="service-purchase-row">
            <span className="service-purchase-label">Цена</span>
            <span className="service-purchase-value service-purchase-value--price">
              {Math.round(service_price)} руб
            </span>
          </div>
        </div>

        {isOrganizer && (
          <p className="service-purchase-hint">
            Вы уже являетесь организатором
          </p>
        )}

        {error && (
          <p className="service-purchase-error">{error}</p>
        )}

        <div className="service-purchase-buttons">
          <button
            className="service-purchase-btn service-purchase-btn--confirm"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {isPurchasing ? 'Обработка...' : 'Подтвердить'}
          </button>
          <button
            className="service-purchase-btn service-purchase-btn--cancel"
            onClick={handleClose}
            disabled={isPurchasing}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicePurchaseModal;
