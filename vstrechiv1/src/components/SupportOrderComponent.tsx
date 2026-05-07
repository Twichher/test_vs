import './SupportOrderComponent.css';
import { useNavigate } from 'react-router-dom';

interface SupportOrderProps {
  ticket_id: number;
  text_category: string;
  created_at_formatted: string;
  has_photos: boolean;
  index: number;
}

const SupportOrderComponent: React.FC<SupportOrderProps> = ({
  ticket_id,
  text_category,
  created_at_formatted,
  has_photos,
  index,
}) => {
  const navigate = useNavigate();

  const handleDetailsClick = () => {
    navigate(`/support/${ticket_id}`, {
      state: {
        ticket_id,
        text_category,
        created_at_formatted,
        has_photos,
      },
    });
  };

  return (
    <div
      className="support-order-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="support-order-card__content">
        <p className="support-order-card__row">
          <span className="support-order-card__label">Обращение №</span>
          <span className="support-order-card__value">{ticket_id}</span>
        </p>
        <p className="support-order-card__row">
          <span className="support-order-card__label">Категория: </span>
          <span className="support-order-card__value">{text_category}</span>
        </p>
        <p className="support-order-card__row">
          <span className="support-order-card__label">Дата обращения: </span>
          <span className="support-order-card__value">{created_at_formatted}</span>
        </p>
        <p className="support-order-card__row">
          <span className="support-order-card__label">Медиафайлы: </span>
          <span className="support-order-card__value">
            {has_photos ? 'Есть' : 'Отсутствует'}
          </span>
        </p>
      </div>
      <button className="support-order-card__button" onClick={handleDetailsClick}>
        Подробнее
      </button>
    </div>
  );
};

export default SupportOrderComponent;
