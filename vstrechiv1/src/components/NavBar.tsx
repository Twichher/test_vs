import { FiUser, FiSettings, FiBarChart2, FiMessageSquare, FiShoppingCart } from 'react-icons/fi';
import './NavBar.css';

interface NavBarProps {
  onChange: (tab: 'profile' | 'settings' | 'stats' | 'messages' | 'shop') => void;
}

const NavBar: React.FC<NavBarProps> = ({ onChange }) => {
  const items = [
    { key: 'profile',  icon: <FiUser size={24} /> },
    { key: 'settings', icon: <FiSettings size={24} /> },
    { key: 'stats',    icon: <FiBarChart2 size={24} /> },
    { key: 'messages', icon: <FiMessageSquare size={24} /> },
    { key: 'shop',     icon: <FiShoppingCart size={24} /> },
  ] as const;

  return (
    <div className="settings-panel">
      {items.map((item) => (
        <button
          key={item.key}
          className="settings-icon"
          onClick={() => onChange(item.key)}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
};

export default NavBar;
