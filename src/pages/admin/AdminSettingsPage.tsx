import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Clock, CheckCircle2, AlertCircle, Calendar, ChevronLeft } from 'lucide-react';
import { api, SiteSettingsData } from '../../lib/api';
import { useClinic } from '../../context/ClinicContext';

export const AdminSettingsPage: React.FC = () => {
  const { reloadAll } = useClinic();

  const [formData, setFormData] = useState<Partial<SiteSettingsData>>({
    clinic_name: 'Priya Health Care',
    tagline: 'Trusted Healthcare, With Care That Puts Patients First.',
    working_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    opening_time: '09:00 AM',
    closing_time: '07:00 PM',
    appointment_duration: 20,
    buffer_time: 5,
    break_start: '01:00 PM',
    break_end: '02:00 PM',
    blocked_dates: '[]',
    seo_title: 'Priya Health Care | Dr. Gultun Paswan | Singahi',
    seo_description: 'Official healthcare website and appointment portal for Priya Health Care in Singahi led by Dr. Gultun Paswan.',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.success && res.data) {
        setFormData(res.data);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const res = await api.updateSettings(formData);
    setSaving(false);

    if (res.success && res.data) {
      setFeedback({ type: 'success', message: 'Settings saved successfully.' });
      reloadAll();
    } else {
      setFeedback({ type: 'error', message: res.error?.message || 'Failed to save settings.' });
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentWorkingDays = (formData.working_days || '').split(',').map((d) => d.trim());

  const toggleDay = (day: string) => {
    let list = [...currentWorkingDays];
    if (list.includes(day)) {
      list = list.filter((d) => d !== day);
    } else {
      list.push(day);
    }
    setFormData({ ...formData, working_days: list.join(',') });
  };

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
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Schedule & Clinic Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure working hours, slot intervals, and appointment calculation rules
        </p>
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

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Working Days */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Working Days of Week
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => {
                const active = currentWorkingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      active
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Opening Time
              </label>
              <input
                type="text"
                value={formData.opening_time || '09:00 AM'}
                onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Closing Time
              </label>
              <input
                type="text"
                value={formData.closing_time || '07:00 PM'}
                onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Lunch/Break Start
              </label>
              <input
                type="text"
                value={formData.break_start || '01:00 PM'}
                onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Lunch/Break End
              </label>
              <input
                type="text"
                value={formData.break_end || '02:00 PM'}
                onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Appointment Duration (Minutes)
              </label>
              <input
                type="number"
                min={10}
                max={60}
                value={formData.appointment_duration ?? 20}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    appointment_duration: parseInt(e.target.value, 10) || 20,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Time allocated per patient slot
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Blocked Dates (JSON array)
              </label>
              <input
                type="text"
                placeholder='["2026-10-02"]'
                value={formData.blocked_dates || '[]'}
                onChange={(e) => setFormData({ ...formData, blocked_dates: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-cyan-600 outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dates when clinic is closed (holidays/leave)
              </span>
            </div>
          </div>

          {/* Branding & SEO */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Branding & SEO</h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Clinic Tagline / Hero Subheading
              </label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={formData.seo_title || ''}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                SEO Meta Description
              </label>
              <textarea
                rows={2}
                value={formData.seo_description || ''}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
