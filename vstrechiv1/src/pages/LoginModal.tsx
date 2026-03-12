import { useState } from 'react';
import type { AppDispatch } from '../slices/store';
import './LoginModal.css';
import { useDispatch } from 'react-redux';
import { setUser } from '../slices/authSlice';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [email_user, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('')

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
  
    fetch('http://localhost:8000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_user, password }),
      credentials: 'include',
    })
      .then((res) => {
        if (res.status === 401) throw new Error('Неверный email или пароль');
        if (res.status === 403) throw new Error('Аккаунт заблокирован');
        if (!res.ok) throw new Error('Ошибка сервера');
        return res.json();
      })
      .then((data) => {
        dispatch(setUser(data));
        onClose();
        navigate('/');
      })
      .catch((err) => {
        setError(err.message); // показать ошибку пользователю
      });;
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 className="modal-title">Вход</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            className="modal-input"
            type="email"
            placeholder="Email adress"
            value={email_user}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="modal-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* ← показывать ошибку только если она есть */}
          {error && <p className="modal-error">{error}</p>}

          <button className="modal-submit" type="submit">Войти</button>
        </form>

        <p className="modal-register">
          Нет аккаунта?{' '}
          <a href="/register" className="modal-register-link">Создайте!</a>
        </p>

      </div>
    </div>
  );

};

export default LoginModal;
