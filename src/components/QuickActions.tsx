import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Phone,
  MessageSquare,
  MapPin,
  ArrowUpRight,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { generateWhatsAppLink } from '../lib/whatsapp';

export const QuickActions: React.FC = () => {
  const { clinic, settings, isVerified } = useClinic();

  const phoneVerified = isVerified(clinic?.phone);
  const wa = generateWhatsAppLink(clinic?.whatsapp);

  // Maps URL from database setting, or google search fallback for Singahi
  const googleMapsUrl =
    settings?.google_maps_url && settings.google_maps_url.trim().length > 0
      ? settings.google_maps_url
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Priya Health Care Singahi')}`;

  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-1">
            Fast Access
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">
            How Can We Assist You Today?
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose an option below to schedule care or reach our Singahi clinic directly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Book Appointment */}
          <Link
            to="/appointments"
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-sky-900 to-sky-950 text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-cyan-300 mb-4 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white mb-1">
                Book Appointment
              </h3>
              <p className="text-xs text-sky-200 leading-relaxed">
                Schedule an outpatient consultation with Dr. Gultun Paswan.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-cyan-300 group-hover:text-white transition-colors">
              <span>Book Online</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>

          {/* 2. Call Clinic */}
          {phoneVerified ? (
            <a
              href={`tel:${clinic?.phone}`}
              className="group relative p-6 rounded-2xl bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 text-slate-900 shadow-xs hover:shadow-sm transition-all hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-800 mb-4 group-hover:scale-105 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-1">
                  Call Clinic
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Call our clinic reception directly for assistance and queries.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-sky-800 group-hover:text-sky-950 transition-colors">
                <span>{clinic?.phone}</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </a>
          ) : (
            <Link
              to="/contact"
              className="group relative p-6 rounded-2xl bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 text-slate-900 shadow-xs hover:shadow-sm transition-all hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-800 mb-4 group-hover:scale-105 transition-transform">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-1">
                  Call Clinic
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  View clinic contact channels and phone numbers in Singahi.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-sky-800 group-hover:text-sky-950 transition-colors">
                <span>Contact Details</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>
          )}

          {/* 3. WhatsApp */}
          <a
            href={wa.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-6 rounded-2xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300 text-slate-900 shadow-xs hover:shadow-sm transition-all hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-emerald-950 mb-1">
                WhatsApp
              </h3>
              <p className="text-xs text-emerald-800/80 leading-relaxed">
                Send an enquiry or ask appointment questions on WhatsApp.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:text-emerald-900 transition-colors">
              <span>Chat on WhatsApp</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </a>

          {/* 4. Get Directions */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-6 rounded-2xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-200 hover:border-cyan-300 text-slate-900 shadow-xs hover:shadow-sm transition-all hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-800 mb-4 group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-1">
                Get Directions
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Navigate to Priya Health Care in Singahi on Google Maps.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-cyan-800 group-hover:text-cyan-950 transition-colors">
              <span>Open Map</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};
