import { useSelector } from 'react-redux'
import './SettingsPage.css'
import type { RootState }  from '../slices/store';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { FiEdit2, FiDownload, FiX } from 'react-icons/fi';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

interface SettingFieldProps {
  label: string;
  value: string;
  disabled?: boolean;
  onEdit: (fieldName: string) => void;
}

function SettingField({ label, value, disabled = false, onEdit }: SettingFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const originalValueRef = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = () => {
    if (isEditing) {
      // Если уже в режиме редактирования - отменяем изменения
      setCurrentValue(originalValueRef.current);
      setIsEditing(false);
    } else {
      // Включаем режим редактирования
      onEdit(label);
      setIsEditing(true);
      // Фокусируем input после включения редактирования
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };

  return (
    <div className="setting-field">
      <span className="setting-label">{label}</span>
      <input 
        ref={inputRef}
        type="text" 
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        readOnly={!isEditing}
        className={`setting-input ${disabled ? 'setting-input--disabled' : ''} ${isEditing ? 'setting-input--editing' : 'setting-input--readonly'}`}
      />
      {!disabled ? (
        <button 
          className={`setting-edit-btn ${isEditing ? 'setting-edit-btn--active' : ''}`} 
          onClick={handleEditClick}
        >
          {isEditing ? <FiX size={20} /> : <FiEdit2 size={20} />}
        </button>
      ) : (
        <div className="setting-edit-placeholder" />
      )}
    </div>
  );
}

export default function SettingsPage () {
    const { isAuth } = useSelector((state : RootState) => state.auth);
    const navigate = useNavigate()

    if (!isAuth){
        navigate(`/`);
        return null
    }

    const handleEdit = (fieldName: string) => {
      console.log(fieldName);
    };

    const handlePhotoUpload = () => {
      console.log('Загрузить фотографию');
    };

    return (
        <div className='SettingPage'>
            <NavbarLogin />
            <div className="meetings-settings-panel">
                <NavBar />
            </div>
            <main className='settings-page-content'>
                {/* Блок загрузки фотографии */}
                <div className="setting-photo-upload">
                  <span className="setting-photo-label">Загрузить фотографию*</span>
                  <button className="setting-photo-btn" onClick={() => handlePhotoUpload()}>
                    <FiDownload size={24} />
                  </button>
                </div>

                {/* Поля настроек */}
                <div className="settings-form">
                  <SettingField 
                    label="Фамилия" 
                    value="Флоринский" 
                    onEdit={handleEdit} 
                  />
                  <SettingField 
                    label="Имя" 
                    value="Влад" 
                    onEdit={handleEdit} 
                  />
                  <SettingField 
                    label="Дата рождения" 
                    value="28.02.2004" 
                    onEdit={handleEdit} 
                  />
                  <SettingField 
                    label="Пол" 
                    value="Мужской" 
                    onEdit={handleEdit} 
                  />
                  <SettingField 
                    label="Квартал" 
                    value="ВАО" 
                    onEdit={handleEdit} 
                  />
                  <SettingField 
                    label="Почта" 
                    value="pochta@gmail.com" 
                    onEdit={handleEdit} 
                  />
                  <SettingField 
                    label="Код с почты" 
                    value="" 
                    disabled={true}
                    onEdit={() => {}}
                  />
                  <SettingField 
                    label="Пароль" 
                    value="********************" 
                    onEdit={handleEdit} 
                  />
                </div>
            </main>
            <Footer />
        </div>
    )
}
