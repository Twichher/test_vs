import { BsPerson } from 'react-icons/bs';
import './UserComponent.css';
import { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface UserComponentProps {
  user_id: number;
  first_name: string;
  last_name: string;
  is_organizer: boolean;
  user_action: string;
  photo_url: string | null;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

export default function UserComponent({
  user_id,
  first_name,
  last_name,
  is_organizer: _is_organizer,
  user_action,
  photo_url,
  isCurrentUser,
  onClick
}: UserComponentProps) {
    // Состояние для модального окна фото
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [allPhotos, setAllPhotos] = useState<string[]>([]);

    const handlePhotoClick = (photoUrl: string, photos: string[]) => {
      setSelectedPhoto(photoUrl);
      setAllPhotos(photos);
      setPhotoModalOpen(true);
    };

    const handleClick = () => {
      if (onClick) {
        onClick();
      }
    };

    return (
        <>
      <div
        className={`user-component ${isCurrentUser ? 'user-component--current' : ''} ${user_action === 'missed' ? 'user-component--missed' : ''} ${user_action === 'missedbyorg' ? 'user-component--missedbyorg' : ''}`}
        onClick={handleClick}
      >
        {/* Аватар */}
        <div className="user-component-avatar">
          {photo_url ? (
            <img src={photo_url} alt="avatar" className="user-component-avatar-img" />
          ) : (
            <BsPerson size={32} className="user-component-avatar-icon" />
          )}
        </div>

        {/* Имя */}
        <div className="user-component-name">
          <span>{first_name}</span>
          <span>{last_name}</span>
        </div>
      </div>

      {/* Модальное окно фото */}
      {photoModalOpen && (
        <div className="photo-modal-overlay" onClick={() => setPhotoModalOpen(false)}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setPhotoModalOpen(false)}>
              <FiX size={24} />
            </button>

            <div className="photo-modal-thumbnails">
              {[...allPhotos].reverse().map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`photo-${index}`}
                  className={`photo-modal-thumb ${selectedPhoto === url ? 'photo-modal-thumb--active' : ''}`}
                  onClick={() => setSelectedPhoto(url)}
                />
              ))}
            </div>

            <div className="photo-modal-main">
              {selectedPhoto && (
                <img src={selectedPhoto} alt="selected" className="photo-modal-main-img" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
