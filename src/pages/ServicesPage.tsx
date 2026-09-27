import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Stethoscope, Sparkles, ArrowRight, Calendar } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { ServiceCard } from '../components/ServiceCard';

export const ServicesPage: React.FC = () => {
  const { services, loading } = useClinic();
  const [search, setSearch] = useState('');

  const filteredServices = services.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.short_description.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-2">
            Priya Health Care • Singahi
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Medical Services & Care Areas
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            Personalized outpatient consultations, preventive health evaluations, and continuous primary care led by Dr. Gultun Paswan.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search medical services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-700 shadow-2xs"
            />
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <p className="text-slate-500 text-sm">No services found matching "{search}".</p>
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-xs font-semibold text-sky-800 hover:underline"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {/* Bottom Booking Banner */}
        <div className="bg-sky-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold tracking-tight">Need a Medical Evaluation?</h3>
            <p className="text-xs sm:text-sm text-sky-200 max-w-xl">
              Book a consultation slot with Dr. Gultun Paswan at Priya Health Care in Singahi.
            </p>
          </div>

          <Link
            to="/appointments"
            className="px-6 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm transition-colors shrink-0 shadow-xs flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-slate-950" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
