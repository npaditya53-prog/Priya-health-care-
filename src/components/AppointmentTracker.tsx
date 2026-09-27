import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api';

export const AppointmentTracker: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter your Appointment Number or registered phone number.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const res = await api.trackAppointment(query.trim());
    setLoading(false);

    if (res.success && res.data) {
      setResults(res.data);
    } else {
      setError(res.error?.message || 'No appointment found matching your query.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CONFIRMED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
            <XCircle className="w-3.5 h-3.5" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            PENDING CLINIC REVIEW
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 max-w-xl mx-auto mt-8">
      <h3 className="text-base font-bold text-slate-900 text-center">
        Track Existing Appointment
      </h3>
      <p className="text-xs text-slate-500 text-center mt-1">
        Enter your Appointment Number (e.g. 1) or 10-digit registered phone number.
      </p>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Enter Appointment Number or Phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-700"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Track</span>
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((r, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Appointment Number
                  </span>
                  <span className="font-mono font-extrabold text-base text-sky-950">
                    {r.appointmentNumber ? `${r.appointmentNumber}` : r.appointmentId}
                  </span>
                </div>
                {getStatusBadge(r.status)}
              </div>
              <div className="mt-2 text-xs text-slate-600 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block">Patient:</span>
                  <span className="font-medium text-slate-900">{r.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date & Time:</span>
                  <span className="font-medium text-slate-900">
                    {r.appointmentDate} at {r.appointmentTime}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
