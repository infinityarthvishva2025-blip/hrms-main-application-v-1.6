import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Clock, MapPin, CheckCircle, LogOut, Loader2,
  AlertCircle, ChevronRight, Send, UserCircle, X,
  FileText, AlertTriangle, Users, Camera, Wifi, WifiOff,
  Shield, Zap, Info, ExternalLink,
} from 'lucide-react';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/* ── Geo status pill (enhanced with permission_denied state) ── */
const GeoStatus = ({ status, distance, onRequestPermission }) => {
  const statusMap = {
    checking: { color: '#D97706', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', Icon: Wifi, text: 'Verifying location…' },
    valid:    { color: '#059669', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', Icon: CheckCircle, text: `Within zone · ${distance}m` },
    invalid:  { color: '#DC2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', Icon: WifiOff, text: `Out of range · ${distance}m` },
    error:    { color: '#DC2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', Icon: WifiOff, text: 'GPS error' },
    permission_denied: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)', Icon: AlertCircle, text: 'Location blocked' },
  };
  const c = statusMap[status] || statusMap.checking;
  const CIcon = c.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        background: c.bg, color: c.color,
        padding: '8px 16px', borderRadius: 'var(--radius-full)',
        fontSize: '0.8rem', fontWeight: 700,
        border: `1px solid ${c.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <CIcon size={13} />
      {c.text}
    </motion.div>
  );
};

/* ── Location permission help banner ─────────────────────────── */
const LocationPermissionBanner = ({ onRetry }) => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(220,38,38,0.12)',
        border: '1px solid rgba(220,38,38,0.3)',
        borderRadius: 'var(--radius-xl)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <div style={{ background: '#DC2626', borderRadius: 'var(--radius-full)', padding: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={18} color="#fff" />
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>Location access required</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Attendance requires your current location to verify office zone.
          </p>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px', cursor: 'pointer', padding: 0 }}
          >
            {showDetails ? 'Hide instructions ↓' : 'How to enable location →'}
          </button>
        </div>
      </div>
      <button
        onClick={onRetry}
        style={{
          background: 'var(--gradient-primary)',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 20px',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
        }}
      >
        <MapPin size={16} /> Retry location
      </button>
      {showDetails && (
        <div style={{ width: '100%', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(220,38,38,0.2)', fontSize: '0.8rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>🔧 To enable location:</p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-text-secondary)' }}>
            <li>Click the <strong>lock icon</strong> 🔒 in your browser address bar</li>
            <li>Set <strong>Location</strong> permission to <strong>Allow</strong></li>
            <li>Refresh the page or click <strong>"Retry location"</strong> above</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
};

const AttendancePage = () => {
  const { user, refreshProfile } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('checking');
  const [geoDistance, setGeoDistance] = useState(0);
  const [coords, setCoords] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const [officeSettings, setOfficeSettings] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ todayWork: '', pendingWork: '', issuesFaced: '', reportParticipants: [] });
  const [managementEmployees, setManagementEmployees] = useState([]);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceOp, setFaceOp] = useState(null);
  const videoRef = useRef();

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      toast.error('Failed to load face verification models');
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(s => { if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => toast.error('Webcam access denied'));
  };

  const stopVideo = () => {
    if (videoRef.current?.srcObject)
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const handleVerifyFaceAndProceed = async () => {
    if (!videoRef.current) return;
    setVerifyingFace(true);
    try {
      if (!user.faceDescriptor?.length) {
        toast.error('Face ID not registered. Visit your Profile to set it up.');
        setVerifyingFace(false);
        return;
      }
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) { toast.error('No face detected. Reposition yourself.'); setVerifyingFace(false); return; }

      const dist = faceapi.euclideanDistance(detection.descriptor, new Float32Array(user.faceDescriptor));
      if (dist > 0.6) { toast.error('Face mismatch. Try again.'); setVerifyingFace(false); return; }

      toast.success('Identity Verified ✓');
      setShowFaceModal(false);
      stopVideo();
      if (faceOp === 'checkin') await proceedWithCheckIn();
      else if (faceOp === 'checkout') setShowReportModal(true);
    } catch (err) {
      toast.error('Face verification failed');
    } finally { setVerifyingFace(false); }
  };

  // Live timer
  useEffect(() => {
    refreshProfile();
    if (!todayRecord?.inTime || todayRecord?.outTime) return;
    const inTime = new Date(todayRecord.inTime);
    const shiftMs = (inTime.getDay() === 6 ? 7 : 8.5) * 3600000;
    const tick = () => {
      const worked = Date.now() - inTime.getTime();
      const rem = shiftMs - worked;
      setIsOvertime(rem < 0);
      setRemainingMs(Math.abs(rem));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [todayRecord]);

  // Enhanced location fetch with permission handling
  const fetchGeo = useCallback((office) => {
    if (!office || !navigator.geolocation) { 
      setGeoStatus('error'); 
      return; 
    }
    setGeoStatus('checking');
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setCoords({ latitude, longitude });
        const R = 6371000, tr = v => (v * Math.PI) / 180;
        const dLat = tr(latitude - office.lat), dLng = tr(longitude - office.lng);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(tr(office.lat)) * Math.cos(tr(latitude)) * Math.sin(dLng / 2) ** 2;
        const d = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        setGeoDistance(d);
        setGeoStatus(d <= office.radius ? 'valid' : 'invalid');
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === 1) {
          setGeoStatus('permission_denied');
          toast.error('Location permission denied. Please enable it in browser settings.');
        } else if (err.code === 2) {
          setGeoStatus('error');
          toast.error('Location unavailable. Check device GPS.');
        } else {
          setGeoStatus('error');
          toast.error('Failed to get location');
        }
        setCoords(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const fetchToday = useCallback(async () => {
    try {
      const { data } = await api.get('/attendance/today');
      setTodayRecord(data.data.record);
      if (data.data.office) { 
        setOfficeSettings(data.data.office); 
        fetchGeo(data.data.office); 
      }
    } catch (_) {}
    setLoading(false);
  }, [fetchGeo]);

  const fetchManagement = useCallback(async () => {
    try {
      const { data } = await api.get('/employees/management');
      setManagementEmployees(data.data);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchToday(); fetchManagement(); }, [fetchToday, fetchManagement]);

  const handleCheckIn = async () => {
    if (!coords) { 
      toast.error('Location not available. Please allow location access.'); 
      if (geoStatus === 'permission_denied') fetchGeo(officeSettings);
      return; 
    }
    if (geoStatus === 'invalid') { toast.error(`Out of Zone: ${geoDistance}m away.`); return; }
    if (!user.faceDescriptor?.length) { toast.error('Register Face ID from Profile first!'); return; }
    if (!modelsLoaded) await loadModels();
    setFaceOp('checkin');
    setShowFaceModal(true);
    setTimeout(startVideo, 100);
  };

  const proceedWithCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-in', { latitude: coords.latitude, longitude: coords.longitude });
      toast.success('Checked In Successfully!');
      fetchToday();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally { setActionLoading(false); }
  };

  const handleCheckOutSubmit = async () => {
    if (!reportData.todayWork.trim()) { toast.error("Describe today's work first"); return; }
    setActionLoading(true);
    try {
      const { data } = await api.post('/attendance/check-out', { latitude: coords.latitude, longitude: coords.longitude, ...reportData });
      const { overtimeMinutes, shortfallMinutes } = data.data;
      if (overtimeMinutes > 0) toast.success(`Checked out! Overtime: ${overtimeMinutes}m`);
      else if (shortfallMinutes > 0) toast(`Checked out ${shortfallMinutes}m early`, { icon: '⚠️' });
      else toast.success('Checked Out Successfully!');
      setShowReportModal(false);
      fetchToday();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally { setActionLoading(false); }
  };

  const toggleParticipant = (id) =>
    setReportData(p => ({
      ...p,
      reportParticipants: p.reportParticipants.includes(id)
        ? p.reportParticipants.filter(x => x !== id)
        : [...p.reportParticipants, id],
    }));

  const isCheckedIn = !!todayRecord?.inTime;
  const isCheckedOut = !!todayRecord?.outTime;
  const fmtT = (s) => s ? new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
  const canAct = geoStatus === 'valid' && !actionLoading && coords;

  return (
    <AppShell>
      <div className="page-wrapper fade-in attendance-page-container">

        {/* ── Page Header ── */}
        <div className="attendance-header">
          <div>
            <h1 className="attendance-title">Attendance</h1>
            <p className="attendance-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="header-actions">
            <GeoStatus status={geoStatus} distance={geoDistance} />
            <button className="btn-icon" onClick={() => fetchGeo(officeSettings)} title="Refresh Location">
              <MapPin size={16} />
            </button>
          </div>
        </div>

        {/* ── Location permission banner (if blocked) ── */}
        {geoStatus === 'permission_denied' && (
          <LocationPermissionBanner onRetry={() => fetchGeo(officeSettings)} />
        )}

        {/* ── Main Responsive Grid ── */}
        <div className="attendance-dashboard-grid">

          {/* ── Central Action Card ── */}
          <div className="action-card">
            <div className="action-card-glow" />
            <div className="action-card-inner">
              {loading ? (
                <Loader2 size={40} className="animate-spin" style={{ color: 'rgba(255,255,255,0.25)' }} />
              ) : (
                <AnimatePresence mode="wait">
                  {isCheckedIn && !isCheckedOut && (
                    <motion.div key="timer" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="timer-section">
                      <p className="timer-label">{isOvertime ? '⏱ Overtime Running' : 'Shift Time Remaining'}</p>
                      <div className={`timer-value ${isOvertime ? 'overtime' : ''}`}>
                        {isOvertime && '+'}{formatDuration(remainingMs)}
                      </div>
                      <p className="timer-footnote">Clocked in at {fmtT(todayRecord?.inTime)}</p>
                    </motion.div>
                  )}

                  {!isCheckedIn && (
                    <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="idle-section">
                      <div className="idle-icon">
                        <Clock size={36} />
                      </div>
                      <h2>Ready to Begin?</h2>
                      <p>Ensure you're within the office zone, then check in securely.</p>
                    </motion.div>
                  )}

                  {isCheckedOut && (
                    <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="done-section">
                      <div className="done-icon">
                        <CheckCircle size={36} />
                      </div>
                      <h2>Day Complete!</h2>
                      <p>Attendance securely logged. See you tomorrow!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {!loading && (
                <div className="action-buttons">
                  {!isCheckedIn && (
                    <motion.button
                      whileHover={{ scale: canAct ? 1.02 : 1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCheckIn}
                      disabled={!canAct}
                      className={`action-btn checkin-btn ${!canAct ? 'disabled' : ''}`}
                    >
                      {actionLoading ? <Loader2 size={22} className="animate-spin" /> : <Shield size={22} />}
                      Secure Check In
                    </motion.button>
                  )}

                  {isCheckedIn && !isCheckedOut && (
                    <motion.button
                      whileHover={{ scale: canAct ? 1.02 : 1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        if (!coords) { 
                          toast.error('Location unavailable'); 
                          if (geoStatus === 'permission_denied') fetchGeo(officeSettings);
                          return; 
                        }
                        if (geoStatus === 'invalid') { toast.error('Out of zone!'); return; }
                        if (!user.faceDescriptor?.length) { toast.error('Face ID not registered!'); return; }
                        if (!modelsLoaded) await loadModels();
                        setFaceOp('checkout');
                        setShowFaceModal(true);
                        setTimeout(startVideo, 100);
                      }}
                      disabled={!canAct}
                      className={`action-btn checkout-btn ${!canAct ? 'disabled' : ''}`}
                    >
                      {actionLoading ? <Loader2 size={22} className="animate-spin" /> : <LogOut size={22} />}
                      Check Out
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Side Panel ── */}
          <div className="side-panel">
            {/* Today's Metrics Card */}
            <div className="metrics-card">
              <p className="section-title">Today's Metrics</p>
              <div className="metrics-list">
                <div className="metric-item">
                  <span>Check In</span>
                  <span className="metric-value success">{loading ? '—' : fmtT(todayRecord?.inTime)}</span>
                </div>
                <div className="divider" />
                <div className="metric-item">
                  <span>Check Out</span>
                  <span className={`metric-value ${isCheckedOut ? 'primary' : 'muted'}`}>
                    {loading ? '—' : isCheckedOut ? fmtT(todayRecord?.outTime) : 'Pending'}
                  </span>
                </div>
                {todayRecord?.totalHours && (
                  <>
                    <div className="divider" />
                    <div className="metric-item">
                      <span>Total Hours</span>
                      <span className="metric-value accent">{todayRecord.totalHours.toFixed(1)}h</span>
                    </div>
                  </>
                )}
                {todayRecord?.isLate && (
                  <div className="late-badge">
                    <AlertCircle size={14} />
                    <span>Late by {todayRecord.lateMinutes} minutes</span>
                  </div>
                )}
              </div>
            </div>

            {/* History Link */}
            <motion.a href="/attendance/summary" whileHover={{ y: -3 }} className="history-link">
              <div className="history-card">
                <div className="history-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="history-title">Attendance History</p>
                  <p className="history-subtitle">View monthly logs & reports</p>
                </div>
                <ChevronRight size={16} className="history-arrow" />
              </div>
            </motion.a>

            {/* Zone Info */}
            {officeSettings && (
              <div className="zone-card">
                <p className="section-title">Office Zone</p>
                <div className="zone-details">
                  <div className={`zone-icon ${geoStatus === 'valid' ? 'valid' : 'invalid'}`}>
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="zone-radius">Radius: {officeSettings.radius}m</p>
                    <p className="zone-distance">You are {geoDistance}m away</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CHECKOUT REPORT MODAL (Responsive)
        ══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showReportModal && (
            <div className="modal-backdrop">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowReportModal(false)}
                className="modal-overlay"
              />
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 24 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className="report-modal"
              >
                <div className="modal-header">
                  <div>
                    <div className="modal-title-icon">
                      <Send size={16} />
                    </div>
                    <h2>Check-out Report</h2>
                    <p>Complete your daily EOD before leaving</p>
                  </div>
                  <button className="btn-icon" onClick={() => setShowReportModal(false)}><X size={18} /></button>
                </div>

                <div className="modal-body">
                  {[
                    { key: 'todayWork', label: "Today's Completed Work *", icon: CheckCircle, placeholder: 'What specific tasks did you complete today?', rows: 3 },
                    { key: 'pendingWork', label: 'Pending / Carry-over Tasks', icon: Clock, placeholder: 'Any tasks to carry forward to tomorrow?', rows: 2 },
                    { key: 'issuesFaced', label: 'Blockers / Issues Faced', icon: AlertTriangle, placeholder: 'Any blockers, challenges, or escalations?', rows: 2 },
                  ].map(({ key, label, icon: LIcon, placeholder, rows }) => (
                    <div key={key} className="form-group">
                      <label className="form-label"><LIcon size={13} /> {label}</label>
                      <textarea
                        className="input-field"
                        placeholder={placeholder}
                        rows={rows}
                        value={reportData[key]}
                        onChange={(e) => setReportData({ ...reportData, [key]: e.target.value })}
                      />
                    </div>
                  ))}

                  {managementEmployees.length > 0 && (
                    <div className="form-group">
                      <label className="form-label"><Users size={13} /> Share Report With</label>
                      <div className="participants-list">
                        {managementEmployees.map(emp => {
                          const sel = reportData.reportParticipants.includes(emp._id);
                          return (
                            <button
                              key={emp._id}
                              onClick={() => toggleParticipant(emp._id)}
                              className={`participant-chip ${sel ? 'selected' : ''}`}
                            >
                              <UserCircle size={13} />
                              {emp.name}
                              <span className="participant-role">({emp.role})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleCheckOutSubmit} disabled={actionLoading}>
                      {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Submit & Check Out
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════
            FACE VERIFICATION MODAL (Responsive)
        ══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showFaceModal && (
            <div className="modal-backdrop">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowFaceModal(false); stopVideo(); }}
                className="modal-overlay"
              />
              <motion.div
                initial={{ scale: 0.88, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                className="face-modal"
              >
                <button className="btn-icon modal-close" onClick={() => { setShowFaceModal(false); stopVideo(); }}>
                  <X size={16} />
                </button>

                <div className="face-modal-icon">
                  <Shield size={26} />
                </div>
                <h2>Security Verification</h2>
                <p>Verifying identity for <strong>{faceOp === 'checkin' ? 'Check In' : 'Check Out'}</strong></p>

                <div className="camera-feed">
                  <video ref={videoRef} autoPlay muted playsInline />
                  <div className="scan-line" />
                </div>

                <div className="face-modal-actions">
                  <button className="btn-secondary" onClick={() => { setShowFaceModal(false); stopVideo(); }}>Cancel</button>
                  <button className="btn-primary" onClick={handleVerifyFaceAndProceed} disabled={verifyingFace}>
                    {verifyingFace ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                    {verifyingFace ? 'Verifying…' : 'Verify Identity'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      <style>{`
        /* ----- Responsive styles ----- */
        .attendance-page-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .attendance-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
        }

        .attendance-title {
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 900;
          letter-spacing: -0.04em;
          color: var(--color-text);
          margin-bottom: 4px;
        }

        .attendance-date {
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        /* Main Grid */
        .attendance-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
        }

        /* Action Card */
        .action-card {
          background: linear-gradient(145deg, #0F172A 0%, #162035 60%, #1A2647 100%);
          border-radius: var(--radius-2xl);
          padding: clamp(28px, 6vw, 52px);
          color: #fff;
          position: relative;
          overflow: hidden;
          min-height: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 24px 60px rgba(15,23,42,0.3);
        }

        .action-card-glow {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%);
          filter: blur(40px);
        }

        .action-card-inner {
          position: relative;
          z-index: 1;
          text-align: center;
          width: 100%;
        }

        .timer-section {
          margin-bottom: 36px;
        }

        .timer-label {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(255,255,255,0.45);
          margin-bottom: 10px;
        }

        .timer-value {
          font-size: clamp(2.5rem, 10vw, 4.5rem);
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          letter-spacing: -4px;
          line-height: 1;
          color: #fff;
          margin-bottom: 6px;
        }

        .timer-value.overtime {
          color: #FCD34D;
        }

        .timer-footnote {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.3);
          margin-top: 6px;
        }

        .idle-section, .done-section {
          margin-bottom: 36px;
        }

        .idle-icon, .done-icon {
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .done-icon {
          background: rgba(16,185,129,0.12);
          border-color: rgba(16,185,129,0.25);
        }

        .idle-section h2, .done-section h2 {
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .idle-section p, .done-section p {
          color: rgba(255,255,255,0.45);
          max-width: 260px;
          margin: 0 auto;
          font-size: 0.9rem;
        }

        .action-buttons {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 18px 44px;
          border-radius: var(--radius-xl);
          border: none;
          font-size: 1.1rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s;
          cursor: pointer;
        }

        .checkin-btn {
          background: var(--gradient-success);
          color: #fff;
          box-shadow: 0 12px 32px rgba(16,185,129,0.35);
        }

        .checkout-btn {
          background: var(--gradient-error);
          color: #fff;
          box-shadow: 0 12px 32px rgba(220,38,38,0.3);
        }

        .action-btn.disabled {
          background: rgba(255,255,255,0.07);
          box-shadow: none;
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Side Panel */
        .side-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .metrics-card, .zone-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 22px;
        }

        .section-title {
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-tertiary);
          margin-bottom: 18px;
        }

        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-item span:first-child {
          font-size: 0.88rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .metric-value {
          font-weight: 800;
          font-size: 0.95rem;
        }

        .metric-value.success { color: var(--color-success); }
        .metric-value.primary { color: var(--color-primary); }
        .metric-value.muted { color: var(--color-text-tertiary); }
        .metric-value.accent { color: var(--color-accent); }

        .divider {
          height: 1px;
          background: var(--color-border);
          margin: 4px 0;
        }

        .late-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-warning-light);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          border: 1px solid #FDE68A;
          margin-top: 4px;
        }

        .late-badge span {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--color-warning);
        }

        .history-link {
          text-decoration: none;
        }

        .history-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .history-card:hover {
          transform: translateY(-2px);
          border-color: var(--color-primary);
        }

        .history-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .history-title {
          font-weight: 700;
          color: var(--color-text);
          font-size: 0.92rem;
        }

        .history-subtitle {
          font-size: 0.78rem;
          color: var(--color-text-tertiary);
          margin-top: 2px;
        }

        .history-arrow {
          margin-left: auto;
          color: var(--color-text-tertiary);
        }

        .zone-details {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .zone-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .zone-icon.valid {
          background: var(--color-success-light);
          color: var(--color-success);
        }

        .zone-icon.invalid {
          background: var(--color-error-light);
          color: var(--color-error);
        }

        .zone-radius {
          font-weight: 700;
          font-size: 0.88rem;
        }

        .zone-distance {
          font-size: 0.76rem;
          color: var(--color-text-tertiary);
        }

        /* Modals responsive */
        .report-modal, .face-modal {
          position: relative;
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          width: 90%;
          max-width: 580px;
          max-height: 90dvh;
          overflow: hidden;
          box-shadow: var(--shadow-2xl);
        }

        .face-modal {
          max-width: 400px;
          padding: 36px 28px 28px;
          text-align: center;
        }

        .modal-header {
          padding: 28px 28px 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .modal-title-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .modal-header h2 {
          font-size: 1.35rem;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .modal-header p {
          color: var(--color-text-secondary);
          font-size: 0.88rem;
        }

        .modal-body {
          padding: 24px 28px 28px;
          overflow-y: auto;
          max-height: calc(90dvh - 80px);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .participants-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 14px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
        }

        .participant-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          background: #fff;
          color: var(--color-text-secondary);
          outline: 1.5px solid var(--color-border);
          transition: all 0.2s;
        }

        .participant-chip.selected {
          background: var(--color-primary);
          color: #fff;
          outline: none;
        }

        .participant-role {
          opacity: 0.65;
          font-size: 0.7rem;
        }

        .modal-actions, .face-modal-actions {
          display: flex;
          gap: 12px;
          padding-top: 4px;
        }

        .modal-actions button, .face-modal-actions button {
          flex: 1;
        }

        .face-modal-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg);
          background: var(--color-primary-light);
          border: 1px solid rgba(37,99,235,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .face-modal h2 {
          font-size: 1.3rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          margin-bottom: 4px;
        }

        .face-modal p {
          color: var(--color-text-secondary);
          font-size: 0.88rem;
          margin-bottom: 24px;
        }

        .camera-feed {
          position: relative;
          width: 220px;
          height: 220px;
          margin: 0 auto 24px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid var(--color-border);
          box-shadow: var(--shadow-lg);
        }

        .camera-feed video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .scan-line {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(37,99,235,0) 0%, rgba(37,99,235,0.15) 50%, rgba(37,99,235,0) 100%);
          animation: scanLine 2s ease-in-out infinite;
        }

        @keyframes scanLine {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        /* Responsive breakpoints */
        @media (max-width: 900px) {
          .attendance-dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .action-card {
            min-height: 320px;
            padding: 32px 24px;
          }
          
          .action-btn {
            padding: 14px 28px;
            font-size: 1rem;
          }
          
          .metrics-card, .zone-card {
            padding: 18px;
          }
        }

        @media (max-width: 480px) {
          .attendance-page-container {
            padding: 0 12px;
          }
          
          .attendance-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .action-btn {
            width: 100%;
            justify-content: center;
            padding: 14px 20px;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .timer-value {
            font-size: 2rem;
            letter-spacing: -2px;
          }
          
          .modal-header {
            padding: 20px 20px 0;
          }
          
          .modal-body {
            padding: 20px;
          }
          
          .face-modal {
            padding: 28px 20px 20px;
          }
          
          .camera-feed {
            width: 180px;
            height: 180px;
          }
        }

        /* Animation utilities */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </AppShell>
  );
};

export default AttendancePage;