import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import {
  MapPin, Heart, MessageCircle, X, Navigation, Globe, Send, Locate, Plus, Minus, List, Map as MapIcon,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { useAuth } from '../context/AuthContext';
import { pinsAPI, categoriesAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import './Auth.css';

// Import custom pin icons
import pinParques from '../assets/pins/parques.png';
import pinCafeteria from '../assets/pins/cafeteria.png';
import pinRestaurantes from '../assets/pins/restaurantes.png';
import pinVidaNocturna from '../assets/pins/vida-nocturna.png';
import pinLugaresPublicos from '../assets/pins/lugares-publicos.png';
import pinFavoritos from '../assets/pins/favoritos.png';

const CATEGORY_PIN_IMAGES = {
  'Parques': pinParques,
  'Cafetería': pinCafeteria,
  'Restaurantes': pinRestaurantes,
  'Vida Nocturna': pinVidaNocturna,
  'Lugares Públicos': pinLugaresPublicos,
  'Lugares Favoritos': pinFavoritos,
  'Favoritos': pinFavoritos,
  'default': pinFavoritos
};

// IDs must match `c.name` column in DB (backend filters by c.name)
const FIXED_CATEGORIES = [
  { id: 'parques', name: 'Parques', icon: pinParques },
  { id: 'cafeteria', name: 'Cafetería', icon: pinCafeteria },
  { id: 'restaurantes', name: 'Restaurantes', icon: pinRestaurantes },
  { id: 'vida_nocturna', name: 'Vida Nocturna', icon: pinVidaNocturna },
  { id: 'lugares_publicos', name: 'Lugares Públicos', icon: pinLugaresPublicos },
  { id: 'favoritos', name: 'Favoritos', icon: pinFavoritos },
];

const createCustomIcon = (categoryName) => {
  const pinImage = CATEGORY_PIN_IMAGES[categoryName] || CATEGORY_PIN_IMAGES.default;
  return L.icon({
    iconUrl: pinImage,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
    className: 'custom-pin-marker'
  });
};

// Haversine distance in km
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

// Fit map to pins bounds (only on first load, not on every filter change)
const RecenterMap = ({ pins }) => {
  const map = useMap();
  const hasCentered = useRef(false);
  useEffect(() => {
    if (!hasCentered.current && pins && pins.length > 0) {
      const validPins = pins.filter(pin => pin.latitude && pin.longitude);
      if (validPins.length > 0) {
        const bounds = validPins.map(pin => [pin.latitude, pin.longitude]);
        map.fitBounds(bounds, { padding: [50, 50] });
        hasCentered.current = true;
      }
    }
  }, [pins, map]);
  return null;
};

// Fly to a specific location (zoom ~14 = 80%)
const FlyToLocation = ({ position, onDone }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      const currentZoom = map.getZoom();
      const targetZoom = Math.max(currentZoom, 14);
      map.flyTo(position, targetZoom, { duration: 0.8 });
      if (onDone) setTimeout(onDone, 900);
    }
  }, [position, map, onDone]);
  return null;
};

