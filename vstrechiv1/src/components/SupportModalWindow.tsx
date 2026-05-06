import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import { FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import './SupportModalWindow.css';

interface SupportCategory {
  category_to_support_id: number;
  text_category: string;
}

interface SupportModalWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SupportModalWindow: React.FC<SupportModalWindowProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isAuth } = useSelector((state: RootState) => state.auth);
  const [isClosing, setIsClosing] = useState(false);
  const wasOpenRef = useRef(false);

  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Фото
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загружаем категории при открытии
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('http://localhost:8000/support/categories')
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка загрузки категорий');
        return res.json();
      })
      .then((data: { categories: SupportCategory[] }) => {
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setSelectedCategory(String(data.categories[0].category_to_support_id));
        }
        setLoading(false);
      })
      .catch(() => {
        setCategories([]);
        setLoading(false);
      });
  }, [isOpen]);

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
    if (isClosing) return;
    setIsClosing(true);
    onClose();
  };

  const isSubmitDisabled = messageText.trim().length === 0 || isSubmitting;

  // --- Загрузка фото ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 5 - photos.length;
    const filesToProcess = Math.min(files.length, remainingSlots);
    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => [...prev, event.target!.result as string]);
      };
      reader.readAsDataURL(file);
    }
    // Сбрасываем input, чтобы можно было выбрать те же файлы повторно
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (photos.length < 5 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleClosePhotoModal = () => {
    setSelectedPhotoIndex(null);
  };

  const handleDeletePhoto = () => {
    if (selectedPhotoIndex === null) return;
    const newPhotos = photos.filter((_, index) => index !== selectedPhotoIndex);
    setPhotos(newPhotos);
    if (newPhotos.length === 0) {
      setSelectedPhotoIndex(null);
    } else if (selectedPhotoIndex >= newPhotos.length) {
      setSelectedPhotoIndex(newPhotos.length - 1);
    }
  };

  const handleSubmit = async () => {
    if (!messageText.trim() || !selectedCategory) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('http://localhost:8000/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category_id: Number(selectedCategory),
          message_text: messageText.trim(),
          photos: photos,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка отправки обращения');
      }

      const data = await response.json();
      if (data.success) {
        // Очистка формы
        setMessageText('');
        setPhotos([]);
        setSelectedPhotoIndex(null);
        if (categories.length > 0) {
          setSelectedCategory(String(categories[0].category_to_support_id));
        }
        onSuccess?.();
        handleClose();
      } else {
        throw new Error(data.message || 'Неизвестная ошибка');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Ошибка отправки обращения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`support-overlay ${isClosing ? 'support-overlay--closing' : ''}`} onClick={handleClose}>
        <div className={`support-modal ${isClosing ? 'support-modal--closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <button className="support-close" onClick={handleClose}>
            <FiX size={24} />
          </button>

          {isAuth ? (
            <>
              <h2 className="support-title">Сообщение для поддержки</h2>

              <div className="support-form">
                <div className="support-field">
                  <label className="support-label" htmlFor="support-category">
                    С чем вы столкнулись?
                  </label>
                  <select
                    id="support-category"
                    className="support-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={loading}
                  >
                    {categories.map((cat) => (
                      <option key={cat.category_to_support_id} value={cat.category_to_support_id}>
                        {cat.text_category}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  className="support-textarea"
                  placeholder="Опишите вашу проблему подробно..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={8}
                />

                {/* Блок прикрепления фото */}
                <div className="support-attach-section">
                  <p className="support-attach-label">Прикрепить изображение проблемы при наличии</p>
                  <div className="support-photos-row">
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className="support-photo-thumb"
                        onClick={() => handlePhotoClick(index)}
                      >
                        <img src={photo} alt={`Фото ${index + 1}`} />
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <div className="support-upload-btn" onClick={handleUploadClick}>
                        <FiUpload size={24} />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="support-file-input"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>

                {submitError && (
                  <p className="support-error" style={{ color: '#ff4444', fontSize: '14px', margin: 0 }}>
                    {submitError}
                  </p>
                )}

                <button
                  className="support-submit"
                  disabled={isSubmitDisabled}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </>
          ) : (
            <div className="support-unauth">
              <h2 className="support-title">Обращение в поддержку</h2>
              <p className="support-unauth-text">
                Чтобы оставить заявку в поддержку нужно авторизоваться в системе.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно просмотра фото */}
      {selectedPhotoIndex !== null && (
        <div className="support-photo-modal-overlay" onClick={handleClosePhotoModal}>
          <div className="support-photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="support-photo-modal-close" onClick={handleClosePhotoModal}>
              <FiX size={24} />
            </button>
            <div className="support-photo-modal-thumbnails">
              {photos.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`photo-${index}`}
                  className={`support-photo-modal-thumb ${selectedPhotoIndex === index ? 'support-photo-modal-thumb--active' : ''}`}
                  onClick={() => setSelectedPhotoIndex(index)}
                />
              ))}
            </div>
            <div className="support-photo-modal-main">
              {photos[selectedPhotoIndex] && (
                <img src={photos[selectedPhotoIndex]} alt="selected" className="support-photo-modal-main-img" />
              )}
            </div>
            <div className="support-photo-modal-delete-section">
              <button className="support-photo-modal-delete-btn" onClick={handleDeletePhoto}>
                <FiTrash2 size={24} />
              </button>
              <span className="support-photo-modal-delete-text">Удалить фотографию</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportModalWindow;
