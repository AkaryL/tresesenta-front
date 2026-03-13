import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Lock, Award } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { useAuth } from '../context/AuthContext';
import { badgesAPI } from '../services/api';
import './Badges.css';

// Local badge images
import imgRaicesEternas from '../assets/insignias/raices-eternas.png';
import imgAguaCacao from '../assets/insignias/sello-agua-y-cacao.png';
import imgCaminoPlata from '../assets/insignias/sello-camino-de-plata.png';
import imgCaminoReal from '../assets/insignias/sello-camino-real.png';
import imgCorazonPais from '../assets/insignias/sello-corazon-del-pais.png';
import imgCostaBravia from '../assets/insignias/sello-costa-bravia.png';
import imgDesiertoMar from '../assets/insignias/sello-desierto-y-mar.png';
import imgFronteraNorte from '../assets/insignias/sello-frontera-norte.png';
import imgGolfoBravo from '../assets/insignias/sello-golfo-bravo.png';
import imgHidrocalido from '../assets/insignias/sello-hidrocalido.png';
import imgHuastecaMagica from '../assets/insignias/sello-huasteca-magica.png';
import imgMarCortes from '../assets/insignias/sello-mar-del-cortes.png';
import imgNorteIndomable from '../assets/insignias/sello-norte-indomable.png';
import imgOrigenAncestral from '../assets/insignias/sello-origen-ancestral.png';
import imgRaicesCamelo from '../assets/insignias/sello-raices-camelo.png';
import imgSelloRaicesEternas from '../assets/insignias/sello-raices-eternas.png';
import imgRivieraNayarita from '../assets/insignias/sello-riviera-nayarita.png';
import imgSierraNorte from '../assets/insignias/sello-sierra-del-norte.png';
import imgTierraCine from '../assets/insignias/sello-tierra-del-cine.png';
import imgVientosMezquital from '../assets/insignias/sello-vientos-del-mezquital.png';
import imgVolcanPaiso from '../assets/insignias/sello-volcan-del-paiso.png';
import imgVolcanInfinito from '../assets/insignias/sello-volcan-infinito.png';

// Mapping: sello name -> Mexican state
const SELLO_STATE_MAP = {
  'Hidrocálido': 'Aguascalientes',
  'Frontera Norte': 'Baja California',
  'Mar de Cortés': 'Baja California Sur',
  'Raíces de Camelo': 'Campeche',
  'Raíces Eternas': 'Chiapas',
  'Camino Real': 'Chihuahua',
  'Corazón del País': 'Ciudad de México',
  'Volcán del Paraíso': 'Colima',
  'Norte Indomable': 'Coahuila',
  'Tierra del Cine': 'Durango',
  'Costa Bravía': 'Guerrero',
  'Vientos del Mezquital': 'Hidalgo',
  'Volcán Infinito': 'Jalisco',
  'Riviera Nayarita': 'Nayarit',
  'Origen Ancestral': 'Oaxaca',
  'Sierra del Norte': 'Puebla',
  'Huasteca Mágica': 'San Luis Potosí',
  'Desierto y Mar': 'Sonora',
  'Agua y Cacao': 'Tabasco',
  'Golfo Bravo': 'Tamaulipas',
  'Camino de Plata': 'Zacatecas',
};

