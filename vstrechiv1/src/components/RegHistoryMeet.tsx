import './RegHistoryMeet.css'
import MeetingAsItem from './MeetingAsItem';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import { useNavigate } from 'react-router-dom';

interface MeetingTypeOne {
    meeting_id: number;
    meeting_title: string;
    registered_users_count: number;
    max_people_allowed: number;
    district: string;
    adults_only_18plus: boolean;
    start_at: string;
    end_at: string;
    category_ids: number[];
  }

  export default function RegHistoryMeet() {
    const { user_id } = useSelector((state: RootState) => state.auth);
  
    const [regedMeetings, setRegedMeetings] = useState<MeetingTypeOne[]>([]);
    const [attendedMeetings, setAttendedMeetings] = useState<MeetingTypeOne[]>([]);
  
    const [regedOpen, setRegedOpen] = useState(true);
    const [attendedOpen, setAttendedOpen] = useState(true);

    const navigate = useNavigate();
  
    useEffect(() => {
      if (!user_id) return;
  
      fetch(`http://localhost:8000/users/${user_id}/info_reged_meetings`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data: MeetingTypeOne[]) => setRegedMeetings(data))
        .catch(console.error);
  
      fetch(`http://localhost:8000/users/${user_id}/info_atted_meetings`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data: MeetingTypeOne[]) => setAttendedMeetings(data))
        .catch(console.error);
    }, [user_id]);
  
    return (
      <div className="reg-history">
  
        {/* Записи */}
        <div className="reg-history-section">
          <button
            className="reg-history-header"
            onClick={() => setRegedOpen((prev) => !prev)}
          >
            <span>Записи</span>
            {regedOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
  
          {regedOpen && (
            <div className="reg-history-grid">
              {regedMeetings.length === 0 ? (
                <p className="reg-history-empty">Нет активных записей</p>
              ) : (
                regedMeetings.map((meeting) => (
                  <div
                    key={meeting.meeting_id}
                    onClick={() => {
                      console.log(meeting.meeting_id);
                      navigate(`/meetings/info_reged/${meeting.meeting_id}`);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <MeetingAsItem
                      meeting_title={meeting.meeting_title}
                      registered_users_count={meeting.registered_users_count}
                      max_people_allowed={meeting.max_people_allowed}
                      district={meeting.district}
                      adults_only_18plus={meeting.adults_only_18plus}
                      start_at = {meeting.start_at}
                      end_at = {meeting.end_at}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
  
        {/* История */}
        <div className="reg-history-section">
          <button
            className="reg-history-header"
            onClick={() => setAttendedOpen((prev) => !prev)}
          >
            <span>История</span>
            {attendedOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
  
          {attendedOpen && (
            <div className="reg-history-grid reg-history-grid--attended">
              {attendedMeetings.length === 0 ? (
                <p className="reg-history-empty">История пуста</p>
              ) : (
                attendedMeetings.map((meeting) => (
                  <div
                  key={meeting.meeting_id}
                  onClick={() => {
                    console.log(meeting.meeting_id);
                    navigate(`/meetings/info_history/${meeting.meeting_id}`);
                  }}
                  style={{ cursor: 'pointer' }}
                  >
                    <MeetingAsItem
                      key={meeting.meeting_id}
                      meeting_title={meeting.meeting_title}
                      registered_users_count={meeting.registered_users_count}
                      max_people_allowed={meeting.max_people_allowed}
                      district={meeting.district}
                      adults_only_18plus={meeting.adults_only_18plus}
                      start_at = {meeting.start_at}
                      end_at = {meeting.end_at}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
  
      </div>
    );
  }