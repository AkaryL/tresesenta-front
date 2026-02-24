import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { useAuth } from '../context/AuthContext';
import { badgesAPI } from '../services/api';
import './Badges.css';

const Badges = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await badgesAPI.getAll();
        const data = response.data.badges || [];
        setBadges(data.map(b => ({
          id: b.id,
          name: b.name_es || b.name,
          description: b.description,
          image: b.image_url,
          emoji: b.emoji,
          category: b.category,
          rarity: b.rarity,
          unlocked: !!b.earned,
          earned_at: b.earned_at,
          points_reward: b.points_reward,
          geographic_scope: b.geographic_scope,
        })));
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, []);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length || 0;

  return (
    <div className="badges-page">
      {/* Hero Section - Desktop */}
      <section className="badges-hero">
        <DesktopHeader />
        <div className="badges-hero-content">
          <span className="badges-hero-brand">TRESESENTA</span>
          <h1 className="badges-hero-title">Mis Insignias</h1>
          <p className="badges-hero-description">
            Colecciona insignias explorando los 32 estados de México.
          </p>
        </div>
      </section>

      {/* Mobile Header */}
      <div className="badges-header-mobile">
        <button className="btn-back" onClick={() => navigate('/profile')}>
          <ChevronLeft size={24} />
        </button>
        <h1>Mis Insignias</h1>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Content */}
      <div className="badges-content">
        {/* Progress Summary */}
        <div className="badges-summary">
          <div className="summary-circle">
            <span className="summary-number">{unlockedCount}</span>
            <span className="summary-total">/{totalCount}</span>
          </div>
          <p className="summary-text">
            {unlockedCount === 0 && '¡Comienza a explorar para desbloquear insignias!'}
            {unlockedCount > 0 && unlockedCount < 10 && '¡Buen comienzo, sigue explorando!'}
            {unlockedCount >= 10 && unlockedCount < 20 && '¡Vas muy bien, explorador!'}
            {unlockedCount >= 20 && unlockedCount < totalCount && '¡Eres un experto viajero!'}
            {totalCount > 0 && unlockedCount === totalCount && '¡Felicidades, desbloqueaste todas las insignias!'}
          </p>
        </div>

        {loading ? (
          <div className="badges-grid-full">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="badge-card locked">
                <div className="badge-image-container">
                  <div className="badge-placeholder" style={{ opacity: 0.3 }} />
                </div>
                <span className="badge-card-name" style={{ opacity: 0.3 }}>Cargando...</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="badges-grid-full">
            {badges.map((badge) => (
              <button
                key={badge.id}
                className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => setSelectedBadge(badge)}
              >
                <div className="badge-image-container">
                  {badge.unlocked && badge.image ? (
                    <img src={badge.image} alt={badge.name} className="badge-img" />
                  ) : badge.unlocked && badge.emoji ? (
                    <span style={{ fontSize: '2.5rem' }}>{badge.emoji}</span>
                  ) : (
                    <div className="badge-placeholder">
                      <Lock size={24} />
                    </div>
                  )}
                </div>
                <span className="badge-card-name">{badge.name}</span>
                {badge.rarity && (
                  <span className="badge-card-state">{badge.rarity}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="badge-modal-overlay" onClick={() => setSelectedBadge(null)}>
          <div className="badge-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedBadge(null)}>×</button>

            <div className="badge-modal-image">
              {selectedBadge.unlocked && selectedBadge.image ? (
                <img src={selectedBadge.image} alt={selectedBadge.name} />
              ) : selectedBadge.unlocked && selectedBadge.emoji ? (
                <span style={{ fontSize: '4rem' }}>{selectedBadge.emoji}</span>
              ) : (
                <div className="badge-modal-locked">
                  <Lock size={48} />
                </div>
              )}
            </div>

            <h2 className="badge-modal-name">{selectedBadge.name}</h2>
            {selectedBadge.category && (
              <p className="badge-modal-state">{selectedBadge.category}</p>
            )}
            <p className="badge-modal-description">{selectedBadge.description}</p>

            {selectedBadge.points_reward > 0 && (
              <p className="badge-modal-description" style={{ fontWeight: 600, color: 'var(--theme-primary)' }}>
                +{selectedBadge.points_reward} puntos
              </p>
            )}

            {selectedBadge.unlocked ? (
              <div className="badge-modal-status unlocked">
                Desbloqueada
                {selectedBadge.earned_at && (
                  <span style={{ marginLeft: 8, fontSize: '0.8rem', opacity: 0.7 }}>
                    {new Date(selectedBadge.earned_at).toLocaleDateString('es-MX')}
                  </span>
                )}
              </div>
            ) : (
              <div className="badge-modal-status locked">
                <Lock size={16} />
                Sigue explorando para desbloquear
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Badges;
