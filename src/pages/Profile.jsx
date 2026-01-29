import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Heart, Route, Gift, ChevronRight, Award } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Profile.css';
import './Auth.css';

// Import insignias
import selloRaicesEternas from '../assets/insignias/sello-raices-eternas.png';
import selloCaminoReal from '../assets/insignias/sello-camino-real.png';
import selloDesiertoYMar from '../assets/insignias/sello-desierto-y-mar.png';
import selloCorazonDelPais from '../assets/insignias/sello-corazon-del-pais.png';
import selloHuastecaMagica from '../assets/insignias/sello-huasteca-magica.png';
import selloMarDelCortes from '../assets/insignias/sello-mar-del-cortes.png';

const LEVELS = [
  { name: 'Explorador Novato', min: 0, max: 5000 },
  { name: 'Viajero Local', min: 5000, max: 15000 },
  { name: 'Aventurero Experto', min: 15000, max: 30000 },
  { name: 'Explorador Universal', min: 30000, max: 50000 },
  { name: 'Leyenda 360', min: 50000, max: 999999 },
];

const PROFILE_COLORS = [
  { id: 'beige', bg: '#d6cfc4', wave: '#AEAA9F', textColor: '#4a4a48' },
  { id: 'camel', bg: '#b89b7a', wave: '#A88565', textColor: '#ffffff' },
  { id: 'sage', bg: '#8f9b8a', wave: '#9AA79A', textColor: '#ffffff' },
  { id: 'gray', bg: '#9a9a96', wave: '#747678', textColor: '#ffffff' },
  { id: 'steel', bg: '#7f8a92', wave: '#7F8A92', textColor: '#ffffff' },
  { id: 'olive', bg: '#343316', wave: '#44431D', textColor: '#ffffff' },
];

