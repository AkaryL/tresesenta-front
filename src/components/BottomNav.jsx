import { NavLink } from 'react-router-dom';
import { Map, Route, Plus, Ticket, User } from 'lucide-react';
import './BottomNav.css';

const PROFILE_COLORS = {
  beige: '#d6cfc4',
  camel: '#b89b7a',
  sage: '#8f9b8a',
  gray: '#9a9a96',
  steel: '#7f8a92',
  olive: '#343316',
};

const BottomNav = () => {
  const colorId = localStorage.getItem('passport_color') || 'olive';
  const accentColor = PROFILE_COLORS[colorId] || PROFILE_COLORS.olive;

  return (
    <nav className="bottom-nav" style={{ '--nav-accent': accentColor }}>
      <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Map size={22} strokeWidth={2} />
        <span className="nav-label">Mapa</span>
      </NavLink>

      <NavLink to="/routes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Route size={22} strokeWidth={2} />
        <span className="nav-label">Rutas</span>
      </NavLink>

      <NavLink to="/create" className="nav-item nav-item-create">
        <div className="create-btn" style={{ background: accentColor }}>
          <Plus size={24} strokeWidth={2.5} />
        </div>
      </NavLink>

      <NavLink to="/passport" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Ticket size={22} strokeWidth={2} />
        <span className="nav-label">Pasaporte</span>
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User size={22} strokeWidth={2} />
        <span className="nav-label">Perfil</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
