import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <h1>Встречай. Общайся. Дружи.</h1>
      <p>Люди из самых разных сфер жизни собираются в одном месте, чтобы познакомиться, обсудить интересные темы и отлично провести время.</p>
      <button className="cta-button" onClick={() => navigate('/registration')}>
        Начать общаться!
      </button>
    </section>  
  );
};

export default HeroSection;
