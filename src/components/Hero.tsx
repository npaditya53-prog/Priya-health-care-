import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Phone,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const Hero: React.FC = () => {
  const { doctor, settings } = useClinic();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 py-16 lg:py-24 border-b border-slate-200">
      {/* Subtle background radial glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-cyan-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-sky-100/50 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200/80 text-sky-900 text-xs font-bold tracking-wide uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>PRIYA HEALTH CARE • SINGAHI</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
            Trusted Healthcare, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-700 bg-clip-text text-transparent">
              With Care That Puts Patients First.
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            {settings?.tagline ||
              'Professional healthcare services with a focus on patient comfort, clear communication and compassionate care in Singahi, led by Dr. Gultun Paswan.'}
          </p>

          {/* Doctor Lead Badge - Interactive Doctor Card */}
          <Link
            to="/doctor/dr-gultun-paswan"
            className="group inline-flex items-center gap-3.5 p-3 sm:pr-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-sky-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            aria-label="View Dr. Gultun Paswan profile"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold group-hover:bg-sky-200 transition-colors shrink-0">
              <UserCheck className="w-5 h-5 text-sky-700" />
            </div>
            <div className="text-left">
              <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Lead Consulting Physician
              </span>
              <span className="block text-sm font-bold text-slate-900 group-hover:text-sky-900 transition-colors">
                {doctor?.name || 'Dr. Gultun Paswan'}
              </span>
            </div>
            <div className="pl-2 border-l border-slate-200 flex items-center text-xs font-semibold text-sky-700 group-hover:text-cyan-700 transition-colors">
              <span className="hidden sm:inline">View Doctor Profile</span>
              <span className="sm:hidden">View</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/appointments"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-base shadow-sm hover:shadow-md transition-all active:scale-98"
            >
              <Calendar className="w-5 h-5 text-cyan-300" />
              <span>Book Appointment</span>
              <ArrowRight className="w-4 h-4 text-sky-300" />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base transition-all"
            >
              <Phone className="w-4 h-4 text-cyan-700" />
              <span>Contact Clinic</span>
            </Link>
          </div>

          {/* Highlights */}
          <div className="pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Personalized Care</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Singahi Location</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Structured Appointments</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