// Local badges with names and images (fallback if API fails)
const LOCAL_BADGES = [
  { name: 'Hidrocálido', image: imgHidrocalido, state: 'Aguascalientes' },
  { name: 'Frontera Norte', image: imgFronteraNorte, state: 'Baja California' },
  { name: 'Mar de Cortés', image: imgMarCortes, state: 'Baja California Sur' },
  { name: 'Raíces de Camelo', image: imgRaicesCamelo, state: 'Campeche' },
  { name: 'Raíces Eternas', image: imgRaicesEternas, state: 'Chiapas' },
  { name: 'Camino Real', image: imgCaminoReal, state: 'Chihuahua' },
  { name: 'Corazón del País', image: imgCorazonPais, state: 'Ciudad de México' },
  { name: 'Volcán del Paraíso', image: imgVolcanPaiso, state: 'Colima' },
  { name: 'Norte Indomable', image: imgNorteIndomable, state: 'Coahuila' },
  { name: 'Tierra del Cine', image: imgTierraCine, state: 'Durango' },
  { name: 'Costa Bravía', image: imgCostaBravia, state: 'Guerrero' },
  { name: 'Vientos del Mezquital', image: imgVientosMezquital, state: 'Hidalgo' },
  { name: 'Volcán Infinito', image: imgVolcanInfinito, state: 'Jalisco' },
  { name: 'Riviera Nayarita', image: imgRivieraNayarita, state: 'Nayarit' },
  { name: 'Origen Ancestral', image: imgOrigenAncestral, state: 'Oaxaca' },
  { name: 'Sierra del Norte', image: imgSierraNorte, state: 'Puebla' },
  { name: 'Huasteca Mágica', image: imgHuastecaMagica, state: 'San Luis Potosí' },
  { name: 'Desierto y Mar', image: imgDesiertoMar, state: 'Sonora' },
  { name: 'Agua y Cacao', image: imgAguaCacao, state: 'Tabasco' },
  { name: 'Golfo Bravo', image: imgGolfoBravo, state: 'Tamaulipas' },
  { name: 'Camino de Plata', image: imgCaminoPlata, state: 'Zacatecas' },
  { name: 'Sello Raíces Eternas', image: imgSelloRaicesEternas, state: 'Estado de México' },
];

const PROFILE_COLORS = [
  { id: 'beige', bg: '#d6cfc4', text: '#4a4a48' },
  { id: 'camel', bg: '#b89b7a', text: '#ffffff' },
  { id: 'sage', bg: '#8f9b8a', text: '#ffffff' },
  { id: 'gray', bg: '#9a9a96', text: '#ffffff' },
  { id: 'steel', bg: '#7f8a92', text: '#ffffff' },
  { id: 'olive', bg: '#343316', text: '#ffffff' },
];

