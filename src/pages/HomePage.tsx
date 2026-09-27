import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle,
  HeartHandshake,
  Building2,
} from 'lucide-react';
import { Hero } from '../components/Hero';
import { QuickActions } from '../components/QuickActions';
import { useClinic } from '../context/ClinicContext';

export const HomePage: React.FC = () => {
  const { clinic, settings, isVerified } = useClinic();

  const phoneVerified = isVerified(clinic?.phone);
  const addressVerified = isVerified(clinic?.address);

  // Embedded map or directions link
  const googleMapsUrl =
    settings?.google_maps_url && settings.google_maps_url.trim().length > 0
      ? settings.google_maps_url
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Priya Health Care Singahi')}`;

  return (
    <div className="space-y-0">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. About Section */}
      <section className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-bold uppercase tracking-wider">
                <HeartHandshake className="w-3.5 h-3.5 text-cyan-600" />
                <span>Patient-Centered Philosophy</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                About Priya Health Care
              </h2>

              <p className="text-base text-slate-600 leading-relaxed">
                Priya Health Care is established in Singahi with a core mission: delivering dependable, patient-centered outpatient medical care. We believe that good medicine begins with attentive listening, clear explanations, and respectful patient communication.
              </p>

              <div className="space-y-3 pt-2 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dedicated Outpatient Care:</strong> Focused evaluations for acute ailments, routine checkups, and wellness guidance.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Local Accessibility in Singahi:</strong> Serving the local community with structured consultation timings.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Organized Appointments:</strong> Minimizing waiting room fatigue through scheduled appointments.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-sm transition-colors"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 text-cyan-300" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Priya Health Care Clinic</h3>
                    <p className="text-xs text-slate-500">Singahi, Uttar Pradesh</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Lead Physician:</span>
                    <span className="font-semibold text-slate-900 text-right">Dr. Gultun Paswan</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Working Schedule:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {settings?.working_days || 'Monday to Saturday'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Daily Timings:</span>
                    <span className="font-semibold text-cyan-800 text-right">
                      {settings?.opening_time || '09:00 AM'} - {settings?.closing_time || '07:00 PM'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Emergency Protocol:</span>
                    <span className="font-semibold text-amber-800 text-right">Outpatient Only / Refer Emergency</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-950">
                  <strong>Need medical advice?</strong> Request a consultation online or call the clinic during operating hours.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Directions Section */}
      <section className="pt-6 sm:pt-8 pb-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm -mt-2 sm:-mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-1">
                  Location & Map
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Find Priya Health Care in Singahi
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {addressVerified
                    ? clinic?.address
                    : 'Priya Health Care is located in Singahi. Please contact our reception for detailed landmark directions.'}
                </p>

                <div className="mt-6 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>Singahi, Uttar Pradesh</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>{settings?.working_days || 'Monday - Saturday'}: {settings?.opening_time || '09:00 AM'} - {settings?.closing_time || '07:00 PM'}</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-xs transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-cyan-300" />
                    <span>Get Directions on Google Maps</span>
                  </a>

                  <Link
                    to="/contact"
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Contact Info
                  </Link>
                </div>
              </div>

              {/* Map placeholder / preview */}
              <div className="h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative flex flex-col items-center justify-center p-6 text-center">
                <MapPin className="w-12 h-12 text-sky-800 mb-3" />
                <h3 className="text-base font-bold text-slate-900">Priya Health Care</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Singahi, Uttar Pradesh
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-4 py-2 rounded-lg bg-sky-800 text-white font-semibold text-xs shadow-xs hover:bg-sky-900 transition-colors"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
