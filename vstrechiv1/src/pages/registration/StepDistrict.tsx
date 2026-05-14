import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../slices/store';
import { updateUserProfile } from '../../slices/authSlice';
import './StepDistrict.css';

interface District {
  code: string;
  name: string;
}

interface StepDistrictProps {
  onComplete: () => void;
}

const StepDistrict: React.FC<StepDistrictProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.auth.user_id);

  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [skipDistrict, setSkipDistrict] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load districts list
  useEffect(() => {
    fetch('http://localhost:8000/districts')
      .then((res) => res.json())
      .then((data: District[]) => setDistricts(data))
      .catch(() => setError('Не удалось загрузить список районов'));
  }, []);

  const handleSelectDistrict = (code: string) => {
    if (skipDistrict) return;
    setSelectedDistrict((prev) => (prev === code ? null : code));
    setError('');
  };

  const handleSkipChange = () => {
    setSkipDistrict((prev) => {
      const next = !prev;
      if (next) {
        setSelectedDistrict(null);
      }
      return next;
    });
    setError('');
  };

  const handleSubmit = async () => {
    if (!skipDistrict && !selectedDistrict) {
      setError('Выберите район или отметьте "Не буду указывать район"');
      return;
    }

    // If skipping district — just go next without API call
    if (skipDistrict) {
      onComplete();
      return;
    }

    if (!userId || !selectedDistrict) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/users/${userId}/district`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ district: selectedDistrict }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка сохранения района');
      }

      // Update Redux with new district
      dispatch(updateUserProfile({ district: selectedDistrict }));
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-district">
      <h1 className="step-district__title">
        Создаем тебе аккаунт для входа в сообщество, где тебе все рады!
      </h1>

      {/* Selected district display */}
      {selectedDistrict && !skipDistrict && (
        <div className="step-district__selected">
          <span className="step-district__selected-label">Выбранный район:</span>
          <span className="step-district__selected-value">{selectedDistrict}</span>
          <button
            className="step-district__selected-clear"
            onClick={() => setSelectedDistrict(null)}
            title="Снять выбор"
          >
            ✕
          </button>
        </div>
      )}

      {/* Districts grid */}
      <div className={`step-district__grid ${skipDistrict ? 'disabled' : ''}`}>
        {districts.map((d) => (
          <button
            key={d.code}
            type="button"
            className={`step-district__item ${selectedDistrict === d.code ? 'selected' : ''}`}
            onClick={() => handleSelectDistrict(d.code)}
            disabled={skipDistrict}
            title={d.name}
          >
            {d.code}
          </button>
        ))}
      </div>

      {/* Skip checkbox */}
      <label className="step-district__skip">
        <input
          type="checkbox"
          checked={skipDistrict}
          onChange={handleSkipChange}
        />
        <span>Не буду указывать район</span>
      </label>

      {/* Error */}
      {error && <div className="step-district__error">{error}</div>}

      {/* Next button */}
      <button
        type="button"
        className="step-district__button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Сохраняем...' : 'Далее'}
      </button>
    </div>
  );
};

export default StepDistrict;
