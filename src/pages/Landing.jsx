import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Compass, Award, X } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="landing">
      <div className="landing-bg-pattern"></div>

      {/* Decorative elements */}
      <div className="landing-decoration landing-decoration-1"></div>
      <div className="landing-decoration landing-decoration-2"></div>

      <motion.div
        className="landing-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="logo-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="logo">TRESESENTA</h1>
          <div className="logo-divider"></div>
          <h2 className="logo-sub">MAPA 360</h2>
        </motion.div>

        <motion.p
          className="tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Descubre Mexico. Colecciona experiencias.
        </motion.p>

        <motion.div
          className="cta-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <button
            className="btn-primary-landing"
            onClick={() => setShowInfo(true)}
          >
            <Compass size={20} />
            Explorar Mexico
          </button>

          <button
            className="btn-secondary-landing"
            onClick={() => navigate('/login')}
          >
            Ya tengo cuenta
          </button>
        </motion.div>

        {/* Features preview */}
        <motion.div
          className="features-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="feature-item">
            <MapPin size={18} />
            <span>32 Estados</span>
          </div>
          <div className="feature-item">
            <Award size={18} />
            <span>Gana puntos</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal de informacion */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            className="info-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              className="info-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="info-modal-close" onClick={() => setShowInfo(false)}>
                <X size={24} />
              </button>

              <div className="info-modal-header">
                <h2>Bienvenido a TRESESENTA</h2>
                <p className="info-modal-subtitle">Tu pasaporte digital por Mexico</p>
              </div>

              <div className="info-modal-content">
                <p>
                  <strong>TRESESENTA Mapa 360</strong> es una plataforma exclusiva para clientes de Tresesenta
                  donde puedes explorar los 32 estados de Mexico de forma interactiva.
                </p>

                <div className="info-features">
                  <div className="info-feature">
                    <div className="info-feature-icon">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4>Explora el mapa</h4>
                      <p>Descubre lugares increibles en cada estado de la republica</p>
                    </div>
                  </div>

                  <div className="info-feature">
                    <div className="info-feature-icon">
                      <Award size={24} />
                    </div>
                    <div>
                      <h4>Gana puntos</h4>
                      <p>Acumula puntos por cada lugar que visites y sube de nivel</p>
                    </div>
                  </div>

                  <div className="info-feature">
                    <div className="info-feature-icon">
                      <Compass size={24} />
                    </div>
                    <div>
                      <h4>Colecciona experiencias</h4>
                      <p>Crea tu pasaporte digital con todos los lugares que has conocido</p>
                    </div>
                  </div>
                </div>

                <p className="info-note">
                  Para acceder necesitas una cuenta de cliente en <strong>Tresesenta</strong>.
                </p>
              </div>

              <div className="info-modal-actions">
                <button
                  className="btn-modal-primary"
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesion
                </button>
                <a
                  href="https://tresesenta.com/account/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-modal-secondary"
                >
                  Crear cuenta en Tresesenta
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
