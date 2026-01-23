import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {
  MapPin, Heart, MessageCircle, X, Navigation,
  Coffee, Wine, Palette, Star, Globe, Trees, Utensils
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { pinsAPI, categoriesAPI } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

// Colores de categorías según diseño Mapa 360
const CATEGORY_COLORS = {
  'Parques': '#7ed957',
  'Restaurante': '#9b59b6',
  'Vida Nocturna': '#85c1e9',
  'Cafetería': '#f5a623',
  'Cultura': '#e84393',
  'Favoritos': '#f1c40f',
  'default': '#b89b7a'
};

// Componentes de iconos para cada categoría
const CATEGORY_ICON_COMPONENTS = {
  'Parques': Trees,
  'Restaurante': Utensils,
  'Vida Nocturna': Wine,
  'Cafetería': Coffee,
  'Cultura': Palette,
  'Favoritos': Star,
  'default': MapPin
};

// Función para crear marcadores coloridos personalizados con SVG de categoría
const createCustomIcon = (color, categoryName) => {
  // SVG paths para cada categoría
  const iconPaths = {
    'MONUMENTOS': 'M12 2l-8 8v12h5v-7h6v7h5V10z',
    'NATURALEZA / CAMINOS': 'M12 2L4 8v4l8 6 8-6V8z',
    'CAFÉS': 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z',
    'NIGHTLIFE (BARES/RESTAURANTES)': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
    'MUSEOS / EXCURSIONES': 'M12 2l-5.5 9h11z M7 13h10v8H7z',
    'CURIOSOS': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  };

  const iconPath = iconPaths[categoryName] || 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z';

  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
          <path d="${iconPath}"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Componente para re-centrar el mapa cuando cambian los pins
const RecenterMap = ({ pins }) => {
  const map = useMap();

  useEffect(() => {
    if (pins && pins.length > 0) {
      const validPins = pins.filter(pin => pin.latitude && pin.longitude);
      if (validPins.length > 0) {
        const bounds = validPins.map(pin => [pin.latitude, pin.longitude]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [pins, map]);

  return null;
};

const Map = () => {
  const [pins, setPins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [selectedPin, setSelectedPin] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    loadData();
    // Mostrar bienvenida si es la primera vez
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

      const categoriesData = categoriesRes.data.categories || [];
      const pinsData = pinsRes.data.pins || [];

      console.log('Categorías cargadas:', categoriesData.length);
      console.log('Pins cargados:', pinsData.length);
      console.log('Pins con coordenadas:', pinsData.filter(p => p.latitude && p.longitude).length);

      setCategories(categoriesData);
      setPins(pinsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos. Por favor, recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    setError(null);
    try {
      const params = categoryId !== 'all' ? { category: categoryId } : {};
      const response = await pinsAPI.getAll(params);
      setPins(response.data.pins || []);
    } catch (error) {
      console.error('Error changing category:', error);
      setError('Error al filtrar categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (pinId) => {
    try {
      const pin = pins.find(p => p.id === pinId);
      const isLiked = pin?.user_has_liked;

      if (isLiked) {
        // Unlike
        await pinsAPI.unlike(pinId);
        setPins(pins.map(p =>
          p.id === pinId ? {
            ...p,
            likes_count: Math.max(0, (p.likes_count || 0) - 1),
            user_has_liked: false
          } : p
        ));
        if (selectedPin && selectedPin.id === pinId) {
          setSelectedPin({
            ...selectedPin,
            likes_count: Math.max(0, (selectedPin.likes_count || 0) - 1),
            user_has_liked: false
          });
        }
      } else {
        // Like
        try {
          await pinsAPI.like(pinId);
          setPins(pins.map(p =>
            p.id === pinId ? {
              ...p,
              likes_count: (p.likes_count || 0) + 1,
              user_has_liked: true
            } : p
          ));
          if (selectedPin && selectedPin.id === pinId) {
            setSelectedPin({
              ...selectedPin,
              likes_count: (selectedPin.likes_count || 0) + 1,
              user_has_liked: true
            });
          }
        } catch (error) {
          // Si es 409, significa que ya le dio like, entonces hacemos unlike
          if (error.response?.status === 409) {
            console.log('Ya le habías dado like, quitando like...');
            await pinsAPI.unlike(pinId);
            setPins(pins.map(p =>
              p.id === pinId ? {
                ...p,
                user_has_liked: false
              } : p
            ));
            if (selectedPin && selectedPin.id === pinId) {
              setSelectedPin({
                ...selectedPin,
                user_has_liked: false
              });
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
      console.log('Comentarios cargados:', response.data.comments?.length || 0);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  useEffect(() => {
    if (selectedPin) {
      loadComments(selectedPin.id);
    }
  }, [selectedPin]);

  const getMapCenter = () => {
    const validPins = pins.filter(pin => pin.latitude && pin.longitude);
    if (validPins.length > 0) {
      return [validPins[0].latitude, validPins[0].longitude];
    }
    return [19.4326, -99.1332]; // CDMX default
  };

  const getCategoryColor = (categoryName) => {
    return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.default;
  };

  const getCategoryIconComponent = (categoryName) => {
    return CATEGORY_ICON_COMPONENTS[categoryName] || CATEGORY_ICON_COMPONENTS.default;
  };

  const handleShare = (pin) => {
    if (pin.latitude && pin.longitude) {
      const googleMapsUrl = `https://www.google.com/maps?q=${pin.latitude},${pin.longitude}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const validPins = pins.filter(pin => pin.latitude && pin.longitude);

  return (
    <div className="map-page">
      {/* Header */}
      <div className="map-header-minimal">
        <div>
          <h1>Descubre</h1>
          <p className="map-subtitle">Descubre lugares auténticos de México</p>
        </div>
        <div className="view-toggle">
          <button
            className={viewMode === 'map' ? 'active' : ''}
            onClick={() => setViewMode('map')}
          >
            Mapa
          </button>
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="categories-filter">
        <button
          className={`filter-chip ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('all')}
        >
          <Globe size={18} strokeWidth={2} className="chip-icon" />
          <span className="chip-text">Todos</span>
        </button>
        {categories.map(cat => {
          const categoryName = cat.name_es || cat.name;
          const IconComponent = getCategoryIconComponent(categoryName);
          return (
            <button
              key={cat.id}
              className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <IconComponent size={18} strokeWidth={2} className="chip-icon" />
              <span className="chip-text">{categoryName}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
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
      ) : (
        <>
          {viewMode === 'map' ? (
            <div className="map-container">
              {validPins.length === 0 ? (
                <div className="empty-state-map">
                  <MapPin size={64} strokeWidth={1.5} />
                  <h3>No hay pins para mostrar</h3>
                  <p>Agrega algunos pins primero o prueba con otra categoría</p>
                  <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                    Pins cargados: {pins.length} | Con coordenadas: {validPins.length}
                  </p>
                </div>
              ) : (
                <MapContainer
                  key={`map-${validPins.length}`}
                  center={getMapCenter()}
                  zoom={12}
                  style={{
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1
                  }}
                  scrollWheelZoom={true}
                  zoomControl={true}
                  whenCreated={(map) => {
                    console.log('Mapa creado!', map);
                    setTimeout(() => {
                      map.invalidateSize();
                      console.log('Mapa redimensionado');
                    }, 100);
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                  <RecenterMap pins={validPins} />
                  {validPins.map((pin) => {
                    const category = categories.find(c => c.id === pin.category_id);
                    const categoryName = category?.name_es || category?.name || 'default';
                    const color = getCategoryColor(categoryName);

                    return (
                      <Marker
                        key={pin.id}
                        position={[pin.latitude, pin.longitude]}
                        icon={createCustomIcon(color, categoryName)}
                        eventHandlers={{
                          click: () => setSelectedPin(pin),
                        }}
                      >
                        <Popup>
                          <div className="map-popup">
                            <h3>{pin.title}</h3>
                            {pin.image_urls && pin.image_urls.length > 0 && (
                              <img
                                src={pin.image_urls[0]}
                                alt={pin.title}
                                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }}
                              />
                            )}
                            <p style={{ marginTop: '8px', fontSize: '14px' }}>{pin.description}</p>
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                              {pin.city_name && <span>📍 {pin.city_name}</span>}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          ) : (
            <div className="pins-grid-view">
              {validPins.length === 0 ? (
                <div className="empty-state">
                  <MapPin size={64} strokeWidth={1.5} />
                  <h3>No hay pins en esta categoría</h3>
                  <p>Prueba con otra categoría</p>
                </div>
              ) : (
                <div className="pins-grid">
                  {validPins.map((pin) => (
                    <div key={pin.id} className="pin-card" onClick={() => setSelectedPin(pin)}>
                      {pin.image_urls && pin.image_urls.length > 0 ? (
                        <div className="pin-image">
                          <img src={pin.image_urls[0]} alt={pin.title} />
                        </div>
                      ) : (
                        <div className="pin-image pin-image-placeholder">
                          <MapPin size={32} />
                        </div>
                      )}

                      <div className="pin-content">
                        <div className="pin-header">
                          <h3 className="pin-title">{pin.title}</h3>
                          {pin.city_name && (
                            <span className="pin-city">{pin.city_name}</span>
                          )}
                        </div>

                        {pin.description && (
                          <p className="pin-description">{pin.description}</p>
                        )}

                        <div className="pin-footer">
                          <button
                            className={`pin-action-btn ${pin.user_has_liked ? 'liked' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(pin.id);
                            }}
                          >
                            <Heart
                              size={18}
                              strokeWidth={2}
                              fill={pin.user_has_liked ? 'currentColor' : 'none'}
                            />
                            <span>{pin.likes_count || 0}</span>
                          </button>
                          <button
                            className="pin-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPin(pin);
                            }}
                          >
                            <MessageCircle size={18} strokeWidth={2} />
                            <span>{pin.comments_count || 0}</span>
                          </button>
                          <button
                            className="pin-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(pin);
                            }}
                          >
                            <Navigation size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Pin Detail Modal */}
      {selectedPin && (
        <div className="pin-modal-overlay" onClick={() => setSelectedPin(null)}>
          <div className="pin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPin(null)}>
              <X size={20} />
            </button>

            {selectedPin.image_urls && selectedPin.image_urls.length > 0 && (
              <img src={selectedPin.image_urls[0]} alt={selectedPin.title} />
            )}

            <div className="modal-content">
              <h2>{selectedPin.title}</h2>
              <p className="modal-location">{selectedPin.city_name}</p>
              <p className="modal-description">{selectedPin.description}</p>

              <div className="modal-actions">
                <button
                  className={`modal-action-btn ${selectedPin.user_has_liked ? 'liked' : ''}`}
                  onClick={() => handleLike(selectedPin.id)}
                >
                  <Heart
                    size={20}
                    strokeWidth={2}
                    fill={selectedPin.user_has_liked ? 'currentColor' : 'none'}
                  />
                  <span>{selectedPin.likes_count || 0}</span>
                </button>
                <button className="modal-action-btn">
                  <MessageCircle size={20} strokeWidth={2} />
                  <span>{selectedPin.comments_count || 0}</span>
                </button>
                <button
                  className="modal-action-btn"
                  onClick={() => handleShare(selectedPin)}
                >
                  <Navigation size={20} strokeWidth={2} />
                  <span>Ir</span>
                </button>
              </div>

              {/* Sección de comentarios */}
              <div className="comments-section">
                <h3>Comentarios ({comments.length})</h3>
                {comments && comments.length > 0 ? (
                  <div className="comments-list">
                    {comments.map((comment, idx) => (
                      <div key={idx} className="comment-item">
                        <strong>{comment.user?.username || comment.username || 'Usuario'}</strong>
                        <p>{comment.content || comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-comments">No hay comentarios aún. ¡Sé el primero!</p>
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
            <h2>🌎 BIENVENIDO AL MAPA 360</h2>
            <p>
              Aquí podrás encontrar todas las experiencias que exploradores de
              TRESESENTA han compartido.
            </p>
            <p className="welcome-cta">¡Únete a la comunidad!</p>
            <button
              className="btn-welcome"
              onClick={() => setShowWelcome(false)}
            >
              Explorar Mapa
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Map;
