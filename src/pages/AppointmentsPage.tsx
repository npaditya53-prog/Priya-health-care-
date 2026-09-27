import React from 'react';
import { AppointmentBookingForm } from '../components/AppointmentBookingForm';
import { AppointmentTracker } from '../components/AppointmentTracker';
import { Clock, ShieldAlert, CheckCircle2, Phone } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const AppointmentsPage: React.FC = () => {
  const { clinic, settings, isVerified } = useClinic();
  const phoneVerified = isVerified(clinic?.phone);

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-2">
            Online Scheduling
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Appointment Booking & Tracking
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            Request an outpatient consultation with Dr. Gultun Paswan at Priya Health Care in Singahi, or track an existing booking.
          </p>
        </div>

        {/* Appointment Booking Form */}
        <AppointmentBookingForm />

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
              <Clock className="w-4 h-4 text-cyan-700" />
              <span>Consultation Timings</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {settings?.working_days || 'Monday - Saturday'}: {settings?.opening_time || '09:00 AM'} to {settings?.closing_time || '07:00 PM'}.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-700" />
              <span>Confirmation Call</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Our clinic receptionist will call or message your registered phone number to confirm your allocated time.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Emergency Disclaimer</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              For sudden, life-threatening symptoms, please proceed immediately to an emergency hospital casualty unit.
            </p>
          </div>
        </div>

        {/* Track existing appointment */}
        <div className="pt-4 border-t border-slate-200">
          <AppointmentTracker />
        </div>
      </div>
    </div>
  );
};
