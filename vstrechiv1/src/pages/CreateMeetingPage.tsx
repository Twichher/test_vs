import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../slices/store';
import { initDraft, saveDraft, clearDraft, updateDraftField } from '../slices/draftSlice';
import { useEffect, useState, useRef, useCallback } from 'react';
import { FiHelpCircle, FiUpload, FiX, FiTrash2 } from 'react-icons/fi';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './CreateMeetingPage.css';

// Типы для категорий и предупреждений
interface Category {
  category_id: number;
  category_name: string;
  photo_url: string;
}

interface Warning {
  warning_id: number;
  warning_name: string;
  forAdults: boolean;
}

interface WarningOption {
  option_id: number;
  option_name: string;
  forAdults: boolean;
}

interface WarningGroup {
  warning_id: number;
  warning_name: string;
  options: WarningOption[];
}

export default function CreateMeetingPage() {
  const { isAuth, is_organizer, district, user_id } = useSelector((state: RootState) => state.auth);
  const { meetingDraft } = useSelector((state: RootState) => state.draft);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Состояния формы (инициализируем из черновика если есть)
  const [title, setTitle] = useState(meetingDraft?.title ?? '');
  const [description, setDescription] = useState(meetingDraft?.description ?? '');
  const [maxPeople, setMaxPeople] = useState(meetingDraft?.maxPeople ?? '');
  const [maxPeopleError, setMaxPeopleError] = useState(false);
  const [address, setAddress] = useState(meetingDraft?.address ?? '');
  const [meetingDate, setMeetingDate] = useState(meetingDraft?.meetingDate ?? '');
  const [startTime, setStartTime] = useState(meetingDraft?.startTime ?? '');
  const [endTime, setEndTime] = useState(meetingDraft?.endTime ?? '');
  const [emailMessage, setEmailMessage] = useState(meetingDraft?.emailMessage ?? '');
  const [adultsOnly, setAdultsOnly] = useState(meetingDraft?.adultsOnly ?? false);
  const [adultsOnlyLocked, setAdultsOnlyLocked] = useState(false);
  const [photos, setPhotos] = useState<string[]>(meetingDraft?.photos ?? []);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedWarnings, setSelectedWarnings] = useState<Record<number, number>>(meetingDraft?.selectedWarnings ?? {});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(meetingDraft?.selectedCategoryIds ?? []);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Состояния для создания встречи
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  
  // Состояния для загрузки данных с бэкенда
  const [categories, setCategories] = useState<Category[]>([]);
  const [warningGroups, setWarningGroups] = useState<WarningGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Ref для file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [showCategorySelectionField, setShowCategorySelectionField] = useState(false);

  // Инициализация черновика из localStorage при загрузке страницы
  useEffect(() => {
    if (user_id) {
      dispatch(initDraft({ userId: user_id }));
    }
  }, [user_id, dispatch]);

  // Применяем загруженный черновик к состояниям формы
  useEffect(() => {
    if (meetingDraft) {
      setTitle(meetingDraft.title);
      setDescription(meetingDraft.description);
      setMaxPeople(meetingDraft.maxPeople);
      setAddress(meetingDraft.address);
      setMeetingDate(meetingDraft.meetingDate);
      setStartTime(meetingDraft.startTime);
      setEndTime(meetingDraft.endTime);
      setEmailMessage(meetingDraft.emailMessage);
      setAdultsOnly(meetingDraft.adultsOnly);
      setPhotos(meetingDraft.photos);
      setSelectedWarnings(meetingDraft.selectedWarnings);
      setSelectedCategoryIds(meetingDraft.selectedCategoryIds);
    }
  }, []); // Запускаем только при монтировании

  // Сохранение изменений в черновик (debounced через useEffect)
  useEffect(() => {
    if (!user_id) return;
    
    dispatch(saveDraft({
      userId: user_id,
      draft: {
        title,
        description,
        maxPeople,
        address,
        meetingDate,
        startTime,
        endTime,
        emailMessage,
        adultsOnly,
        photos,
        selectedWarnings,
        selectedCategoryIds,
      },
    }));
  }, [title, description, maxPeople, address, meetingDate, startTime, endTime, emailMessage, adultsOnly, photos, selectedWarnings, selectedCategoryIds, user_id, dispatch]);

  // Загрузка категорий и предупреждений с бэкенда
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Загружаем категории
        const categoriesRes = await fetch('http://localhost:8000/categories', {
          credentials: 'include',
        });
        if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
        
        // Загружаем предупреждения
        const warningsRes = await fetch('http://localhost:8000/warnings', {
          credentials: 'include',
        });
        if (!warningsRes.ok) throw new Error('Failed to fetch warnings');
        const warningsData = await warningsRes.json();
        
        // Группируем предупреждения по имени (каждое предупреждение имеет 2 опции)
        const warnings: Warning[] = warningsData.warnings || [];
        const groupedWarnings = groupWarningsByName(warnings);
        console.log(groupedWarnings)
        setWarningGroups(groupedWarnings);
        
        // Проверяем, нужно ли заблокировать adultsOnly на основе загруженных предупреждений
        const hasAdultsWarning = Object.entries(selectedWarnings).some(([groupId, optionId]) => {
          const group = groupedWarnings.find((g) => g.warning_id === parseInt(groupId));
          const option = group?.options.find((o) => o.option_id === optionId);
          return option?.forAdults === true;
        });
        if (hasAdultsWarning) {
          setAdultsOnly(true);
          setAdultsOnlyLocked(true);
        }
        
        setLoadError(null);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoadError('Ошибка загрузки данных. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuth && is_organizer) {
      fetchData();
    }
  }, [isAuth, is_organizer]);

  // Группировка предупреждений по имени
  const groupWarningsByName = (warnings: Warning[]): WarningGroup[] => {
    const groups: Record<string, Warning[]> = {};
    
    warnings.forEach((warning) => {
      // Извлекаем базовое имя (без "разрешен/запрещен")
      const baseName = warning.warning_name.replace(/\s+(разрешен|разрешена|запрещен|запрещена|разрешено|запрещено)$/i, '');
      
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(warning);
    });
    
    return Object.entries(groups).map(([name, options], index) => ({
      warning_id: index + 1,
      warning_name: name,
      options: options.map((opt) => ({
        option_id: opt.warning_id,
        option_name: opt.warning_name,
        forAdults: opt.forAdults,
      })),
    }));
  };

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
    const categorySelectionTimer = setTimeout(() => setShowCategorySelectionField(true), 1900);
    
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
      clearTimeout(categorySelectionTimer);
    };
  }, []);

  // Проверка валидности формы
  useEffect(() => {
    const isValid = 
      title.trim() !== '' &&
      description.trim() !== '' &&
      maxPeople !== '' &&
      !maxPeopleError &&
      address.trim() !== '' &&
      meetingDate !== '' &&
      startTime !== '' &&
      endTime !== '' &&
      emailMessage.trim() !== '' &&
      photos.length > 0 &&
      selectedCategoryIds.length > 0;
    
    setIsFormValid(isValid);
  }, [title, description, maxPeople, maxPeopleError, address, meetingDate, startTime, endTime, emailMessage, photos, selectedCategoryIds]);

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
  const handleWarningSelect = (groupId: number, optionId: number, forAdults: boolean) => {
    setSelectedWarnings((prev) => {
      // Если кликаем на уже выбранный пункт - снимаем выбор
      if (prev[groupId] === optionId) {
        const { [groupId]: _, ...rest } = prev;
        
        // Проверяем, осталось ли что-то с forAdults=TRUE после снятия выбора
        const remainingAdultsOptions = Object.entries(rest).some(([gid, oid]) => {
          const group = warningGroups.find((g) => g.warning_id === parseInt(gid));
          const option = group?.options.find((o) => o.option_id === oid);
          return option?.forAdults === true;
        });
        
        // Если ничего с forAdults=TRUE не осталось - разблокируем adultsOnly
        // Но НЕ сбрасываем значение - оставляем как было выбрано пользователем
        if (!remainingAdultsOptions) {
          setAdultsOnlyLocked(false);
        }
        console.log(groupId, optionId, forAdults)
        return rest;
      }
      
      // Если выбираем предупреждение с forAdults=TRUE - активируем и блокируем
      if (forAdults) {
        setAdultsOnly(true);
        setAdultsOnlyLocked(true);
      }
      // Если forAdults=FALSE - не трогаем adultsOnly, пользователь сам управляет галочкой
      
      return { ...prev, [groupId]: optionId };
    });
  };

  // Выбор категории
  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Создание встречи
  const handleCreateMeeting = async () => {
    if (!isFormValid || isCreating) return;
    
    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(false);
    
    try {
      const requestData = {
        title,
        description,
        max_people: parseInt(maxPeople, 10),
        address,
        meeting_date: meetingDate,
        start_time: startTime,
        end_time: endTime,
        email_message: emailMessage,
        adults_only: adultsOnly,
        category_ids: selectedCategoryIds,
        selected_warnings: selectedWarnings,
        photos: photos,
      };
      
      const response = await fetch('http://localhost:8000/meetings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при создании встречи');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCreateSuccess(true);
        // Очищаем черновик после успешного создания
        if (user_id) {
          dispatch(clearDraft({ userId: user_id }));
        }
        // Показываем toast и перенаправляем на страницу профиля через 1 секунду
        setTimeout(() => {
          navigate(`/user/${user_id}`);
        }, 1000);
      } else {
        throw new Error(result.message || 'Ошибка при создании встречи');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      setCreateError(error instanceof Error ? error.message : 'Ошибка при создании встречи');
      setIsCreating(false);
    }
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
          
          {loadError && (
            <div className="create-meeting-error-banner">{loadError}</div>
          )}
          
          {createError && (
            <div className="create-meeting-error-banner">{createError}</div>
          )}
          
          {createSuccess && (
            <div className="create-meeting-success-banner">
              Встреча успешно создана! Перенаправление...
            </div>
          )}
          
          {isLoading ? (
            <div className="create-meeting-loading">Загрузка...</div>
          ) : (
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
                <label className={`create-meeting-checkbox-label ${adultsOnlyLocked ? 'create-meeting-checkbox-label--locked' : ''}`} onClick={() => !adultsOnlyLocked && setAdultsOnly(!adultsOnly)}>
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
                  <span className="create-meeting-tooltip" title="Это поможет всем посетителям встречи избежать конфликтных ситуаций. При выборе предупреждения с forAdults=TRUE, встреча автоматически переходит в разряд 18+.">
                    <FiHelpCircle size={16} />
                  </span>
                </label>
                <div className="create-meeting-warnings-grid">
                  {warningGroups.flatMap((group) => group.options).map((option) => (
                    <div
                      key={option.option_id}
                      className={`create-meeting-warning-item ${Object.values(selectedWarnings).includes(option.option_id) ? 'create-meeting-warning-item--selected' : ''}`}
                      onClick={() => {
                        // Находим group_id для этой опции
                        const group = warningGroups.find((g) => g.options.some((o) => o.option_id === option.option_id));
                        if (group) {
                          handleWarningSelect(group.warning_id, option.option_id, option.forAdults);
                        }
                      }}
                    >
                      <span className="create-meeting-warning-name">{option.option_name}</span>
                      <div className={`create-meeting-warning-checkbox ${Object.values(selectedWarnings).includes(option.option_id) ? 'create-meeting-warning-checkbox--checked' : ''}`}>
                        {Object.values(selectedWarnings).includes(option.option_id) && <span className="create-meeting-warning-check">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Поле Выбор категорий встречи */}
              <div className={`create-meeting-field ${showCategorySelectionField ? 'field-visible' : 'field-hidden'}`}>
                <label className="create-meeting-label">
                  <span>Выбор категорий встречи</span>
                  <span className="create-meeting-tooltip" title="Категории отражают суть вашей встречи.">
                    <FiHelpCircle size={16} />
                  </span>
                </label>
                <div className="create-meeting-categories-grid">
                  {categories.map((category) => (
                    <div
                      key={category.category_id}
                      className={`create-meeting-category-card ${selectedCategoryIds.includes(category.category_id) ? 'create-meeting-category-card--active' : ''}`}
                      onClick={() => toggleCategory(category.category_id)}
                    >
                      <div className="create-meeting-category-icon">
                        <img 
                          src={category.photo_url} 
                          alt={category.category_name}
                          className="create-meeting-category-img"
                          onError={(e) => {
                            // Если фото не загрузилось, скрываем его
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="create-meeting-category-name">{category.category_name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Кнопка создания встречи */}
              <div className={`create-meeting-field create-meeting-submit-wrapper ${showCategorySelectionField ? 'field-visible' : 'field-hidden'}`}>
                {createError && (
                  <div className="create-meeting-submit-error">{createError}</div>
                )}
                <button
                  type="button"
                  className={`create-meeting-submit-btn ${isFormValid && !isCreating ? 'create-meeting-submit-btn--active' : ''}`}
                  onClick={handleCreateMeeting}
                  disabled={!isFormValid || isCreating}
                >
                  {isCreating ? 'Создание...' : 'Создать встречу'}
                </button>
              </div>
            </form>
          )}

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

      {/* Toast-уведомление об успешном создании */}
      {createSuccess && (
        <div className="create-meeting-toast">
          <div className="create-meeting-toast-content">
            <span className="create-meeting-toast-icon">✓</span>
            <span className="create-meeting-toast-text">Встреча успешно создана</span>
          </div>
        </div>
      )}
    </div>
  );
}
