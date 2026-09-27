import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const Footer: React.FC = () => {
  const { clinic, doctor, settings, isVerified } = useClinic();

  const phoneVerified = isVerified(clinic?.phone);
  const emailVerified = isVerified(clinic?.email);
  const addressVerified = isVerified(clinic?.address);
  const hoursVerified = isVerified(clinic?.opening_hours);

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-24 sm:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Clinic Brand & Intro */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-700 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                P
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  PRIYA HEALTH CARE
                </h3>
                <p className="text-xs text-cyan-400 font-medium">SINGAHI</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {settings?.tagline ||
                'Trusted Healthcare, With Care That Puts Patients First. Focused on personalized consultation, prevention, and compassionate care.'}
            </p>

            <div className="pt-2">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                <span className="text-slate-400 block font-medium">Consulting Physician:</span>
                <span className="text-white font-semibold text-sm">
                  {doctor?.name || 'Dr. Gultun Paswan'}
                </span>
                <span className="text-cyan-400 text-xs block mt-0.5">
                  {doctor?.designation || 'Doctor'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  About Priya Health Care
                </Link>
              </li>
              <li>
                <Link to="/doctor" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  Dr. Gultun Paswan
                </Link>
              </li>
              <li>
                <Link to="/facilities" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  Clinic Facilities
                </Link>
              </li>
              <li>
                <Link to="/appointments" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  Contact & Location
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinic Location & Hours */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Location & Hours
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                <div>
                  <span className="text-white font-medium block">Singahi Clinic</span>
                  {addressVerified ? (
                    <span className="text-slate-400 text-xs block mt-0.5">{clinic?.address}</span>
                  ) : (
                    <span className="text-slate-500 italic text-xs block mt-0.5">
                      Singahi, Uttar Pradesh [Verified street address will be updated soon]
                    </span>
                  )}
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
                <div>
                  <span className="text-white font-medium block">Consultation Hours</span>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    {settings?.working_days || 'Monday - Saturday'}
                  </span>
                  <span className="text-cyan-400 text-xs font-medium block">
                    {settings?.opening_time || '09:00 AM'} - {settings?.closing_time || '07:00 PM'}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact & Verification Notice */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Contact & Inquiries
            </h4>
            <div className="space-y-3 text-sm">
              {phoneVerified ? (
                <a
                  href={`tel:${clinic?.phone}`}
                  className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span>{clinic?.phone}</span>
                </a>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>Phone verification pending</span>
                </div>
              )}

              {emailVerified ? (
                <a
                  href={`mailto:${clinic?.email}`}
                  className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>{clinic?.email}</span>
                </a>
              ) : null}

              <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Accuracy Commitment
                </div>
                <p className="text-slate-400 leading-normal text-[11px]">
                  All doctor qualifications, clinic registration, and schedules are verified by the clinic administration before publication.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Medical Disclaimer */}
        <div className="py-6 border-b border-slate-800 text-xs text-slate-400 flex flex-col md:flex-row items-start md:items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="leading-relaxed">
            <strong className="text-amber-300">EMERGENCY NOTICE:</strong> Priya Health Care provides scheduled outpatient consultations and general health services. If you or a family member are experiencing a life-threatening medical emergency (such as severe chest pain, stroke symptoms, major trauma, or acute breathing difficulty), please proceed immediately to the nearest hospital casualty emergency department.
          </p>
        </div>

        {/* Bottom copyright & Legal */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Priya Health Care • Singahi. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
