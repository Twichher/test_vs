import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../slices/store';
import { useEffect, useState, useRef } from 'react';
import { FiHelpCircle, FiUpload, FiX, FiTrash2 } from 'react-icons/fi';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './CreateMeetingPage.css';

export default function CreateMeetingPage() {
  const { isAuth, is_organizer } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // Состояния формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxPeople, setMaxPeople] = useState('');
  const [maxPeopleError, setMaxPeopleError] = useState(false);
  const [address, setAddress] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [adultsOnly, setAdultsOnly] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedWarnings, setSelectedWarnings] = useState<Record<string, string>>({});
  
  // Ref для file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Предупреждения для встречи
  const warnings = [
    { name: 'Курение', options: ['Курение разрешено', 'Курение запрещено'] },
    { name: 'Алкоголь', options: ['Алкоголь разрешен', 'Алкоголь запрещен'] },
    { name: 'Мат', options: ['Мат разрешен', 'Мат запрещен'] },
  ];
  
  // Получаем сегодняшнюю дату в формате YYYY-MM-DD для min атрибута
  const today = new Date().toISOString().split('T')[0];
  
  // Состояния для анимации появления
  const [showTitleField, setShowTitleField] = useState(false);
  const [showDescriptionField, setShowDescriptionField] = useState(false);
  const [showMaxPeopleField, setShowMaxPeopleField] = useState(false);
  const [showAddressField, setShowAddressField] = useState(false);
  const [showDateField, setShowDateField] = useState(false);
  const [showStartTimeField, setShowStartTimeField] = useState(false);
  const [showEndTimeField, setShowEndTimeField] = useState(false);
  const [showEmailMessageField, setShowEmailMessageField] = useState(false);
  const [showAdultsOnlyField, setShowAdultsOnlyField] = useState(false);
  const [showPhotosField, setShowPhotosField] = useState(false);
  const [showCategoriesField, setShowCategoriesField] = useState(false);

  // Проверяем авторизацию и права организатора
  useEffect(() => {
    if (!isAuth) {
      navigate('/');
      return;
    }
    if (!is_organizer) {
      navigate('/profile');
      return;
    }
  }, [isAuth, is_organizer, navigate]);

  // Плавное появление полей
  useEffect(() => {
    const titleTimer = setTimeout(() => setShowTitleField(true), 100);
    const descTimer = setTimeout(() => setShowDescriptionField(true), 300);
    const maxPeopleTimer = setTimeout(() => setShowMaxPeopleField(true), 500);
    const addressTimer = setTimeout(() => setShowAddressField(true), 700);
    const datetimeTimer = setTimeout(() => {
      setShowDateField(true);
      setShowStartTimeField(true);
      setShowEndTimeField(true);
    }, 900);
    const emailMessageTimer = setTimeout(() => setShowEmailMessageField(true), 1100);
    const adultsOnlyTimer = setTimeout(() => setShowAdultsOnlyField(true), 1300);
    const photosTimer = setTimeout(() => setShowPhotosField(true), 1500);
    const categoriesTimer = setTimeout(() => setShowCategoriesField(true), 1700);
    
    return () => {
      clearTimeout(titleTimer);
      clearTimeout(descTimer);
      clearTimeout(maxPeopleTimer);
      clearTimeout(addressTimer);
      clearTimeout(datetimeTimer);
      clearTimeout(emailMessageTimer);
      clearTimeout(adultsOnlyTimer);
      clearTimeout(photosTimer);
      clearTimeout(categoriesTimer);
    };
  }, []);

  // Валидация поля "Максимум людей" - только цифры
  const handleMaxPeopleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxPeople(value);
    
    // Проверяем, что введены только цифры
    if (value === '') {
      setMaxPeopleError(false);
    } else {
      const isOnlyDigits = /^\d+$/.test(value);
      setMaxPeopleError(!isOnlyDigits);
    }
  };

  // Обработчик загрузки фотографий
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - photos.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Сбрасываем input чтобы можно было загрузить еще фото
    e.target.value = '';
  };

  // Обработчик клика по фото для открытия модалки
  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  // Закрытие модалки
  const handleClosePhotoModal = () => {
    setSelectedPhotoIndex(null);
  };

  // Выбор предупреждения
  const handleWarningSelect = (warningName: string, option: string) => {
    setSelectedWarnings((prev) => {
      // Если кликаем на уже выбранный пункт - снимаем выбор
      if (prev[warningName] === option) {
        const { [warningName]: _, ...rest } = prev;
        return rest;
      }
      
      const newWarnings = { ...prev, [warningName]: option };
      
      // Проверяем, выбрано ли что-то "разрежено"
      const hasAllowed = Object.values(newWarnings).some(
        (value) => value.includes('разрешен') || value.includes('разрешено')
      );
      
      // Автоматически активируем adultsOnly если выбрано "разрешено"
      if (hasAllowed) {
        setAdultsOnly(true);
      }
      
      return newWarnings;
    });
  };

  // Удаление фотографии
  const handleDeletePhoto = () => {
    if (selectedPhotoIndex === null) return;
    
    const newPhotos = photos.filter((_, index) => index !== selectedPhotoIndex);
    setPhotos(newPhotos);
    
    if (newPhotos.length === 0) {
      // Если фото не осталось, закрываем модалку
      setSelectedPhotoIndex(null);
    } else if (selectedPhotoIndex >= newPhotos.length) {
      // Если удалили последнюю фото, показываем предыдущую
      setSelectedPhotoIndex(newPhotos.length - 1);
    }
    // Иначе показываем следующую фото (индекс остается тем же)
  };

  const handleUploadClick = () => {
    if (photos.length < 5 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!isAuth || !is_organizer) {
    return null;
  }

  return (
    <div className="create-meeting-page">
      <NavbarLogin />
      <NavBar onChange={() => {}} />
      
      <main className="create-meeting-content">
        <div className="create-meeting-inner">
          <h1 className="create-meeting-title">Создание встречи</h1>
          
          <form className="create-meeting-form">
            {/* Поле Название */}
            <div className={`create-meeting-field ${showTitleField ? 'field-visible' : 'field-hidden'}`}>
              <label className="create-meeting-label">
                <span>Название</span>
                <span className="create-meeting-tooltip" title="Название вашей встречи">
                  <FiHelpCircle size={16} />
                </span>
              </label>
              <input
                type="text"
                className="create-meeting-input create-meeting-input--small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите название встречи"
              />
            </div>

            {/* Поле Описание */}
            <div className={`create-meeting-field ${showDescriptionField ? 'field-visible' : 'field-hidden'}`}>
              <label className="create-meeting-label">
                <span>Описание встречи</span>
                <span className="create-meeting-tooltip" title="Описание встречи которое видно на главной странице">
                  <FiHelpCircle size={16} />
                </span>
              </label>
              <textarea
                className="create-meeting-input create-meeting-input--large"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Введите описание встречи"
                rows={6}
              />
            </div>

            {/* Поле Максимум людей */}
            <div className={`create-meeting-field ${showMaxPeopleField ? 'field-visible' : 'field-hidden'}`}>
              <label className="create-meeting-label">
                <span>Максимум людей</span>
                <span className="create-meeting-tooltip" title="Максимум людей на встречи">
                  <FiHelpCircle size={16} />
                </span>
              </label>
              <div className="create-meeting-input-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`create-meeting-input create-meeting-input--number ${maxPeopleError ? 'input-error' : ''}`}
                  value={maxPeople}
                  onChange={handleMaxPeopleChange}
                  placeholder="0"
                />
                {maxPeopleError && (
                  <span className="create-meeting-error">Вводить можно только число</span>
                )}
              </div>
            </div>

            {/* Поле Адрес встречи */}
            <div className={`create-meeting-field ${showAddressField ? 'field-visible' : 'field-hidden'}`}>
              <label className="create-meeting-label">
                <span>Адрес встречи</span>
                <span className="create-meeting-tooltip" title="Адрес где будет проводиться встреча. Дополнительную информацию о месте, укажите в пунктах 'Сообщение для почты' и 'Загрузка фотографий встречи'">
                  <FiHelpCircle size={16} />
                </span>
              </label>
              <input
                type="text"
                className="create-meeting-input create-meeting-input--medium"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Введите адрес встречи"
              />
            </div>

            {/* Блок Дата и Время в одной строке */}
            <div className={`create-meeting-field create-meeting-field--datetime ${showDateField && showStartTimeField && showEndTimeField ? 'field-visible' : 'field-hidden'}`}>
              <div className="create-meeting-datetime-row">
                {/* Дата */}
                <div className="create-meeting-datetime-col">
                  <label className="create-meeting-label">
                    <span>Дата встречи</span>
                    <span className="create-meeting-tooltip" title="Выберите дату встречи">
                      <FiHelpCircle size={16} />
                    </span>
                  </label>
                  <input
                    type="date"
                    className="create-meeting-input create-meeting-input--date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    min={today}
                  />
                </div>
                
                {/* Время начала */}
                <div className="create-meeting-datetime-col">
                  <label className="create-meeting-label">
                    <span>Время начала</span>
                    <span className="create-meeting-tooltip" title="Время когда начнется встреча, формат ЧЧ.ММ">
                      <FiHelpCircle size={16} />
                    </span>
                  </label>
                  <input
                    type="time"
                    className="create-meeting-input create-meeting-input--time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                
                {/* Тире */}
                <span className="create-meeting-datetime-separator create-meeting-datetime-separator--large">-</span>
                
                {/* Время конца */}
                <div className="create-meeting-datetime-col">
                  <label className="create-meeting-label">
                    <span>Время конца</span>
                    <span className="create-meeting-tooltip" title="Время когда закончится встреча, формат ЧЧ.ММ">
                      <FiHelpCircle size={16} />
                    </span>
                  </label>
                  <input
                    type="time"
                    className="create-meeting-input create-meeting-input--time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Поле Сообщение для почты */}
            <div className={`create-meeting-field ${showEmailMessageField ? 'field-visible' : 'field-hidden'}`}>
              <label className="create-meeting-label">
                <span>Сообщение для почты</span>
                <span className="create-meeting-tooltip" title="Сообщение, которые получат пользователи, записавшиеся на встречу. Укажите тут подробную информацию как добраться до места встречи, а также укажите способ связи с вами.">
                  <FiHelpCircle size={16} />
                </span>
              </label>
              <textarea
                className="create-meeting-input create-meeting-input--large"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Введите сообщение для участников встречи"
                rows={6}
              />
            </div>

            {/* Поле Встреча только для совершеннолетних */}
            <div className={`create-meeting-field create-meeting-field--checkbox ${showAdultsOnlyField ? 'field-visible' : 'field-hidden'}`}>
              <label className="create-meeting-checkbox-label" onClick={() => setAdultsOnly(!adultsOnly)}>
                <span className="create-meeting-label-text">
                  Встреча только для совершеннолетних
                  <span className="create-meeting-tooltip" title="Если на встречи будет происходит то, что детям нельзя слышать или видеть, обязательно нажмите на этот блок.">
                    <FiHelpCircle size={16} />
                  </span>
                </span>
                <div className={`create-meeting-checkbox ${adultsOnly ? 'create-meeting-checkbox--checked' : ''}`}>
                  {adultsOnly && <span className="create-meeting-checkbox-check">✓</span>}
                </div>
              </label>
            </div>

            {/* Поле Загрузка фотографий */}
            <div className={`create-meeting-field ${showPhotosField ? 'field-visible' : 'field-hidden'}`}>
              <label className="create-meeting-label">
                <span>Загрузите от 1 до 5 фотографий места встречи</span>
                <span className="create-meeting-tooltip" title="Эти фотографии увидят только зарегистрированные на встречу пользователи, используйте их как дополнительную информацию о том как добраться до места встречи">
                  <FiHelpCircle size={16} />
                </span>
              </label>
              <div className="create-meeting-photos-row">
                {photos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="create-meeting-photo-thumb"
                    onClick={() => handlePhotoClick(index)}
                  >
                    <img src={photo} alt={`Фото ${index + 1}`} />
                  </div>
                ))}
                {photos.length < 5 && (
                  <div className="create-meeting-upload-btn" onClick={handleUploadClick}>
                    <FiUpload size={24} />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="create-meeting-file-input"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
              </div>
            </div>
            {/* Поле Предупреждения для встречи */}
            <div className={`create-meeting-field ${showCategoriesField ? 'field-visible' : 'field-hidden'}`}>
              <label className="create-meeting-label">
                <span>Предупреждения для встречи</span>
                <span className="create-meeting-tooltip" title="Это поможет всем посетителям встречи избежать конфликтных ситуаций. При выборе предупреждения из первой колонки, встреча автоматически переходит в разряд 18+.">
                  <FiHelpCircle size={16} />
                </span>
              </label>
              <div className="create-meeting-warnings">
                {warnings.map((warning) => (
                  <div key={warning.name} className="create-meeting-warning-row">
                    {warning.options.map((option) => (
                      <div
                        key={option}
                        className={`create-meeting-warning-item ${selectedWarnings[warning.name] === option ? 'create-meeting-warning-item--selected' : ''}`}
                        onClick={() => handleWarningSelect(warning.name, option)}
                      >
                        <span className="create-meeting-warning-name">{option}</span>
                        <div className={`create-meeting-warning-checkbox ${selectedWarnings[warning.name] === option ? 'create-meeting-warning-checkbox--checked' : ''}`}>
                          {selectedWarnings[warning.name] === option && <span className="create-meeting-warning-check">✓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Модальное окно для просмотра фотографий */}
          {selectedPhotoIndex !== null && (
            <div className="photo-modal-overlay" onClick={handleClosePhotoModal}>
              <div className="photo-modal photo-modal--with-delete" onClick={(e) => e.stopPropagation()}>
                <button className="photo-modal-close" onClick={handleClosePhotoModal}>
                  <FiX size={24} />
                </button>

                {/* Список миниатюр — слева */}
                <div className="photo-modal-thumbnails">
                  {photos.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`photo-${index}`}
                      className={`photo-modal-thumb ${selectedPhotoIndex === index ? 'photo-modal-thumb--active' : ''}`}
                      onClick={() => setSelectedPhotoIndex(index)}
                    />
                  ))}
                </div>

                {/* Главное фото — в центре */}
                <div className="photo-modal-main">
                  {photos[selectedPhotoIndex] && (
                    <img src={photos[selectedPhotoIndex]} alt="selected" className="photo-modal-main-img" />
                  )}
                </div>

                {/* Кнопка удаления — справа */}
                <div className="photo-modal-delete-section">
                  <button className="photo-modal-delete-btn" onClick={handleDeletePhoto}>
                    <FiTrash2 size={28} />
                  </button>
                  <span className="photo-modal-delete-text">Удалить фотографию</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
