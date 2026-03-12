import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import LoginModal from '../pages/LoginModal';


const NavbarNoLogin: React.FC = () => {

    const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

    return (
      <>
      <nav className="navbar"> 
      <a href="/" className="logo">VSTRECHI.RU</a>
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
      <div className="auth-buttons">
          <button className="login" onClick={() => setIsLoginOpen(true)}>Войти</button>
          <a href="/register" className="register">Регистрация</a>
      </div>
    </nav>

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}

    </>
    );
  };
  
  export default NavbarNoLogin;
  