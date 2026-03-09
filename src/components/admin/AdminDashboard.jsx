import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MapPin, Shield, Award, Settings,
  ChevronDown, Search, Eye, EyeOff, Check, X,
  Zap, History, ChevronLeft, ChevronRight
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [openSection, setOpenSection] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Section data
  const [verifications, setVerifications] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [users, setUsers] = useState([]);
  const [pins, setPins] = useState([]);
  const [badges, setBadges] = useState([]);
  const [pointActions, setPointActions] = useState([]);
  const [settings, setSettings] = useState([]);
  const loadedSectionsRef = useRef({});

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionInput, setActionInput] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Historial UI state
  const [historialTab, setHistorialTab] = useState('approved');
  const [historialSearch, setHistorialSearch] = useState('');
  const [historialPage, setHistorialPage] = useState(1);
  const HISTORIAL_PAGE_SIZE = 10;

  // Expanded verification cards
  const [expandedVerif, setExpandedVerif] = useState({});
  const toggleVerifExpand = (id) => setExpandedVerif(prev => ({ ...prev, [id]: !prev[id] }));

  // Historial detail modal
  const [historialModal, setHistorialModal] = useState(null); // item de historial seleccionado

  // Lightbox
  const [lightbox, setLightbox] = useState(null); // { images: [], index: 0 }

  const openLightbox = (images, index = 0) => setLightbox({ images, index });
  const closeLightbox = () => setLightbox(null);
  const lightboxPrev = () => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }));
  const lightboxNext = () => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length }));

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadSectionData = useCallback(async (section) => {
    try {
      switch (section) {
        case 'verifications': {
          const res = await adminAPI.getPendingVerifications();
          setVerifications(res.data.requests || []);
          break;
        }
        case 'historial': {
          const res = await adminAPI.getHistorial();
          setHistorial(res.data.historial || []);
          break;
        }
        case 'users': {
          const res = await adminAPI.getUsers();
          setUsers(res.data.users || []);
          break;
        }
        case 'pins': {
          const res = await adminAPI.getPins();
          setPins(res.data.pins || []);
          break;
        }
        case 'badges': {
          const res = await adminAPI.getBadges();
          setBadges(res.data.badges || []);
          break;
        }
        case 'settings': {
          const [pa, st] = await Promise.all([
            adminAPI.getPointActions(),
            adminAPI.getSettings(),
          ]);
          setPointActions(pa.data.actions || []);
          const grouped = st.data.settings || {};
          setSettings(Object.values(grouped).flat());
          break;
        }
      }
      loadedSectionsRef.current[section] = true;
    } catch (e) {
      console.error(`Error loading ${section}:`, e);
      showToast(`Error al cargar ${section}`, 'error');
    }
  }, []);

  useEffect(() => {
    if (openSection && !loadedSectionsRef.current[openSection]) {
      loadSectionData(openSection);
    }
  }, [openSection, loadSectionData]);

  // WebSocket: actualizar verificaciones pendientes en tiempo real
  useEffect(() => {
    const socket = getSocket();
    const handler = ({ verif_id, pin_id, status }) => {
      setVerifications(prev => prev.filter(v => String(v.id) !== String(verif_id) && String(v.pin_id) !== String(pin_id)));
      loadedSectionsRef.current['historial'] = false;
    };
    socket.on('verification:updated', handler);
    return () => socket.off('verification:updated', handler);
  }, []);

  const toggleSection = (section) => {
    setOpenSection(prev => prev === section ? null : section);
    setConfirmAction(null);
  };

  // === ACTIONS ===
  const handleApproveVerification = async (id) => {
    setSavingId(id);
    try {
      await adminAPI.approveVerification(id, 'Aprobado desde panel');
      setVerifications(prev => prev.filter(v => v.id !== id));
      if (stats) setStats(s => ({ ...s, verifications: { ...s.verifications, pending: s.verifications.pending - 1, approved: s.verifications.approved + 1 } }));
      // Invalidar historial para que recargue la próxima vez
      loadedSectionsRef.current['historial'] = false;
      showToast('Verificacion aprobada');
    } catch (e) {
      showToast('Error al aprobar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleRejectVerification = async (id) => {
    if (!actionInput.trim()) return;
    setSavingId(id);
    try {
      await adminAPI.rejectVerification(id, actionInput.trim());
      setVerifications(prev => prev.filter(v => v.id !== id));
      if (stats) setStats(s => ({ ...s, verifications: { ...s.verifications, pending: s.verifications.pending - 1, rejected: s.verifications.rejected + 1 } }));
      setConfirmAction(null);
      setActionInput('');
      loadedSectionsRef.current['historial'] = false;
      showToast('Verificacion rechazada');
    } catch (e) {
      showToast('Error al rechazar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleBanUser = async (id) => {
    if (!actionInput.trim()) return;
    setSavingId(id);
    try {
      await adminAPI.banUser(id, actionInput.trim());
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: true } : u));
      setConfirmAction(null);
      setActionInput('');
      showToast('Usuario baneado');
    } catch (e) {
      showToast('Error al banear', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleUnbanUser = async (id) => {
    setSavingId(id);
    try {
      await adminAPI.unbanUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: false } : u));
      showToast('Usuario desbaneado');
    } catch (e) {
      showToast('Error al desbanear', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleAdmin = async (id, currentVal) => {
    setSavingId(id);
    try {
      await adminAPI.setAdmin(id, !currentVal);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_admin: !currentVal } : u));
      showToast(currentVal ? 'Admin removido' : 'Admin otorgado');
    } catch (e) {
      showToast('Error al cambiar admin', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleVerifiedBuyer = async (id, currentVal) => {
    setSavingId(id);
    try {
      await adminAPI.verifyBuyer(id, !currentVal);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified_buyer: !currentVal } : u));
      showToast('Comprador verificado actualizado');
    } catch (e) {
      showToast('Error', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleHidePin = async (id) => {
    if (!actionInput.trim()) return;
    setSavingId(id);
    try {
      await adminAPI.hidePin(id, actionInput.trim());
      setPins(prev => prev.map(p => p.id === id ? { ...p, is_hidden: true } : p));
      setConfirmAction(null);
      setActionInput('');
      showToast('Pin oculto');
    } catch (e) {
      showToast('Error al ocultar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleUnhidePin = async (id) => {
    setSavingId(id);
    try {
      await adminAPI.unhidePin(id);
      setPins(prev => prev.map(p => p.id === id ? { ...p, is_hidden: false } : p));
      showToast('Pin restaurado');
    } catch (e) {
      showToast('Error al restaurar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleBadge = async (badge) => {
    setSavingId(badge.id);
    try {
      await adminAPI.updateBadge(badge.id, { is_active: !badge.is_active });
      setBadges(prev => prev.map(b => b.id === badge.id ? { ...b, is_active: !b.is_active } : b));
      showToast(badge.is_active ? 'Badge desactivado' : 'Badge activado');
    } catch (e) {
      showToast('Error', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleRejectFromHistorial = async (pinId) => {
    if (!actionInput.trim()) return;
    setSavingId(pinId);
    try {
      await adminAPI.rejectFromHistorial(pinId, actionInput.trim());
      // Pin regular → desaparece del historial (oculto). Tresesenta → queda como rechazado
      setHistorial(prev => prev
        .map(h => h.pin_id === pinId ? { ...h, status: 'rejected', rejection_reason: actionInput.trim() } : h)
        .filter(h => !(h.pin_id === pinId && !h.used_tresesenta))
      );
      setConfirmAction(null);
      setActionInput('');
      loadedSectionsRef.current['historial'] = false;
      showToast('Pin rechazado y removido del mapa');
    } catch (e) {
      showToast('Error al rechazar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdatePointAction = async (action, field, value) => {
    setSavingId(action.id);
    try {
      await adminAPI.updatePointAction(action.id, { [field]: value });
      setPointActions(prev => prev.map(a => a.id === action.id ? { ...a, [field]: value } : a));
      showToast('Puntos actualizados');
    } catch (e) {
      showToast('Error al actualizar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    setSavingId(key);
    try {
      await adminAPI.updateSetting(key, value);
      setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: { value } } : s));
      showToast('Configuracion guardada');
    } catch (e) {
      showToast('Error al guardar', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = searchTerm
    ? users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const SectionHeader = ({ id, icon: Icon, title, badge }) => (
    <button className="section-header" onClick={() => toggleSection(id)}>
      <div className="section-title">
        <Icon size={18} />
        <span>{title}</span>
        {badge > 0 && <span className="badge-count">{badge}</span>}
      </div>
      <ChevronDown
        size={18}
        className={`section-chevron ${openSection === id ? 'rotated' : ''}`}
      />
    </button>
  );

  // Imágenes de una verificación: primero las del pin, luego las de evidencia
  const getVerifImages = (v) => {
    const pinImgs = (v.pin_images || []).map(url => ({ url, type: 'pin' }));
    const evidImgs = (v.verification_images || []).map(url => ({ url, type: 'evidencia' }));
    return [...pinImgs, ...evidImgs];
  };

  return (
    <div className="admin-dashboard">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`admin-toast ${toast.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {/* Historial detail modal */}
        {historialModal && (
          <motion.div
            className="admin-lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHistorialModal(null)}
          >
            <motion.div
              className="historial-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="admin-lightbox-close" onClick={() => setHistorialModal(null)}>
                <X size={20} />
              </button>

              {/* Status badge */}
              <div className={`historial-modal-badge ${historialModal.status}`}>
                {historialModal.status === 'approved' ? <><Check size={13} /> Aprobado</> : <><X size={13} /> Rechazado</>}
              </div>

              <h3 className="historial-modal-title">{historialModal.pin_title}</h3>

              {/* Imágenes del pin */}
              {(() => {
                const imgs = [
                  ...(historialModal.pin_images || []).map(u => ({ url: u, type: 'pin' })),
                  ...(historialModal.verification_images || []).map(u => ({ url: u, type: 'evidencia' })),
                ];
                return imgs.length > 0 ? (
                  <div className="historial-modal-images">
                    {imgs.map((img, i) => (
                      <button key={i} className="verification-thumb-btn" onClick={() => openLightbox(imgs, i)}>
                        <img src={img.url} alt="" />
                        {img.type === 'evidencia' && <span className="thumb-badge-ev">EV</span>}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Rechazo prominente */}
              {historialModal.rejection_reason && (
                <div className="historial-modal-rejection">
                  <strong>Motivo de rechazo:</strong>
                  <p>{historialModal.rejection_reason}</p>
                </div>
              )}

              {/* Detalles */}
              <div className="historial-modal-details">
                {historialModal.pin_description && (
                  <div className="verif-detail-row">
                    <span className="verif-detail-label">Descripción</span>
                    <span className="verif-detail-value">{historialModal.pin_description}</span>
                  </div>
                )}
                <div className="verif-detail-row">
                  <span className="verif-detail-label">Categoría</span>
                  <span className="verif-detail-value">{historialModal.category_emoji} {historialModal.category_name}</span>
                </div>
                {historialModal.city_name && (
                  <div className="verif-detail-row">
                    <span className="verif-detail-label">Ciudad</span>
                    <span className="verif-detail-value">{historialModal.city_name}</span>
                  </div>
                )}
                {historialModal.location_name && (
                  <div className="verif-detail-row">
                    <span className="verif-detail-label">Ubicación</span>
                    <span className="verif-detail-value">{historialModal.location_name}</span>
                  </div>
                )}
                {historialModal.used_tresesenta && historialModal.shoe_model && (
                  <div className="verif-detail-row">
                    <span className="verif-detail-label">Modelo</span>
                    <span className="verif-detail-value verif-detail-model">{historialModal.shoe_model}</span>
                  </div>
                )}
                <div className="verif-detail-row">
                  <span className="verif-detail-label">Creador</span>
                  <span className="verif-detail-value">@{historialModal.username}</span>
                </div>
                <div className="verif-detail-row">
                  <span className="verif-detail-label">Revisado por</span>
                  <span className="verif-detail-value">@{historialModal.reviewer_username || '—'}</span>
                </div>
                <div className="verif-detail-row">
                  <span className="verif-detail-label">Fecha revisión</span>
                  <span className="verif-detail-value">
                    {historialModal.reviewed_at
                      ? new Date(historialModal.reviewed_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
                {historialModal.points_awarded > 0 && (
                  <div className="verif-detail-row">
                    <span className="verif-detail-label">Puntos otorgados</span>
                    <span className="verif-detail-value">+{historialModal.points_awarded} pts</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {lightbox && (
          <motion.div
            className="admin-lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <motion.div
              className="admin-lightbox-content"
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="admin-lightbox-close" onClick={closeLightbox}>
                <X size={20} />
              </button>
              <img
                src={lightbox.images[lightbox.index].url}
                alt=""
                className="admin-lightbox-img"
              />
              {lightbox.images[lightbox.index].type === 'evidencia' && (
                <span className="admin-lightbox-tag">Evidencia</span>
              )}
              {lightbox.images.length > 1 && (
                <>
                  <button className="admin-lightbox-nav admin-lightbox-prev" onClick={lightboxPrev}>
                    <ChevronLeft size={22} />
                  </button>
                  <button className="admin-lightbox-nav admin-lightbox-next" onClick={lightboxNext}>
                    <ChevronRight size={22} />
                  </button>
                  <div className="admin-lightbox-counter">
                    {lightbox.index + 1} / {lightbox.images.length}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="admin-title">Panel de Administracion</h2>

      {/* Stats Grid */}
      {loadingStats ? (
        <div className="admin-stats-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="stat-card stat-skeleton" />)}
        </div>
      ) : stats && (
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-card-title"><Users size={14} /> Usuarios</div>
            <div className="stat-main-number">{stats.users?.total || 0}</div>
            <div className="stat-detail">
              <strong>+{stats.users?.today || 0}</strong> hoy
              {stats.users?.banned > 0 && <> · <span className="stat-warn">{stats.users.banned} ban</span></>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title"><MapPin size={14} /> Pines</div>
            <div className="stat-main-number">{stats.pins?.total || 0}</div>
            <div className="stat-detail">
              <strong>+{stats.pins?.today || 0}</strong> hoy
              {stats.pins?.hidden > 0 && <> · {stats.pins.hidden} ocultos</>}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title"><Shield size={14} /> Verificaciones</div>
            <div className="stat-main-number">{stats.verifications?.pending || 0}</div>
            <div className="stat-detail">
              pendientes · <strong>{stats.verifications?.approved || 0}</strong> aprobadas
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title"><Zap size={14} /> Puntos</div>
            <div className="stat-main-number">{(stats.points?.total_earned || 0).toLocaleString()}</div>
            <div className="stat-detail">
              <strong>+{stats.points?.today_earned || 0}</strong> hoy
            </div>
          </div>
        </div>
      )}

      {/* Section: Verifications */}
      <div className="admin-section">
        <SectionHeader id="verifications" icon={Shield} title="Verificaciones pendientes" badge={stats?.verifications?.pending} />
        <AnimatePresence>
          {openSection === 'verifications' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="section-content"
            >
              <div className="section-body">
                {verifications.length === 0 ? (
                  <p className="section-empty">No hay verificaciones pendientes</p>
                ) : (
                  verifications.map(v => {
                    const allImages = getVerifImages(v);
                    const isExpanded = !!expandedVerif[v.id];
                    return (
                      <div key={v.id} className="verification-card">
                        {/* Header: usuario + fecha */}
                        <div className="verification-header">
                          <div className="verification-user">
                            {v.avatar_url ? (
                              <img src={v.avatar_url} alt={v.username} className="admin-avatar-img" />
                            ) : (
                              <div className="admin-avatar">{v.username?.charAt(0).toUpperCase()}</div>
                            )}
                            <div>
                              <strong>@{v.username}</strong>
                              <span className="text-muted text-small">{v.email}</span>
                            </div>
                            {v.is_verified_buyer && <span className="tag tag-green">Comprador</span>}
                          </div>
                          <span className="text-muted text-small">
                            {new Date(v.created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>

                        {/* Info básica del pin */}
                        <div className="verification-pin-info">
                          <MapPin size={14} />
                          <span>{v.pin_title}</span>
                          {v.location_name && <span className="text-muted">· {v.location_name}</span>}
                        </div>

                        {/* Tags rápidos visibles siempre */}
                        <div className="tag-row" style={{ marginBottom: '0.5rem' }}>
                          {v.category_name && (
                            <span className="tag">
                              {v.category_emoji && `${v.category_emoji} `}{v.category_name}
                            </span>
                          )}
                          {v.city_name && <span className="tag">{v.city_name}</span>}
                          {v.bonus_points > 0 && (
                            <span className="tag tag-green">+{v.bonus_points} pts bonus</span>
                          )}
                        </div>

                        {/* Ver más / Ver menos */}
                        <button
                          className="verif-expand-btn"
                          onClick={() => toggleVerifExpand(v.id)}
                        >
                          {isExpanded ? (
                            <><ChevronDown size={13} style={{ transform: 'rotate(180deg)' }} /> Ver menos</>
                          ) : (
                            <><ChevronDown size={13} /> Ver más detalles</>
                          )}
                        </button>

                        {/* Detalle expandido */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="verif-detail">
                                {v.pin_description && (
                                  <div className="verif-detail-row">
                                    <span className="verif-detail-label">Descripción</span>
                                    <span className="verif-detail-value">{v.pin_description}</span>
                                  </div>
                                )}
                                {v.latitude && v.longitude && (
                                  <div className="verif-detail-row">
                                    <span className="verif-detail-label">Coordenadas</span>
                                    <span className="verif-detail-value">
                                      {parseFloat(v.latitude).toFixed(5)}, {parseFloat(v.longitude).toFixed(5)}
                                    </span>
                                  </div>
                                )}
                                {v.city_name && (
                                  <div className="verif-detail-row">
                                    <span className="verif-detail-label">Ciudad</span>
                                    <span className="verif-detail-value">{v.city_name}</span>
                                  </div>
                                )}
                                {v.category_name && (
                                  <div className="verif-detail-row">
                                    <span className="verif-detail-label">Categoría</span>
                                    <span className="verif-detail-value">
                                      {v.category_emoji && `${v.category_emoji} `}{v.category_name}
                                    </span>
                                  </div>
                                )}
                                <div className="verif-detail-row">
                                  <span className="verif-detail-label">Usa producto 360</span>
                                  <span className="verif-detail-value">{v.used_tresesenta ? 'Sí' : 'No'}</span>
                                </div>
                                {v.shoe_model && (
                                  <div className="verif-detail-row">
                                    <span className="verif-detail-label">Modelo</span>
                                    <span className="verif-detail-value verif-detail-model">{v.shoe_model}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Imágenes */}
                        {allImages.length > 0 && (
                          <div className="verification-images">
                            {allImages.map((img, i) => (
                              <button
                                key={i}
                                className="verification-thumb-btn"
                                onClick={() => openLightbox(allImages, i)}
                                title={img.type === 'evidencia' ? 'Ver evidencia' : 'Ver imagen del pin'}
                              >
                                <img
                                  src={img.url}
                                  alt={img.type}
                                  className={`verification-thumb ${img.type === 'evidencia' ? 'verification-evidence' : ''}`}
                                />
                                {img.type === 'evidencia' && (
                                  <span className="thumb-badge-ev">Evidencia</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {confirmAction?.type === 'reject' && confirmAction.id === v.id ? (
                          <div className="inline-confirm">
                            <input
                              className="inline-input"
                              placeholder="Razon del rechazo..."
                              value={actionInput}
                              onChange={e => setActionInput(e.target.value)}
                              autoFocus
                            />
                            <div className="inline-confirm-btns">
                              <button
                                className="btn-admin-action btn-reject"
                                onClick={() => handleRejectVerification(v.id)}
                                disabled={savingId === v.id}
                              >
                                Rechazar
                              </button>
                              <button
                                className="btn-admin-action btn-neutral"
                                onClick={() => { setConfirmAction(null); setActionInput(''); }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="verification-actions">
                            <button
                              className="btn-admin-action btn-approve"
                              onClick={() => handleApproveVerification(v.id)}
                              disabled={savingId === v.id}
                            >
                              <Check size={14} /> Aprobar
                            </button>
                            <button
                              className="btn-admin-action btn-reject"
                              onClick={() => { setConfirmAction({ type: 'reject', id: v.id }); setActionInput(''); }}
                            >
                              <X size={14} /> Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section: Historial */}
      <div className="admin-section">
        <SectionHeader
          id="historial"
          icon={History}
          title="Historial de verificaciones"
          badge={historial.filter(h => h.status === 'approved').length || 0}
        />
        <AnimatePresence>
          {openSection === 'historial' && (() => {
            const filtered = historial
              .filter(h => h.status === historialTab)
              .filter(h => {
                if (!historialSearch) return true;
                const q = historialSearch.toLowerCase();
                return h.pin_title?.toLowerCase().includes(q) ||
                       h.username?.toLowerCase().includes(q) ||
                       h.reviewer_username?.toLowerCase().includes(q);
              });
            const totalPages = Math.max(1, Math.ceil(filtered.length / HISTORIAL_PAGE_SIZE));
            const page = Math.min(historialPage, totalPages);
            const pageItems = filtered.slice((page - 1) * HISTORIAL_PAGE_SIZE, page * HISTORIAL_PAGE_SIZE);

            return (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="section-content"
              >
                <div className="section-body">
                  {/* Tabs */}
                  <div className="historial-tabs">
                    <button
                      className={`historial-tab ${historialTab === 'approved' ? 'active' : ''}`}
                      onClick={() => { setHistorialTab('approved'); setHistorialPage(1); }}
                    >
                      Aprobadas
                      <span className="historial-tab-count">
                        {historial.filter(h => h.status === 'approved').length}
                      </span>
                    </button>
                    <button
                      className={`historial-tab ${historialTab === 'rejected' ? 'active' : ''}`}
                      onClick={() => { setHistorialTab('rejected'); setHistorialPage(1); }}
                    >
                      Rechazadas
                      <span className="historial-tab-count">
                        {historial.filter(h => h.status === 'rejected').length}
                      </span>
                    </button>
                  </div>

                  {/* Búsqueda */}
                  <div className="search-wrapper" style={{ marginBottom: '0.75rem' }}>
                    <Search size={15} className="search-icon" />
                    <input
                      className="admin-search"
                      placeholder="Buscar pin, usuario o revisor..."
                      value={historialSearch}
                      onChange={e => { setHistorialSearch(e.target.value); setHistorialPage(1); }}
                    />
                  </div>

                  {/* Lista */}
                  {pageItems.length === 0 ? (
                    <p className="section-empty">
                      {historialSearch ? 'Sin resultados' : `No hay registros ${historialTab === 'approved' ? 'aprobados' : 'rechazados'}`}
                    </p>
                  ) : (
                    pageItems.map(h => (
                      <div key={h.pin_id} className="historial-row">
                        <div className="historial-row-main">
                          <span className="historial-row-title">{h.pin_title}</span>
                          <span className="text-muted text-small">@{h.username}</span>
                        </div>
                        <div className="historial-row-meta">
                          <span className="text-muted text-small">
                            por <strong>@{h.reviewer_username || '—'}</strong>
                          </span>
                          <span className="text-muted text-small">
                            {h.reviewed_at
                              ? new Date(h.reviewed_at).toLocaleDateString('es-MX')
                              : new Date(h.pin_created_at).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <div className="historial-row-actions">
                          <button
                            className="btn-admin-action btn-neutral btn-sm"
                            onClick={() => setHistorialModal(h)}
                          >
                            <Eye size={12} /> Ver más
                          </button>
                          {h.status === 'approved' && (
                            confirmAction?.type === 'historial-reject' && confirmAction.id === h.pin_id ? (
                              <div className="inline-confirm">
                                <input
                                  className="inline-input"
                                  placeholder="Razón del rechazo..."
                                  value={actionInput}
                                  onChange={e => setActionInput(e.target.value)}
                                  autoFocus
                                />
                                <div className="inline-confirm-btns">
                                  <button
                                    className="btn-admin-action btn-reject btn-sm"
                                    onClick={() => handleRejectFromHistorial(h.pin_id)}
                                    disabled={savingId === h.pin_id}
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    className="btn-admin-action btn-neutral btn-sm"
                                    onClick={() => { setConfirmAction(null); setActionInput(''); }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                className="btn-admin-action btn-reject btn-sm"
                                onClick={() => { setConfirmAction({ type: 'historial-reject', id: h.pin_id }); setActionInput(''); }}
                              >
                                <X size={12} /> Rechazar
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="historial-pagination">
                      <button
                        className="historial-page-btn"
                        onClick={() => setHistorialPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="historial-page-info">{page} / {totalPages}</span>
                      <button
                        className="historial-page-btn"
                        onClick={() => setHistorialPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Section: Users */}
      <div className="admin-section">
        <SectionHeader id="users" icon={Users} title="Usuarios" badge={0} />
        <AnimatePresence>
          {openSection === 'users' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="section-content"
            >
              <div className="section-body">
                <div className="search-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    className="admin-search"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                {filteredUsers.map(u => (
                  <div key={u.id} className="admin-row">
                    <div className="admin-avatar">{u.username?.charAt(0).toUpperCase()}</div>
                    <div className="admin-row-info">
                      <strong>@{u.username}</strong>
                      <span className="text-muted text-small">{u.email}</span>
                      <div className="tag-row">
                        {u.is_admin && <span className="tag tag-purple">Admin</span>}
                        {u.is_verified_buyer && <span className="tag tag-green">Comprador</span>}
                        {u.is_banned && <span className="tag tag-red">Baneado</span>}
                        <span className="text-muted text-small">{u.total_points || 0} pts</span>
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      {confirmAction?.type === 'ban' && confirmAction.id === u.id ? (
                        <div className="inline-confirm-sm">
                          <input
                            className="inline-input"
                            placeholder="Razon..."
                            value={actionInput}
                            onChange={e => setActionInput(e.target.value)}
                            autoFocus
                          />
                          <button className="btn-admin-action btn-reject btn-sm" onClick={() => handleBanUser(u.id)} disabled={savingId === u.id}>Ban</button>
                          <button className="btn-admin-action btn-neutral btn-sm" onClick={() => { setConfirmAction(null); setActionInput(''); }}>X</button>
                        </div>
                      ) : (
                        <>
                          {u.is_banned ? (
                            <button className="btn-admin-action btn-approve btn-sm" onClick={() => handleUnbanUser(u.id)} disabled={savingId === u.id}>Desbanear</button>
                          ) : (
                            <button className="btn-admin-action btn-reject btn-sm" onClick={() => { setConfirmAction({ type: 'ban', id: u.id }); setActionInput(''); }}>Ban</button>
                          )}
                          <button
                            className={`toggle-switch ${u.is_admin ? 'on' : ''}`}
                            onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                            disabled={savingId === u.id}
                            title="Admin"
                          />
                          <button
                            className={`toggle-switch ${u.is_verified_buyer ? 'on' : ''}`}
                            onClick={() => handleToggleVerifiedBuyer(u.id, u.is_verified_buyer)}
                            disabled={savingId === u.id}
                            title="Comprador verificado"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <p className="section-empty">No se encontraron usuarios</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section: Pins */}
      <div className="admin-section">
        <SectionHeader id="pins" icon={MapPin} title="Moderacion de Pines" badge={0} />
        <AnimatePresence>
          {openSection === 'pins' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="section-content"
            >
              <div className="section-body">
                {pins.map(p => (
                  <div key={p.id} className={`admin-row ${p.is_hidden ? 'row-hidden' : ''}`}>
                    <div className="admin-row-info" style={{ flex: 1 }}>
                      <div className="pin-row-header">
                        <strong>{p.title}</strong>
                        {p.is_hidden && <span className="tag tag-red">Oculto</span>}
                        {p.used_tresesenta && <span className="tag tag-green">360</span>}
                      </div>
                      <span className="text-muted text-small">
                        @{p.username} · {p.category_name || 'Sin cat.'} · {new Date(p.created_at).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                    <div className="admin-row-actions">
                      {confirmAction?.type === 'hide' && confirmAction.id === p.id ? (
                        <div className="inline-confirm-sm">
                          <input
                            className="inline-input"
                            placeholder="Razon..."
                            value={actionInput}
                            onChange={e => setActionInput(e.target.value)}
                            autoFocus
                          />
                          <button className="btn-admin-action btn-reject btn-sm" onClick={() => handleHidePin(p.id)} disabled={savingId === p.id}>Ocultar</button>
                          <button className="btn-admin-action btn-neutral btn-sm" onClick={() => { setConfirmAction(null); setActionInput(''); }}>X</button>
                        </div>
                      ) : p.is_hidden ? (
                        <button className="btn-admin-action btn-approve btn-sm" onClick={() => handleUnhidePin(p.id)} disabled={savingId === p.id}>
                          <Eye size={14} /> Mostrar
                        </button>
                      ) : (
                        <button className="btn-admin-action btn-neutral btn-sm" onClick={() => { setConfirmAction({ type: 'hide', id: p.id }); setActionInput(''); }}>
                          <EyeOff size={14} /> Ocultar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {pins.length === 0 && <p className="section-empty">No hay pines</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section: Badges */}
      <div className="admin-section">
        <SectionHeader id="badges" icon={Award} title="Badges / Medallas" badge={0} />
        <AnimatePresence>
          {openSection === 'badges' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="section-content"
            >
              <div className="section-body">
                {badges.map(b => (
                  <div key={b.id} className="admin-row">
                    <span className="badge-emoji-lg">{b.emoji || '🏅'}</span>
                    <div className="admin-row-info" style={{ flex: 1 }}>
                      <strong>{b.name_es || b.name}</strong>
                      <span className="text-muted text-small">
                        {b.description_es || b.description || 'Sin descripcion'}
                      </span>
                      <div className="tag-row">
                        <span className="tag">{b.rarity || 'common'}</span>
                        <span className="tag">{b.geographic_scope || 'nacional'}</span>
                        <span className="text-muted text-small">{b.users_with_badge || 0} usuarios</span>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${b.is_active ? 'on' : ''}`}
                      onClick={() => handleToggleBadge(b)}
                      disabled={savingId === b.id}
                      title={b.is_active ? 'Desactivar' : 'Activar'}
                    />
                  </div>
                ))}
                {badges.length === 0 && <p className="section-empty">No hay badges configurados</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section: Points & Settings */}
      <div className="admin-section">
        <SectionHeader id="settings" icon={Settings} title="Puntos y Configuracion" badge={0} />
        <AnimatePresence>
          {openSection === 'settings' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="section-content"
            >
              <div className="section-body">
                <h4 className="subsection-title">Acciones de Puntos</h4>
                <div className="point-actions-list">
                  {pointActions.map(a => (
                    <div key={a.id} className="point-action-row">
                      <div className="point-action-info">
                        <strong>{a.action_name_es || a.action_name}</strong>
                        <span className="text-muted text-small">{a.description || a.action_code}</span>
                      </div>
                      <div className="point-action-fields">
                        <label className="field-group">
                          <span>Pts</span>
                          <input
                            type="number"
                            className="inline-input inline-input-sm"
                            defaultValue={a.points}
                            onBlur={e => {
                              const val = parseInt(e.target.value);
                              if (val !== a.points) handleUpdatePointAction(a, 'points', val);
                            }}
                          />
                        </label>
                        <label className="field-group">
                          <span>Limite</span>
                          <input
                            type="number"
                            className="inline-input inline-input-sm"
                            defaultValue={a.daily_limit || ''}
                            placeholder="∞"
                            onBlur={e => {
                              const val = e.target.value ? parseInt(e.target.value) : null;
                              if (val !== a.daily_limit) handleUpdatePointAction(a, 'daily_limit', val);
                            }}
                          />
                        </label>
                        <button
                          className={`toggle-switch ${a.is_active ? 'on' : ''}`}
                          onClick={() => handleUpdatePointAction(a, 'is_active', !a.is_active)}
                          disabled={savingId === a.id}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <h4 className="subsection-title" style={{ marginTop: '1.5rem' }}>Configuracion del Sistema</h4>
                {settings.map(s => (
                  <div key={s.setting_key} className="setting-row">
                    <div className="setting-info">
                      <strong>{s.setting_key.replace(/_/g, ' ')}</strong>
                      <span className="text-muted text-small">{s.description}</span>
                    </div>
                    <div className="setting-value">
                      {typeof s.setting_value?.value === 'boolean' ? (
                        <button
                          className={`toggle-switch ${s.setting_value.value ? 'on' : ''}`}
                          onClick={() => handleUpdateSetting(s.setting_key, !s.setting_value.value)}
                          disabled={savingId === s.setting_key}
                        />
                      ) : (
                        <input
                          type="number"
                          className="inline-input inline-input-sm"
                          defaultValue={s.setting_value?.value}
                          onBlur={e => {
                            const val = parseFloat(e.target.value);
                            if (val !== s.setting_value?.value) handleUpdateSetting(s.setting_key, val);
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
