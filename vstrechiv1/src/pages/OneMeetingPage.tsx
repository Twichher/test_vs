import Footer from '../components/Footer'
import MeetingExpandedInfo from '../components/MeetingExpandedInfo'
import NavBar from '../components/NavBar'
import NavbarLogin from '../components/NavbarLogin'
import './OneMeetingPage.css'
import { useParams } from 'react-router-dom';

export default function OneMeetingPage () {

    const { meeting_id } = useParams<{ meeting_id: string }>();

    return (
        <div className="meeting-page">
            <NavbarLogin />
        <div className="meetings-settings-panel">
                <NavBar onChange={() => {}} />
          </div>
          <main className="meeting-page-content">
            <MeetingExpandedInfo meeting_id={Number(meeting_id)} />
          </main>
  
        <Footer />
      </div>
    )

}