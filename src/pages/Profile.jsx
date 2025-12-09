import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Award, TrendingUp, MapPin, Heart } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const LEVELS = [
  { name: 'Explorador Novato', min: 0, max: 100 },
  { name: 'Viajero Urbano', min: 100, max: 500 },
  { name: 'Aventurero Experto', min: 500, max: 1500 },
  { name: 'Nómada Digital', min: 1500, max: 3500 },
  { name: 'Leyenda México', min: 3500, max: 999999 },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userPoints = user?.total_points || 250;

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            <div className="avatar-circle">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>
          </div>
        </div>
        <h1 className="profile-username">@{user?.username || 'usuario'}</h1>
        <p className="profile-email">{user?.email || 'email@example.com'}</p>
      </div>

      {/* Content */}
      <div className="profile-content">
        {/* Level */}
        <motion.section
          className="profile-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="section-header">
            <TrendingUp size={20} />
            <h2>Mi Nivel</h2>
          </div>

          <div className="level-card">
            <div className="level-top">
              <span className="level-name">{levelInfo.current}</span>
              <span className="level-points">{userPoints} pts</span>
            </div>

            <div className="level-bar">
              <motion.div
                className="level-fill"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            {levelInfo.next && (
              <p className="level-next">{levelInfo.pointsToNext} pts para {levelInfo.next}</p>
            )}
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section
          className="profile-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="section-header">
            <Award size={20} />
            <h2>Estadísticas</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <MapPin size={24} />
              <span className="stat-value">12</span>
              <span className="stat-label">Pins</span>
            </div>
            <div className="stat-card">
              <Heart size={24} />
              <span className="stat-value">45</span>
              <span className="stat-label">Likes</span>
            </div>
          </div>
        </motion.section>

        {/* Logout */}
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
