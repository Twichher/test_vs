import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch, RootState } from '../slices/store';
import { BsLightningChargeFill } from 'react-icons/bs';
import { MdOutlineExitToApp } from 'react-icons/md';
import { clearUser } from '../slices/authSlice';
import './NavbarLogin.css'

const NavbarLogin: React.FC = () => {
  const { first_name, last_name, meetings_as_currency } = useSelector(
    (state: RootState) => state.auth
  );

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    // Удалить куку на бэкенде
    fetch('http://localhost:8000/logout', {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      dispatch(clearUser());  // ← обнулить Redux
      navigate('/');          // ← редирект на главную
    });
  };

  return (
    <nav className="navbar">
      <a href="/" className="logo">VSTRECHI.RU</a>
      <div className="nav-links">
        <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          О проекте
        </NavLink>
        <NavLink to="/meetings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Встречи
        </NavLink>
        <NavLink to="/faq" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          FAQ
        </NavLink>
      </div>

      {/* Вместо кнопок — данные пользователя */}
      <div className="user-panel">
        <div className="user-info">
          <span className="user-name">{first_name} {last_name?.charAt(0)}.</span>
          <span className="user-currency">
            {meetings_as_currency} <BsLightningChargeFill color="#7c3aed" size={15} />
          </span>
        </div>

        {/* Кнопка выхода */}
        <button className="logout-btn" onClick={handleLogout} title="Выйти">
          <MdOutlineExitToApp size={24} color="#e05555" />
        </button>
      </div>
    </nav>
  );
};

export default NavbarLogin;
