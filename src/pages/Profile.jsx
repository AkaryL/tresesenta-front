import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Award, TrendingUp, MapPin, Heart, Sparkles, Package, ChevronDown, ChevronUp } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Profile.css';

const LEVELS = [
  { name: 'Explorador Novato', min: 0, max: 100 },
  { name: 'Viajero Urbano', min: 100, max: 500 },
  { name: 'Aventurero Experto', min: 500, max: 1500 },
  { name: 'Nomada Digital', min: 1500, max: 3500 },
  { name: 'Leyenda Mexico', min: 3500, max: 999999 },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [collection, setCollection] = useState([]);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [collectionError, setCollectionError] = useState('');
  const [showCollection, setShowCollection] = useState(false);

  const userPoints = user?.total_points || 250;

  const getLevelInfo = (points) => {
    for (let i = 0; i < LEVELS.length; i++) {
      if (points >= LEVELS[i].min && points < LEVELS[i].max) {
        const progress = ((points - LEVELS[i].min) / (LEVELS[i].max - LEVELS[i].min)) * 100;
        return {
          current: LEVELS[i].name,
          next: i < LEVELS.length - 1 ? LEVELS[i + 1].name : null,
          progress,
          pointsToNext: LEVELS[i].max - points,
        };
      }
    }
    return { current: LEVELS[LEVELS.length - 1].name, next: null, progress: 100, pointsToNext: 0 };
  };

  const levelInfo = getLevelInfo(userPoints);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const loadCollection = async () => {
    if (collection.length > 0) {
      setShowCollection(!showCollection);
      return;
    }

    setLoadingCollection(true);
    setCollectionError('');

    try {
      const response = await authAPI.myOrders();
      const orders = response.data.orders || [];

      // Mostrar TODA la info para debug
      const items = [];
      orders.forEach(order => {
        order.items.forEach(item => {
          items.push({
            // Info del item
            title: item.title,
            variant_title: item.variant_title,
            quantity: item.quantity,
            price: item.price,
            sku: item.sku,
            image: item.image,
            // Info de la orden
            order_id: order.order_id,
            order_number: order.order_number,
            order_name: order.name,
            order_date: order.created_at,
            total_price: order.total_price,
            currency: order.currency,
            financial_status: order.financial_status,
            fulfillment_status: order.fulfillment_status,
            shipping_city: order.shipping_address?.city,
            shipping_province: order.shipping_address?.province,
            shipping_country: order.shipping_address?.country,
          });
        });
      });

      setCollection(items);
      setShowCollection(true);
    } catch (error) {
      setCollectionError('Error al cargar tu coleccion');
      console.error(error);
    } finally {
      setLoadingCollection(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            <div className="avatar-circle">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>
          </div>
        </div>
        <h1 className="profile-username">@{user?.username || 'usuario'}</h1>
        <p className="profile-email">{user?.email || 'email@example.com'}</p>
      </div>

      {/* Content */}
      <div className="profile-content">
        {/* Level */}
        <motion.section
          className="profile-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="section-header">
            <TrendingUp size={20} />
            <h2>Mi Nivel</h2>
          </div>

          <div className="level-card">
            <div className="level-top">
              <span className="level-name">{levelInfo.current}</span>
              <span className="level-points">{userPoints} pts</span>
            </div>

            <div className="level-bar">
              <motion.div
                className="level-fill"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            {levelInfo.next && (
              <p className="level-next">{levelInfo.pointsToNext} pts para {levelInfo.next}</p>
            )}
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section
          className="profile-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="section-header">
            <Award size={20} />
            <h2>Estadisticas</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <MapPin size={24} />
              <span className="stat-value">12</span>
              <span className="stat-label">Pins</span>
            </div>
            <div className="stat-card">
              <Heart size={24} />
              <span className="stat-value">45</span>
              <span className="stat-label">Likes</span>
            </div>
          </div>
        </motion.section>

        {/* Mi Coleccion */}
        {user?.shopify_customer_id && (
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button className="section-header section-header-btn" onClick={loadCollection}>
              <div className="section-header-left">
                <Sparkles size={20} />
                <h2>Mi Coleccion</h2>
              </div>
              {loadingCollection ? (
                <div className="spinner-small"></div>
              ) : showCollection ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>

            {collectionError && <p className="orders-error">{collectionError}</p>}

            {showCollection && (
              <div className="collection-container">
                {collection.length === 0 ? (
                  <div className="collection-empty">
                    <div className="collection-empty-icon">
                      <Package size={48} />
                    </div>
                    <h3>Tu coleccion esta vacia</h3>
                    <p>Consigue tus primeros tenis y desbloquea logros</p>
                    <a
                      href="https://tresesenta.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-get-more"
                    >
                      <Sparkles size={18} />
                      Explorar tienda
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="collection-header">
                      <span className="collection-count">
                        {collection.length} {collection.length === 1 ? 'par conseguido' : 'pares conseguidos'}
                      </span>
                    </div>

                    <div className="collection-grid">
                      {collection.map((item, idx) => (
                        <div key={idx} className="collection-item">
                          <div className="collection-item-icon">
                            {item.image ? (
                              <img src={item.image} alt={item.title} />
                            ) : (
                              <span className="sneaker-emoji">👟</span>
                            )}
                          </div>
                          <div className="collection-item-info">
                            <h4 className="collection-item-name">{item.title}</h4>
                            {item.variant_title && (
                              <span className="collection-item-variant">{item.variant_title}</span>
                            )}
                            <span className="collection-item-date">
                              Conseguido {formatDate(item.order_date)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <a
                      href="https://tresesenta.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-get-more"
                    >
                      <Sparkles size={18} />
                      Conseguir mas
                    </a>
                  </>
                )}
              </div>
            )}
          </motion.section>
        )}

        {/* Logout */}
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Cerrar Sesion</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
