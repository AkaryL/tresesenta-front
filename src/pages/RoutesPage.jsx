import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BottomNav from '../components/BottomNav';
import './RoutesPage.css';

const FEATURED_ROUTES = [
  {
    id: 1,
    title: 'Ruta del Mezcal - Oaxaca',
    description: 'Descubre las mejores mezcalerías tradicionales de Oaxaca',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800',
    stops: 8,
    duration: '2 días',
    difficulty: 'Media',
    category: 'Gastronomía',
    gradient: 'linear-gradient(135deg, #C67B5C, #8B9B7E)',
  },
  {
    id: 2,
    title: 'Cafés Icónicos CDMX',
    description: 'Los cafés más emblemáticos de la Ciudad de México',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    stops: 12,
    duration: '1 día',
    difficulty: 'Fácil',
    category: 'Cafeterías',
    gradient: 'linear-gradient(135deg, #4A3A2A, #C67B5C)',
  },
  {
    id: 3,
    title: 'Naturaleza en Jalisco',
    description: 'Bosques, cascadas y paisajes naturales de Jalisco',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    stops: 6,
    duration: '3 días',
    difficulty: 'Alta',
    category: 'Naturaleza',
    gradient: 'linear-gradient(135deg, #8B9B7E, #4A3A2A)',
  },
  {
    id: 4,
    title: 'Arte y Cultura - San Miguel',
    description: 'Galerías, museos y espacios culturales de San Miguel de Allende',
    image: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800',
    stops: 10,
    duration: '2 días',
    difficulty: 'Fácil',
    category: 'Arte',
    gradient: 'linear-gradient(135deg, #E8DCC8, #C67B5C)',
  },
  {
    id: 5,
    title: 'Street Food Guadalajara',
    description: 'Los mejores puestos de comida callejera tapatía',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    stops: 15,
    duration: '1 día',
    difficulty: 'Fácil',
    category: 'Gastronomía',
    gradient: 'linear-gradient(135deg, #C67B5C, #E8DCC8)',
  },
  {
    id: 6,
    title: 'Playas de Quintana Roo',
    description: 'Las playas más hermosas del Caribe Mexicano',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800',
    stops: 7,
    duration: '4 días',
    difficulty: 'Media',
    category: 'Playas',
    gradient: 'linear-gradient(135deg, #8B9B7E, #E8DCC8)',
  },
];

const RoutesPage = () => {
  const [routes, setRoutes] = useState(FEATURED_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState(null);

  return (
    <div className="routes-page">
      {/* Minimal Header - Airbnb Style */}
      <div className="routes-header-minimal">
        <h1>Rutas</h1>
      </div>

      <div className="routes-content">
        <div className="routes-grid">
          {routes.map((route, index) => (
            <motion.div
              key={route.id}
              className="route-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedRoute(route)}
            >
              <div className="route-image">
                <img src={route.image} alt={route.title} />
                <div className="route-category-badge">{route.category}</div>
              </div>

              <div className="route-content">
                <h3 className="route-title">{route.title}</h3>
                <p className="route-description">{route.description}</p>

                <div className="route-meta">
                  <div className="route-meta-item">
                    <span className="meta-text">{route.stops} paradas</span>
                  </div>
                  <div className="route-meta-item">
                    <span className="meta-text">{route.duration}</span>
                  </div>
                  <div className="route-meta-item">
                    <span className="meta-text">{route.difficulty}</span>
                  </div>
                </div>

                <button className="btn-explore-route">
                  Explorar Ruta →
                </button>
              </div>
            </motion.div>
          ))}
        </div>

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
          onClick={() => setSelectedRoute(null)}
        >
          <motion.div
            className="route-modal"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedRoute(null)}
            >
              ✕
            </button>

            <div className="modal-header">
              <img src={selectedRoute.image} alt={selectedRoute.title} />
            </div>

            <div className="modal-content">
              <h2>{selectedRoute.title}</h2>
              <p>{selectedRoute.description}</p>

              <div className="modal-meta">
                <span>{selectedRoute.category}</span>
                <span>{selectedRoute.stops} paradas</span>
                <span>{selectedRoute.duration}</span>
                <span>{selectedRoute.difficulty}</span>
              </div>

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
