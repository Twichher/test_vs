import { NavLink } from 'react-router-dom';

const NavbarNoLogin: React.FC = () => {
    return (
      <nav className="navbar">
      <a href="/" className="logo">VSTRECHI.RU</a>
      <div className="nav-links">
        <NavLink
          to="/about"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          О проекте
        </NavLink>
        <NavLink
          to="/meetings"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          Встречи
        </NavLink>
        <NavLink
          to="/faq"
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          FAQ
        </NavLink>
      </div>
      <div className="auth-buttons">
        <a href="/login" className="login">Войти</a>
        <a href="/register" className="register">Регистрация</a>
      </div>
    </nav>
    );
  };
  
  export default NavbarNoLogin;
  