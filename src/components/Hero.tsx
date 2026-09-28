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
  Building2,
  MapPin,
  Stethoscope,
  Activity,
  Heart,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const Hero: React.FC = () => {
  const { doctor, clinic, settings } = useClinic();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 py-12 lg:py-20 border-b border-slate-200">
      {/* Subtle background radial glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-cyan-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-sky-100/50 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200/80 text-sky-900 text-xs font-bold tracking-wide uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>PRIYA HEALTH CARE • SINGAHI</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
              Trusted Healthcare, <br />
              <span className="text-sky-800">
                With Care That Puts Patients First.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Trusted Healthcare, With Care That Puts Patients First.
            </p>

            {/* Doctor Lead Badge - Interactive Doctor Card */}
            <Link
              to="/doctor/dr-gultun-paswan"
              className="group inline-flex items-center justify-between gap-4 p-3 pr-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all duration-200 cursor-pointer w-full sm:w-auto"
              aria-label="View Dr. Gultun Paswan profile"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-sky-100 text-sky-800 flex items-center justify-center font-bold group-hover:bg-sky-200 transition-colors shrink-0 border border-sky-200">
                  {doctor?.image_url ? (
                    <img
                      src={doctor.image_url}
                      alt={doctor.name || 'Dr. Gultun Paswan'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCheck className="w-5 h-5 text-sky-700" />
                  )}
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Lead Consulting Physician
                  </span>
                  <span className="block text-sm font-bold text-slate-900 group-hover:text-sky-900 transition-colors">
                    {doctor?.name || 'Dr. Gultun Paswan'}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-xs font-semibold text-sky-700 group-hover:text-cyan-700 transition-colors">
                <span>View Doctor Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/appointments"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-sm shadow-sm transition-all active:scale-98"
              >
                <Calendar className="w-4 h-4 text-cyan-300" />
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4 text-sky-300" />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all"
              >
                <Phone className="w-4 h-4 text-cyan-700" />
                <span>Contact Clinic</span>
              </Link>
            </div>

            {/* Highlights */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Personalized Care</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Singahi Location</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Structured Appointments</span>
              </div>
            </div>
          </div>

          {/* Right Column: Only on large desktop screens to maintain pristine mobile interface */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-7 sm:p-8 shadow-xl border border-sky-800/40 overflow-hidden">
              {/* Decorative background circle */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />

              <div className="relative space-y-6">
                {/* Clinic Portal Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-400 p-0.5 shadow-md flex items-center justify-center">
                      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-lg tracking-tight">
                        Priya Health Care
                      </h3>
                      <p className="text-xs text-cyan-300 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        Singahi, Uttar Pradesh
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    OPD Open Today
                  </span>
                </div>

                {/* Doctor Section inside Portal Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                      {doctor?.image_url ? (
                        <img
                          src={doctor.image_url}
                          alt={doctor.name || 'Dr. Gultun Paswan'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Stethoscope className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">
                          Consulting Doctor
                        </span>
                        <Link
                          to="/doctor/dr-gultun-paswan"
                          className="text-[11px] text-cyan-300 hover:text-white font-semibold flex items-center gap-0.5 transition-colors"
                        >
                          Profile <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <h4 className="text-base font-bold text-white truncate mt-0.5">
                        {doctor?.name || 'Dr. Gultun Paswan'}
                      </h4>
                      <p className="text-xs text-slate-300">
                        {doctor?.designation || 'Lead Consulting Physician'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timings and Clinic Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Consultation Hours</span>
                    </div>
                    <p className="font-semibold text-white">
                      {settings?.opening_time || '09:00 AM'} - {settings?.closing_time || '07:00 PM'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {settings?.working_days || 'Mon - Sat'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Care Service</span>
                    </div>
                    <p className="font-semibold text-white">Outpatient Care</p>
                    <p className="text-[11px] text-slate-400">Routine & Acute Checkups</p>
                  </div>
                </div>

                {/* Portal Features list */}
                <div className="space-y-2 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Scheduled appointments to avoid waiting room rush</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Verified doctor credentials & clinic details in Singahi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Direct phone and WhatsApp appointment support</span>
                  </div>
                </div>

                {/* Portal Card Action Buttons */}
                <div className="pt-2 flex gap-3">
                  <Link
                    to="/appointments"
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs text-center transition-all shadow-md active:scale-98"
                  >
                    Book OPD Slot
                  </Link>
                  <Link
                    to="/doctor/dr-gultun-paswan"
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs text-center transition-colors"
                  >
                    View Doctor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
