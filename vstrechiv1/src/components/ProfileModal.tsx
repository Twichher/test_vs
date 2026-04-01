import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import ProfileCard from './ProfileCard';
import './UserComponent.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  firstName: string;
  lastName: string;
}

export default function ProfileModal({ isOpen, onClose, userId, firstName, lastName }: ProfileModalProps) {
  // Состояние для модального окна фото
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [allPhotos, setAllPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
  
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (photoModalOpen) {
          setPhotoModalOpen(false);
        } else {
          onClose();
        }
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, photoModalOpen]);

  const handlePhotoClick = (photoUrl: string, photos: string[]) => {
    setSelectedPhoto(photoUrl);
    setAllPhotos(photos);
    setPhotoModalOpen(true);
  };

  if (!isOpen || !userId) return null;

  return (
    <>
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="profile-modal-close" onClick={onClose}>
            <FiX size={24} />
          </button>
          <ProfileCard
            userId={userId}
            firstname={firstName}
            lastname={lastName}
            onPhotoClick={handlePhotoClick}
          />
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
