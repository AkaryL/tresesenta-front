import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Crown, Medal, Trophy } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { useAuth } from '../context/AuthContext';
import { pointsAPI } from '../services/api';
import './Leaderboard.css';

const PROFILE_COLORS = [
  { id: 'beige', bg: '#d6cfc4', text: '#4a4a48' },
  { id: 'camel', bg: '#b89b7a', text: '#ffffff' },
  { id: 'sage', bg: '#8f9b8a', text: '#ffffff' },
  { id: 'gray', bg: '#9a9a96', text: '#ffffff' },
  { id: 'steel', bg: '#7f8a92', text: '#ffffff' },
  { id: 'olive', bg: '#343316', text: '#ffffff' },
];

const LEVELS = [
  { name: 'Explorador Novato', min: 0, max: 5000 },
  { name: 'Viajero Local', min: 5000, max: 15000 },
  { name: 'Aventurero Experto', min: 15000, max: 30000 },
  { name: 'Explorador Universal', min: 30000, max: 50000 },
  { name: 'Leyenda 360', min: 50000, max: 999999 },
];

const PERIODS = [
  { key: null, label: 'Todo' },
  { key: 'monthly', label: 'Mensual' },
  { key: 'weekly', label: 'Semanal' },
];

const getLevel = (points) => {
  return LEVELS.find(l => points >= l.min && points < l.max) || LEVELS[0];
};

const getAvatarColor = (user) => {
  if (user.profile_color) {
    const color = PROFILE_COLORS.find(c => c.id === user.profile_color);
    if (color) return color;
  }
  // Deterministic fallback based on user_id
  const index = (user.user_id || 0) % PROFILE_COLORS.length;
  return PROFILE_COLORS[index];
};

const getInitials = (user) => {
  if (user.full_name) {
    return user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
  if (user.username) {
    return user.username.slice(0, 2).toUpperCase();
  }
  return '??';
};

const formatPoints = (points) => {
  return new Intl.NumberFormat('es-MX').format(points || 0);
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await pointsAPI.getLeaderboard(period);
        setLeaderboard(response.data.leaderboard || []);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const currentUserId = user?.id;

  // Check if current user is in the visible list
  const userInList = leaderboard.find(u => u.user_id === currentUserId);
  const userRank = userInList?.rank;
  const showMyPosition = userInList && userRank > 10;

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  return (
    <div className="leaderboard-page">
      {/* Hero Section - Desktop */}
      <section className="leaderboard-hero">
        <DesktopHeader />
        <div className="leaderboard-hero-content">
          <span className="leaderboard-hero-brand">TRESESENTA</span>
          <h1 className="leaderboard-hero-title">Ranking</h1>
          <p className="leaderboard-hero-description">
            Compite con otros exploradores y escala posiciones.
          </p>
        </div>
      </section>

      {/* Mobile Header */}
      <div className="leaderboard-header-mobile">
        <button className="btn-back" onClick={() => navigate('/profile')}>
          <ChevronLeft size={24} />
        </button>
        <h1>Ranking</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Content */}
      <div className="leaderboard-content">
        {/* Period Tabs */}
        <div className="leaderboard-tabs">
          {PERIODS.map(p => (
            <button
              key={p.label}
              className={`leaderboard-tab ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          /* Skeleton Loading */
          <div className="leaderboard-skeleton">
            <div className="skeleton-podium">
              {[0, 1, 2].map(i => (
                <div key={i} className={`skeleton-podium-item ${i === 1 ? 'first' : ''}`}>
                  <div className="skeleton-avatar" />
                  <div className="skeleton-name" />
                  <div className="skeleton-points" />
                </div>
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton-row">
                <div className="skeleton-rank" />
                <div className="skeleton-avatar-sm" />
                <div className="skeleton-info">
                  <div className="skeleton-name" />
                  <div className="skeleton-level" />
                </div>
                <div className="skeleton-points" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Podium - Top 3 */}
            {top3.length > 0 && (
              <div className="leaderboard-podium">
                {podiumOrder.map((entry, i) => {
                  if (!entry) return null;
                  const actualRank = entry.rank || (leaderboard.indexOf(entry) + 1);
                  const color = getAvatarColor(entry);
                  const isFirst = actualRank === 1;
                  const isSecond = actualRank === 2;
                  const isCurrentUser = entry.user_id === currentUserId;
                  return (
                    <div
                      key={entry.user_id}
                      className={`podium-item rank-${actualRank} ${isCurrentUser ? 'is-me' : ''}`}
                    >
                      <div className="podium-medal">
                        {isFirst && <Crown size={20} className="medal-icon gold" />}
                        {isSecond && <Medal size={18} className="medal-icon silver" />}
                        {actualRank === 3 && <Medal size={18} className="medal-icon bronze" />}
                      </div>
                      <div
                        className={`podium-avatar ${isFirst ? 'podium-avatar-lg' : ''}`}
                        style={{ background: color.bg, color: color.text }}
                      >
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.username} />
                        ) : (
                          <span>{getInitials(entry)}</span>
                        )}
                      </div>
                      <span className="podium-name">
                        {entry.full_name || entry.username}
                      </span>
                      <span className="podium-points">
                        {formatPoints(entry.total_points)} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ranking List (4th+) */}
            {rest.length > 0 && (
              <div className="leaderboard-list">
                {rest.map((entry) => {
                  const rank = entry.rank || (leaderboard.indexOf(entry) + 1);
                  const color = getAvatarColor(entry);
                  const level = getLevel(entry.total_points || 0);
                  const isCurrentUser = entry.user_id === currentUserId;
                  return (
                    <div
                      key={entry.user_id}
                      className={`leaderboard-row ${isCurrentUser ? 'is-me' : ''}`}
                    >
                      <span className="rank">#{rank}</span>
                      <div
                        className="user-avatar"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.username} />
                        ) : (
                          <span>{getInitials(entry)}</span>
                        )}
                      </div>
                      <div className="user-info">
                        <span className="user-name">
                          {entry.full_name || entry.username}
                        </span>
                        <span className="user-level">{level.name}</span>
                      </div>
                      <span className="user-points">
                        {formatPoints(entry.total_points)} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {leaderboard.length === 0 && (
              <div className="leaderboard-empty">
                <Trophy size={48} />
                <p>No hay datos de ranking disponibles.</p>
              </div>
            )}
          </>
        )}

        {/* Current user's position - sticky bottom */}
        {showMyPosition && (
          <div className="leaderboard-my-position">
            <span className="rank">#{userRank}</span>
            <div
              className="user-avatar"
              style={{
                background: getAvatarColor(userInList).bg,
                color: getAvatarColor(userInList).text,
              }}
            >
              {userInList.avatar_url ? (
                <img src={userInList.avatar_url} alt={userInList.username} />
              ) : (
                <span>{getInitials(userInList)}</span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">Tú</span>
              <span className="user-level">{getLevel(userInList.total_points || 0).name}</span>
            </div>
            <span className="user-points">
              {formatPoints(userInList.total_points)} pts
            </span>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
