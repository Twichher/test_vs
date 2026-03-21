import { BsPerson } from 'react-icons/bs';
import './UserComponent.css';
import { useEffect, useState } from 'react';
import ProfileCard from './ProfileCard';
import { FiX } from 'react-icons/fi';

interface UserComponentProps {
  user_id: number;
  first_name: string;
  last_name: string;
  is_organizer: boolean;
  user_action: string;
  photo_url: string | null;
  isCurrentUser?: boolean;
}

export default function UserComponent({
  user_id,
  first_name,
  last_name,
  is_organizer,
  user_action,
  photo_url,
  isCurrentUser
}: UserComponentProps) {
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
      if (!modalOpen) return;
    
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setModalOpen(false);
      };
    
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [modalOpen]);

    return (
        <>
      <div
        className={`user-component ${isCurrentUser ? 'user-component--current' : ''} ${user_action === 'missed' ? 'user-component--missed' : ''}`}
        onClick={() => setModalOpen(true)}
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

      {/* Модальное окно */}
      {modalOpen && (
        <div className="user-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="user-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="user-modal-close" onClick={() => setModalOpen(false)}><FiX size={24} /></button>
            <ProfileCard
              userId={user_id}
              firstname={first_name}
              lastname={last_name}
              isOrganizer={is_organizer}
            />
          </div>
        </div>
      )}
    </>
  );
}
