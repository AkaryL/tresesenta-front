import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <div className="landing-bg-pattern"></div>

      <motion.div
        className="landing-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="logo-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="logo">TRESESENTA</h1>
          <h2 className="logo-sub">MAPA 360</h2>
        </motion.div>

        <motion.p
          className="tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          "Úsalos como quieras. Cuando quieras."
        </motion.p>

        <motion.div
          className="cta-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <button
            className="btn-start"
            onClick={() => navigate('/register')}
          >
            Explorar México 🗺️
          </button>
          <button
            className="btn-learn"
            onClick={() => navigate('/login')}
          >
            Ya tengo cuenta
          </button>
        </motion.div>
      </motion.div>

      <div className="scroll-indicator">
        <div className="mouse"></div>
      </div>
    </div>
  );
};

export default Landing;
