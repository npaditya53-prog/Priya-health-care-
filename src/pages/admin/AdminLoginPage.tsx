import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowLeft, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogleAuth, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('npaditya53@gmail.com');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await login({ email, password });
    setLoading(false);

    if (res.success) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError(res.message || 'Invalid credentials. Please verify your email and password.');
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (data.success) {
        setSuccessMessage('Your new password has been set successfully! Logging in...');
        setPassword(newPassword);
        // Automatically log in with the new password
        setTimeout(async () => {
          const loginRes = await login({ email: email.trim(), password: newPassword.trim() });
          if (loginRes.success) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            setIsResetMode(false);
          }
        }, 1200);
      } else {
        setError(data.error?.message || 'Failed to update password. Please check your admin email.');
      }
    } catch {
      setLoading(false);
      setError('Network error occurred while setting new password.');
    }
  };

  const fillAdityaCredentials = () => {
    setEmail('npaditya53@gmail.com');
    setPassword('PriyaCare#2026');
  };

  const fillDefaultCredentials = () => {
    setEmail('admin@priyahealthcare.com');
    setPassword('PriyaCare#2026');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white/10">
            P
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Clinic Staff & Admin Portal
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-400 font-medium uppercase tracking-wider">
          Priya Health Care • Singahi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Mode Tabs: Login vs Set New Password */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                !isResetMode ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsResetMode(true);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                isResetMode ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Set New Password</span>
            </button>
          </div>

          {!isResetMode ? (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="admin@priyahealthcare.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setError(null);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Set New Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              </button>
            </form>
          ) : (
            /* Set New Password Form */
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-200 text-xs">
                Admin can set any new password here to login to Priya Health Care dashboard.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="npaditya53@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter your new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>{loading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
              </button>
            </form>
          )}

          {/* Primary Google Sign-In */}
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setError(null);
              setLoading(true);
              const res = await loginWithGoogleAuth();
              setLoading(false);
              if (res.success) {
                navigate('/admin/dashboard', { replace: true });
              } else {
                setError(res.message || 'Google sign-in failed. Please ensure popups are enabled.');
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer border border-slate-200"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Signing in with Google...' : 'Sign in with Google'}</span>
          </button>

          {/* Quick Info & Helper */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-400 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Admin Access: npaditya53@gmail.com</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Log in with <strong>Google</strong> or use email/password. You can set any new password you prefer using the tab above.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={fillAdityaCredentials}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 hover:bg-cyan-900 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Auto-fill npaditya53
              </button>
              <button
                type="button"
                onClick={fillDefaultCredentials}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Auto-fill admin@
              </button>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
