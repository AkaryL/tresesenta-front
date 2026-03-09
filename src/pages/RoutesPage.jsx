import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Users, Star, Navigation, Plus, ExternalLink, X } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { routesAPI } from '../services/api';
import './RoutesPage.css';
import './Auth.css';

const RoutesPage = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create route state
  const [showCreate, setShowCreate] = useState(false);
  const [myPins, setMyPins] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newRoute, setNewRoute] = useState({
    title: '',
    description: '',
    emoji: '🗺️',
    estimated_time: '',
    pin_ids: [],
  });

  useEffect(() => {
    routesAPI.getAll()
      .then(r => setRoutes(r.data.routes || []))
      .catch(e => console.error('Error fetching routes:', e))
      .finally(() => setLoading(false));
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

  const closeModal = () => {
    setSelectedRoute(null);
    setRouteDetail(null);
  };

  const openInGoogleMaps = (pins) => {
    if (!pins || pins.length === 0) return;
    const waypoints = pins.map(p => `${p.latitude},${p.longitude}`).join('/');
    window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank');
  };

  const openCreate = async () => {
    setShowCreate(true);
    try {
      const res = await routesAPI.getMyPins();
      setMyPins(res.data.pins || []);
    } catch (e) {
      console.error('Error loading pins:', e);
    }
  };

  const togglePin = (pinId) => {
    setNewRoute(prev => ({
      ...prev,
      pin_ids: prev.pin_ids.includes(pinId)
        ? prev.pin_ids.filter(id => id !== pinId)
        : [...prev.pin_ids, pinId],
    }));
  };

  const handleCreateRoute = async () => {
    if (!newRoute.title.trim() || newRoute.pin_ids.length === 0) return;
    setCreating(true);
    try {
      await routesAPI.create(newRoute);
      const res = await routesAPI.getAll();
      setRoutes(res.data.routes || []);
      setShowCreate(false);
      setNewRoute({ title: '', description: '', emoji: '🗺️', estimated_time: '', pin_ids: [] });
    } catch (e) {
      alert(e.response?.data?.error || 'Error al crear ruta');
    } finally {
      setCreating(false);
    }
  };

  const getCoverImage = (route) => route.cover_image_url || null;

  return (
    <div className="routes-page">
      <DesktopHeader />

      <div className="routes-header-minimal">
        <div className="routes-header-top">
          <div>
            <h1>Rutas</h1>
            <p className="routes-subtitle">Playlists de lugares por la comunidad</p>
          </div>
          <button className="btn-create-route" onClick={openCreate}>
            <Plus size={18} />
            <span>Crear</span>
          </button>
        </div>
      </div>

      <div className="routes-content">
        {loading ? (
          <div className="routes-grid">
            {Array.from({ length: 4 }).map((_, i) => (
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
            <h3>Aún no hay rutas</h3>
            <p>Crea la primera ruta con tus pins favoritos.</p>
            <button className="btn-create-route" onClick={openCreate}>
              <Plus size={16} /> Crear mi primera ruta
            </button>
          </div>
        ) : (
          <div className="routes-grid">
            {routes.map((route, index) => (
              <motion.div
                key={route.id}
                className="route-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                onClick={() => handleSelectRoute(route)}
              >
                <div className="route-image">
                  {getCoverImage(route) ? (
                    <img src={getCoverImage(route)} alt={route.title} />
                  ) : (
                    <div className="route-image-placeholder">
                      <span>{route.emoji || '🗺️'}</span>
                    </div>
                  )}
                  {route.is_official && (
                    <div className="route-official-badge">
                      <Star size={11} fill="currentColor" />
                      Oficial
                    </div>
                  )}
                </div>

                <div className="route-content">
                  <div className="route-emoji-title">
                    <span className="route-emoji">{route.emoji || '🗺️'}</span>
                    <h3 className="route-title">{route.title}</h3>
                  </div>
                  {route.description && (
                    <p className="route-description">{route.description}</p>
                  )}

                  <div className="route-meta">
                    <div className="route-meta-item">
                      <MapPin size={13} />
                      <span>{route.total_pins} paradas</span>
                    </div>
                    {route.estimated_time && (
                      <div className="route-meta-item">
                        <Clock size={13} />
                        <span>{route.estimated_time}</span>
                      </div>
                    )}
                    {route.creator_username && !route.is_official && (
                      <div className="route-meta-item route-creator">
                        <span>@{route.creator_username}</span>
                      </div>
                    )}
                  </div>
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeModal}><X size={18} /></button>

              {/* Cover image */}
              <div className="modal-header">
                {getCoverImage(selectedRoute) ? (
                  <img src={getCoverImage(selectedRoute)} alt={selectedRoute.title} />
                ) : (
                  <div className="modal-header-placeholder">
                    <span>{selectedRoute.emoji || '🗺️'}</span>
                  </div>
                )}
              </div>

              <div className="modal-content">
                <div className="modal-title-row">
                  <span className="modal-emoji">{selectedRoute.emoji || '🗺️'}</span>
                  <h2>{selectedRoute.title}</h2>
                </div>

                {selectedRoute.description && (
                  <p className="modal-desc">{selectedRoute.description}</p>
                )}

                <div className="modal-meta">
                  {selectedRoute.is_official && (
                    <span className="meta-official">
                      <Star size={11} fill="currentColor" /> Oficial
                    </span>
                  )}
                  {selectedRoute.creator_username && !selectedRoute.is_official && (
                    <span className="meta-creator">@{selectedRoute.creator_username}</span>
                  )}
                  <span><MapPin size={12} /> {selectedRoute.total_pins} paradas</span>
                  {selectedRoute.estimated_time && (
                    <span><Clock size={12} /> {selectedRoute.estimated_time}</span>
                  )}
                  {selectedRoute.completions_count > 0 && (
                    <span><Users size={12} /> {selectedRoute.completions_count}</span>
                  )}
                </div>

                {/* Pins as cards */}
                {loadingDetail ? (
                  <div className="modal-pins-loading">
                    {[1, 2, 3].map(i => <div key={i} className="modal-pin-skeleton" />)}
                  </div>
                ) : routeDetail?.pins?.length > 0 && (
                  <div className="modal-pins">
                    <h3 className="modal-pins-title">Paradas</h3>
                    <div className="modal-pins-cards">
                      {routeDetail.pins.map((pin, i) => (
                        <div
                          key={pin.id}
                          className="modal-pin-card"
                          onClick={() => {
                            closeModal();
                            navigate(`/map?lat=${pin.latitude}&lng=${pin.longitude}&zoom=16`);
                          }}
                        >
                          <div className="modal-pin-card-img">
                            {pin.image_urls?.[0]
                              ? <img src={pin.image_urls[0]} alt={pin.title} />
                              : <span className="modal-pin-card-emoji">{pin.category_emoji || '📍'}</span>
                            }
                            <span className="modal-pin-card-num">{i + 1}</span>
                          </div>
                          <div className="modal-pin-card-info">
                            <span className="modal-pin-cat-emoji">{pin.category_emoji}</span>
                            <div>
                              <p className="modal-pin-card-name">{pin.title}</p>
                              {pin.location_name && (
                                <p className="modal-pin-card-loc">{pin.location_name}</p>
                              )}
                            </div>
                          </div>
                          <span className="modal-pin-card-arrow">→</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Maps button */}
                <button
                  className="btn-google-maps-full"
                  onClick={() => openInGoogleMaps(routeDetail?.pins || [])}
                  disabled={loadingDetail || !routeDetail?.pins?.length}
                >
                  <ExternalLink size={18} />
                  Abrir en Google Maps
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Route Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="route-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              className="route-modal create-route-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
              <div className="modal-content">
                <h2>Nueva Ruta</h2>
                <p className="create-route-hint">Arma una playlist de tus pins favoritos</p>

                <div className="create-route-title-row">
                  <input
                    className="create-route-emoji"
                    value={newRoute.emoji}
                    onChange={e => setNewRoute(p => ({ ...p, emoji: e.target.value }))}
                    maxLength={2}
                  />
                  <input
                    className="create-route-title-input"
                    placeholder="Nombre de la ruta..."
                    value={newRoute.title}
                    onChange={e => setNewRoute(p => ({ ...p, title: e.target.value }))}
                    maxLength={80}
                  />
                </div>

                <textarea
                  className="create-route-desc"
                  placeholder="Descripción (opcional)..."
                  value={newRoute.description}
                  onChange={e => setNewRoute(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                />

                <input
                  className="create-route-desc"
                  placeholder="Duración estimada, ej. Medio día, 2 horas..."
                  value={newRoute.estimated_time}
                  onChange={e => setNewRoute(p => ({ ...p, estimated_time: e.target.value }))}
                  style={{ marginBottom: '1.25rem' }}
                />

                <h3 className="create-route-pins-title">
                  Selecciona tus pins
                  {newRoute.pin_ids.length > 0 && (
                    <span className="pins-selected-count">{newRoute.pin_ids.length} seleccionados</span>
                  )}
                </h3>

                {myPins.length === 0 ? (
                  <p className="create-route-no-pins">Aún no tienes pins. ¡Crea algunos primero!</p>
                ) : (
                  <div className="create-route-pins-list">
                    {myPins.map(pin => {
                      const selected = newRoute.pin_ids.includes(pin.id);
                      const order = newRoute.pin_ids.indexOf(pin.id) + 1;
                      return (
                        <button
                          key={pin.id}
                          className={`create-route-pin-item ${selected ? 'selected' : ''}`}
                          onClick={() => togglePin(pin.id)}
                        >
                          <div className="pin-picker-img">
                            {pin.image_urls?.[0]
                              ? <img src={pin.image_urls[0]} alt={pin.title} />
                              : <span>{pin.category_emoji || '📍'}</span>
                            }
                          </div>
                          <div className="pin-picker-info">
                            <p className="pin-picker-name">{pin.title}</p>
                            {pin.location_name && <p className="pin-picker-loc">{pin.location_name}</p>}
                          </div>
                          {selected
                            ? <span className="pin-picker-order">{order}</span>
                            : <span className="pin-picker-add">+</span>
                          }
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  className="btn-google-maps-full"
                  onClick={handleCreateRoute}
                  disabled={creating || !newRoute.title.trim() || newRoute.pin_ids.length === 0}
                >
                  {creating ? 'Creando...' : 'Crear Ruta'}
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
