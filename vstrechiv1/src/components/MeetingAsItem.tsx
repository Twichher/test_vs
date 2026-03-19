import { PiUsersFill } from 'react-icons/pi';
import './MeetingAsItem.css'

interface MeetingAsItemProps {
  meeting_title: string;
  registered_users_count: number;
  max_people_allowed: number;
  district: string;
  adults_only_18plus: boolean;
  isReged?: boolean;
}

const MeetingAsItem: React.FC<MeetingAsItemProps> = ({
  meeting_title,
  registered_users_count,
  max_people_allowed,
  district,
  adults_only_18plus,
  isReged = false,  
}) => {
  return (
    <div className={`meeting-card ${isReged ? 'meeting-card--reged' : ''}`}>
      {adults_only_18plus && <span className="meeting-badge">18+</span>}
      <h3 className="meeting-title">{meeting_title}</h3>
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
