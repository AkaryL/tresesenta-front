import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { routesAPI } from '../services/api';
import './RoutesPage.css';
import './Auth.css';

const DIFFICULTY_LABELS = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Alta',
};

const RoutesPage = () => {
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
      {/* Desktop Header */}
      <DesktopHeader />

      {/* Mobile Header */}
      <div className="routes-header-minimal">
        <h1>Rutas</h1>
      </div>

      <div className="routes-content">
        {loading ? (
          <div className="routes-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="route-card" style={{ opacity: 0.4 }}>
                <div className="route-image" style={{ background: '#eee' }} />
                <div className="route-content">
                  <div style={{ height: 20, background: '#eee', borderRadius: 8, marginBottom: 12 }} />
                  <div style={{ height: 14, background: '#eee', borderRadius: 8, width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : routes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--gray-mid)' }}>
            <MapPin size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>Aún no hay rutas disponibles</p>
            <p style={{ fontSize: '0.9rem' }}>Las rutas aparecerán aquí cuando se creen.</p>
          </div>
        ) : (
          <div className="routes-grid">
            {routes.map((route, index) => (
              <motion.div
                key={route.id}
                className="route-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSelectRoute(route)}
              >
                <div className="route-image">
                  {getRouteImage(route) ? (
                    <img src={getRouteImage(route)} alt={route.title} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, var(--camel), var(--charcoal))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '3rem' }}>{route.emoji || '🗺️'}</span>
                    </div>
                  )}
                  {route.is_official && (
                    <div className="route-category-badge">Oficial</div>
                  )}
                </div>

                <div className="route-content">
                  <h3 className="route-title">{route.title}</h3>
                  <p className="route-description">{route.description}</p>

                  <div className="route-meta">
                    <div className="route-meta-item">
                      <span className="meta-text">{route.total_pins} paradas</span>
                    </div>
                    {route.estimated_time && (
                      <div className="route-meta-item">
                        <span className="meta-text">{route.estimated_time}</span>
                      </div>
                    )}
                    {route.difficulty && (
                      <div className="route-meta-item">
                        <span className="meta-text">{DIFFICULTY_LABELS[route.difficulty] || route.difficulty}</span>
                      </div>
                    )}
                  </div>

                  {route.completions_count > 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-mid)', margin: '0 0 0.75rem' }}>
                      {route.completions_count} {route.completions_count === 1 ? 'persona completó' : 'personas completaron'} esta ruta
                    </p>
                  )}

                  <button className="btn-explore-route">
                    Explorar Ruta →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Route Button */}
        <motion.button
          className="btn-create-route"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          + Crear Mi Propia Ruta
        </motion.button>
      </div>

      {/* Route Detail Modal */}
      {selectedRoute && (
        <motion.div
          className="route-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={closeModal}
        >
          <motion.div
            className="route-modal"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>

            <div className="modal-header">
              {getRouteImage(routeDetail || selectedRoute) ? (
                <img src={getRouteImage(routeDetail || selectedRoute)} alt={selectedRoute.title} />
              ) : (
                <div style={{
                  width: '100%', height: 250,
                  background: 'linear-gradient(135deg, var(--camel), var(--charcoal))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '24px 24px 0 0',
                }}>
                  <span style={{ fontSize: '4rem' }}>{selectedRoute.emoji || '🗺️'}</span>
                </div>
              )}
            </div>

            <div className="modal-content">
              <h2>{selectedRoute.title}</h2>
              <p>{selectedRoute.description}</p>

              <div className="modal-meta">
                {selectedRoute.is_official && <span>Oficial</span>}
                <span>{selectedRoute.total_pins} paradas</span>
                {selectedRoute.estimated_time && <span>{selectedRoute.estimated_time}</span>}
                {selectedRoute.difficulty && (
                  <span>{DIFFICULTY_LABELS[selectedRoute.difficulty] || selectedRoute.difficulty}</span>
                )}
                {selectedRoute.total_points > 0 && <span>{selectedRoute.total_points} pts</span>}
              </div>

              {/* Pins de la ruta */}
              {loadingDetail ? (
                <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--gray-mid)' }}>
                  Cargando paradas...
                </div>
              ) : routeDetail?.pins && routeDetail.pins.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--charcoal)' }}>
                    Paradas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {routeDetail.pins.map((pin, i) => (
                      <div
                        key={pin.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem', background: 'var(--cream)', borderRadius: 12,
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--camel)', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          {i + 1}
                        </div>
                        {pin.image_urls && pin.image_urls[0] && (
                          <img
                            src={pin.image_urls[0]}
                            alt={pin.title}
                            style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'var(--charcoal)' }}>
                            {pin.title}
                          </p>
                          {pin.location_name && (
                            <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--gray-mid)' }}>
                              {pin.location_name}
                            </p>
                          )}
                        </div>
                        {pin.is_required && (
                          <span style={{
                            marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 600,
                            background: 'var(--camel)', color: 'white',
                            padding: '0.2rem 0.5rem', borderRadius: 8, flexShrink: 0,
                          }}>
                            Requerida
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn-start-route">
                Comenzar Ruta
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
};

export default RoutesPage;
