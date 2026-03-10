import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Landing.css';
import './Auth.css';

const STEP = {
  EMAIL: 'email',
  OTP: 'otp',
  NOT_FOUND: 'not_found',
};

// Import images
import logoTresesenta from '../assets/logos/TRESESENTA.png';
import tenisLanding from '../assets/tenis-landing.jpeg';
import fondoPasos from '../assets/fondo-pasos.jpg';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithToken } = useAuth();

  // Modal login state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [step, setStep] = useState(STEP.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const otpRefs = useRef([]);

  useEffect(() => {
    if (step === STEP.OTP && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  const openLoginModal = () => {
    setShowLoginModal(true);
    setStep(STEP.EMAIL);
    setEmail('');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setMessage('');
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.requestCode(email);
      setMessage('');
      setStep(STEP.OTP);
    } catch (err) {
      const status = err.response?.data?.status;
      if (status === 'NOT_FOUND' || err.response?.status === 404) {
        setStep(STEP.NOT_FOUND);
      } else {
        setError(err.response?.data?.error || 'Error al enviar el código');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      verifyOtp(pastedData);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (code) => {
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.verifyCode(email, code);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      loginWithToken(token, user);

      closeLoginModal();
      navigate('/map');
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      await authAPI.requestCode(email);
      setMessage('Nuevo código enviado');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reenviar el código');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep(STEP.EMAIL);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setMessage('');
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        {/* Header transparente sobre el video */}
        <header className="landing-header">
          <nav className="landing-nav">
            <Link to="/" className="nav-link">HOME</Link>
            <Link to="/map" className="nav-link">MAPA 360</Link>
            {isAuthenticated ? (
              <>
                <Link to="/passport" className="nav-link">PASAPORTE</Link>
                <Link to="/create" className="nav-link">CREAR PIN</Link>
                <Link to="/routes" className="nav-link">RUTAS</Link>
                <Link to="/profile" className="nav-link">PERFIL</Link>
              </>
            ) : (
              <>
                <button className="nav-link" onClick={openLoginModal}>PASAPORTE</button>
                <button className="nav-link" onClick={openLoginModal}>CREAR PIN</button>
                <button className="nav-link" onClick={openLoginModal}>RUTAS</button>
                <button className="nav-link" onClick={openLoginModal}>INICIAR SESIÓN</button>
              </>
            )}
          </nav>
        </header>

        {/* Video de fondo ambiental - YouTube embed */}
        <div className="hero-video-bg">
          <iframe
            className="hero-bg-video"
            src="https://www.youtube.com/embed/xhCjRC6kZV0?autoplay=1&mute=1&loop=1&playlist=xhCjRC6kZV0&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
            title="Background Video"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
          <div className="hero-video-overlay-bg"></div>
        </div>

        <div className="hero-content">
          <div className="hero-left">
            <span className="hero-brand">TRESESENTA</span>
            <h1 className="hero-title">Mapa 360</h1>
            <p className="hero-description">
              Descubre México paso a paso. Explora las experiencias reales de nuestra comunidad Tresesenta.
            </p>
          </div>

          <div className="hero-right">
            <button className="hero-explore-btn" onClick={() => navigate('/map')}>
              Explorar México
            </button>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="info-section">
        <div className="info-image">
          <img
            src="https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600&h=800&fit=crop"
            alt="Arquitectura mexicana"
          />
        </div>

        <div className="info-content">
          <h2 className="info-title">
            Descubre el verdadero<br />
            <span>México con nosotros</span>
          </h2>

          <div className="info-stats">
            <div className="info-stat">
              <span className="stat-label">Pines creados</span>
              <span className="stat-value">+250,000</span>
            </div>
            <div className="info-stat">
              <span className="stat-label">Rutas para ti</span>
              <span className="stat-value">+1,000</span>
            </div>
          </div>

          <p className="info-text">
            Después de 15 años caminando a tu lado, creamos el Mapa 360 para mostrar el México
            auténtico: los lugares que solo se descubren con pasos propios, las recomendaciones
            locales que no aparecen en guías turísticas y las experiencias que nuestros
            exploradores viven todos los días.
          </p>

          <p className="info-text">
            Este mapa es una invitación abierta a conocer, compartir y celebrar el México real
            junto con nosotros.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section
        className="products-section"
        style={{ backgroundImage: `url(${fondoPasos})` }}
      >
        <div className="products-bg-overlay"></div>

        <div className="products-content">
          <div className="products-text">
            <h2 className="products-title">
              Los pasos que están<br />
              <span>marcando tendencia.</span>
            </h2>
            <a
              href="https://tresesenta.com/collections/all"
              target="_blank"
              rel="noopener noreferrer"
              className="products-btn"
            >
              Ver Modelos
            </a>
          </div>

          <div className="products-images">
            <img
              src={tenisLanding}
              alt="Tenis Tresesenta"
              className="product-img-single"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src={logoTresesenta} alt="Tresesenta" />
          </div>
          <div className="footer-links">
            <a href="https://tresesenta.com" target="_blank" rel="noopener noreferrer">Tienda</a>
            <Link to="/map">Mapa 360</Link>
            <a href="https://tresesenta.com/pages/contacto" target="_blank" rel="noopener noreferrer">Contacto</a>
          </div>
          <p className="footer-copy">© 2025 Tresesenta. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay" onClick={closeLoginModal}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeLoginModal}>×</button>

            <div className="auth-header">
              <h1 className="auth-logo">TRESESENTA</h1>
              <p className="auth-subtitle">
                {step === STEP.OTP ? 'Introducir codigo' :
                 step === STEP.NOT_FOUND ? 'Cuenta no encontrada' :
                 'Iniciar Sesión'}
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            {/* PASO 1: Email */}
            {step === STEP.EMAIL && (
              <form className="auth-form" onSubmit={handleEmailSubmit}>
                <div className="form-group">
                  <label>Email de tu cuenta Tresesenta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn-auth-primary"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Continuar'}
                </button>
              </form>
            )}

            {/* PASO 2: OTP */}
            {step === STEP.OTP && (
              <div className="auth-form">
                <p className="otp-sent-to">
                  Enviado a <strong>{email}</strong>
                </p>

                <div className="otp-container" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                      className="otp-input"
                      placeholder="·"
                    />
                  ))}
                </div>

                <button
                  onClick={() => verifyOtp(otp.join(''))}
                  disabled={loading || otp.some(d => !d)}
                  className="btn-auth-primary"
                >
                  {loading ? 'Verificando...' : 'Enviar'}
                </button>

                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="btn-resend"
                >
                  Reenviar codigo
                </button>

                <button onClick={goBack} className="btn-back-link">
                  Iniciar sesion con otro correo electronico
                </button>
              </div>
            )}

            {/* PASO 3: No encontrado */}
            {step === STEP.NOT_FOUND && (
              <div className="auth-form">
                <div className="not-found-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                </div>

                <p className="not-found-text">
                  No encontramos una cuenta de <strong>Tresesenta</strong> con el email:
                </p>
                <p className="not-found-email">{email}</p>

                <p className="not-found-help">
                  Para usar TRESESENTA necesitas tener una cuenta en nuestra tienda Tresesenta.
                </p>

                <a
                  href="https://tresesenta.com/account/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-auth-primary"
                >
                  Crear cuenta en Tresesenta
                </a>

                <button onClick={goBack} className="btn-back-link">
                  Intentar con otro email
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
