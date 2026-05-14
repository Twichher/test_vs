import { useState, useEffect } from 'react';
import { FiX, FiUpload, FiCheck } from 'react-icons/fi';
import './MessageDetailVerification.css';

interface NotificationItem {
  record_id: number;
  notification_id: number;
  user_id: number;
  notification_type: string;
  sent_at: string;
  status: 'read' | 'unread';
  notification_text: string;
  photo_urls: string[];
  israted: number;
}

interface VerificationRecord {
  verification_id: number;
  user_id: number;
  photo_1_url: string;
  photo_2_url: string;
  status: string;
  photos_uploaded_at: string;
  status_changed_at: string | null;
  answer_ai: string | null;
}

interface MessageVerificationAnswerProps {
  notification: NotificationItem;
  onClose: () => void;
}

export default function MessageVerificationAnswer({ notification, onClose }: MessageVerificationAnswerProps) {
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestVerification, setLatestVerification] = useState<VerificationRecord | null>(null);

  const examplePhotoUrl = 'http://127.0.0.1:9000/allphotos/photos/example_photos.jpg';

  const formattedSentDate = new Date(notification.sent_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    fetch('http://localhost:8000/verification/latest', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { verification: VerificationRecord | null }) => {
        setLatestVerification(data.verification);
      })
      .catch(console.error);
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSubmitError('Пожалуйста, выберите файл изображения');
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      setSubmitError(null);
    }
  };

  const handleSubmit = async () => {
    if (!photo1 || !photo2) {
      setSubmitError('Пожалуйста, загрузите обе фотографии');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('photo_1', photo1);
    formData.append('photo_2', photo2);
    formData.append('record_id', String(notification.record_id));

    try {
      const response = await fetch('http://localhost:8000/verification/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Ошибка загрузки');
      }

      setSubmitSuccess(true);
      setPhoto1(null);
      setPhoto2(null);
      setPreview1(null);
      setPreview2(null);

      setLatestVerification({
        verification_id: result.verification_id,
        user_id: notification.user_id,
        photo_1_url: result.photo_1_url,
        photo_2_url: result.photo_2_url,
        status: 'created',
        photos_uploaded_at: new Date().toISOString(),
        status_changed_at: null,
        answer_ai: null,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Ошибка при отправке');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreated = latestVerification?.status === 'created';
  const isApproved = latestVerification?.status === 'approved';
  const alreadyUploaded = notification.israted === 1;

  return (
    <div className="message-detail message-detail--verification">
      {/* Кнопка закрытия */}
      <button className="message-detail__close" onClick={onClose}>
        <FiX size={24} />
      </button>

      {/* Хедер с фиолетовым градиентом */}
      <div className="message-detail__header message-detail__header--verification">
        <div className="message-detail__meta">
          <span className="message-detail__date">{formattedSentDate}</span>
          <span className="message-detail__separator">•</span>
          <span className="message-detail__type">{notification.notification_type}</span>
        </div>
      </div>

      {/* Разделитель */}
      <div className="message-detail__divider"></div>

      {/* Содержимое */}
      <div className="message-detail__content verification-content">
        {/* Причина отклонения */}
        <div className="verification-rejected-notice">
          <p className="verification-rejected-text">
            <strong>Результат проверки:</strong> {notification.notification_text}
          </p>
          <p className="verification-retry-text">
            Пожалуйста, внимательно прочитай требования и загрузи фотографии заново.
          </p>
        </div>

        {/* Инструкции */}
        <div className="verification-welcome">
          <h2 className="verification-title">Повторная верификация</h2>
          <p className="verification-subtitle">
            Для завершения регистрации загрузите две фотографии: одна —{' '}
            <strong>лицо в анфас</strong> (глаза смотрят точно в объектив) и одна —{' '}
            <strong>в профиль</strong> (сбоку).
          </p>
        </div>

        {/* Пример фото */}
        <div className="verification-example">
          <h3 className="verification-section-title">Вот как примерно выглядит то, что мы хотим:</h3>
          <div className="verification-example-photo">
            <img src={examplePhotoUrl} alt="Пример фотографий" />
          </div>
        </div>

        {/* Уже загружено */}
        {alreadyUploaded && (
          <div className="verification-status-notice verification-status-notice--pending">
            <p><FiCheck size={20} /> Вы уже отправили фото. Ожидайте результата проверки.</p>
          </div>
        )}

        {/* Статус верификации */}
        {isCreated && (
          <div className="verification-status-notice verification-status-notice--pending">
            <p>Фотографии отправлены на проверку. Ожидайте результата.</p>
          </div>
        )}

        {isApproved && (
          <div className="verification-status-notice verification-status-notice--approved">
            <p><FiCheck size={20} /> Верификация пройдена успешно!</p>
          </div>
        )}

        {/* Загрузка фото */}
        {!alreadyUploaded && !isCreated && !isApproved && (
          <div className="verification-uploads">
            {/* Фото 1 */}
            <div className="verification-upload-block">
              <h3 className="verification-upload-label">Загрузи первую фотографию с твоим лицом в анфас</h3>
              <div className="verification-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setPhoto1, setPreview1)}
                  id="verification-photo-1"
                  className="verification-file-input"
                />
                <label htmlFor="verification-photo-1" className="verification-upload-btn">
                  {preview1 ? (
                    <img src={preview1} alt="Превью 1" className="verification-preview-img" />
                  ) : (
                    <>
                      <FiUpload size={24} />
                      <span>Выбрать фото</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Фото 2 */}
            <div className="verification-upload-block">
              <h3 className="verification-upload-label">Загрузи теперь вторую фотографию в профиль</h3>
              <div className="verification-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setPhoto2, setPreview2)}
                  id="verification-photo-2"
                  className="verification-file-input"
                />
                <label htmlFor="verification-photo-2" className="verification-upload-btn">
                  {preview2 ? (
                    <img src={preview2} alt="Превью 2" className="verification-preview-img" />
                  ) : (
                    <>
                      <FiUpload size={24} />
                      <span>Выбрать фото</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Ошибка */}
        {submitError && <p className="verification-error">{submitError}</p>}

        {/* Успех */}
        {submitSuccess && (
          <p className="verification-success">
            <FiCheck size={18} /> Фотографии успешно отправлены на проверку!
          </p>
        )}

        {/* Кнопка отправки */}
        {!alreadyUploaded && !isCreated && !isApproved && (
          <button
            className={`verification-submit-btn ${isSubmitting ? 'verification-submit-btn--loading' : ''} ${!photo1 || !photo2 ? 'verification-submit-btn--disabled' : ''}`}
            onClick={handleSubmit}
            disabled={isSubmitting || !photo1 || !photo2}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить фотографии'}
          </button>
        )}
      </div>
    </div>
  );
}
