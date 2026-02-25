import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './DesktopHeader.css';

const STEP = {
  EMAIL: 'email',
  OTP: 'otp',
  NOT_FOUND: 'not_found',
};

const DesktopHeader = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithToken } = useAuth();

  // Login modal state
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
      setMessage(`Código enviado a ${email}`);
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
    <>
      <header className="desktop-header">
        <nav className="desktop-nav">
          <Link to="/" className="desktop-brand">TRESESENTA</Link>
          <div className="desktop-nav-links">
            <Link to="/map" className="desktop-nav-link">MAPA 360</Link>
            {isAuthenticated ? (
              <>
                <Link to="/passport" className="desktop-nav-link">PASAPORTE</Link>
                <Link to="/create" className="desktop-nav-link">CREAR PIN</Link>
                <Link to="/routes" className="desktop-nav-link">RUTAS</Link>
                <Link to="/profile" className="desktop-nav-link">PERFIL</Link>
              </>
            ) : (
              <>
                <button className="desktop-nav-link" onClick={openLoginModal}>PASAPORTE</button>
                <button className="desktop-nav-link" onClick={openLoginModal}>CREAR PIN</button>
                <button className="desktop-nav-link" onClick={openLoginModal}>RUTAS</button>
                <button className="desktop-nav-link" onClick={openLoginModal}>INICIAR SESIÓN</button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay" onClick={closeLoginModal}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeLoginModal}>×</button>

            <div className="auth-header">
              <h1 className="auth-logo">TRESESENTA</h1>
              <p className="auth-subtitle">
                {step === STEP.OTP ? 'Ingresa el código' :
                 step === STEP.NOT_FOUND ? 'Cuenta no encontrada' :
                 'Iniciar Sesión'}
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

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
                <button type="submit" className="btn-auth-primary" disabled={loading}>
                  {loading ? 'Enviando...' : 'Continuar'}
                </button>
              </form>
            )}

            {step === STEP.OTP && (
              <div className="auth-form">
                <button onClick={goBack} className="btn-back-inline">
                  ← Cambiar email
                </button>
                <p className="otp-instruction">
                  Ingresa el código de 6 dígitos enviado a <strong>{email}</strong>
                </p>
                <div className="otp-hint">
                  Código de prueba: <strong>123456</strong>
                </div>
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
                    />
                  ))}
                </div>
                <button onClick={handleResendCode} disabled={loading} className="btn-resend">
                  Reenviar código
                </button>
              </div>
            )}

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
    </>
  );
};

export default DesktopHeader;
