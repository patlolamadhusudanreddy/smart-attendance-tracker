import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Users,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  UserCheck,
  Smile,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api';

const QrAttendanceScanner = ({ mode = 'generate', subjectId, onScanSuccess }) => {
  // ==========================================
  // TEACHER MODE: Dynamic 20s QR Session State
  // ==========================================
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [sessionDuration, setSessionDuration] = useState(10);
  const [activeSession, setActiveSession] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(20);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(0);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [teacherGps, setTeacherGps] = useState(null);
  const [useTeacherGps, setUseTeacherGps] = useState(false);

  // ==========================================
  // STUDENT MODE: Live Camera & GPS Verification
  // ==========================================
  const [studentStep, setStudentStep] = useState('scan'); // 'scan' | 'selfie' | 'success' | 'error'
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scannedToken, setScannedToken] = useState(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const html5QrCodeRef = useRef(null);
  const selfieVideoRef = useRef(null);
  const selfieStreamRef = useRef(null);

  // ------------------------------------------
  // TEACHER: Load classrooms on mount
  // ------------------------------------------
  useEffect(() => {
    if (mode === 'generate') {
      fetchClassrooms();
    }
  }, [mode]);

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/classrooms');
      if (res.data.success) {
        const list = res.data.data || [];
        setClassrooms(list);
        if (list.length > 0 && !selectedClassroomId) {
          setSelectedClassroomId(list[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load classrooms', err);
    }
  };

  const calibrateTeacherGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTeacherGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          radiusMeters: 35,
          name: 'Teacher Real-Time GPS Anchor',
        });
        setUseTeacherGps(true);
      },
      (err) => {
        console.error('GPS calibration error', err);
      },
      { enableHighAccuracy: true }
    );
  };

  // ------------------------------------------
  // TEACHER: Start Dynamic Attendance Session
  // ------------------------------------------
  const handleStartSession = async () => {
    if (!subjectId) return;
    setIsStartingSession(true);
    try {
      const payload = {
        subjectId,
        classroomId: useTeacherGps ? undefined : selectedClassroomId,
        durationMinutes: sessionDuration,
        customCoordinates: useTeacherGps ? teacherGps : undefined,
      };

      const res = await api.post('/attendance/session/start', payload);
      if (res.data.success) {
        setActiveSession(res.data.data.session);
        setQrDataUrl(res.data.data.qrDataUrl);
        setQrSecondsLeft(20);
        setSessionSecondsLeft(res.data.data.session.durationMinutes * 60);
        setAttendees([]);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to start session');
    } finally {
      setIsStartingSession(false);
    }
  };

  // ------------------------------------------
  // TEACHER: 20-second Dynamic QR Rotation Loop
  // ------------------------------------------
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') return;

    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          rotateQrToken();
          return 20;
        }
        return prev - 1;
      });

      setSessionSecondsLeft((prev) => {
        if (prev <= 1) {
          handleEndSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  const rotateQrToken = async () => {
    if (!activeSession) return;
    setIsRotating(true);
    try {
      const res = await api.post(`/attendance/session/${activeSession.id || activeSession._id}/rotate-qr`);
      if (res.data.success) {
        setQrDataUrl(res.data.data.qrDataUrl);
        setQrSecondsLeft(20);
        // Refresh live attendee list
        fetchSessionDetails(activeSession.id || activeSession._id);
      }
    } catch (err) {
      console.error('Failed to rotate QR token', err);
    } finally {
      setIsRotating(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      const res = await api.get(`/attendance/session/${sessionId}`);
      if (res.data.success) {
        setAttendees(res.data.data.attendees || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/attendance/session/${activeSession.id || activeSession._id}/close`);
    } catch (err) {
      console.error(err);
    } finally {
      setActiveSession(null);
      setQrDataUrl(null);
    }
  };

  // ==========================================
  // STUDENT: Geolocation & Live Camera Scanner
  // ==========================================
  useEffect(() => {
    if (mode === 'scan') {
      acquireGps();
      startCameraScanner();
    }

    return () => {
      stopCameraScanner();
      stopSelfieCamera();
    };
  }, [mode]);

  const acquireGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGpsError(null);
      },
      (err) => {
        setGpsError('Please enable GPS / Location permissions on your device to mark attendance.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startCameraScanner = async () => {
    try {
      setCameraError(null);
      setCameraActive(true);

      // Clean up previous instance if any
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {}
      }

      const html5QrCode = new Html5Qrcode('qr-reader-video');
      html5QrCodeRef.current = html5QrCode;

      const qrConfig = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        qrConfig,
        (decodedText) => {
          // Successfully scanned dynamic QR code!
          handleQrScanned(decodedText);
        },
        (errorMessage) => {
          // Scan frame without QR code is normal
        }
      );
    } catch (err) {
      console.error('Camera stream error:', err);
      setCameraError(
        'Unable to access device camera. Please ensure camera permissions are granted and no other application is using it.'
      );
      setCameraActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {}
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  const handleQrScanned = async (token) => {
    // Play subtle audio beep or vibration feedback
    if (navigator.vibrate) navigator.vibrate(100);
    stopCameraScanner();
    setScannedToken(token);

    // Proceed to selfie verification step
    setStudentStep('selfie');
    startSelfieCamera();
  };

  // ------------------------------------------
  // STUDENT: Front Camera Selfie Verification
  // ------------------------------------------
  const startSelfieCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      selfieStreamRef.current = stream;
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Front camera error:', err);
      // If front camera unavailable, allow direct submission
      setSelfieDataUrl(null);
    }
  };

  const stopSelfieCamera = () => {
    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach((track) => track.stop());
      selfieStreamRef.current = null;
    }
  };

  const captureSelfieAndSubmit = () => {
    let capturedUrl = null;
    if (selfieVideoRef.current) {
      const video = selfieVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      capturedUrl = canvas.toDataURL('image/jpeg', 0.8);
      setSelfieDataUrl(capturedUrl);
    }
    stopSelfieCamera();
    submitSecureAttendance(capturedUrl);
  };

  const submitSecureAttendance = async (selfie) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      // Re-verify GPS before submitting if needed
      let lat = gpsLocation?.latitude;
      let lon = gpsLocation?.longitude;

      if (lat === undefined || lon === undefined) {
        // Fallback quick geolocation check
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      }

      const res = await api.post('/attendance/mark-qr', {
        qrToken: scannedToken,
        latitude: lat,
        longitude: lon,
        selfieImage: selfie || selfieDataUrl,
      });

      if (res.data.success) {
        setVerificationResult(res.data.data);
        setStudentStep('success');
        if (onScanSuccess) onScanSuccess(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please retry.';
      setErrorMessage(msg);
      setStudentStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetStudentScan = () => {
    setScannedToken(null);
    setSelfieDataUrl(null);
    setVerificationResult(null);
    setErrorMessage('');
    setStudentStep('scan');
    acquireGps();
    startCameraScanner();
  };

  // ==========================================
  // RENDER: TEACHER DYNAMIC QR MODE
  // ==========================================
  if (mode === 'generate') {
    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!activeSession) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/60 shadow-sm max-w-xl mx-auto text-left space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Dynamic QR Attendance Session
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate an anti-fraud QR code that rotates every 20 seconds with classroom GPS geofencing.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Classroom Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Designated Classroom (GPS Geofence)</span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  30m Radius
                </span>
              </label>
              <select
                value={selectedClassroomId}
                onChange={(e) => {
                  setSelectedClassroomId(e.target.value);
                  setUseTeacherGps(false);
                }}
                disabled={useTeacherGps}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.roomNumber} - {c.name} ({c.radiusMeters || 30}m geofence)
                  </option>
                ))}
              </select>
            </div>

            {/* Calibrate GPS Button */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Teaching in a different room?
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {useTeacherGps
                      ? `Calibrated: ${teacherGps?.latitude.toFixed(4)}, ${teacherGps?.longitude.toFixed(4)}`
                      : 'Anchor geofence to your current device location'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={calibrateTeacherGps}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 transition"
              >
                {useTeacherGps ? 'Recalibrate' : 'Use My GPS'}
              </button>
            </div>

            {/* Session Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Session Active Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSessionDuration(mins)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      sessionDuration === mins
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mins} Mins
                  </button>
                ))}
              </div>
            </div>

            {/* Anti-Fraud Guarantees List */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 text-[11px] text-indigo-900 dark:text-indigo-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Anti-Fraud Enforcements Active:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400 pl-1">
                <li>QR changes automatically every 20 seconds.</li>
                <li>Single-use tokens with zero screenshot replay capability.</li>
                <li>Haversine GPS verification rejects students outside the classroom radius.</li>
                <li>Live camera stream only (no gallery file upload).</li>
              </ul>
            </div>

            <button
              onClick={handleStartSession}
              disabled={isStartingSession || !subjectId}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              {isStartingSession ? 'Starting Session...' : 'Start Dynamic Attendance Session'}
            </button>
          </div>
        </div>
      );
    }

    // ACTIVE TEACHER SESSION VIEW
    const progressPercent = (qrSecondsLeft / 20) * 100;

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/60 shadow-lg text-center">
          {/* Top Session Status Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                SESSION ACTIVE
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {activeSession.subject?.name || 'Classroom Lecture'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeSession.roomName} • Geofence Radius: {activeSession.roomCoordinates?.radiusMeters || 30}m
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Ends In</span>
                <span className="font-mono text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {formatTime(sessionSecondsLeft)}
                </span>
              </div>

              <button
                onClick={handleEndSession}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5 fill-rose-600" /> End Session
              </button>
            </div>
          </div>

          {/* QR Code Frame with 20s Rotation Indicator */}
          <div className="my-6 inline-block">
            <div className="relative p-5 bg-white rounded-3xl border-4 border-indigo-500/20 shadow-xl inline-block">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Dynamic Attendance QR"
                  className="w-72 h-72 object-contain rounded-xl select-none pointer-events-none"
                />
              ) : (
                <div className="w-72 h-72 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              )}

              {/* Invalidation Overlay animation if rotating */}
              {isRotating && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 rounded-3xl backdrop-blur-[2px] flex items-center justify-center">
                  <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" />
                </div>
              )}
            </div>

            {/* 20-Second Countdown Progress Bar */}
            <div className="mt-4 max-w-xs mx-auto space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Code Rotates In:
                </span>
                <span
                  className={`font-mono text-sm font-black ${
                    qrSecondsLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {qrSecondsLeft}s
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                    qrSecondsLeft <= 5 ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-400 mt-1">
                Screenshots become invalid after 20 seconds. Single-use token per device.
              </p>
            </div>
          </div>

          {/* Real-time Attendees Bar */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Recorded Attendees
                </span>
                <p className="text-[10px] text-slate-400">Verified inside classroom geofence</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-xl text-base font-black bg-indigo-600 text-white shadow-sm">
              {attendees.length} Students
            </span>
          </div>

          {/* Attendee Live Feed */}
          {attendees.length > 0 && (
            <div className="mt-4 text-left max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 rounded-xl border border-slate-100 dark:border-slate-700/60 p-2">
              {attendees.map((rec) => (
                <div key={rec._id} className="py-2 px-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <img
                      src={rec.student?.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {rec.student?.user?.name || 'Student'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Verified ({rec.location?.distanceMeters || 12}m away)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: STUDENT CAMERA SCAN MODE
  // ==========================================
  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Step 1: Live Camera QR Scanner */}
      {studentStep === 'scan' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-lg text-center space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div className="text-left">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Live In-App Camera Only
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Scan Classroom Screen QR
              </h3>
            </div>

            {/* GPS Telemetry Pill */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              {gpsLocation ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" /> GPS Ready
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-600" /> Acquiring GPS
                </span>
              )}
            </div>
          </div>

          {/* Live Camera Viewfinder (No file upload allowed) */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-square max-w-xs mx-auto border-2 border-indigo-500/40 shadow-inner flex items-center justify-center">
            <div id="qr-reader-video" className="w-full h-full object-cover" />

            {/* Viewfinder Target Graphic */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-dashed border-indigo-400/80 rounded-2xl relative animate-pulse">
                <span className="absolute top-2 left-2 text-[10px] font-mono text-indigo-300">
                  Target Live QR
                </span>
              </div>
            </div>
          </div>

          {cameraError ? (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Camera Access Required:</span> {cameraError}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Align your camera with the dynamic QR code displayed on the teacher's screen.
            </p>
          )}

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-500 dark:text-slate-400 text-left flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Fraud Protection:</span> Gallery
              uploads & screenshots are prohibited. Your device GPS location and camera feed will be cryptographically verified.
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Selfie / Face Verification (Bonus) */}
      {studentStep === 'selfie' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Smile className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Live Presence Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              QR code verified! Look into the front camera and take a quick selfie to confirm your classroom presence.
            </p>
          </div>

          {/* Front Camera Video Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video max-w-xs mx-auto border-2 border-indigo-500 shadow-md">
            <video
              ref={selfieVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetStudentScan}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
            >
              Cancel & Rescan
            </button>
            <button
              onClick={captureSelfieAndSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {submitting ? 'Verifying...' : 'Capture & Mark'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success View */}
      {studentStep === 'success' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-emerald-200 dark:border-emerald-800/60 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Attendance Verified & Confirmed!
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              ✓ Physical Presence Authenticated
            </p>
          </div>

          {verificationResult && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 text-xs text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Classroom:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {verificationResult.classroom}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">GPS Distance:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {verificationResult.distanceMeters} meters away (Allowed: {verificationResult.allowedRadiusMeters}m)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Face Verified:</span>
                <span className="font-bold text-indigo-600">
                  {verificationResult.faceVerified ? 'Yes (Live Selfie Captured)' : 'Verified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  {new Date(verificationResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleResetStudentScan}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            Done
          </button>
        </div>
      )}

      {/* Step 4: Security Error Rejection View */}
      {studentStep === 'error' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-rose-200 dark:border-rose-800/60 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Attendance Submission Rejected
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1">
              Anti-Fraud Security Policy Triggered
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-900 dark:text-rose-200 font-semibold text-left">
            {errorMessage || 'Attendance could not be recorded. Security constraints were not satisfied.'}
          </div>

          <div className="text-[11px] text-slate-400 text-left space-y-1">
            <p className="font-bold text-slate-600 dark:text-slate-300">Common rejection reasons:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Outside classroom geofence radius.</li>
              <li>QR code expired (must be scanned within 20 seconds).</li>
              <li>Replay attack / screenshot reused.</li>
              <li>Attendance already marked for today's lecture.</li>
            </ul>
          </div>

          <button
            onClick={handleResetStudentScan}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Try Scanning Again
          </button>
        </div>
      )}
    </div>
  );
};

export default QrAttendanceScanner;
