import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';
import UserComponent from '../components/UserComponent';
import Footer from '../components/Footer';
import './OneMeetingPageHistory.css'
import MeetingExpandedInfoHistory from '../components/MeetingExpandedInfoHistory';

interface MeetingRegedMissedUser {
    user_id: number;
    first_name: string;
    last_name: string;
    is_organizer: boolean;
    user_action: string;
    photo_url: string | null;
  }

// Компонент загрузки
function LoadingSpinner() {
  return (
    <div className="meeting-loading">
      <div className="meeting-loading-spinner"></div>
      <p className="meeting-loading-text">Загрузка...</p>
    </div>
  );
}

export default function OneMeetingPageHistory() {
    const { meeting_id } = useParams<{ meeting_id: string }>();
    const [searchParams] = useSearchParams();
    const { user_id } = useSelector((state: RootState) => state.auth);
    
    const userAction = searchParams.get('action');
  
    const [regedUsers, setRegedUsers] = useState<MeetingRegedMissedUser[]>([]);
    const [usersOpen, setUsersOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [pageVisible, setPageVisible] = useState(false);
  
    useEffect(() => {
      // Плавное появление страницы
      const timer = setTimeout(() => setPageVisible(true), 50);
      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      if (!meeting_id) return;
      
      setIsLoading(true);
      
      fetch(`http://localhost:8000/meetings/${meeting_id}/atted_users`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data: MeetingRegedMissedUser[]) => {
          setRegedUsers(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setIsLoading(false);
        });
    }, [meeting_id]);
  
    return (
      <div className={`meeting-page ${pageVisible ? 'meeting-page--visible' : ''}`}>
        <NavbarLogin />
        <NavBar onChange={() => {}} />
  
        <main className="meeting-page-content">
          <div className="meeting-page-inner">
  
            {!userAction ? (
              <div className="access-denied meeting-fade-in">
                <h2>Нет доступа</h2>
                <p>Доступ к этой странице возможен только через историю встреч.</p>
              </div>
            ) : isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="meeting-fade-in meeting-fade-in--1">
                  <MeetingExpandedInfoHistory meeting_id={Number(meeting_id)} />
                </div>
  
                <div className="meeting-fade-in meeting-fade-in--2">
                  {/* Секция записанных пользователей */}
                  <div className="meeting-users-section">
                    <button
                      className="meeting-users-header"
                      onClick={() => setUsersOpen((prev) => !prev)}
                    >
                      <span>Записаны</span>
                      {usersOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                    </button>
        
                    {usersOpen && (
                      <div className="meeting-users-grid">
                        {regedUsers.map((u, index) => (
                          <div 
                            key={u.user_id}
                            className="meeting-user-item"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <UserComponent
                              user_id={u.user_id}
                              first_name={u.first_name}
                              last_name={u.last_name}
                              is_organizer={u.is_organizer}
                              user_action={u.user_action}
                              photo_url={u.photo_url}
                              isCurrentUser={u.user_id === user_id}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
  
          </div>
        </main>

        <Footer />
      </div>
    );
}
