import { FiUser, FiSettings, FiBarChart2, FiMessageSquare, FiShoppingCart } from 'react-icons/fi';
import './NavBar.css';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavBarProps {
  onChange?: (tab: 'profile' | 'settings' | 'stats' | 'messages' | 'shop') => void;
}

const NavBar: React.FC<NavBarProps> = ({ onChange }) => {
  const items = [
    { key: 'profile',  icon: <FiUser size={24} />,        path: '/user' },
    { key: 'settings', icon: <FiSettings size={24} />,    path: '/settings' },
    { key: 'stats',    icon: <FiBarChart2 size={24} />,   path: '/stats' },
    { key: 'messages', icon: <FiMessageSquare size={24} />, path: '/messages' },
    { key: 'shop',     icon: <FiShoppingCart size={24} />, path: '/shop' },
  ] as const;

  const { user_id } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (key: typeof items[number]['key']) => {
    if (key === 'profile') navigate(`/user/${user_id}`);
    if (key === 'settings') navigate(`/settings`)
    onChange?.(key);
  };

  return (
    <div className="settings-panel">
      {items.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <button
            key={item.key}
            className={`settings-icon ${isActive ? 'settings-icon--active' : ''}`}
            onClick={() => handleClick(item.key)}
          >
            {item.icon}
          </button>
        );
      })}
    </div>
  );
};

export default NavBar;
