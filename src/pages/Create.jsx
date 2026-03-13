import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { X, MapPin, Upload, Image as ImageIcon, Check, Navigation, Search } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { pinsAPI, categoriesAPI, citiesAPI, uploadAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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

const GOOGLE_LIBRARIES = ['places'];

const MAP_STYLES = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d1d9' }] },
  { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f5f0ea' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e0d4' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

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
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const searchTimeoutRef = useRef(null);
  const mapRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const passportColorId = localStorage.getItem('passport_color') || 'olive';
  const pinColor = PROFILE_COLORS[passportColorId] || PROFILE_COLORS.olive;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_LIBRARIES,
  });

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
    getGPSLocation();
  }, []);

  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // Initialize Google services once loaded
  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      geocoderRef.current = new window.google.maps.Geocoder();
      // PlacesService needs a div element if map isn't loaded yet
      if (!placesServiceRef.current) {
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
      }
    }
  }, [isLoaded]);

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

  // Reverse geocode using Google Geocoding API
  const reverseGeocode = async (lat, lng) => {
    if (!geocoderRef.current) return;
    try {
      const response = await geocoderRef.current.geocode({
        location: { lat, lng },
      });
      if (response.results && response.results.length > 0) {
        let cityName = '';
        let stateName = '';
        for (const result of response.results) {
          for (const component of result.address_components) {
            if (component.types.includes('locality') && !cityName) {
              cityName = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1') && !stateName) {
              stateName = component.long_name;
            }
          }
          if (cityName && stateName) break;
        }
        if (!cityName) cityName = stateName;
        setDetectedCity(cityName);

        // Save state name for badge unlocking
        if (stateName) {
          setFormData(prev => ({ ...prev, state_name: stateName }));
        }

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
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  // Location search using Google Places textSearch for better local results
  const handleLocationSearch = (value) => {
    setLocationSearch(value);
    setLocationResults([]);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value.trim() || value.length < 3 || !placesServiceRef.current) return;

    searchTimeoutRef.current = setTimeout(() => {
      setSearchLoading(true);
      const request = {
        query: value,
        language: 'es',
      };

      // Bias towards user's current location
      if (formData.latitude && formData.longitude) {
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        request.location = new window.google.maps.LatLng(lat, lng);
        request.radius = 30000; // 30km bias
      }

      placesServiceRef.current.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setLocationResults(results.slice(0, 6).map(r => ({
            place_id: r.place_id,
            display_name: r.formatted_address || r.name,
            main_text: r.name,
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng(),
          })));
        } else {
          setLocationResults([]);
        }
        setSearchLoading(false);
      });
    }, 400);
  };

  const handleSelectLocation = (result) => {
    const lat = result.lat;
    const lng = result.lng;
    if (!lat || !lng) return;

    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
    setLocationSearch(result.main_text || result.display_name);
    setLocationResults([]);
    reverseGeocode(lat, lng);

    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(15);
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

  const handleMarkerDrag = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
    reverseGeocode(lat, lng);
  }, [cities]);

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    // Also initialize PlacesService (needs a map or div element)
    placesServiceRef.current = new window.google.maps.places.PlacesService(map);
  }, []);

  // Recenter when focusTrigger changes
  useEffect(() => {
    if (mapRef.current && formData.latitude && formData.longitude) {
      mapRef.current.panTo({
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude),
      });
      mapRef.current.setZoom(15);
    }
  }, [focusTrigger]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
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
      if (formData.state_name) pinData.state_name = formData.state_name;

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

  // SVG pin icon for Google Maps marker
  const pinSvgUrl = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${pinColor}" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="#fff" opacity="0.9"/></svg>`)}`;

  return (
    <div className="create-page">
      <DesktopHeader />

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

              {/* Location search with Google Places */}
              <div className="location-search-wrapper">
                <div className="location-search-input-row">
                  <Search size={16} className="location-search-icon" />
                  <input
                    type="text"
                    className="location-search-input"
                    placeholder="Buscar calle, colonia, ciudad..."
                    value={locationSearch}
                    onChange={e => handleLocationSearch(e.target.value)}
                  />
                  {searchLoading && <span className="location-search-spinner" />}
                </div>
                {locationResults.length > 0 && (
                  <ul className="location-search-results">
                    {locationResults.map(r => (
                      <li key={r.place_id} onClick={() => handleSelectLocation(r)}>
                        <MapPin size={13} />
                        <span>{r.display_name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {hasLocation && isLoaded ? (
                <div className="gps-map-preview">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={{ lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }}
                    zoom={15}
                    options={{
                      disableDefaultUI: true,
                      clickableIcons: false,
                      styles: MAP_STYLES,
                      gestureHandling: 'cooperative',
                    }}
                    onLoad={handleMapLoad}
                  >
                    <MarkerF
                      position={{ lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }}
                      draggable
                      onDragEnd={handleMarkerDrag}
                      icon={{
                        url: pinSvgUrl,
                        scaledSize: new window.google.maps.Size(32, 42),
                        anchor: new window.google.maps.Point(16, 42),
                      }}
                    />
                  </GoogleMap>
                  <div className="gps-map-badge">
                    <Check size={14} />
                    <span>Arrastra el pin para ajustar</span>
                  </div>
                  <button
                    type="button"
                    className="gps-map-retry"
                    onClick={() => setFocusTrigger(t => t + 1)}
                  >
                    <Navigation size={12} />
                    Enfocar
                  </button>
                </div>
              ) : hasLocation && !isLoaded ? (
                <div className="gps-map-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner-map"></div>
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

            {/* Checkbox Tresesenta */}
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
              <h2>Pin enviado</h2>
              {successData.points > 0 ? (
                <div className="success-points">+{successData.points} puntos</div>
              ) : (
                <p className="success-verification">Recibirás tus puntos cuando un administrador apruebe tu pin</p>
              )}
            </div>

            <button
              className="success-btn"
              style={{ background: pinColor }}
              onClick={() => navigate('/map')}
            >
              Volver al Mapa
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Create;
