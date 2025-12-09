import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

const MapSimple = () => {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', paddingBottom: '80px' }}>
      <div style={{ padding: '2rem', background: '#4A3A2A', color: 'white', textAlign: 'center' }}>
        <h1>🗺️ Mapa</h1>
        <p>Bienvenido, {user?.username || 'usuario'}!</p>
      </div>

      <div style={{ padding: '2rem' }}>
        <h2>Esta es la página del Mapa</h2>
        <p>El routing está funcionando correctamente!</p>
        <p>Usuario: {JSON.stringify(user)}</p>
      </div>

      <BottomNav />
    </div>
  );
};

export default MapSimple;
