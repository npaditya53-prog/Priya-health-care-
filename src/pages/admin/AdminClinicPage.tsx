import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  MessageSquare,
  Navigation,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { api, ClinicData } from '../../lib/api';
import { useClinic } from '../../context/ClinicContext';

export const AdminClinicPage: React.FC = () => {
  const { reloadAll } = useClinic();

  const [formData, setFormData] = useState<Partial<ClinicData>>({
    name: 'Priya Health Care',
    address: 'Main Market Road, Near Singahi Post Office',
    city: 'Singahi',
    state: 'Uttar Pradesh',
    pincode: '262905',
    phone: '+918809743614',
    whatsapp: '+918809743614',
    email: 'yoonekaditya.ai@gmail.com',
    opening_hours: 'Monday to Saturday: 09:00 AM - 07:00 PM',
    google_maps_url: '',
    phoneVerified: true,
    emailVerified: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    api.getClinic().then((res) => {
      setLoading(false);
      if (res.success && res.data) {
        setFormData((prev) => ({
          ...prev,
          ...res.data,
          phone: res.data?.phone || '+918809743614',
          whatsapp: res.data?.whatsapp || '+918809743614',
          email: res.data?.email || 'yoonekaditya.ai@gmail.com',
          phoneVerified: res.data?.phoneVerified ?? true,
          emailVerified: res.data?.emailVerified ?? true,
        }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const res = await api.updateClinic(formData);
    setSaving(false);

    if (res.success && res.data) {
      setFeedback({ type: 'success', message: 'Clinic details and consultation hours updated successfully!' });
      reloadAll();
    } else {
      setFeedback({ type: 'error', message: res.error?.message || 'Failed to update clinic info.' });
    }
  };

  const cleanPhone = (formData.phone || '').replace(/[^0-9]/g, '');
  const cleanWhatsApp = (formData.whatsapp || formData.phone || '').replace(/[^0-9]/g, '');
  const isPhoneVerified = formData.phoneVerified ?? true;
  const isEmailVerified = formData.emailVerified ?? true;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Return to Dashboard Navigation */}
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-cyan-700 transition-colors mb-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Clinic Details & Location
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage verified Singahi clinic address, consultation hours, contacts, and Google Maps integration
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Verified Contact Channels & Quick Test Actions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider block">
              Active Communication Channels
            </span>
            <span className="text-xs text-slate-500">
              Direct patient contact buttons used on the public website
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${formData.phone || '+918809743614'}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>

            <a
              href={`https://wa.me/${cleanWhatsApp || '918809743614'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={formData.google_maps_url || 'https://maps.google.com/?q=Singahi+Uttar+Pradesh'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-700" />
              <span>Get Directions</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Primary Phone</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{formData.phone || '+918809743614'}</span>
            </div>
            {isPhoneVerified && (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block font-semibold text-[11px]">Clinic Email</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{formData.email || 'yoonekaditya.ai@gmail.com'}</span>
            </div>
            {isEmailVerified && (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Clinic Details Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Clinic Name *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                City / Location *
              </label>
              <input
                type="text"
                required
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Physical Address
            </label>
            <input
              type="text"
              placeholder="e.g. Main Market Road, Near Singahi Post Office, Singahi, Uttar Pradesh"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Postal PIN Code
              </label>
              <input
                type="text"
                value={formData.pincode || ''}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Clinic Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="+918809743614"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Verified WhatsApp Number
              </label>
              <input
                type="text"
                placeholder="+918809743614"
                value={formData.whatsapp || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Clinic Email *
              </label>
              <input
                type="email"
                required
                placeholder="yoonekaditya.ai@gmail.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          {/* Consultation Hours */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Consultation Hours Display
            </label>
            <input
              type="text"
              placeholder="Monday to Saturday: 09:00 AM - 07:00 PM"
              value={formData.opening_hours || ''}
              onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Displayed on contact cards and footer across the website. Detailed slot rules can be tuned under Schedule & Duration.
            </span>
          </div>

          {/* Google Maps Location */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Google Maps URL / Location Link
            </label>
            <input
              type="url"
              placeholder="https://maps.google.com/..."
              value={formData.google_maps_url || ''}
              onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none font-mono"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Clinic Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AdminClinicPage;
