import { NavLink } from 'react-router-dom';
import './RegistrationNavbar.css';

const RegistrationNavbar: React.FC = () => {
  return (
    <nav className="registration-navbar">
      <NavLink to="/" className="logo">
        VSTRECHI.RU
      </NavLink>
      <div className="nav-links">
        <NavLink
          to="/about"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          О проекте
        </NavLink>
        <span className="nav-link nav-link--disabled">
          Встречи
        </span>
        <NavLink
          to="/faq"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          FAQ
        </NavLink>
      </div>
    </nav>
  );
};

export default RegistrationNavbar;
