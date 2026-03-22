import { useSelector } from 'react-redux'
import './SettingsPage.css'
import type { RootState }  from '../slices/store';
import { useNavigate } from 'react-router-dom';
import NavbarLogin from '../components/NavbarLogin';
import NavBar from '../components/NavBar';

export default function SettingsPage () {
    const isAuth = useSelector((state : RootState) => state.auth);
    const navigate = useNavigate()

    if (!isAuth){
        navigate(`/`);
        return null
    }


    return (
        <div className='SettingPage'>
            <NavbarLogin />
            <div className="meetings-settings-panel">
                <NavBar />
            </div>
        </div>
    )
}