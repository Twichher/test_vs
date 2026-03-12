import { useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './FilterPanel.css';

const DISTRICTS = ['ЦАО', 'САО', 'СВАО', 'ВАО', 'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО', 'СЗАО', 'ТАО', 'НАО', 'ЗеАО', 'МО'];

interface Category {
  category_id: number;
  category_name: string;
}

interface FilterValues {
  districts: string[];
  categories: number[];
  max_people: number | null;
}

interface FilterPanelProps {
  onApply: (filters: FilterValues) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [maxPeople, setMaxPeople] = useState<number | ''>('');
  const ref = useRef<HTMLDivElement>(null);

  // Загрузка категорий с API
  useEffect(() => {
    fetch('http://localhost:8000/meetings/categories', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .catch(console.error);
  }, []);

  // Закрыть по клику вне панели
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDistrict = (d: string) =>
    setSelectedDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const toggleCategory = (id: number) =>
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleApply = () => {
    onApply({
      districts: selectedDistricts,
      categories: selectedCategories,
      max_people: maxPeople !== '' ? Number(maxPeople) : null,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedDistricts([]);
    setSelectedCategories([]);
    setMaxPeople('');
    onApply({ districts: [], categories: [], max_people: null });
  };

  return (
    <div className="filter-wrapper" ref={ref}>
      <button className="meetings-filter-btn" onClick={() => setIsOpen((v) => !v)}>
        Фильтры {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>

      <div className={`filter-panel ${isOpen ? 'filter-panel--open' : ''}`}>
        {/* Район */}
        <div className="filter-section">
          <p className="filter-label">Район</p>
          <div className="filter-chips">
            {DISTRICTS.map((d) => (
              <button
                key={d}
                className={`filter-chip ${selectedDistricts.includes(d) ? 'filter-chip--active' : ''}`}
                onClick={() => toggleDistrict(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Критерий */}
        <div className="filter-section">
          <p className="filter-label">Критерий</p>
          <div className="filter-chips">
            {categories.map((c) => (
              <button
                key={c.category_id}
                className={`filter-chip ${selectedCategories.includes(c.category_id) ? 'filter-chip--active' : ''}`}
                onClick={() => toggleCategory(c.category_id)}
              >
                {c.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* Людей максимум */}
        <div className="filter-section filter-section--row">
          <p className="filter-label">Людей максимум до</p>
          <input
            type="number"
            className="filter-number-input"
            value={maxPeople}
            min={1}
            onChange={(e) =>
              setMaxPeople(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
        </div>

        {/* Кнопки */}
        <div className="filter-actions">
          <button className="filter-btn-reset" onClick={handleReset}>Сбросить</button>
          <button className="filter-btn-apply" onClick={handleApply}>Применить</button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
