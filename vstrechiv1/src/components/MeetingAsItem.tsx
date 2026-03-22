import { PiUsersFill } from 'react-icons/pi';
import './MeetingAsItem.css'

interface MeetingAsItemProps {
  meeting_title: string;
  registered_users_count: number;
  max_people_allowed: number;
  district: string;
  adults_only_18plus: boolean;
  start_at: string;
  end_at: string;
  isReged?: boolean;
}

const MeetingAsItem: React.FC<MeetingAsItemProps> = ({
  meeting_title,
  registered_users_count,
  max_people_allowed,
  district,
  adults_only_18plus,
  start_at,
  end_at,
  isReged = false, 
}) => {
  const startDate = new Date(start_at);
  const endDate = new Date(end_at);
  
  const dateStr = startDate.toLocaleString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  
  const timeStr = `${startDate.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })} – ${endDate.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  return (
    <div className={`meeting-card ${isReged ? 'meeting-card--reged' : ''}`}>
      {adults_only_18plus && <span className="meeting-badge">18+</span>}
      <h3 className="meeting-title">{meeting_title}</h3>

      <div className="meeting-datetime">
        <span className="meeting-date">{dateStr} – {timeStr}</span>
      </div>


      <div className="meeting-footer">
        <span className="meeting-people">
          <PiUsersFill size={18} /> {registered_users_count}/{max_people_allowed}
        </span>
        <span className="meeting-district">{district}</span>
      </div>
    </div>
  );
};

export default MeetingAsItem;
