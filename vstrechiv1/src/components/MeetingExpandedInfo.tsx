import './MeetingExpandedInfo.css'
import { useEffect, useState } from 'react';
import { FiCalendar, FiSearch, FiX } from 'react-icons/fi';
import { BsPerson } from 'react-icons/bs';
import { PiUsersFill } from 'react-icons/pi';
import { TbMapPin } from 'react-icons/tb';
import ProfileCard from './ProfileCard';

interface MeetingInfoV2 {
    meeting_id: number;
    status: string;
    meeting_title: string;
    meeting_start_at: string;
    meeting_end_at : string;
    creator_user_id: number;
    creator_first_name: string;
    creator_last_name: string;
    registered_users_count: number;
    max_people: number;
    district: string;
    adults_only: boolean;
    warnings: string;
    meeting_description: string;
    meeting_city?: string;
    meeting_adress: string;
  }

interface MeetingExpandedInfoProps {
    meeting_id : number
}

export default function MeetingExpandedInfo({meeting_id} : MeetingExpandedInfoProps){
    const [info, setInfo] = useState<MeetingInfoV2 | null>(null);

    const [profileModalUserId, setProfileModalUserId] = useState<number | null>(null); // state для модалки и открытие по клику
    const [profileModalfirstname, setProfileModalFirstName] = useState<string | undefined>(undefined)
    const [profileModallastname, setProfileModalLastName] = useState<string | undefined>(undefined)

    useEffect(() => {
      fetch(`http://localhost:8000/meetings/${meeting_id}/reged_info`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data: MeetingInfoV2) => {  
          console.log(data);
          setInfo(data);
        })
        .catch(console.error);
    }, [meeting_id]);

    if (!info) return <div className="meeting-expanded-info-card" />;

    return (
    <div className="meeting-expanded-info-card">
        <h2 className="mei-title">
        {info.meeting_title}
        {info.adults_only && <span className="mei-badge">18+</span>}
      </h2>

      {/* Дата */}
      <div className="mei-row">
        <FiCalendar size={18} />
        <span>
          {new Date(info.meeting_start_at).toLocaleString('ru-RU', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })} - {new Date(info.meeting_end_at).toLocaleString('ru-RU', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Организатор */}
      <div className="mei-row">
        <BsPerson size={18} />
        <span className="mei-organizer">
          {info.creator_first_name} {info.creator_last_name?.charAt(0)}.
        </span>
        <button
          className="mei-search-btn"
          onClick={(e) => {
            console.log(info.creator_user_id);
            e.stopPropagation();
            setProfileModalUserId(info.creator_user_id);
            setProfileModalLastName(info.creator_last_name)
            setProfileModalFirstName(info.creator_first_name)
        }}
        >
          <FiSearch size={16} />
        </button>
      </div>

      {/* Адрес */}
      <div className="mei-row">
        <TbMapPin size={18} />
        <span>{info.meeting_city}, {info.meeting_adress}</span>
      </div>

      {/* Участники и район */}
      <div className="mei-row">
        <PiUsersFill size={18} />
        <span>{info.registered_users_count}/{info.max_people}</span>
        <span className="mei-district">{info.district}</span>
      </div>

      {/* Важно */}
      {info.warnings && (
        <p className="mei-warnings">
          <span className="mei-warnings-label">Важно:</span> {info.warnings}
        </p>
      )}

      {/* Описание */}
      {info.meeting_description && (
        <p className="mei-description">
          Описание: {info.meeting_description}
        </p>
      )}

    {profileModalUserId !== null && (
        <div className="profile-modal-overlay" onClick={() => setProfileModalUserId(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="profile-modal-close" onClick={() => setProfileModalUserId(null)}>
              <FiX size={24} />
            </button>
            <ProfileCard userId={profileModalUserId} firstname={profileModalfirstname} lastname={profileModallastname} isOrganizer={true} />
          </div>
        </div>
      )}

    </div>
    )
}