// Insignias de ejemplo (en produccion vendrian del backend)
const SAMPLE_BADGES = [
  { id: 1, name: 'Raíces Eternas', state: 'Oaxaca', image: selloRaicesEternas, unlocked: true },
  { id: 2, name: 'Camino Real', state: 'Querétaro', image: selloCaminoReal, unlocked: true },
  { id: 3, name: 'Desierto y Mar', state: 'Sonora', image: selloDesiertoYMar, unlocked: true },
  { id: 4, name: 'Corazón del País', state: 'CDMX', image: selloCorazonDelPais, unlocked: true },
  { id: 5, name: 'Huasteca Mágica', state: 'San Luis Potosí', image: selloHuastecaMagica, unlocked: false },
  { id: 6, name: 'Mar del Cortés', state: 'Baja California', image: selloMarDelCortes, unlocked: false },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedColor, setSelectedColor] = useState('olive');
  const [badges, setBadges] = useState(SAMPLE_BADGES);

  const userPoints = user?.total_points || 36000;
  const unlockedBadges = badges.filter(b => b.unlocked).length;
  const totalBadges = 32;

  const getLevelInfo = (points) => {
    for (let i = 0; i < LEVELS.length; i++) {
      if (points >= LEVELS[i].min && points < LEVELS[i].max) {
        const progress = ((points - LEVELS[i].min) / (LEVELS[i].max - LEVELS[i].min)) * 100;
        return {
          current: LEVELS[i].name,
          next: i < LEVELS.length - 1 ? LEVELS[i + 1].name : null,
          progress,
          pointsToNext: LEVELS[i].max - points,
        };
      }
    }
    return { current: LEVELS[LEVELS.length - 1].name, next: null, progress: 100, pointsToNext: 0 };
  };

  const levelInfo = getLevelInfo(userPoints);
  const currentColorScheme = PROFILE_COLORS.find(c => c.id === selectedColor) || PROFILE_COLORS[5];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: Plus, label: 'Crear Pin', action: () => navigate('/create') },
    { icon: Heart, label: 'Favoritos', action: () => {} },
    { icon: Route, label: 'Ver rutas guardadas', action: () => navigate('/routes') },
    { icon: Gift, label: 'Intercambiar puntos', action: () => {} },
  ];

  return (
    <div className="profile-page">
      {/* Desktop Header */}
      <DesktopHeader />

      {/* Pasaporte Header */}
      <div
        className="profile-header-section"
        style={{ backgroundColor: currentColorScheme.bg }}
      >
        {/* Ondas decorativas */}
        <svg className="passport-waves" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path
            d="M0,50 Q50,30 100,50 T200,50 T300,50 T400,50 L400,100 L0,100 Z"
            fill={currentColorScheme.wave}
            opacity="0.3"
          />
          <path
            d="M0,60 Q50,40 100,60 T200,60 T300,60 T400,60 L400,100 L0,100 Z"
            fill={currentColorScheme.wave}
            opacity="0.2"
          />
          <path
            d="M0,70 Q50,50 100,70 T200,70 T300,70 T400,70 L400,100 L0,100 Z"
            fill={currentColorScheme.wave}
            opacity="0.15"
          />
        </svg>

        <h1 className="passport-title" style={{ color: currentColorScheme.textColor }}>PASAPORTE 360</h1>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        {/* Avatar y Info */}
        <div className="profile-info-section">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} />
              ) : (
                <span>{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
          </div>

          <div className="profile-details">
            <h2 className="profile-name">{user?.full_name || 'NOMBRE DE USUARIO'}</h2>
            <p className="profile-username">@{user?.username || 'user-name'}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="points-section">
          <div className="points-bar-container">
            <div className="points-bar">
              <motion.div
                className="points-fill"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              {/* Marcadores de progreso */}
              <div className="points-markers">
                {[0, 25, 50, 75, 100].map((pos, i) => (
                  <div
                    key={i}
                    className={`marker ${levelInfo.progress >= pos ? 'active' : ''}`}
                    style={{ left: `${pos}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="points-total">
              <span className="points-number">{userPoints.toLocaleString()}</span>
              <span className="points-label">PUNTOS</span>
            </div>
          </div>

          {levelInfo.next && (
            <p className="points-message">
              Faltan <strong>{levelInfo.pointsToNext.toLocaleString()} puntos</strong> para alcanzar <em>{levelInfo.next.toLowerCase()}</em>.
            </p>
          )}
        </div>

        {/* Insignias Section */}
        <div className="badges-section">
          <button className="badges-header" onClick={() => navigate('/badges')}>
            <div className="badges-title">
              <Award size={18} />
              <span>INSIGNIAS</span>
              <span className="badges-count">({unlockedBadges}/{totalBadges})</span>
            </div>
            <ChevronRight size={20} />
          </button>

          <div className="badges-grid">
            {badges.slice(0, 6).map((badge) => (
              <div
                key={badge.id}
                className={`badge-item ${badge.unlocked ? '' : 'locked'}`}
              >
                <div className="badge-circle">
                  {badge.image ? (
                    <img src={badge.image} alt={badge.name} className="badge-image" />
                  ) : (
                    <span className="badge-locked">?</span>
                  )}
                </div>
                <span className="badge-name">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Actions */}
        <div className="profile-menu">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="menu-item"
              onClick={item.action}
            >
              <span className="menu-label">{item.label}</span>
              <ChevronRight size={18} className="menu-arrow" />
            </button>
          ))}
        </div>

        {/* Color Selector */}
        <div className="color-selector">
          <span className="color-label">Color del pasaporte:</span>
          <div className="color-options">
            {PROFILE_COLORS.map((color) => (
              <button
                key={color.id}
                className={`color-option ${selectedColor === color.id ? 'selected' : ''}`}
                style={{ backgroundColor: color.bg }}
                onClick={() => setSelectedColor(color.id)}
              >
                {/* Onda decorativa en miniatura */}
                <svg viewBox="0 0 40 40" className="color-wave-preview">
                  <path
                    d="M0,25 Q10,20 20,25 T40,25 L40,40 L0,40 Z"
                    fill={color.wave}
                    opacity="0.5"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar Sesion</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
