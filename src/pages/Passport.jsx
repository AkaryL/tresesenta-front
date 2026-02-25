import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, MapPin } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DesktopHeader from '../components/DesktopHeader';
import { citiesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Passport.css';
import './Auth.css';

// Map cities to their Mexican states
const CITY_TO_STATE = {
  'CDMX': 'CDMX',
  'Guadalajara': 'Jalisco',
  'Monterrey': 'Nuevo León',
  'Puebla': 'Puebla',
  'Querétaro': 'Querétaro',
  'Oaxaca': 'Oaxaca',
  'Mérida': 'Yucatán',
  'Puerto Vallarta': 'Jalisco',
  'Guanajuato': 'Guanajuato',
  'Morelia': 'Michoacán',
};

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
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [visitedStates, setVisitedStates] = useState(new Set());
  const [stateCities, setStateCities] = useState({});
  const [expandedState, setExpandedState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await citiesAPI.getAll();
      const citiesData = response.data.cities || response.data || [];
      setCities(citiesData);

      // Build visited states set and state->cities map
      const visited = new Set();
      const cityMap = {};

      citiesData.forEach(city => {
        const stateName = CITY_TO_STATE[city.name];
        if (stateName) {
          if (!cityMap[stateName]) cityMap[stateName] = [];
          cityMap[stateName].push({
            name: city.name,
            emoji: city.emoji,
            visited: !!city.visited,
            pinsCount: city.user_pins_count || 0,
            totalPins: parseInt(city.pins_count) || 0,
          });
          if (city.visited) {
            visited.add(stateName);
          }
        }
      });

      setVisitedStates(visited);
      setStateCities(cityMap);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStates = MEXICAN_STATES.length;
  const visitedCount = visitedStates.size;
  const progress = totalStates > 0 ? (visitedCount / totalStates) * 100 : 0;

  const isStateVisited = (stateName) => visitedStates.has(stateName);
  const hasAvailableCities = (stateName) => !!stateCities[stateName];

  const circumference = 2 * Math.PI * 54;

  return (
    <div className="passport-page">
      <DesktopHeader />

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
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (circumference * progress) / 100 }}
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
          {visitedCount > 0 && visitedCount < 5 && '¡Buen comienzo, explorador!'}
          {visitedCount >= 5 && visitedCount < 15 && '¡Vas muy bien!'}
          {visitedCount >= 15 && visitedCount < 32 && '¡Eres un verdadero viajero!'}
          {visitedCount === 32 && '¡Completaste todo México!'}
        </p>
      </div>

      {/* States Grid */}
      <div className="passport-content">
        {loading ? (
          <div className="states-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="state-card state-skeleton">
                <div className="skeleton-code" />
                <div className="skeleton-name" />
              </div>
            ))}
          </div>
        ) : (
          <div className="states-grid">
            {MEXICAN_STATES.map((state, index) => {
              const visited = isStateVisited(state.name);
              const hasCities = hasAvailableCities(state.name);
              const isExpanded = expandedState === state.code;

              return (
                <motion.div
                  key={state.code}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <button
                    className={`state-card ${visited ? 'visited' : ''} ${hasCities ? 'has-cities' : ''} ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => {
                      if (hasCities) {
                        setExpandedState(isExpanded ? null : state.code);
                      }
                    }}
                  >
                    <span className="state-code">{state.code}</span>
                    <span className="state-name">{state.name}</span>
                    {visited && (
                      <div className="state-check">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                    {hasCities && !visited && (
                      <div className="state-available">
                        <MapPin size={10} />
                      </div>
                    )}
                  </button>

                  {/* Expanded cities */}
                  <AnimatePresence>
                    {isExpanded && stateCities[state.name] && (
                      <motion.div
                        className="state-cities"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {stateCities[state.name].map(city => (
                          <div key={city.name} className={`city-row ${city.visited ? 'visited' : ''}`}>
                            <span className="city-emoji">{city.emoji}</span>
                            <span className="city-name">{city.name}</span>
                            {city.visited ? (
                              <span className="city-pins">{city.pinsCount} pins</span>
                            ) : (
                              <span className="city-explore">Explorar</span>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Passport;
