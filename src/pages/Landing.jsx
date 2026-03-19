import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Landing.css';
import './Auth.css';
import '../components/DesktopHeader.css';

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

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileNav = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

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
      const res = await authAPI.requestCode(email);
      if (res.data?.debug_code) console.log('%c OTP: ' + res.data.debug_code, 'color: #c67b5c; font-size: 20px; font-weight: bold;');
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
        {/* Mobile Header */}
        <header className="landing-header-mobile">
          <Link to="/" className="landing-mobile-brand">
            <img src={logoTresesenta} alt="Tresesenta" className="landing-mobile-logo" />
          </Link>
          <button
            className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </header>

        {/* Mobile Full-Screen Menu */}
        <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="mobile-menu-nav">
            <button className="mobile-menu-link" onClick={() => mobileNav('/')}>Home</button>
            <button className="mobile-menu-link" onClick={() => mobileNav('/map')}>Mapa 360</button>
            {isAuthenticated ? (
              <>
                <button className="mobile-menu-link" onClick={() => mobileNav('/passport')}>Pasaporte</button>
                <button className="mobile-menu-link" onClick={() => mobileNav('/create')}>Crear Pin</button>
                <button className="mobile-menu-link" onClick={() => mobileNav('/routes')}>Rutas</button>
                <button className="mobile-menu-link" onClick={() => mobileNav('/profile')}>Perfil</button>
              </>
            ) : (
              <button className="mobile-menu-link" onClick={() => { setMobileMenuOpen(false); openLoginModal(); }}>Iniciar Sesion</button>
            )}
          </nav>
          <span className="mobile-menu-brand">TRESESENTA</span>
        </div>

        {/* Desktop Header */}
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
              href="https://tenis360.com/"
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
            <a href="https://tenis360.com/" target="_blank" rel="noopener noreferrer">Tienda</a>
            <Link to="/map">Mapa 360</Link>
          </div>
          <div className="footer-socials">
            <a href="https://www.facebook.com/tenistres60/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/tenis_360/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@tenis360" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
            <a href="https://x.com/@tenis_360" target="_blank" rel="noopener noreferrer" aria-label="X">
              <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
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
