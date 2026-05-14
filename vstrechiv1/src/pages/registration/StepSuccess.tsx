import { useNavigate } from 'react-router-dom';
import ProfileCard from '../../components/ProfileCard';
import './StepSuccess.css';

const StepSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="step-success">
      <h1 className="step-success__title">
        Вот и всё! Твоя регистрация в сообществе завершена!
      </h1>

      <div className="step-success__gift">
        <span className="step-success__gift-emoji">🎁</span>
        <span className="step-success__gift-text">3 встречи в подарок</span>
      </div>

      <div className="step-success__card-wrapper">
        <ProfileCard />
      </div>

      <button
        type="button"
        className="step-success__button"
        onClick={() => navigate('/')}
      >
        Завершить
      </button>
    </div>
  );
};

export default StepSuccess;
