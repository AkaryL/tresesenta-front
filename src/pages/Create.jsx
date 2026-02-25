import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Upload, Image as ImageIcon, Check, Navigation } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { pinsAPI, categoriesAPI, citiesAPI, uploadAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import './Create.css';
import './Auth.css';

const PROFILE_COLORS = {
  beige: '#d6cfc4',
  camel: '#b89b7a',
  sage: '#8f9b8a',
  gray: '#9a9a96',
  steel: '#7f8a92',
  olive: '#343316',
};

const createColoredPin = (color) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="#fff" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'custom-create-pin',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
};

// Recenter map when position changes
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

// Draggable marker component with custom color
const DraggableMarker = ({ position, onDragEnd, color }) => {
  const markerRef = useRef(null);
  const icon = useMemo(() => createColoredPin(color), [color]);
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        onDragEnd(lat, lng);
      }
    },
  }), [onDragEnd]);

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={icon}
    />
  );
};

const Create = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [shoeModels, setShoeModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [detectedCity, setDetectedCity] = useState('');
  const [successData, setSuccessData] = useState(null);
  const passportColorId = localStorage.getItem('passport_color') || 'olive';
  const pinColor = PROFILE_COLORS[passportColorId] || PROFILE_COLORS.olive;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    city_id: '',
    latitude: '',
    longitude: '',
    shoe_model: '',
    used_tresesenta: false,
  });

  useEffect(() => {
    loadCategories();
    loadCities();
    loadMyShoes();
    // Auto-detect location on mount
    getGPSLocation();
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCities = async () => {
    try {
      const response = await citiesAPI.getAll();
      setCities(response.data.cities || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadMyShoes = async () => {
    try {
      const response = await authAPI.myOrders();
      const orders = response.data.orders || [];
      const names = new Set();
      orders.forEach(order =>
        order.items.forEach(item => {
          if (item.title) names.add(item.title);
        })
      );
      setShoeModels([...names].map(name => ({ value: name, label: name })));
    } catch (error) {
      console.error('Error loading shoes:', error);
    }
  };

  // Reverse geocode to find city
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const cityName = addr.city || addr.town || addr.municipality || addr.state || '';
      setDetectedCity(cityName);

      // Match to existing cities
      if (cityName && cities.length > 0) {
        const match = cities.find(c =>
          c.name.toLowerCase().includes(cityName.toLowerCase()) ||
          cityName.toLowerCase().includes(c.name.toLowerCase())
        );
        if (match) {
          setFormData(prev => ({ ...prev, city_id: match.id.toString() }));
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + images.length > 5) {
      alert('Máximo 5 imágenes');
      return;
    }

    setImages([...images, ...files]);

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const getGPSLocation = () => {
    setGpsLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
          }));
          setGpsLoading(false);
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('No se pudo obtener la ubicación');
          setGpsLoading(false);
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización');
      setGpsLoading(false);
    }
  };

  const handleMarkerDrag = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
    reverseGeocode(lat, lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload pin images
      let imageUrls = [];
      if (images.length > 0) {
        const formDataImages = new FormData();
        images.forEach(image => {
          formDataImages.append('images', image);
        });
        try {
          const uploadResponse = await uploadAPI.images(formDataImages);
          imageUrls = uploadResponse.data.images || uploadResponse.data.urls || [];
        } catch (uploadErr) {
          console.error('Upload error details:', uploadErr.response?.data || uploadErr.message);
          alert('Error al subir imágenes: ' + (uploadErr.response?.data?.error || uploadErr.message));
          setLoading(false);
          return;
        }
      }

      // Create pin - clean up empty values
      const pinData = {
        title: formData.title,
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        category_id: parseInt(formData.category_id),
        image_urls: imageUrls,
        used_tresesenta: formData.used_tresesenta,
      };
      if (formData.city_id) pinData.city_id = parseInt(formData.city_id);
      if (formData.shoe_model) pinData.shoe_model = formData.shoe_model;

      const pinResponse = await pinsAPI.create(pinData);

      const createdPin = pinResponse.data.pin;

      setSuccessData({
        message: pinResponse.data.message || 'Pin creado exitosamente',
        points: pinResponse.data.points_earned || 0,
        verification: pinResponse.data.verification_status === 'pending',
        image: imageUrls[0] || null,
      });
    } catch (error) {
      console.error('Error creating pin:', error);
      alert(error.response?.data?.error || 'Error al crear el pin');
    } finally {
      setLoading(false);
    }
  };

  const hasLocation = formData.latitude && formData.longitude;
  const isFormValid = formData.title.trim() && formData.description.trim() && formData.category_id && hasLocation;
  const titleLength = formData.title.length;
  const descLength = formData.description.length;

  return (
    <div className="create-page">
      {/* Desktop Header */}
      <DesktopHeader />

      {/* Mobile Header */}
      <div className="create-header-minimal">
        <button className="btn-back" onClick={() => navigate('/map')}>
          <X size={24} />
        </button>
        <h1>Nuevo Pin</h1>
        <button
          className="btn-publish"
          onClick={handleSubmit}
          disabled={loading || !isFormValid}
        >
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
      </div>

      <div className="create-content">
        <div className="create-desktop-header">
          <div>
            <h1 className="create-desktop-title">Crear nuevo Pin</h1>
            <p className="create-desktop-subtitle">Comparte tu experiencia con la comunidad</p>
          </div>
          <button
            className="btn-publish-desktop"
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
          >
            {loading ? 'Publicando...' : 'Publicar Pin'}
          </button>
        </div>
        <form className="create-form" onSubmit={handleSubmit}>
          {/* Image Upload Section */}
          <div className="images-section">
            {imagePreviews.length === 0 ? (
              <label className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <div className="upload-placeholder">
                  <ImageIcon size={48} />
                  <p>Agregar fotos</p>
                  <span>Hasta 5 imágenes</span>
                </div>
              </label>
            ) : (
              <div className="images-preview">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeImage(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="add-more">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <Upload size={24} />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="form-fields">
            <div className="field-group">
              <div className="field-header">
                <label>Título</label>
                {titleLength > 0 && <span className={`char-count ${titleLength > 100 ? 'over' : ''}`}>{titleLength}/100</span>}
              </div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Nombre del lugar"
              />
            </div>

            <div className="field-group">
              <div className="field-header">
                <label>Descripción</label>
                {descLength > 0 && <span className={`char-count ${descLength > 500 ? 'over' : ''}`}>{descLength}/500</span>}
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                maxLength={500}
                placeholder="Cuéntanos sobre este lugar..."
                rows="4"
              />
            </div>

            <div className="field-group">
              <label>Categoría</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_es || cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="location-section">
              {detectedCity && (
                <div className="city-kpi">
                  <MapPin size={14} />
                  <span className="city-kpi-label">CIUDAD</span>
                  <span className="city-kpi-value">{detectedCity}</span>
                </div>
              )}

              <label className="field-label">Ubicación</label>
              {hasLocation ? (
                <div className="gps-map-preview">
                  <MapContainer
                    center={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}
                    zoom={15}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    attributionControl={false}
                    doubleClickZoom={false}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <RecenterMap lat={parseFloat(formData.latitude)} lng={parseFloat(formData.longitude)} />
                    <DraggableMarker
                      position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}
                      onDragEnd={handleMarkerDrag}
                      color={pinColor}
                    />
                  </MapContainer>
                  <div className="gps-map-badge">
                    <Check size={14} />
                    <span>Arrastra el pin para ajustar</span>
                  </div>
                  <button
                    type="button"
                    className="gps-map-retry"
                    onClick={getGPSLocation}
                  >
                    <Navigation size={12} />
                    Enfocar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-gps"
                  onClick={getGPSLocation}
                  disabled={gpsLoading}
                >
                  <MapPin size={18} />
                  {gpsLoading ? 'Obteniendo ubicación...' : 'Capturar mi ubicación'}
                </button>
              )}
            </div>

            {/* Checkbox Tresesenta - Verificación */}
            <label className="tresesenta-checkbox">
              <input
                type="checkbox"
                checked={formData.used_tresesenta}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    used_tresesenta: checked,
                    shoe_model: checked ? prev.shoe_model : '',
                  }));
                }}
              />
              <div className="tresesenta-checkbox-content">
                <strong>Usé mis tenis Tresesenta en esta publicación</strong>
                <span>Gana puntos extra por compartir tu experiencia real.</span>
              </div>
            </label>

            {/* Shoe Model + Verification (only when checkbox is checked) */}
            {formData.used_tresesenta && (
              <>
                <div className="field-group">
                  <label>¿Con qué modelo fuiste?</label>
                  <select
                    name="shoe_model"
                    value={formData.shoe_model}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona tu modelo</option>
                    {shoeModels.map(model => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                  {shoeModels.length === 0 && (
                    <span className="field-hint">No tienes modelos en tu colección aún.</span>
                  )}
                </div>

              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-create-pin"
              disabled={loading || !isFormValid}
            >
              <MapPin size={18} />
              {loading ? 'Publicando...' : 'Crear Pin'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {successData && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-stamp">
              <div className="stamp-circle" style={{ borderColor: pinColor }}>
                <div className="stamp-inner" style={{ background: pinColor }}>
                  <Check size={32} color="#fff" />
                </div>
              </div>
              <div className="stamp-lines">
                <div className="stamp-line" style={{ background: pinColor }} />
                <div className="stamp-line" style={{ background: pinColor }} />
                <div className="stamp-line" style={{ background: pinColor }} />
              </div>
            </div>

            {successData.image && (
              <div className="success-image">
                <img src={successData.image} alt="Pin creado" />
              </div>
            )}

            <div className="success-text">
              <h2>Pin registrado</h2>
              {successData.points > 0 && (
                <div className="success-points">+{successData.points} puntos</div>
              )}
              {successData.verification && (
                <p className="success-verification">Tu verificación TRESESENTA está pendiente de aprobación</p>
              )}
            </div>

            <button
              className="success-btn"
              style={{ background: pinColor }}
              onClick={() => navigate('/map')}
            >
              Ver en Mapa 360
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Create;
