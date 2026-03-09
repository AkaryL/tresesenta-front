import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Users, Star, Navigation, Plus, ExternalLink, X, Heart, SlidersHorizontal } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { routesAPI } from '../services/api';
import './RoutesPage.css';

// ─── Haversine ────────────────────────────────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDist = (km) => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

// ─── Carousel cover ───────────────────────────────────────────────────────────
const RouteCardCover = ({ images }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 2500);
    return () => clearInterval(t);
  }, [images]);

  if (!images || images.length === 0) return null;

  return images.map((url, i) => (
    <img
      key={i}
      src={url}
      alt=""
      className={`route-carousel-img ${i === idx ? 'active' : ''}`}
    />
  ));
};

// ─── Duration options ─────────────────────────────────────────────────────────
const DURATION_OPTIONS = ['1-2 horas', 'Medio día', '1 día', 'Fin de semana'];

// ─── Component ────────────────────────────────────────────────────────────────
const RoutesPage = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDetail, setRouteDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [filter, setFilter] = useState({ search: '', duration: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Create route state
  const [showCreate, setShowCreate] = useState(false);
  const [myPins, setMyPins] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newRoute, setNewRoute] = useState({
    title: '', description: '', emoji: '🗺️', estimated_time: '', pin_ids: [],
  });

  useEffect(() => {
    routesAPI.getAll()
      .then(r => {
        const fetched = r.data.routes || [];
        setRoutes(fetched);
        setSavedIds(new Set(fetched.filter(r => r.is_saved).map(r => r.id)));
      })
      .catch(e => console.error('Error fetching routes:', e))
      .finally(() => setLoading(false));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // ── Filtering + sorting ──────────────────────────────────────────────────────
  const filteredRoutes = useMemo(() => {
    let list = routes.filter(r => {
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (!r.title.toLowerCase().includes(q) && !(r.description || '').toLowerCase().includes(q)) return false;
      }
      if (filter.duration && r.estimated_time !== filter.duration) return false;
      return true;
    });

    list = list.map(r => {
      let dist = null;
      if (userLocation && r.first_lat && r.first_lng) {
        dist = haversine(userLocation.lat, userLocation.lng, parseFloat(r.first_lat), parseFloat(r.first_lng));
      }
      return { ...r, _dist: dist };
    });

    list.sort((a, b) => {
      const aSaved = savedIds.has(a.id) ? 0 : 1;
      const bSaved = savedIds.has(b.id) ? 0 : 1;
      if (aSaved !== bSaved) return aSaved - bSaved;
      if (a._dist !== null && b._dist !== null) return a._dist - b._dist;
      if (a._dist !== null) return -1;
      if (b._dist !== null) return 1;
      return 0;
    });

    return list;
  }, [routes, filter, userLocation, savedIds]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSelectRoute = async (route) => {
    setSelectedRoute(route);
    setRouteDetail(null);
    setLoadingDetail(true);
    try {
      const res = await routesAPI.getById(route.id);
      setRouteDetail(res.data.route);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => { setSelectedRoute(null); setRouteDetail(null); };

  const handleSave = async (e, routeId) => {
    e.stopPropagation();
    try {
      const res = await routesAPI.saveRoute(routeId);
      setSavedIds(prev => {
        const next = new Set(prev);
        res.data.saved ? next.add(routeId) : next.delete(routeId);
        return next;
      });
    } catch (e) { console.error(e); }
  };

  const openInGoogleMaps = (pins) => {
    if (!pins?.length) return;
    window.open(`https://www.google.com/maps/dir/${pins.map(p => `${p.latitude},${p.longitude}`).join('/')}`, '_blank');
  };

  const openCreate = async () => {
    setShowCreate(true);
    try {
      const res = await routesAPI.getMyPins();
      setMyPins(res.data.pins || []);
    } catch (e) { console.error(e); }
  };

  const togglePin = (id) => setNewRoute(prev => ({
    ...prev,
    pin_ids: prev.pin_ids.includes(id) ? prev.pin_ids.filter(p => p !== id) : [...prev.pin_ids, id],
  }));

  const handleCreateRoute = async () => {
    if (!newRoute.title.trim() || newRoute.pin_ids.length === 0) return;
    setCreating(true);
    try {
      await routesAPI.create(newRoute);
      const res = await routesAPI.getAll();
      const fetched = res.data.routes || [];
      setRoutes(fetched);
      setSavedIds(new Set(fetched.filter(r => r.is_saved).map(r => r.id)));
      setShowCreate(false);
      setNewRoute({ title: '', description: '', emoji: '🗺️', estimated_time: '', pin_ids: [] });
    } catch (e) {
      alert(e.response?.data?.error || 'Error al crear ruta');
    } finally {
      setCreating(false);
    }
  };

  const getCoverImage = (route) => route.cover_image_url || null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="routes-page">
      <DesktopHeader />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="routes-header">
        <div className="routes-header-top">
          <div className="routes-header-text">
            <p className="routes-header-eyebrow">TRESESENTA</p>
            <h1 className="routes-magazine-title">Rutas</h1>
            <p className="routes-subtitle">Playlists de lugares por la comunidad</p>
          </div>
          <button className="btn-create-route" onClick={openCreate}>
            <Plus size={16} /><span>Crear</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="routes-filter-bar">
          <input
            className="routes-filter-input"
            placeholder="Buscar ruta..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          />
          <div className="routes-filter-chips">
            {DURATION_OPTIONS.map(d => (
              <button
                key={d}
                className={`filter-chip ${filter.duration === d ? 'active' : ''}`}
                onClick={() => setFilter(f => ({ ...f, duration: f.duration === d ? '' : d }))}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <div className="routes-content">
        {loading ? (
          <div className="routes-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="route-card route-skeleton">
                <div className="route-card-img" />
                <div className="route-card-body">
                  <div className="skel-line w70" /><div className="skel-line w90" /><div className="skel-line w50" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="routes-empty">
            <Navigation size={40} strokeWidth={1.5} />
            <h3>Sin rutas</h3>
            <p>{routes.length === 0 ? 'Crea la primera ruta con tus pins.' : 'Ninguna ruta coincide con el filtro.'}</p>
            {routes.length === 0 && (
              <button className="btn-create-route" onClick={openCreate}><Plus size={14} />Crear ruta</button>
            )}
          </div>
        ) : (
          <div className="routes-grid">
            {filteredRoutes.map((route, index) => (
              <motion.article
                key={route.id}
                className="route-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => handleSelectRoute(route)}
              >
                {/* Cover image carousel — only from pin photos */}
                <div className="route-card-img">
                  {route.pin_images?.length > 0 ? (
                    <RouteCardCover images={route.pin_images} />
                  ) : (
                    <div className="route-img-placeholder">
                      <span>🗺️</span>
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    className={`btn-save-route ${savedIds.has(route.id) ? 'saved' : ''}`}
                    onClick={e => handleSave(e, route.id)}
                    aria-label="Guardar ruta"
                  >
                    <Heart size={15} fill={savedIds.has(route.id) ? 'currentColor' : 'none'} />
                  </button>

                  {/* Official badge */}
                  {route.is_official && (
                    <div className="route-official-badge">
                      <Star size={10} fill="currentColor" /> Oficial
                    </div>
                  )}

                  {/* Distance badge */}
                  {route._dist !== null && (
                    <div className="route-distance-badge">{formatDist(route._dist)}</div>
                  )}
                </div>

                {/* Card body */}
                <div className="route-card-body">
                  <h3 className="route-title">{route.title}</h3>
                  {route.description && <p className="route-desc">{route.description}</p>}
                  <div className="route-meta">
                    <span><MapPin size={12} />{route.total_pins} paradas</span>
                    {route.estimated_time && <span><Clock size={12} />{route.estimated_time}</span>}
                    {!route.is_official && route.creator_username && (
                      <span className="route-meta-creator">@{route.creator_username}</span>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRoute && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal}>
            <motion.div
              className="route-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={closeModal}><X size={16} /></button>

              {/* Cover — from first pin photo */}
              <div className="modal-cover">
                {selectedRoute.pin_images?.length > 0 ? (
                  <img src={selectedRoute.pin_images[0]} alt={selectedRoute.title} />
                ) : routeDetail?.pins?.find(p => p.image_urls?.[0]) ? (
                  <img src={routeDetail.pins.find(p => p.image_urls?.[0]).image_urls[0]} alt={selectedRoute.title} />
                ) : (
                  <div className="modal-cover-placeholder"><span>🗺️</span></div>
                )}
              </div>

              <div className="modal-body">
                <div className="modal-title-row">
                  <span className="modal-emoji-big">{selectedRoute.emoji || '🗺️'}</span>
                  <h2>{selectedRoute.title}</h2>
                </div>

                {selectedRoute.description && <p className="modal-desc">{selectedRoute.description}</p>}

                <div className="modal-tags">
                  {selectedRoute.is_official && <span className="tag tag-official"><Star size={10} fill="currentColor" /> Oficial</span>}
                  {!selectedRoute.is_official && selectedRoute.creator_username && <span className="tag">@{selectedRoute.creator_username}</span>}
                  <span className="tag"><MapPin size={11} /> {selectedRoute.total_pins} paradas</span>
                  {selectedRoute.estimated_time && <span className="tag"><Clock size={11} /> {selectedRoute.estimated_time}</span>}
                </div>

                {/* Pins */}
                <h3 className="modal-section-title">Paradas</h3>
                {loadingDetail ? (
                  <div className="pins-loading">
                    {[1, 2, 3].map(i => <div key={i} className="pin-card-skeleton" />)}
                  </div>
                ) : routeDetail?.pins?.length > 0 ? (
                  <div className="pins-list">
                    {routeDetail.pins.map((pin, i) => (
                      <div
                        key={pin.id}
                        className="pin-card"
                        onClick={() => { closeModal(); navigate(`/map?lat=${pin.latitude}&lng=${pin.longitude}&zoom=17`); }}
                      >
                        <div className="pin-card-img">
                          {pin.image_urls?.[0]
                            ? <img src={pin.image_urls[0]} alt={pin.title} />
                            : <span className="pin-card-emoji">{pin.category_emoji || '📍'}</span>
                          }
                          <span className="pin-card-num">{i + 1}</span>
                        </div>
                        <div className="pin-card-info">
                          <span className="pin-cat-emoji">{pin.category_emoji}</span>
                          <div>
                            <p className="pin-card-name">{pin.title}</p>
                            {pin.location_name && <p className="pin-card-loc">{pin.location_name}</p>}
                          </div>
                        </div>
                        <span className="pin-card-arrow">›</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <button
                  className="btn-gmaps"
                  onClick={() => openInGoogleMaps(routeDetail?.pins || [])}
                  disabled={loadingDetail || !routeDetail?.pins?.length}
                >
                  <ExternalLink size={17} />
                  Abrir en Google Maps
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
            <motion.div
              className="route-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
              <div className="modal-body" style={{ paddingTop: '2rem' }}>
                <h2>Nueva Ruta</h2>
                <p className="create-hint">Arma una playlist de tus pins favoritos</p>

                <div className="create-title-row">
                  <input className="create-text-input" placeholder="Nombre de la ruta..." value={newRoute.title} onChange={e => setNewRoute(p => ({ ...p, title: e.target.value }))} maxLength={80} />
                </div>

                <textarea className="create-textarea" placeholder="Descripción (opcional)..." value={newRoute.description} onChange={e => setNewRoute(p => ({ ...p, description: e.target.value }))} rows={2} />

                <select className="create-select" value={newRoute.estimated_time} onChange={e => setNewRoute(p => ({ ...p, estimated_time: e.target.value }))}>
                  <option value="">Duración estimada (opcional)</option>
                  <option value="1-2 horas">1-2 horas</option>
                  <option value="Medio día">Medio día</option>
                  <option value="1 día">1 día</option>
                  <option value="Fin de semana">Fin de semana</option>
                </select>

                <div className="create-pins-header">
                  <h3>Selecciona tus pins</h3>
                  {newRoute.pin_ids.length > 0 && <span className="pins-badge">{newRoute.pin_ids.length} seleccionados</span>}
                </div>

                {myPins.length === 0 ? (
                  <p className="create-empty-pins">Aún no tienes pins. ¡Crea algunos primero!</p>
                ) : (
                  <div className="create-pins-list">
                    {myPins.map(pin => {
                      const sel = newRoute.pin_ids.includes(pin.id);
                      const order = newRoute.pin_ids.indexOf(pin.id) + 1;
                      return (
                        <button key={pin.id} className={`picker-pin ${sel ? 'selected' : ''}`} onClick={() => togglePin(pin.id)}>
                          <div className="picker-pin-img">
                            {pin.image_urls?.[0] ? <img src={pin.image_urls[0]} alt={pin.title} /> : <span>{pin.category_emoji || '📍'}</span>}
                          </div>
                          <div className="picker-pin-info">
                            <p className="picker-pin-name">{pin.title}</p>
                            {pin.location_name && <p className="picker-pin-loc">{pin.location_name}</p>}
                          </div>
                          {sel ? <span className="picker-num">{order}</span> : <span className="picker-add">+</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                <button className="btn-gmaps" onClick={handleCreateRoute} disabled={creating || !newRoute.title.trim() || newRoute.pin_ids.length === 0}>
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
