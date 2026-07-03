import { useState, useRef } from 'react';
import { FiX, FiUpload, FiTrash2 } from 'react-icons/fi';
import './MessageDetail.css';
import type { NotificationItem } from '../types/notification';


interface MessageDetailConflictSolutionProps {
  notification: NotificationItem;
  onClose: () => void;
  onRateSuccess?: (record_id: number) => void;
}

export default function MessageDetailConflictSolution({
  notification,
  onClose,
  onRateSuccess,
}: MessageDetailConflictSolutionProps) {
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [proofText, setProofText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localIsrated, setLocalIsrated] = useState(notification.israted ?? 0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formattedSentDate = new Date(notification.sent_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleUploadClick = () => {
    if (photos.length < 5 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - photos.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    }

    // Сбрасываем input, чтобы можно было выбрать тот же файл повторно
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('record_id', String(notification.record_id));
      if (proofText.trim()) {
        formData.append('proof_text', proofText.trim());
      }

      // Конвертируем base64 в Blob и добавляем в FormData
      for (let i = 0; i < photos.length; i++) {
        const base64 = photos[i];
        const response = await fetch(base64);
        const blob = await response.blob();
        formData.append('files', blob, `photo_${i}.jpg`);
      }

      const res = await fetch('http://localhost:8000/conflicts/appeal', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Ошибка при отправке доказательств');
      }

      setLocalIsrated(1);
      onRateSuccess?.(notification.record_id);
    } catch (error) {
      console.error('Error submitting appeal:', error);
      alert(error instanceof Error ? error.message : 'Не удалось отправить доказательства');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="message-detail">
      {/* Кнопка закрытия */}
      <button className="message-detail__close" onClick={onClose}>
        <FiX size={24} />
      </button>

      {/* Хедер с оранжевым переливающимся градиентом */}
      <div className="message-detail__header message-detail__header--orange">
        {notification.meeting_title && (
          <h2 className="message-detail__meeting-title">{notification.meeting_title}</h2>
        )}
        <div className="message-detail__meta">
          <span className="message-detail__date">{formattedSentDate}</span>
          <span className="message-detail__separator">•</span>
          <span className="message-detail__type">{notification.notification_type}</span>
        </div>
      </div>

      {/* Разделитель */}
      <div className="message-detail__divider"></div>

      {/* Содержимое */}
      <div className="message-detail__content">
        <p className="message-detail__text">{notification.notification_text}</p>

        {localIsrated === 1 ? (
          <div className="message-detail__already-rated" style={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' }}>
            <p>Доказательства отправлены. Администратор рассмотрит вашу апелляцию.</p>
          </div>
        ) : (
          <>
            {!showAppealForm ? (
              <button
                className="message-detail__submit-btn message-detail__submit-btn--orange"
                onClick={() => setShowAppealForm(true)}
              >
                Да, я был на той встрече
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <p className="message-detail__text">
                  Если вы имеете доказательства того, что вы были, то предъявите их.
                  Это необязательно, но увеличит шансы на разрешение конфликта в вашу пользу.
                </p>

                {/* Текстовое поле */}
                <div>
                  <label className="message-detail__section-title" style={{ display: 'block', marginBottom: 8 }}>
                    Сообщение для администратора
                  </label>
                  <textarea
                    className="message-detail__textarea"
                    placeholder="Напишите здесь то, что может повлиять на его решение..."
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Загрузка фото */}
                <div>
                  <label className="message-detail__section-title" style={{ display: 'block', marginBottom: 8 }}>
                    Прикрепите фото/медиа доказательства вашего присутствия на встрече. Не более 5 файлов.
                  </label>
                  <div className="message-detail__photos-row">
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className="message-detail__photo-thumb"
                        onClick={() => handlePhotoClick(index)}
                      >
                        <img src={photo} alt={`Фото ${index + 1}`} />
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <div className="message-detail__upload-btn" onClick={handleUploadClick}>
                        <FiUpload size={24} />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="message-detail__file-input"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>

                {/* Кнопка отправки */}
                <button
                  className="message-detail__submit-btn message-detail__submit-btn--orange"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить доказательства'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно просмотра фото */}
      {selectedPhotoIndex !== null && (
        <div className="photo-modal-overlay" onClick={handleClosePhotoModal}>
          <div className="message-detail__photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal__close" onClick={handleClosePhotoModal}>
              <FiX size={24} />
            </button>

            <div className="message-detail__photo-modal-thumbnails">
              {photos.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`photo-${index}`}
                  className={`message-detail__photo-modal-thumb ${selectedPhotoIndex === index ? 'message-detail__photo-modal-thumb--active' : ''}`}
                  onClick={() => setSelectedPhotoIndex(index)}
                />
              ))}
            </div>

            <div className="message-detail__photo-modal-main">
              <img src={photos[selectedPhotoIndex]} alt="preview" />
            </div>

            <div className="message-detail__photo-modal-delete">
              <button className="message-detail__photo-modal-delete-btn" onClick={handleDeletePhoto}>
                <FiTrash2 size={28} />
              </button>
              <span className="message-detail__photo-modal-delete-text">Удалить</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