// Custom map controls (zoom + locate)
const MapControls = ({ onLocate }) => {
  const map = useMap();
  return (
    <div className="map-controls">
      <button className="map-ctrl-btn" onClick={() => map.zoomIn()} title="Acercar">
        <Plus size={18} strokeWidth={2.5} />
      </button>
      <button className="map-ctrl-btn" onClick={() => map.zoomOut()} title="Alejar">
        <Minus size={18} strokeWidth={2.5} />
      </button>
      <button className="map-ctrl-btn map-ctrl-locate" onClick={onLocate} title="Mi ubicacion">
        <Locate size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const PROFILE_COLORS = {
  beige: '#d6cfc4',
  camel: '#b89b7a',
  sage: '#8f9b8a',
  gray: '#9a9a96',
  steel: '#7f8a92',
  olive: '#343316',
};

const Map = () => {
  const { user } = useAuth();
  const passportColorId = localStorage.getItem('passport_color') || 'camel';
  const accentColor = PROFILE_COLORS[passportColorId] || PROFILE_COLORS.camel;
  const [pins, setPins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // mobile only
  const [selectedPin, setSelectedPin] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [commentError, setCommentError] = useState('');
  const [hoveredPinId, setHoveredPinId] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const sidebarRef = useRef(null);
  const cardRefs = useRef({});

  // Track viewport for conditional rendering (only one MapContainer at a time)
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log('Ubicacion denegada:', err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleLocateMe = useCallback(() => {
    if (userLocation) {
      setFlyTarget([userLocation.lat, userLocation.lng]);
    } else {
      requestLocation();
    }
  }, [userLocation, requestLocation]);

  const handleFocusOnMap = useCallback((pin) => {
    setFlyTarget([pin.latitude, pin.longitude]);
    setSelectedPin(pin);
    setViewMode('map');
  }, []);

  // Click a sidebar card -> fly to pin on map
  const handleCardClick = useCallback((pin) => {
    setFlyTarget([pin.latitude, pin.longitude]);
    setHoveredPinId(pin.id);
    setSelectedPin(pin);
  }, []);

  useEffect(() => {
    loadData();
    requestLocation();
    const hasSeenWelcome = localStorage.getItem('hasSeenMapWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      localStorage.setItem('hasSeenMapWelcome', 'true');
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesRes, pinsRes] = await Promise.all([
        categoriesAPI.getAll(),
        pinsAPI.getAll()
      ]);
      setCategories(categoriesRes.data.categories || []);
      setPins(pinsRes.data.pins || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos. Por favor, recarga la pagina.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    setError(null);
    try {
      let params = {};
      if (categoryId !== 'all') {
        // Backend filters by c.name (DB column), so send the id directly
        // FIXED_CATEGORIES ids match the DB name column: parques, cafeteria, etc.
        params = { category: categoryId };
      }
      const response = await pinsAPI.getAll(params);
      setPins(response.data.pins || []);
    } catch (error) {
      console.error('Error changing category:', error);
      setError('Error al filtrar categoria');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (pinId) => {
    try {
      const pin = pins.find(p => p.id === pinId);
      const isLiked = pin?.user_has_liked;

      if (isLiked) {
        await pinsAPI.unlike(pinId);
        setPins(pins.map(p =>
          p.id === pinId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1), user_has_liked: false } : p
        ));
        if (selectedPin?.id === pinId) {
          setSelectedPin(prev => ({ ...prev, likes_count: Math.max(0, (prev.likes_count || 0) - 1), user_has_liked: false }));
        }
      } else {
        try {
          await pinsAPI.like(pinId);
          setPins(pins.map(p =>
            p.id === pinId ? { ...p, likes_count: (p.likes_count || 0) + 1, user_has_liked: true } : p
          ));
          if (selectedPin?.id === pinId) {
            setSelectedPin(prev => ({ ...prev, likes_count: (prev.likes_count || 0) + 1, user_has_liked: true }));
          }
        } catch (error) {
          if (error.response?.status === 409) {
            await pinsAPI.unlike(pinId);
            setPins(pins.map(p =>
              p.id === pinId ? { ...p, user_has_liked: false } : p
            ));
            if (selectedPin?.id === pinId) {
              setSelectedPin(prev => ({ ...prev, user_has_liked: false }));
            }
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const loadComments = async (pinId) => {
    try {
      const response = await pinsAPI.getComments(pinId);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  useEffect(() => {
    if (selectedPin) {
      loadComments(selectedPin.id);
      setActiveImageIndex(0);
      setNewComment('');
      setCommentError('');
    }
  }, [selectedPin]);

  // WebSocket: connect on mount, join/leave pin rooms
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = connectSocket();
    return () => disconnectSocket();
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    if (selectedPin) {
      socket.emit('join-pin', selectedPin.id);

      const handleNewComment = (data) => {
        if (data.pin_id === selectedPin.id) {
          setComments(prev => {
            if (prev.some(c => c.id === data.comment.id)) return prev;
            return [...prev, data.comment];
          });
        }
      };

      const handlePinLiked = (data) => {
        if (data.pin_id === selectedPin.id) {
          // Update likes_count on the selected pin from other users
          setPins(prev => prev.map(p =>
            p.id === data.pin_id
              ? { ...p, likes_count: data.liked ? (p.likes_count || 0) + 1 : Math.max(0, (p.likes_count || 0) - 1) }
              : p
          ));
          setSelectedPin(prev => prev && prev.id === data.pin_id
            ? { ...prev, likes_count: data.liked ? (prev.likes_count || 0) + 1 : Math.max(0, (prev.likes_count || 0) - 1) }
            : prev
          );
        }
      };

      socket.on('new-comment', handleNewComment);
      socket.on('pin-liked', handlePinLiked);

      return () => {
        socket.emit('leave-pin', selectedPin.id);
        socket.off('new-comment', handleNewComment);
        socket.off('pin-liked', handlePinLiked);
      };
    }
  }, [selectedPin]);

  const handleAddComment = async () => {
    if (!newComment.trim() || sendingComment) return;
    const commentText = newComment.trim();
    setSendingComment(true);
    setCommentError('');

    const optimisticComment = {
      id: `temp-${Date.now()}`,
      content: commentText,
      username: user?.username || 'Tu',
      user: { username: user?.username || 'Tu' },
      created_at: new Date().toISOString(),
    };
    setComments(prev => [...prev, optimisticComment]);
    setNewComment('');
    setPins(pins.map(p =>
      p.id === selectedPin.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
    ));
    setSelectedPin(prev => ({ ...prev, comments_count: (prev.comments_count || 0) + 1 }));

    try {
      const res = await pinsAPI.addComment(selectedPin.id, commentText);
      const realComment = res.data.comment;
      if (realComment) {
        setComments(prev => prev.map(c =>
          c.id === optimisticComment.id
            ? { ...realComment, user: { username: user?.username || 'Tu' } }
            : c
        ));
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setPins(pins.map(p =>
        p.id === selectedPin.id ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p
      ));
      setSelectedPin(prev => ({ ...prev, comments_count: Math.max(0, (prev.comments_count || 0) - 1) }));
      const msg = error.response?.data?.error || error.response?.data?.message || 'Error al enviar comentario';
      setCommentError(msg);
      setTimeout(() => setCommentError(''), 4000);
    } finally {
      setSendingComment(false);
    }
  };

  const getMapCenter = () => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    const vp = pins.filter(pin => pin.latitude && pin.longitude);
    if (vp.length > 0) return [vp[0].latitude, vp[0].longitude];
    return [19.4326, -99.1332];
  };

  const handleShare = (pin) => {
    if (pin.latitude && pin.longitude) {
      const googleMapsUrl = `https://www.google.com/maps?q=${pin.latitude},${pin.longitude}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const validPins = pins.filter(pin => pin.latitude && pin.longitude);

  const sortedPins = userLocation
    ? [...validPins].sort((a, b) =>
        getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude) -
        getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
      )
    : validPins;

  const renderFilters = () => (
    <>
      <button
        className={`filter-chip ${selectedCategory === 'all' ? 'active' : ''}`}
        onClick={() => handleCategoryChange('all')}
      >
        <Globe size={18} strokeWidth={2} className="chip-icon" />
        <span className="chip-text">Todos</span>
      </button>
      {FIXED_CATEGORIES.map(cat => (
        <button
          key={cat.id}
          className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
          onClick={() => handleCategoryChange(cat.id)}
        >
          <img src={cat.icon} alt={cat.name} className="chip-pin-icon" />
          <span className="chip-text">{cat.name}</span>
        </button>
      ))}
    </>
  );

  // Sidebar card for desktop
  const renderSidebarCard = (pin) => {
    const dist = userLocation
      ? getDistance(userLocation.lat, userLocation.lng, pin.latitude, pin.longitude)
      : null;
    const isActive = selectedPin?.id === pin.id;

    return (
      <div
        key={pin.id}
        ref={el => cardRefs.current[pin.id] = el}
        className={`sidebar-card ${isActive ? 'active' : ''}`}
        onClick={() => handleCardClick(pin)}
        onMouseEnter={() => setHoveredPinId(pin.id)}
        onMouseLeave={() => setHoveredPinId(null)}
      >
        <div className="sidebar-card-img">
          {pin.image_urls && pin.image_urls.length > 0 ? (
            <img src={pin.image_urls[0]} alt={pin.title} />
          ) : (
            <div className="sidebar-card-img-placeholder">
              <MapPin size={24} strokeWidth={1.5} />
            </div>
          )}
          {dist !== null && (
            <span className="sidebar-card-distance">{formatDistance(dist)}</span>
          )}
        </div>
        <div className="sidebar-card-body">
          <h3 className="sidebar-card-title">{pin.title}</h3>
          {pin.city_name && <span className="sidebar-card-city">{pin.city_name}</span>}
          {pin.description && (
            <p className="sidebar-card-desc">{pin.description}</p>
          )}
          <div className="sidebar-card-meta">
            <span className="sidebar-card-stat">
              <Heart size={14} fill={pin.user_has_liked ? 'currentColor' : 'none'} />
              {pin.likes_count || 0}
            </span>
            <span className="sidebar-card-stat">
              <MessageCircle size={14} />
              {pin.comments_count || 0}
            </span>
            {pin.category_name_es && (
              <span className="sidebar-card-cat">{pin.category_name_es}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Mobile grid card
  const renderGridCard = (pin) => {
    const dist = userLocation
      ? getDistance(userLocation.lat, userLocation.lng, pin.latitude, pin.longitude)
      : null;

    return (
      <div key={pin.id} className="pin-card" onClick={() => setSelectedPin(pin)}>
        {pin.image_urls && pin.image_urls.length > 0 ? (
          <div className="pin-image">
            <img src={pin.image_urls[0]} alt={pin.title} />
            {dist !== null && (
              <span className="pin-distance-badge">{formatDistance(dist)}</span>
            )}
          </div>
        ) : (
          <div className="pin-image pin-image-placeholder">
            <MapPin size={32} />
            {dist !== null && (
              <span className="pin-distance-badge">{formatDistance(dist)}</span>
            )}
          </div>
        )}
        <div className="pin-content">
          <div className="pin-header">
            <h3 className="pin-title">{pin.title}</h3>
            {pin.city_name && <span className="pin-city">{pin.city_name}</span>}
          </div>
          {pin.description && <p className="pin-description">{pin.description}</p>}
          <div className="pin-footer">
            <button
              className={`pin-action-btn ${pin.user_has_liked ? 'liked' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleLike(pin.id); }}
            >
              <Heart size={18} strokeWidth={2} fill={pin.user_has_liked ? 'currentColor' : 'none'} />
              <span>{pin.likes_count || 0}</span>
            </button>
            <button className="pin-action-btn" onClick={(e) => { e.stopPropagation(); setSelectedPin(pin); }}>
              <MessageCircle size={18} strokeWidth={2} />
              <span>{pin.comments_count || 0}</span>
            </button>
            <button
              className="pin-action-btn pin-focus-btn"
              onClick={(e) => { e.stopPropagation(); handleFocusOnMap(pin); }}
              title="Ver en mapa"
            >
              <Locate size={18} strokeWidth={2} />
            </button>
            <button className="pin-action-btn" onClick={(e) => { e.stopPropagation(); handleShare(pin); }}>
              <Navigation size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMapContent = () => (
    <>
      {validPins.length === 0 && !loading ? (
        <div className="empty-state-map">
          <MapPin size={64} strokeWidth={1.5} />
          <h3>No hay pins para mostrar</h3>
          <p>Agrega algunos pins o prueba con otra categoria</p>
        </div>
      ) : (
        <MapContainer
          center={getMapCenter()}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          <RecenterMap pins={validPins} />
          {flyTarget && <FlyToLocation position={flyTarget} onDone={() => setFlyTarget(null)} />}
          <MapControls onLocate={handleLocateMe} />
          {userLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={8}
              pathOptions={{
                fillColor: '#4A90D9',
                fillOpacity: 0.9,
                color: '#fff',
                weight: 3,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Tu ubicacion</span>
              </Tooltip>
            </CircleMarker>
          )}
          {validPins.map((pin) => {
            const categoryName = pin.category_name_es || pin.category_name || 'default';
            return (
              <Marker
                key={pin.id}
                position={[pin.latitude, pin.longitude]}
                icon={createCustomIcon(categoryName)}
                eventHandlers={{ click: () => setSelectedPin(pin) }}
              >
                <Tooltip direction="top" offset={[0, -50]} opacity={1} className="pin-tooltip">
                  <div className="pin-tooltip-content">
                    {pin.image_urls && pin.image_urls.length > 0 && (
                      <img src={pin.image_urls[0]} alt={pin.title} />
                    )}
                    <div className="pin-tooltip-info">
                      <strong>{pin.title}</strong>
                      {pin.city_name && <span>{pin.city_name}</span>}
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </>
  );

  return (
    <div className="map-page" style={{ '--accent': accentColor }}>
      <DesktopHeader />

      {isDesktop ? (
        /* ===== DESKTOP LAYOUT: Split View ===== */
        <div className="split-layout">
          {/* Left Sidebar */}
          <aside className="sidebar" ref={sidebarRef}>
            <div className="sidebar-header">
              <span className="sidebar-label">MAPA 360</span>
              <h1 className="sidebar-title-script">Descubre</h1>
              <p className="sidebar-subtitle">Lugares autenticos de Mexico</p>
              <span className="sidebar-count">{validPins.length} {validPins.length === 1 ? 'lugar' : 'lugares'}</span>
            </div>

            <div className="sidebar-list">
              {loading ? (
                <div className="sidebar-loading">
                  <div className="spinner-map"></div>
                  <p>Cargando...</p>
                </div>
              ) : error ? (
                <div className="sidebar-error">
                  <p>{error}</p>
                  <button onClick={loadData} className="btn-retry">Reintentar</button>
                </div>
              ) : sortedPins.length === 0 ? (
                <div className="sidebar-empty">
                  <MapPin size={40} strokeWidth={1.5} />
                  <p>No hay pins en esta categoria</p>
                </div>
              ) : (
                sortedPins.map(pin => renderSidebarCard(pin))
              )}
            </div>
          </aside>

          {/* Right Map */}
          <div className="map-panel">
            <div className="map-floating-filters">{renderFilters()}</div>
            {renderMapContent()}

            {/* Floating detail card over the map */}
            {selectedPin && (
              <div className="floating-detail">
                <div className="floating-detail-inner">
                  <button className="floating-detail-close" onClick={() => setSelectedPin(null)}>
                    <X size={14} />
                  </button>

                  {selectedPin.image_urls && selectedPin.image_urls.length > 0 ? (
                    <div className="floating-detail-img">
                      <img
                        src={selectedPin.image_urls[activeImageIndex]}
                        alt={selectedPin.title}
                        onClick={() => setLightboxUrl(selectedPin.image_urls[activeImageIndex])}
                        style={{ cursor: 'pointer' }}
                      />
                      {selectedPin.image_urls.length > 1 && (
                        <>
                          <button
                            className="img-arrow img-arrow-left"
                            onClick={() => setActiveImageIndex(i => (i - 1 + selectedPin.image_urls.length) % selectedPin.image_urls.length)}
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            className="img-arrow img-arrow-right"
                            onClick={() => setActiveImageIndex(i => (i + 1) % selectedPin.image_urls.length)}
                          >
                            <ChevronRight size={18} />
                          </button>
                          <div className="img-counter">{activeImageIndex + 1}/{selectedPin.image_urls.length}</div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="floating-detail-img floating-detail-img-empty">
                      <MapPin size={28} strokeWidth={1} />
                    </div>
                  )}

                  <div className="floating-detail-body">
                    <h2 className="floating-detail-title">{selectedPin.title}</h2>
                    <div className="floating-detail-meta">
                      {selectedPin.city_name && (
                        <span className="overlay-location">{selectedPin.city_name}</span>
                      )}
                      {selectedPin.category_name_es && (
                        <span className="overlay-category">{selectedPin.category_name_es}</span>
                      )}
                    </div>

                    {selectedPin.user_username && (
                      <div className="floating-detail-author">
                        <div className="overlay-author-avatar">
                          {selectedPin.user_username.charAt(0).toUpperCase()}
                        </div>
                        <span>@{selectedPin.user_username}</span>
                      </div>
                    )}

                    {selectedPin.description && (
                      <p className="floating-detail-desc">{selectedPin.description}</p>
                    )}

                    <div className="overlay-actions">
                      <button
                        className={`overlay-btn ${selectedPin.user_has_liked ? 'liked' : ''}`}
                        onClick={() => handleLike(selectedPin.id)}
                      >
                        <Heart size={16} fill={selectedPin.user_has_liked ? 'currentColor' : 'none'} />
                        <span>{selectedPin.likes_count || 0}</span>
                      </button>
                      <button className="overlay-btn">
                        <MessageCircle size={16} />
                        <span>{comments.length}</span>
                      </button>
                      <button
                        className="overlay-btn overlay-btn-nav"
                        onClick={() => handleShare(selectedPin)}
                      >
                        <Navigation size={14} />
                        <span>Ir</span>
                      </button>
                    </div>

                    <div className="floating-detail-comments">
                      <h3 className="overlay-comments-title">
                        Comentarios
                        {comments.length > 0 && <span>({comments.length})</span>}
                      </h3>

                      {comments.length > 0 ? (
                        <div className="overlay-comments-list">
                          {comments.map((comment, idx) => (
                            <div key={idx} className="overlay-comment">
                              <div className="overlay-comment-avatar">
                                {(comment.user?.username || comment.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="overlay-comment-body">
                                <span className="overlay-comment-user">
                                  {comment.user?.username || comment.username || 'Usuario'}
                                </span>
                                <p className="overlay-comment-text">{comment.content || comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="overlay-no-comments">Se el primero en comentar</p>
                      )}

                      {commentError && (
                        <p className="overlay-comment-error">{commentError}</p>
                      )}
                      {user && (
                        <div className="overlay-comment-form">
                          <div className="overlay-comment-input-avatar">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <input
                            type="text"
                            placeholder="Escribe un comentario..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            disabled={sendingComment}
                          />
                          <button
                            className="overlay-send-btn"
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || sendingComment}
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===== MOBILE LAYOUT ===== */
        <div className="mobile-layout">
          {/* Mobile Header */}
          <div className="mobile-header">
            <div>
              <h1>Descubre</h1>
              <p className="map-subtitle">Lugares autenticos de Mexico</p>
            </div>
            <div className="view-toggle">
              <button
                className={viewMode === 'map' ? 'active' : ''}
                onClick={() => { setViewMode('map'); requestLocation(); }}
              >
                <MapIcon size={16} />
                Mapa
              </button>
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
              >
                <List size={16} />
                Lista
              </button>
            </div>
          </div>

          {/* Mobile Content */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner-map"></div>
              <p>Cargando mapa...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadData} className="btn-retry">Reintentar</button>
            </div>
          ) : viewMode === 'map' ? (
            <div className="map-container-mobile">
              <div className="categories-filter floating">{renderFilters()}</div>
              {renderMapContent()}
            </div>
          ) : (
            <>
              <div className="categories-filter">{renderFilters()}</div>
              <div className="pins-grid-view">
                {sortedPins.length === 0 ? (
                  <div className="empty-state">
                    <MapPin size={64} strokeWidth={1.5} />
                    <h3>No hay pins en esta categoria</h3>
                    <p>Prueba con otra categoria</p>
                  </div>
                ) : (
                  <div className="pins-grid">
                    {sortedPins.map(pin => renderGridCard(pin))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== MOBILE PIN DETAIL OVERLAY (only on mobile) ===== */}
      {!isDesktop && selectedPin && (
        <div className="overlay-backdrop" onClick={() => setSelectedPin(null)}>
          <div className="overlay-card" onClick={(e) => e.stopPropagation()}>
            <div className="overlay-image-section">
              {selectedPin.image_urls && selectedPin.image_urls.length > 0 ? (
                <>
                  <img
                    src={selectedPin.image_urls[activeImageIndex]}
                    alt={selectedPin.title}
                    className="overlay-hero-img"
                    onClick={() => setLightboxUrl(selectedPin.image_urls[activeImageIndex])}
                    style={{ cursor: 'pointer' }}
                  />
                  {selectedPin.image_urls.length > 1 && (
                    <>
                      <button
                        className="img-arrow img-arrow-left"
                        onClick={() => setActiveImageIndex(i => (i - 1 + selectedPin.image_urls.length) % selectedPin.image_urls.length)}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        className="img-arrow img-arrow-right"
                        onClick={() => setActiveImageIndex(i => (i + 1) % selectedPin.image_urls.length)}
                      >
                        <ChevronRight size={20} />
                      </button>
                      <div className="img-counter">{activeImageIndex + 1}/{selectedPin.image_urls.length}</div>
                    </>
                  )}
                </>
              ) : (
                <div className="overlay-hero-placeholder">
                  <MapPin size={40} strokeWidth={1} />
                </div>
              )}
              <button className="overlay-close" onClick={() => setSelectedPin(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="overlay-glass">
              <div className="overlay-header">
                <div className="overlay-header-info">
                  <h2 className="overlay-title">{selectedPin.title}</h2>
                  <div className="overlay-meta">
                    {selectedPin.city_name && (
                      <span className="overlay-location">{selectedPin.city_name}</span>
                    )}
                    {selectedPin.category_name_es && (
                      <span className="overlay-category">{selectedPin.category_name_es}</span>
                    )}
                  </div>
                </div>
                {selectedPin.user_username && (
                  <div className="overlay-author">
                    <div className="overlay-author-avatar">
                      {selectedPin.user_username.charAt(0).toUpperCase()}
                    </div>
                    <span>@{selectedPin.user_username}</span>
                  </div>
                )}
              </div>

              {selectedPin.description && (
                <p className="overlay-description">{selectedPin.description}</p>
              )}

              <div className="overlay-actions">
                <button
                  className={`overlay-btn ${selectedPin.user_has_liked ? 'liked' : ''}`}
                  onClick={() => handleLike(selectedPin.id)}
                >
                  <Heart size={18} fill={selectedPin.user_has_liked ? 'currentColor' : 'none'} />
                  <span>{selectedPin.likes_count || 0}</span>
                </button>
                <button className="overlay-btn">
                  <MessageCircle size={18} />
                  <span>{comments.length}</span>
                </button>
                <button
                  className="overlay-btn overlay-btn-nav"
                  onClick={() => handleShare(selectedPin)}
                >
                  <Navigation size={16} />
                  <span>Ir</span>
                </button>
              </div>

              <div className="overlay-comments">
                <h3 className="overlay-comments-title">
                  Comentarios
                  {comments.length > 0 && <span>({comments.length})</span>}
                </h3>

                {comments.length > 0 ? (
                  <div className="overlay-comments-list">
                    {comments.map((comment, idx) => (
                      <div key={idx} className="overlay-comment">
                        <div className="overlay-comment-avatar">
                          {(comment.user?.username || comment.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="overlay-comment-body">
                          <span className="overlay-comment-user">
                            {comment.user?.username || comment.username || 'Usuario'}
                          </span>
                          <p className="overlay-comment-text">{comment.content || comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="overlay-no-comments">Se el primero en comentar</p>
                )}

                {commentError && (
                  <p className="overlay-comment-error">{commentError}</p>
                )}
                {user && (
                  <div className="overlay-comment-form">
                    <div className="overlay-comment-input-avatar">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <input
                      type="text"
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      disabled={sendingComment}
                    />
                    <button
                      className="overlay-send-btn"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || sendingComment}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      {showWelcome && (
        <div className="welcome-overlay" onClick={() => setShowWelcome(false)}>
          <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
            <h2>BIENVENIDO AL MAPA 360</h2>
            <p>
              Aqui podras encontrar todas las experiencias que exploradores de
              TRESESENTA han compartido.
            </p>
            <p className="welcome-cta">Unite a la comunidad!</p>
            <button
              className="btn-welcome"
              onClick={() => setShowWelcome(false)}
            >
              Explorar Mapa
            </button>
          </div>
        </div>
      )}

      {/* Lightbox - click image to see bigger */}
      {lightboxUrl && (
        <div className="lightbox-backdrop" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Foto ampliada" className="lightbox-img" />
          <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>
            <X size={20} />
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Map;
