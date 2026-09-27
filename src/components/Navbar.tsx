import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Phone,
  Calendar,
  ShieldAlert,
  Clock,
  MapPin,
  Lock,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { clinic, settings, isVerified } = useClinic();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Dr. Gultun Paswan', path: '/doctor/dr-gultun-paswan' },
    { name: 'Services', path: '/services' },
    { name: 'Facilities', path: '/facilities' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  const phoneVerified = isVerified(clinic?.phone);
  const addressVerified = isVerified(clinic?.address);

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-200">
      {/* Top Notification / Micro Bar */}
      <div className="bg-sky-950 text-sky-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Singahi, Uttar Pradesh</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-sky-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{settings?.opening_time || '09:00 AM'} - {settings?.closing_time || '07:00 PM'}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <span className="hidden md:inline-flex items-center gap-1 text-sky-200 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Emergency: Visit nearest emergency room immediately</span>
            </span>
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-0.5 rounded text-xs font-medium transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin ({user?.name ? user.name.split(' ')[0] : user?.role})</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-sky-300 hover:text-white transition-colors text-[11px] cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="text-sky-300 hover:text-white transition-colors text-[11px] inline-flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                <span>Google / Staff Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <nav
        className={`w-full bg-white/95 backdrop-blur-md transition-shadow duration-200 border-b border-slate-200 ${
          scrolled ? 'shadow-md py-2.5' : 'py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-800 to-sky-950 flex items-center justify-center text-white font-bold text-xl shadow-inner ring-2 ring-cyan-500/30">
              P
            </div>
            <div>
              <span className="block font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 leading-tight group-hover:text-sky-800 transition-colors">
                PRIYA HEALTH CARE
              </span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-cyan-700">
                SINGAHI • DR. GULTUN PASWAN
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'text-sky-800 bg-sky-50 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-98"
            >
              <span>Book Appointment</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              to="/appointments"
              className="p-2 rounded-lg bg-sky-800 text-white"
              aria-label="Book appointment"
            >
              <Calendar className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      active
                        ? 'bg-sky-50 text-sky-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                to="/appointments"
                className="w-full text-center py-3 rounded-xl bg-sky-800 text-white font-semibold text-base shadow-sm flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Book Appointment
              </Link>
              {phoneVerified && (
                <a
                  href={`tel:${clinic?.phone}`}
                  className="w-full text-center py-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-base flex items-center justify-center gap-2 hover:bg-slate-50"
                >
                  <Phone className="w-4 h-4 text-cyan-600" />
                  Call Clinic
                </a>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
