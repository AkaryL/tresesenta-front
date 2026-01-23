import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Upload, Image as ImageIcon } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { pinsAPI, categoriesAPI, citiesAPI, uploadAPI } from '../services/api';
import './Create.css';

const SHOE_MODELS = [
  { value: 'dama-beige', label: 'Dama Beige' },
  { value: 'caballero-negro', label: 'Caballero Negro' },
  { value: 'urbano-gris', label: 'Urbano Gris' },
  { value: 'clasico-blanco', label: 'Clásico Blanco' },
  { value: 'runner-azul', label: 'Runner Azul' },
  { value: 'outdoor-verde', label: 'Outdoor Verde' },
];

const Create = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);

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
  }, []);

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
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
          setGpsLoading(false);
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

        const uploadResponse = await uploadAPI.images(formDataImages);
        imageUrls = uploadResponse.data.urls;
      }

      await pinsAPI.create({
        ...formData,
        image_urls: imageUrls,
      });

      alert('Pin creado exitosamente');
      navigate('/map');
    } catch (error) {
      console.error('Error creating pin:', error);
      alert(error.response?.data?.error || 'Error al crear el pin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      {/* Minimal Header */}
      <div className="create-header-minimal">
        <button className="btn-back" onClick={() => navigate('/map')}>
          <X size={24} />
        </button>
        <h1>Nuevo Pin</h1>
        <button
          className="btn-publish"
          onClick={handleSubmit}
          disabled={loading || !formData.title}
        >
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
      </div>

      <div className="create-content">
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
              <label>Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Nombre del lugar"
              />
            </div>

            <div className="field-group">
              <label>Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Cuéntanos sobre este lugar..."
                rows="4"
              />
            </div>

            <div className="field-row">
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

              <div className="field-group">
                <label>Ciudad</label>
                <select
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-group">
              <label>Modelo de tenis</label>
              <select
                name="shoe_model"
                value={formData.shoe_model}
                onChange={handleChange}
                required
              >
                <option value="">¿Con qué tenis fuiste?</option>
                {SHOE_MODELS.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Ubicación GPS</label>
              <button
                type="button"
                className="btn-gps"
                onClick={getGPSLocation}
                disabled={gpsLoading}
              >
                <MapPin size={18} />
                {gpsLoading ? 'Obteniendo ubicación...' :
                  formData.latitude ? 'Ubicación capturada' : 'Capturar ubicación'}
              </button>
              {formData.latitude && formData.longitude && (
                <p className="gps-info">
                  {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                </p>
              )}
            </div>

            {/* Checkbox Tresesenta - Verificación */}
            <label className="tresesenta-checkbox">
              <input
                type="checkbox"
                checked={formData.used_tresesenta}
                onChange={(e) => setFormData({ ...formData, used_tresesenta: e.target.checked })}
              />
              <div className="tresesenta-checkbox-content">
                <strong>Usé mis tenis Tresesenta en esta publicación</strong>
                <span>Gana puntos extra por compartir tu experiencia real.</span>
              </div>
            </label>
          </div>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default Create;
