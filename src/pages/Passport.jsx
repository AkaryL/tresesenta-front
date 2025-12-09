import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { citiesAPI } from '../services/api';
import './Passport.css';

const MEXICAN_STATES = [
  { name: 'Aguascalientes', code: 'AGS' },
  { name: 'Baja California', code: 'BC' },
  { name: 'Baja California Sur', code: 'BCS' },
  { name: 'Campeche', code: 'CAM' },
  { name: 'Chiapas', code: 'CHIS' },
  { name: 'Chihuahua', code: 'CHIH' },
  { name: 'CDMX', code: 'CDMX' },
  { name: 'Coahuila', code: 'COAH' },
  { name: 'Colima', code: 'COL' },
  { name: 'Durango', code: 'DGO' },
  { name: 'Guanajuato', code: 'GTO' },
  { name: 'Guerrero', code: 'GRO' },
  { name: 'Hidalgo', code: 'HGO' },
  { name: 'Jalisco', code: 'JAL' },
  { name: 'México', code: 'MEX' },
  { name: 'Michoacán', code: 'MICH' },
  { name: 'Morelos', code: 'MOR' },
  { name: 'Nayarit', code: 'NAY' },
  { name: 'Nuevo León', code: 'NL' },
  { name: 'Oaxaca', code: 'OAX' },
  { name: 'Puebla', code: 'PUE' },
  { name: 'Querétaro', code: 'QRO' },
  { name: 'Quintana Roo', code: 'QROO' },
  { name: 'San Luis Potosí', code: 'SLP' },
  { name: 'Sinaloa', code: 'SIN' },
  { name: 'Sonora', code: 'SON' },
  { name: 'Tabasco', code: 'TAB' },
  { name: 'Tamaulipas', code: 'TAM' },
  { name: 'Tlaxcala', code: 'TLAX' },
  { name: 'Veracruz', code: 'VER' },
  { name: 'Yucatán', code: 'YUC' },
  { name: 'Zacatecas', code: 'ZAC' },
];

const Passport = () => {
  const [cities, setCities] = useState([]);
  const [visitedCities, setVisitedCities] = useState(['Ciudad de México', 'Guadalajara', 'Monterrey']);
  const [expandedState, setExpandedState] = useState(null);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await citiesAPI.getAll();
      setCities(response.data);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const totalStates = MEXICAN_STATES.length;
  const visitedStates = MEXICAN_STATES.filter(state =>
    visitedCities.length > 0
  ).length;
  const visitedCount = visitedCities.length;
  const progress = (visitedCount / 100) * 100; // Assuming ~100 cities goal

  const isStateVisited = (stateName) => {
    return visitedCities.length > 0;
  };

  return (
    <div className="passport-page">
      {/* Header */}
      <div className="passport-header">
        <h1 className="passport-title">Mi Pasaporte</h1>
        <p className="passport-subtitle">Explora los 32 estados de México</p>

        {/* Progress Circle */}
        <motion.div
          className="progress-container"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg width="120" height="120" className="progress-ring">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="6"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={339.292}
              initial={{ strokeDashoffset: 339.292 }}
              animate={{ strokeDashoffset: 339.292 - (339.292 * progress) / 100 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </svg>
          <div className="progress-number">
            <span className="visited">{visitedCount}</span>
            <span className="total">/{totalStates}</span>
          </div>
        </motion.div>

        <p className="progress-message">
          {visitedCount === 0 && '¡Comienza tu aventura!'}
          {visitedCount > 0 && visitedCount < 10 && '¡Buen comienzo!'}
          {visitedCount >= 10 && '¡Vas excelente!'}
        </p>
      </div>

      {/* States Grid */}
      <div className="passport-content">
        <div className="states-grid">
          {MEXICAN_STATES.map((state, index) => (
            <motion.button
              key={state.code}
              className={`state-card ${isStateVisited(state.name) ? 'visited' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => setExpandedState(expandedState === state.code ? null : state.code)}
            >
              <span className="state-code">{state.code}</span>
              <span className="state-name">{state.name}</span>
              {isStateVisited(state.name) && (
                <div className="state-check">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Passport;
