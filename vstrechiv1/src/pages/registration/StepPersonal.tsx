import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../../slices/authSlice';
import LoginModal from '../LoginModal';
import './StepPersonal.css';

interface StepPersonalProps {
  onComplete: () => void;
}

const MONTHS = [
  { value: '01', label: 'Январь' },
  { value: '02', label: 'Февраль' },
  { value: '03', label: 'Март' },
  { value: '04', label: 'Апрель' },
  { value: '05', label: 'Май' },
  { value: '06', label: 'Июнь' },
  { value: '07', label: 'Июль' },
  { value: '08', label: 'Август' },
  { value: '09', label: 'Сентябрь' },
  { value: '10', label: 'Октябрь' },
  { value: '11', label: 'Ноябрь' },
  { value: '12', label: 'Декабрь' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => String(CURRENT_YEAR - i));

interface FormData {
  last_name: string;
  first_name: string;
  middle_name: string;
  day: string;
  month: string;
  year: string;
  gender: string;
  email: string;
  password: string;
  confirm_password: string;
}

const EMPTY_FORM: FormData = {
  last_name: '',
  first_name: '',
  middle_name: '',
  day: '',
  month: '',
  year: '',
  gender: '',
  email: '',
  password: '',
  confirm_password: '',
};

const StepPersonal: React.FC<StepPersonalProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.last_name.trim()) newErrors.last_name = 'Введите фамилию';
    if (!form.first_name.trim()) newErrors.first_name = 'Введите имя';
    if (!form.day) newErrors.day = 'Выберите день';
    if (!form.month) newErrors.month = 'Выберите месяц';
    if (!form.year) newErrors.year = 'Выберите год';
    if (!form.gender) newErrors.gender = 'Выберите пол';

    if (!form.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Неверный формат email';
    }

    if (!form.password) {
      newErrors.password = 'Введите пароль';
    } else if (form.password.length < 6) {
      newErrors.password = 'Минимум 6 символов';
    }

    if (form.password !== form.confirm_password) {
      newErrors.confirm_password = 'Пароли не совпадают';
    }

    if (form.day && form.month && form.year) {
      const dateStr = `${form.year}-${form.month}-${form.day}`;
      const date = new Date(dateStr);
      if (
        isNaN(date.getTime()) ||
        date.getDate() !== parseInt(form.day) ||
        date.getMonth() + 1 !== parseInt(form.month)
      ) {
        newErrors.day = 'Неверная дата';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.submit;
      return updated;
    });

    try {
      // Проверяем существование домена email перед регистрацией
      const checkResponse = await fetch(
        `http://localhost:8000/check-email?email=${encodeURIComponent(form.email.trim())}`,
        { credentials: 'include' }
      );
      const checkData = await checkResponse.json();

      if (!checkData.valid) {
        setErrors({ submit: 'Данной почты не существует' });
        setIsSubmitting(false);
        return;
      }

      const birthDate = `${form.year}-${form.month}-${form.day}`;
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          middle_name: form.middle_name.trim() || null,
          email: form.email.trim(),
          password: form.password,
          confirm_password: form.confirm_password,
          birth_date: birthDate,
          gender: form.gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка регистрации');
      }

      dispatch(setUser(data));
      onComplete();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Произошла ошибка. Попробуйте позже.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="step-personal">
      <h1 className="step-personal__title">
        Создаем тебе аккаунт для входа в сообщество, где тебе все рады!
      </h1>

      <form className="step-personal__form" onSubmit={handleSubmit} noValidate>
        <div className="step-personal__field">
          <label className="step-personal__label">Фамилия</label>
          <input
            type="text"
            className={`step-personal__input ${errors.last_name ? 'error' : ''}`}
            placeholder="Иванов"
            value={form.last_name}
            onChange={(e) => updateField('last_name', e.target.value)}
          />
          {errors.last_name && <span className="step-personal__error">{errors.last_name}</span>}
        </div>

        <div className="step-personal__field">
          <label className="step-personal__label">Имя</label>
          <input
            type="text"
            className={`step-personal__input ${errors.first_name ? 'error' : ''}`}
            placeholder="Иван"
            value={form.first_name}
            onChange={(e) => updateField('first_name', e.target.value)}
          />
          {errors.first_name && <span className="step-personal__error">{errors.first_name}</span>}
        </div>

        <div className="step-personal__field">
          <label className="step-personal__label">Отчество</label>
          <input
            type="text"
            className="step-personal__input"
            placeholder="Иванович"
            value={form.middle_name}
            onChange={(e) => updateField('middle_name', e.target.value)}
          />
        </div>

        <div className="step-personal__field">
          <label className="step-personal__label">Дата рождения</label>
          <div className="step-personal__birth-row">
            <select
              className={`step-personal__select ${errors.day ? 'error' : ''}`}
              value={form.day}
              onChange={(e) => updateField('day', e.target.value)}
            >
              <option value="">ДД</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              className={`step-personal__select ${errors.month ? 'error' : ''}`}
              value={form.month}
              onChange={(e) => updateField('month', e.target.value)}
            >
              <option value="">Месяц</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              className={`step-personal__select ${errors.year ? 'error' : ''}`}
              value={form.year}
              onChange={(e) => updateField('year', e.target.value)}
            >
              <option value="">Год</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {(errors.day || errors.month || errors.year) && (
            <span className="step-personal__error">
              {errors.day || errors.month || errors.year}
            </span>
          )}
        </div>

        <div className="step-personal__field">
          <label className="step-personal__label">Пол</label>
          <select
            className={`step-personal__select step-personal__select--full ${errors.gender ? 'error' : ''}`}
            value={form.gender}
            onChange={(e) => updateField('gender', e.target.value)}
          >
            <option value="">Выберите пол</option>
            <option value="M">Мужской</option>
            <option value="F">Женский</option>
          </select>
          {errors.gender && <span className="step-personal__error">{errors.gender}</span>}
        </div>

        <div className="step-personal__field">
          <label className="step-personal__label">Почта</label>
          <input
            type="email"
            className={`step-personal__input ${errors.email ? 'error' : ''}`}
            placeholder="example@mail.ru"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            autoComplete="email"
          />
          {errors.email && <span className="step-personal__error">{errors.email}</span>}
        </div>

        <div className="step-personal__field">
          <label className="step-personal__label">Пароль</label>
          <input
            type="password"
            className={`step-personal__input ${errors.password ? 'error' : ''}`}
            placeholder="••••••"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            autoComplete="new-password"
          />
          {errors.password && <span className="step-personal__error">{errors.password}</span>}
        </div>

        <div className="step-personal__field">
          <label className="step-personal__label">Повторить пароль</label>
          <input
            type="password"
            className={`step-personal__input ${errors.confirm_password ? 'error' : ''}`}
            placeholder="••••••"
            value={form.confirm_password}
            onChange={(e) => updateField('confirm_password', e.target.value)}
            autoComplete="new-password"
          />
          {errors.confirm_password && (
            <span className="step-personal__error">{errors.confirm_password}</span>
          )}
        </div>

        <button
          type="submit"
          className="step-personal__button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Создаем аккаунт...' : 'Далее'}
        </button>

        {errors.submit && (
          <div className="step-personal__submit-error">{errors.submit}</div>
        )}

        <p className="step-personal__login-text">
          Есть аккаунт?{' '}
          <button
            type="button"
            className="step-personal__login-link"
            onClick={() => setIsLoginOpen(true)}
          >
            Войдите!
          </button>
        </p>
      </form>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
    </div>
  );
};

export default StepPersonal;
