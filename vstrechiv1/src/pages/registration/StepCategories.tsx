import { useState, useEffect } from 'react';
import './StepCategories.css';

interface Category {
  category_id: number;
  category_name: string;
  photo_url: string;
}

interface StepCategoriesProps {
  onComplete: () => void;
}

const DUMMY_PHOTO = 'http://127.0.0.1:9000/allphotos/no.jpg';

const EMOJI_MAP: Record<string, string> = {
  'спорт': '⚽',
  'гонки': '🏎️',
  'кино': '🎬',
  'музыка': '🎵',
  'настольные игры': '🎲',
  'видеоигры': '🎮',
  'путешествия': '✈️',
  'кулинария': '🍳',
  'фотография': '📷',
  'книги': '📚',
  'технологии': '💻',
  'бизнес': '💼',
  'языки': '🗣️',
  'танцы': '💃',
  'йога': '🧘',
};

const StepCategories: React.FC<StepCategoriesProps> = ({ onComplete }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/categories', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
      })
      .catch(() => setError('Не удалось загрузить категории'));
  }, []);

  const toggleCategory = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setError('');
  };

  const getCategoryImage = (cat: Category): string | null => {
    if (cat.photo_url && cat.photo_url !== DUMMY_PHOTO) {
      return cat.photo_url;
    }
    return null;
  };

  const getCategoryEmoji = (name: string): string => {
    return EMOJI_MAP[name.toLowerCase()] || '📌';
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/users/me/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ category_ids: Array.from(selectedIds) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка сохранения категорий');
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-categories">
      <h1 className="step-categories__title">
        Создаем тебе аккаунт для входа в сообщество, где тебе все рады!
      </h1>

      <p className="step-categories__subtitle">
        Выбери увлечения, которые тебе по душе
      </p>

      {categories.length > 0 ? (
        <div className="step-categories__grid">
          {categories.map((cat) => {
            const isSelected = selectedIds.has(cat.category_id);
            const imgUrl = getCategoryImage(cat);

            return (
              <button
                key={cat.category_id}
                type="button"
                className={`step-categories__card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleCategory(cat.category_id)}
              >
                <div className="step-categories__icon">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={cat.category_name}
                      className="step-categories__img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="step-categories__emoji">
                      {getCategoryEmoji(cat.category_name)}
                    </span>
                  )}
                </div>
                <span className="step-categories__name">{cat.category_name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="step-categories__empty">Загрузка категорий...</p>
      )}

      {error && <div className="step-categories__error">{error}</div>}

      <button
        type="button"
        className="step-categories__button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Сохраняем...' : 'Далее'}
      </button>
    </div>
  );
};

export default StepCategories;