const Badges = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isPassport = location.pathname === '/passport';
  const pageTitle = isPassport ? 'Mis Sellos' : 'Mis Insignias';
  const pageDescription = isPassport
    ? 'Colecciona sellos explorando los 32 estados de Mexico.'
    : 'Colecciona insignias explorando los 32 estados de Mexico.';
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltipBadge, setTooltipBadge] = useState(null);

  // User's chosen color
  const savedColor = localStorage.getItem('passport_color') || 'olive';
  const colorScheme = PROFILE_COLORS.find(c => c.id === savedColor) || PROFILE_COLORS[5];

  useEffect(() => {
    const fetchBadges = async () => {
      if (isPassport) {
        // /passport -> show local geographical stamps (sellos)
        // Fetch user's earned badges to mark which sellos are unlocked
        let earnedBadgeNames = new Set();
        try {
          const res = await badgesAPI.getMine();
          const earned = res.data.badges || [];
          earnedBadgeNames = new Set(earned.map(b => b.name || b.name_es));
        } catch (e) {
          // User not logged in or API error - all locked
        }
        setBadges(LOCAL_BADGES.map((b, index) => ({
          id: index + 1,
          name: b.name,
          description: `Publica un pin en ${b.state} para desbloquear`,
          image: b.image,
          state: b.state,
          unlocked: earnedBadgeNames.has(b.name),
        })));
        setLoading(false);
        return;
      }

      // /badges -> show API badges (insignias) with local images as fallback
      try {
        const response = await badgesAPI.getAll();
        const data = response.data.badges || [];
        if (data.length > 0) {
          setBadges(data.map((b, index) => ({
            id: b.id,
            name: b.name_es || b.name,
            description: b.description,
            image: b.image_url || LOCAL_BADGES[index % LOCAL_BADGES.length].image,
            emoji: b.emoji,
            category: b.category,
            rarity: b.rarity,
            unlocked: !!b.earned,
            earned_at: b.earned_at,
            points_reward: b.points_reward,
            geographic_scope: b.geographic_scope,
          })));
        } else {
          setBadges(LOCAL_BADGES.map((b, index) => ({
            id: index + 1,
            name: b.name,
            description: b.description,
            image: b.image,
            unlocked: false,
          })));
        }
      } catch (error) {
        console.error('Error fetching badges:', error);
        setBadges(LOCAL_BADGES.map((b, index) => ({
          id: index + 1,
          name: b.name,
          description: b.description,
          image: b.image,
          unlocked: false,
        })));
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, [isPassport]);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length || 0;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  // SVG donut chart values
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="badges-page">
      {/* Hero Section - Desktop */}
      <section className="badges-hero" style={{ background: `linear-gradient(135deg, ${colorScheme.bg}, ${colorScheme.bg}dd)` }}>
        <DesktopHeader />
        <div className="badges-hero-content">
          <span className="badges-hero-brand" style={{ color: colorScheme.text, opacity: 0.6 }}>TRESESENTA</span>
          <h1 className="badges-hero-title" style={{ color: colorScheme.text }}>{pageTitle}</h1>
          <p className="badges-hero-description" style={{ color: colorScheme.text, opacity: 0.6 }}>
            {pageDescription}
          </p>
        </div>
      </section>

      {/* Mobile Header */}
      <div className="badges-header-mobile" style={{ background: colorScheme.bg }}>
        <button className="btn-back" style={{ color: colorScheme.text }} onClick={() => navigate('/profile')}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ color: colorScheme.text }}>{pageTitle}</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Content */}
      <div className="badges-content">
        {/* Progress Summary with donut chart */}
        <div className="badges-summary">
          <div className="summary-donut">
            <svg viewBox="0 0 100 100" className="donut-svg">
              <circle
                cx="50" cy="50" r={radius}
                fill="none"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="8"
              />
              <circle
                cx="50" cy="50" r={radius}
                fill="none"
                stroke={colorScheme.bg}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="donut-label">
              <span className="donut-number">{unlockedCount}</span>
              <span className="donut-total">/{totalCount}</span>
            </div>
          </div>
          <div className="summary-info">
            <p className="summary-text">
              {unlockedCount === 0 && 'Comienza a explorar para desbloquear'}
              {unlockedCount > 0 && unlockedCount < 10 && 'Buen comienzo, sigue explorando'}
              {unlockedCount >= 10 && unlockedCount < 20 && 'Vas muy bien, explorador'}
              {unlockedCount >= 20 && unlockedCount < totalCount && 'Eres un experto viajero'}
              {totalCount > 0 && unlockedCount === totalCount && 'Felicidades, desbloqueaste todas'}
            </p>
            <div className="summary-bar">
              <div className="summary-bar-fill" style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${colorScheme.bg}, ${colorScheme.bg}cc)` }} />
            </div>
            <span className="summary-percent">{Math.round(progressPercent)}% completado</span>
          </div>
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
                onMouseEnter={() => setTooltipBadge(badge.id)}
                onMouseLeave={() => setTooltipBadge(null)}
                onTouchStart={() => {
                  setTooltipBadge(tooltipBadge === badge.id ? null : badge.id);
                }}
              >
                <div className="badge-image-container">
                  {badge.image ? (
                    <img
                      src={badge.image}
                      alt={badge.name}
                      className={`badge-img ${!badge.unlocked ? 'badge-img-locked' : ''}`}
                    />
                  ) : (
                    <div className="badge-placeholder">
                      <Award size={24} />
                    </div>
                  )}
                </div>
                <span className="badge-card-name">{badge.name}</span>
                {badge.state && (
                  <span className="badge-card-state">{badge.state}</span>
                )}
                {!badge.state && badge.rarity && (
                  <span className="badge-card-state">{badge.rarity}</span>
                )}

                {/* Tooltip on hover/tap */}
                {tooltipBadge === badge.id && (
                  <div className="badge-tooltip">
                    {badge.unlocked ? (
                      <span>Desbloqueada</span>
                    ) : (
                      <span>{badge.description || 'Sigue explorando para desbloquear'}</span>
                    )}
                  </div>
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
              {selectedBadge.image ? (
                <img
                  src={selectedBadge.image}
                  alt={selectedBadge.name}
                  className={!selectedBadge.unlocked ? 'badge-img-locked' : ''}
                />
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
              <p className="badge-modal-points">
                +{selectedBadge.points_reward} puntos
              </p>
            )}

            {selectedBadge.unlocked ? (
              <div className="badge-modal-status unlocked">
                Desbloqueada
                {selectedBadge.earned_at && (
                  <span className="badge-modal-date">
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
