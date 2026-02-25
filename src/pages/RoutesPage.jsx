import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Mountain, Users, ChevronRight, Star, Navigation } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { routesAPI } from '../services/api';
import './RoutesPage.css';
import './Auth.css';

const DIFFICULTY_LABELS = {
  easy: { label: 'Fácil', color: '#7ed957' },
  medium: { label: 'Media', color: '#f5a623' },
  hard: { label: 'Difícil', color: '#e74c3c' },
};

const RoutesPage = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await routesAPI.getAll();
        setRoutes(response.data.routes || []);
      } catch (error) {
        console.error('Error fetching routes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const handleSelectRoute = async (route) => {
    setSelectedRoute(route);
    setRouteDetail(null);
    setLoadingDetail(true);
    try {
      const response = await routesAPI.getById(route.id);
      setRouteDetail(response.data.route);
    } catch (error) {
      console.error('Error fetching route detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStartRoute = () => {
    if (!routeDetail?.pins?.length) return;
    const firstPin = routeDetail.pins[0];
    navigate(`/map?lat=${firstPin.latitude}&lng=${firstPin.longitude}&zoom=14&route=${routeDetail.id}`);
  };

  const getRouteImage = (route) => {
    if (route.pins && route.pins.length > 0) {
      const pinWithImage = route.pins.find(p => p.image_urls && p.image_urls.length > 0);
      if (pinWithImage) return pinWithImage.image_urls[0];
    }
    return null;
  };

  const closeModal = () => {
    setSelectedRoute(null);
    setRouteDetail(null);
  };

  return (
    <div className="routes-page">
      <DesktopHeader />

      {/* Mobile Header */}
      <div className="routes-header-minimal">
        <h1>Rutas</h1>
        <p className="routes-subtitle">Descubre recorridos curados por la comunidad</p>
      </div>

      <div className="routes-content">
        {loading ? (
          <div className="routes-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="route-card route-skeleton">
                <div className="route-image" />
                <div className="route-content">
                  <div className="skel-title" />
                  <div className="skel-desc" />
                  <div className="skel-meta" />
                </div>
              </div>
            ))}
          </div>
        ) : routes.length === 0 ? (
          <div className="routes-empty">
            <Navigation size={48} strokeWidth={1} />
            <h3>Aún no hay rutas disponibles</h3>
            <p>Las rutas aparecerán aquí cuando se creen.</p>
          </div>
        ) : (
          <div className="routes-grid">
            {routes.map((route, index) => (
              <motion.div
                key={route.id}
                className="route-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => handleSelectRoute(route)}
              >
                <div className="route-image">
                  {getRouteImage(route) ? (
                    <img src={getRouteImage(route)} alt={route.title} />
                  ) : (
                    <div className="route-image-placeholder">
                      <span>{route.emoji || '🗺️'}</span>
                    </div>
                  )}
                  {route.is_official && (
                    <div className="route-official-badge">
                      <Star size={12} />
                      Oficial
                    </div>
                  )}
                  {route.difficulty && (
                    <div
                      className="route-difficulty-badge"
                      style={{ background: DIFFICULTY_LABELS[route.difficulty]?.color || '#999' }}
                    >
                      {DIFFICULTY_LABELS[route.difficulty]?.label || route.difficulty}
                    </div>
                  )}
                </div>

                <div className="route-content">
                  <h3 className="route-title">{route.title}</h3>
                  <p className="route-description">{route.description}</p>

                  <div className="route-meta">
                    <div className="route-meta-item">
                      <MapPin size={14} />
                      <span>{route.total_pins} paradas</span>
                    </div>
                    {route.estimated_time && (
                      <div className="route-meta-item">
                        <Clock size={14} />
                        <span>{route.estimated_time}</span>
                      </div>
                    )}
                    {route.total_points > 0 && (
                      <div className="route-meta-item route-meta-points">
                        <span>+{route.total_points} pts</span>
                      </div>
                    )}
                  </div>

                  {route.completions_count > 0 && (
                    <div className="route-completions">
                      <Users size={12} />
                      <span>{route.completions_count} {route.completions_count === 1 ? 'persona completó' : 'personas completaron'} esta ruta</span>
                    </div>
                  )}

                  <button className="btn-explore-route">
                    Explorar Ruta
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Route Detail Modal */}
      <AnimatePresence>
        {selectedRoute && (
          <motion.div
            className="route-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="route-modal"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>

              <div className="modal-header">
                {getRouteImage(routeDetail || selectedRoute) ? (
                  <img src={getRouteImage(routeDetail || selectedRoute)} alt={selectedRoute.title} />
                ) : (
                  <div className="modal-header-placeholder">
                    <span>{selectedRoute.emoji || '🗺️'}</span>
                  </div>
                )}
              </div>

              <div className="modal-content">
                <h2>{selectedRoute.title}</h2>
                <p>{selectedRoute.description}</p>

                <div className="modal-meta">
                  {selectedRoute.is_official && (
                    <span className="meta-official">
                      <Star size={12} /> Oficial
                    </span>
                  )}
                  <span>
                    <MapPin size={12} /> {selectedRoute.total_pins} paradas
                  </span>
                  {selectedRoute.estimated_time && (
                    <span>
                      <Clock size={12} /> {selectedRoute.estimated_time}
                    </span>
                  )}
                  {selectedRoute.difficulty && (
                    <span style={{ color: DIFFICULTY_LABELS[selectedRoute.difficulty]?.color }}>
                      <Mountain size={12} /> {DIFFICULTY_LABELS[selectedRoute.difficulty]?.label}
                    </span>
                  )}
                  {selectedRoute.total_points > 0 && (
                    <span className="meta-points">+{selectedRoute.total_points} pts</span>
                  )}
                </div>

                {/* Pins de la ruta */}
                {loadingDetail ? (
                  <div className="modal-pins-loading">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="modal-pin-skeleton" />
                    ))}
                  </div>
                ) : routeDetail?.pins?.length > 0 && (
                  <div className="modal-pins">
                    <h3 className="modal-pins-title">Paradas</h3>
                    <div className="modal-pins-list">
                      {routeDetail.pins.map((pin, i) => (
                        <div key={pin.id} className="modal-pin-item">
                          <div className="pin-order" style={{ background: pin.category_color || 'var(--camel)' }}>
                            {i + 1}
                          </div>
                          {pin.image_urls?.[0] && (
                            <img
                              src={pin.image_urls[0]}
                              alt={pin.title}
                              className="pin-thumb"
                            />
                          )}
                          <div className="pin-info">
                            <p className="pin-name">{pin.title}</p>
                            {pin.location_name && (
                              <p className="pin-location">{pin.location_name}</p>
                            )}
                          </div>
                          {pin.is_required && (
                            <span className="pin-required">Requerida</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button className="btn-start-route" onClick={handleStartRoute} disabled={loadingDetail}>
                  <Navigation size={18} />
                  {loadingDetail ? 'Cargando...' : 'Comenzar Ruta'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default RoutesPage;
