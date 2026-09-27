import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Stethoscope,
  Activity,
  HeartPulse,
  FileCheck2,
  Thermometer,
  ShieldPlus,
  Clock,
  MapPin,
  Share2,
} from 'lucide-react';
import { api, ServiceData } from '../lib/api';
import { useClinic } from '../context/ClinicContext';

export const ServiceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { doctor, clinic, settings } = useClinic();

  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getServiceBySlug(slug).then((res) => {
      setLoading(false);
      if (res.success && res.data) {
        setService(res.data);
      } else {
        setError('Service not found or inactive.');
      }
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-sky-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading service details...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Service Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">
          The requested service page does not exist or may have been updated.
        </p>
        <Link
          to="/services"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-800 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to All Services</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 hover:text-sky-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Services</span>
        </Link>

        {/* Main Service Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-bold uppercase tracking-wider mb-3">
              <span>Medical Service • Outpatient</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              {service.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 mt-3 leading-relaxed">
              {service.short_description}
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Detailed Description */}
          <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
            <h2 className="text-xl font-bold text-slate-900 not-prose">
              Clinical Overview & What to Expect
            </h2>
            <p>{service.description}</p>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs font-bold text-slate-900 block">
                  Lead Consulting Physician
                </strong>
                <span className="text-xs text-slate-600">
                  {doctor?.name || 'Dr. Gultun Paswan'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <Clock className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs font-bold text-slate-900 block">
                  Consultation Duration
                </strong>
                <span className="text-xs text-slate-600">
                  Approx. {settings?.appointment_duration || 20} minutes dedicated time
                </span>
              </div>
            </div>
          </div>

          {/* Direct CTA */}
          <div className="p-6 rounded-2xl bg-sky-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">Interested in this service?</h3>
              <p className="text-xs text-sky-200 mt-0.5">
                Book an appointment slot with Dr. Gultun Paswan at Priya Health Care, Singahi.
              </p>
            </div>

            <Link
              to="/appointments"
              className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shrink-0 shadow-xs flex items-center gap-2 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-950" />
              <span>Book Appointment</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
