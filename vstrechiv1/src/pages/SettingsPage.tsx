import { useSelector, useDispatch } from 'react-redux'
import './SettingsPage.css'
import type { RootState }  from '../slices/store';
import { updateUserProfile } from '../slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FiEdit2, FiX, FiCamera } from 'react-icons/fi';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

interface UserSettingsData {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  district: string;
  email: string;
}

// Тип для отслеживания измененных полей
type ChangedFields = {
  [key: string]: boolean;
};

type SaveStatus = 'idle' | 'loading' | 'success' | 'error';

// Компонент загрузки фотографии
function PhotoUploadField({ 
  onFileSelect, 
  isChanged,
  onEditStateChange 
}: { 
  onFileSelect: (file: File | null) => void;
  isChanged: boolean;
  onEditStateChange: (isChanged: boolean) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите файл изображения');
        return;
      }
      // Создаем превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
      onEditStateChange(true); // Уведомляем, что фото изменено
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="setting-photo-upload">
      <div className={`setting-photo-btn ${isChanged ? 'setting-photo-btn--changed' : ''}`} onClick={handleClick}>
        {preview ? (
          <img src={preview} alt="Preview" className="setting-photo-preview" />
        ) : (
          <FiCamera size={32} />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
        />
      </div>
      <span className="setting-photo-label">Загрузить фотографию</span>
    </div>
  );
}

interface SettingFieldProps {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  onEditStateChange: (isEditing: boolean) => void;
  isChanged: boolean;
}

// Список районов Москвы
const MOSCOW_DISTRICTS = [
  'ЦАО', 'САО', 'СВАО', 'ВАО',
  'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО',
  'СЗАО', 'ЗелАО', 'ТАО', 'НАО'
];

// Компонент для пола (переключение без модального окна)
function GenderField({ label, value, onChange, onEditStateChange, isChanged }: { 
  label: string; 
  value: string; 
  onChange: (newValue: string) => void;
  onEditStateChange: (isEditing: boolean) => void;
  isChanged: boolean;
}) {
  const [currentValue, setCurrentValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const originalValueRef = useRef(value);
  const wasChangedRef = useRef(false);

  useEffect(() => {
    setCurrentValue(value);
    originalValueRef.current = value;
  }, [value]);

  // Сбрасываем режим редактирования когда isChanged меняется с true на false (после сохранения)
  useEffect(() => {
    if (!isChanged && wasChangedRef.current) {
      setIsEditing(false);
    }
    wasChangedRef.current = isChanged;
  }, [isChanged]);

  const handleEditClick = () => {
    if (isEditing || isChanged) {
      // Отмена изменений - возвращаем оригинальное значение
      setCurrentValue(originalValueRef.current);
      onChange(originalValueRef.current);
      setIsEditing(false);
      onEditStateChange(false);
    } else {
      // Переключаем пол
      const newGender = currentValue === 'Мужской' ? 'Женский' : 'Мужской';
      setCurrentValue(newGender);
      onChange(newGender);
      setIsEditing(true);
      onEditStateChange(true);
    }
  };

  return (
    <div className="setting-field">
      <span className="setting-label">{label}</span>
      <input 
        type="text" 
        value={currentValue}
        readOnly
        className={`setting-input setting-input--readonly ${isChanged ? 'setting-input--editing' : ''}`}
      />
      <button 
        className={`setting-edit-btn ${isEditing || isChanged ? 'setting-edit-btn--active' : ''}`} 
        onClick={handleEditClick}
      >
        {isEditing || isChanged ? <FiX size={20} /> : <FiEdit2 size={20} />}
      </button>
    </div>
  );
}

// Компонент для даты рождения с модальным окном
function BirthDateField({ label, value, onChange, onEditStateChange, isChanged }: { 
  label: string; 
  value: string; 
  onChange: (newValue: string) => void;
  onEditStateChange: (isEditing: boolean) => void;
  isChanged: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [currentValue, setCurrentValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const originalValueRef = useRef(value);
  const wasChangedRef = useRef(false);

  useEffect(() => {
    setCurrentValue(value);
    originalValueRef.current = value;
  }, [value]);

  // Сбрасываем режим редактирования когда isChanged меняется с true на false (после сохранения)
  useEffect(() => {
    if (!isChanged && wasChangedRef.current) {
      setIsEditing(false);
    }
    wasChangedRef.current = isChanged;
  }, [isChanged]);

  const handleEditClick = () => {
    if (isEditing || isChanged) {
      // Отмена изменений
      setCurrentValue(originalValueRef.current);
      onChange(originalValueRef.current);
      setIsEditing(false);
      onEditStateChange(false);
    } else {
      // Открываем модальное окно
      setIsModalOpen(true);
      if (currentValue) {
        const parts = currentValue.split('.');
        if (parts.length === 3) {
          setDay(parts[0]);
          setMonth(parts[1]);
          setYear(parts[2]);
        }
      }
    }
  };

  const handleApply = () => {
    if (day && month && year) {
      const formattedDate = `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
      setCurrentValue(formattedDate);
      onChange(formattedDate);
      setIsEditing(true);
      onEditStateChange(true);
      setIsModalOpen(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(val) <= 31 || val === '') {
      setDay(val);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(val) <= 12 || val === '') {
      setMonth(val);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
  };

  const isValid = day.length === 2 && month.length === 2 && year.length === 4;

  return (
    <>
      <div className="setting-field">
        <span className="setting-label">{label}</span>
        <input 
          type="text" 
          value={currentValue}
          readOnly
          className={`setting-input setting-input--readonly ${isEditing || isChanged ? 'setting-input--editing' : ''}`}
          placeholder="DD.MM.YYYY"
        />
        <button 
          className={`setting-edit-btn ${isEditing || isChanged ? 'setting-edit-btn--active' : ''}`} 
          onClick={handleEditClick}
        >
          {isEditing || isChanged ? <FiX size={20} /> : <FiEdit2 size={20} />}
        </button>
      </div>

      {/* Модальное окно ввода даты */}
      {isModalOpen && (
        <div className="district-modal-overlay" onClick={handleClose}>
          <div className="district-modal birthdate-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="district-modal-title">Введите дату рождения</h3>
            
            <div className="birthdate-inputs">
              <div className="birthdate-field">
                <label>День</label>
                <input
                  type="text"
                  value={day}
                  onChange={handleDayChange}
                  placeholder="ДД"
                  maxLength={2}
                />
              </div>
              <span className="birthdate-separator">.</span>
              <div className="birthdate-field">
                <label>Месяц</label>
                <input
                  type="text"
                  value={month}
                  onChange={handleMonthChange}
                  placeholder="ММ"
                  maxLength={2}
                />
              </div>
              <span className="birthdate-separator">.</span>
              <div className="birthdate-field">
                <label>Год</label>
                <input
                  type="text"
                  value={year}
                  onChange={handleYearChange}
                  placeholder="ГГГГ"
                  maxLength={4}
                />
              </div>
            </div>

            <button
              className="district-apply-btn"
              disabled={!isValid}
              onClick={handleApply}
            >
              Применить
            </button>

            <button className="district-modal-close" onClick={handleClose}>
              <FiX size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Компонент для выбора района с модальным окном
function DistrictField({ label, value, onChange, onEditStateChange, isChanged }: { 
  label: string; 
  value: string; 
  onChange: (newValue: string) => void;
  onEditStateChange: (isEditing: boolean) => void;
  isChanged: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [currentValue, setCurrentValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const originalValueRef = useRef(value);
  const wasChangedRef = useRef(false);

  useEffect(() => {
    setCurrentValue(value);
    originalValueRef.current = value;
  }, [value]);

  // Сбрасываем режим редактирования когда isChanged меняется с true на false (после сохранения)
  useEffect(() => {
    if (!isChanged && wasChangedRef.current) {
      setIsEditing(false);
    }
    wasChangedRef.current = isChanged;
  }, [isChanged]);

  const handleEditClick = () => {
    if (isEditing || isChanged) {
      // Отмена изменений
      setCurrentValue(originalValueRef.current);
      onChange(originalValueRef.current);
      setIsEditing(false);
      onEditStateChange(false);
    } else {
      // Открываем модальное окно
      setIsModalOpen(true);
      setSelectedDistrict(null);
    }
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
  };

  const handleApply = () => {
    if (selectedDistrict) {
      setCurrentValue(selectedDistrict);
      onChange(selectedDistrict);
      setIsEditing(true);
      onEditStateChange(true);
      setIsModalOpen(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedDistrict(null);
  };

  return (
    <>
      <div className="setting-field">
        <span className="setting-label">{label}</span>
        <input 
          type="text" 
          value={currentValue}
          readOnly
          className={`setting-input setting-input--readonly ${isEditing || isChanged ? 'setting-input--editing' : ''}`}
        />
        <button 
          className={`setting-edit-btn ${isEditing || isChanged ? 'setting-edit-btn--active' : ''}`} 
          onClick={handleEditClick}
        >
          {isEditing || isChanged ? <FiX size={20} /> : <FiEdit2 size={20} />}
        </button>
      </div>

      {/* Модальное окно выбора района */}
      {isModalOpen && (
        <div className="district-modal-overlay" onClick={handleClose}>
          <div className="district-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="district-modal-title">Выберите район</h3>
            
            <div className="district-grid">
              {MOSCOW_DISTRICTS.map((district) => (
                <button
                  key={district}
                  className={`district-item ${selectedDistrict === district ? 'district-item--selected' : ''}`}
                  onClick={() => handleDistrictSelect(district)}
                >
                  {district}
                </button>
              ))}
            </div>

            <button
              className="district-apply-btn"
              disabled={!selectedDistrict}
              onClick={handleApply}
            >
              Применить
            </button>

            <button className="district-modal-close" onClick={handleClose}>
              <FiX size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Обычное текстовое поле (Фамилия, Имя, Почта)
function SettingField({ label, value, onChange, onEditStateChange, isChanged }: SettingFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const originalValueRef = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasChangedRef = useRef(false);

  useEffect(() => {
    setCurrentValue(value);
    originalValueRef.current = value;
  }, [value]);

  // Сбрасываем режим редактирования когда isChanged меняется с true на false (после сохранения)
  useEffect(() => {
    if (!isChanged && wasChangedRef.current) {
      setIsEditing(false);
    }
    wasChangedRef.current = isChanged;
  }, [isChanged]);

  const handleEditClick = () => {
    if (isEditing || isChanged) {
      // Отмена изменений
      setCurrentValue(originalValueRef.current);
      onChange(originalValueRef.current);
      setIsEditing(false);
      onEditStateChange(false);
    } else {
      // Включаем режим редактирования
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCurrentValue(newValue);
    onChange(newValue);
    // Сообщаем родителю что поле изменено если значение отличается от оригинала
    if (newValue !== originalValueRef.current) {
      onEditStateChange(true);
    } else {
      onEditStateChange(false);
    }
  };

  const handleBlur = () => {
    // Если значение не изменилось и мы не в режиме редактирования с изменениями
    if (currentValue === originalValueRef.current && !isChanged) {
      setIsEditing(false);
    }
  };

  return (
    <div className="setting-field">
      <span className="setting-label">{label}</span>
      <input 
        ref={inputRef}
        type="text" 
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={!isEditing}
        className={`setting-input ${isEditing || isChanged ? 'setting-input--editing' : 'setting-input--readonly'}`}
      />
      <button 
        className={`setting-edit-btn ${isEditing || isChanged ? 'setting-edit-btn--active' : ''}`} 
        onClick={handleEditClick}
      >
        {isEditing || isChanged ? <FiX size={20} /> : <FiEdit2 size={20} />}
      </button>
    </div>
  );
}

export default function SettingsPage () {
    const { isAuth, user_id } = useSelector((state : RootState) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate()
    const [userData, setUserData] = useState<UserSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Состояние для отслеживания измененных полей
    const [changedFields, setChangedFields] = useState<ChangedFields>({});
    const [editedValues, setEditedValues] = useState<Partial<UserSettingsData>>({});
    
    // Состояние сохранения
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [saveMessage, setSaveMessage] = useState('');
    
    // Состояние для файла фотографии
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

    // Загрузка данных пользователя
    useEffect(() => {
      if (!user_id) return;
      
      fetch(`http://localhost:8000/users/${user_id}/settings`, {
        credentials: 'include',
      })
        .then((res) => {
          if (!res.ok) throw new Error('Ошибка загрузки данных');
          return res.json();
        })
        .then((data: UserSettingsData) => {
          setUserData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Ошибка:', err);
          setLoading(false);
        });
    }, [user_id]);

    // Проверяем есть ли изменения
    const hasChanges = Object.values(changedFields).some(v => v);

    const handleFieldChange = (fieldName: string, newValue: string) => {
      setEditedValues(prev => ({ ...prev, [fieldName]: newValue }));
    };

    const handleEditStateChange = (fieldName: string, isChanged: boolean) => {
      setChangedFields(prev => ({ ...prev, [fieldName]: isChanged }));
    };

    const handleSave = async () => {
      if (!user_id || !userData) return;
      
      setSaveStatus('loading');
      
      try {
        // 1. Сначала загружаем фото если оно выбрано
        if (selectedPhoto) {
          const photoFormData = new FormData();
          photoFormData.append('file', selectedPhoto);
          
          const photoResponse = await fetch(`http://localhost:8000/users/${user_id}/photo`, {
            method: 'POST',
            credentials: 'include',
            body: photoFormData,
          });
          
          if (!photoResponse.ok) {
            const errorData = await photoResponse.json();
            throw new Error(errorData.detail || 'Ошибка загрузки фотографии');
          }
          
          const photoResult = await photoResponse.json();
          console.log('Фото загружено:', photoResult);
        }
        
        // 2. Формируем данные для обновления настроек
        const updateData: Partial<UserSettingsData> = {};
        
        if (editedValues.last_name !== undefined && editedValues.last_name !== userData.last_name) {
          updateData.last_name = editedValues.last_name;
        }
        if (editedValues.first_name !== undefined && editedValues.first_name !== userData.first_name) {
          updateData.first_name = editedValues.first_name;
        }
        if (editedValues.birth_date !== undefined && editedValues.birth_date !== userData.birth_date) {
          updateData.birth_date = editedValues.birth_date;
        }
        if (editedValues.gender !== undefined && editedValues.gender !== userData.gender) {
          updateData.gender = editedValues.gender;
        }
        if (editedValues.district !== undefined && editedValues.district !== userData.district) {
          updateData.district = editedValues.district;
        }
        if (editedValues.email !== undefined && editedValues.email !== userData.email) {
          updateData.email = editedValues.email;
        }
        
        // 3. Отправляем обновление настроек только если есть изменения
        if (Object.keys(updateData).length > 0) {
          const response = await fetch(`http://localhost:8000/users/${user_id}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка сохранения');
          }
          
          const result = await response.json();
          
          if (result.success) {
            // Обновляем userData
            setUserData(prev => prev ? { ...prev, ...editedValues } : null);
            
            // Обновляем данные в Redux store (authSlice)
            const profileUpdate: { first_name?: string; last_name?: string; district?: string } = {};
            if (editedValues.first_name !== undefined) {
              profileUpdate.first_name = editedValues.first_name;
            }
            if (editedValues.last_name !== undefined) {
              profileUpdate.last_name = editedValues.last_name;
            }
            if (editedValues.district !== undefined) {
              profileUpdate.district = editedValues.district;
            }
            dispatch(updateUserProfile(profileUpdate));
          }
        }
        
        setSaveStatus('success');
        setSaveMessage('Данные успешно сохранены!');
        
        // Сбрасываем состояние изменений
        setChangedFields({});
        setEditedValues({});
        setSelectedPhoto(null);
        
        // Через 3 секунды скрываем сообщение
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 3000);
      } catch (error: any) {
        setSaveStatus('error');
        setSaveMessage(error.message || 'Произошла ошибка при сохранении');
        
        // Через 3 секунды скрываем сообщение об ошибке
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 3000);
      }
    };

    const handlePhotoSelect = (file: File | null) => {
      setSelectedPhoto(file);
    };

    if (!isAuth){
        navigate(`/`);
        return null
    }

    if (loading) {
      return (
        <div className='SettingPage'>
          <NavbarLogin />
          <div className="meetings-settings-panel">
            <NavBar />
          </div>
          <main className='settings-page-content'>
            <p>Загрузка...</p>
          </main>
          <Footer />
        </div>
      );
    }

    return (
        <div className='SettingPage'>
            <NavbarLogin />
            <div className="meetings-settings-panel">
                <NavBar />
            </div>
            <main className='settings-page-content'>
                {/* Блок загрузки фотографии */}
                <PhotoUploadField 
                  onFileSelect={handlePhotoSelect} 
                  isChanged={changedFields['Фото'] || false}
                  onEditStateChange={(isChanged) => handleEditStateChange('Фото', isChanged)}
                />

                {/* Поля настроек */}
                <div className="settings-form">
                  {userData && (
                    <>
                      <SettingField 
                        label="Фамилия"  
                        value={userData.last_name} 
                        onChange={(val) => handleFieldChange('last_name', val)}
                        onEditStateChange={(isChanged) => handleEditStateChange('Фамилия', isChanged)}
                        isChanged={changedFields['Фамилия'] || false}
                      />
                      <SettingField 
                        label="Имя" 
                        value={userData.first_name} 
                        onChange={(val) => handleFieldChange('first_name', val)}
                        onEditStateChange={(isChanged) => handleEditStateChange('Имя', isChanged)}
                        isChanged={changedFields['Имя'] || false}
                      />
                      <BirthDateField 
                        label="Дата рождения" 
                        value={userData.birth_date} 
                        onChange={(val) => handleFieldChange('birth_date', val)}
                        onEditStateChange={(isChanged) => handleEditStateChange('Дата рождения', isChanged)}
                        isChanged={changedFields['Дата рождения'] || false}
                      />
                      <GenderField 
                        label="Пол" 
                        value={userData.gender} 
                        onChange={(val) => handleFieldChange('gender', val)}
                        onEditStateChange={(isChanged) => handleEditStateChange('Пол', isChanged)}
                        isChanged={changedFields['Пол'] || false}
                      />
                      <DistrictField 
                        label="Квартал" 
                        value={userData.district} 
                        onChange={(val) => handleFieldChange('district', val)}
                        onEditStateChange={(isChanged) => handleEditStateChange('Квартал', isChanged)}
                        isChanged={changedFields['Квартал'] || false}
                      />
                      <SettingField 
                        label="Почта" 
                        value={userData.email} 
                        onChange={(val) => handleFieldChange('email', val)}
                        onEditStateChange={(isChanged) => handleEditStateChange('Почта', isChanged)}
                        isChanged={changedFields['Почта'] || false}
                      />
                    </>
                  )}
                </div>

                {/* Кнопка Сохранить или сообщение о статусе */}
                {saveStatus === 'success' ? (
                  <div className="settings-message settings-message--success">
                    {saveMessage}
                  </div>
                ) : saveStatus === 'error' ? (
                  <div className="settings-message settings-message--error">
                    {saveMessage}
                  </div>
                ) : saveStatus === 'loading' ? (
                  <button className="settings-save-btn settings-save-btn--loading" disabled>
                    Сохранение...
                  </button>
                ) : hasChanges ? (
                  <button className="settings-save-btn" onClick={handleSave}>
                    Сохранить
                  </button>
                ) : null}
            </main>
            <Footer />
        </div>
    )
}
