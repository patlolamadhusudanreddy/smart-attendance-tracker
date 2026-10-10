import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)

  const inputRefs = useRef([]);
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Focus on first OTP input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Update email if query param changes
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // 5-minute countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Take the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance to next box if not the last
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // If Backspace and current box is empty, jump to previous box
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    const otpCode = otp.join('').trim();
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email.trim(), otpCode);
      if (res.success) {
        setSuccessMsg('Email verified successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          const role = res.user.role;
          if (role === 'admin') navigate('/admin/dashboard', { replace: true });
          else if (role === 'teacher') navigate('/teacher/dashboard', { replace: true });
          else navigate('/student/dashboard', { replace: true });
        }, 1200);
      } else {
        setError(res.message || 'OTP verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Verify OTP API Error:', err);
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        'Invalid or expired OTP code. Please check your email or click Resend.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address to receive a new OTP.');
      return;
    }

    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/resend-otp', {
        email: email.trim(),
        type: 'registration',
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || 'A fresh 6-digit OTP code has been dispatched to your email.');
        setTimeLeft(300); // Reset timer to 5 minutes
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Resend OTP Error:', err);
      const msg = err.response?.data?.message || 'Failed to resend OTP. Check your SMTP settings in .env.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700 p-8 sm:p-10 transition-all text-center">
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl mx-auto mb-4 border border-indigo-200 dark:border-indigo-800 shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Verify Your Email
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
          We have sent a 6-digit verification code to
          <br />
          <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm break-all">
            {email || 'your email address'}
          </strong>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 text-left">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email input field if not in URL */}
          {!emailParam && (
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@smartattendance.edu"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* 6 Digit Input Boxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 text-left">
              Enter 6-Digit Code:
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-all shadow-inner"
                />
              ))}
            </div>
          </div>

          {/* Countdown & Resend Button */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              Expires in:{' '}
              <strong
                className={`font-mono text-sm ${
                  timeLeft < 60 ? 'text-rose-600 dark:text-rose-400 font-bold animate-pulse' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {formatTime(timeLeft)}
              </strong>
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || timeLeft > 270}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
              </>
            ) : (
              <>
                Verify OTP & Activate Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Registered with the wrong email?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Register again
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
