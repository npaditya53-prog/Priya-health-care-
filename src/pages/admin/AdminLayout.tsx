import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  MessageSquare,
  Stethoscope,
  User,
  Building2,
  Settings,
  HelpCircle,
  Quote,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Protected route guard
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
    { name: 'Calendar View', path: '/admin/calendar', icon: CalendarDays },
    { name: 'Messages & Enquiries', path: '/admin/messages', icon: MessageSquare },
    { name: 'Medical Services', path: '/admin/services', icon: Stethoscope },
    { name: 'Doctor Profile', path: '/admin/doctor', icon: User },
    { name: 'Clinic Details', path: '/admin/clinic', icon: Building2 },
    { name: 'Schedule & Settings', path: '/admin/settings', icon: Settings },
    { name: 'FAQs Management', path: '/admin/faqs', icon: HelpCircle },
    { name: 'Testimonials', path: '/admin/testimonials', icon: Quote },
    { name: 'Security & Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck, adminOnly: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-black text-sm">
            P
          </div>
          <div>
            <span className="font-bold text-sm block leading-tight">Priya Health Care</span>
            <span className="text-[10px] text-cyan-400 font-semibold uppercase">Admin Panel</span>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                  P
                </div>
                <div>
                  <h1 className="font-extrabold text-white text-base tracking-tight leading-tight">
                    Priya Health Care
                  </h1>
                  <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                    Singahi Clinic Admin
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current user role card */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
              <div className="overflow-hidden">
                <span className="block text-xs font-semibold text-white truncate">
                  {user?.name || 'Administrator'}
                </span>
                <span className="block text-[10px] text-slate-400 truncate">
                  {user?.email}
                </span>
              </div>
              <span className="text-[10px] bg-cyan-900/60 text-cyan-300 border border-cyan-700 px-2 py-0.5 rounded font-bold uppercase">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== 'ADMIN') return null;

              const active = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                View Public Site
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};
