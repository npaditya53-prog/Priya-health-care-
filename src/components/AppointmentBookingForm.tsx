import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api, ServiceData } from '../lib/api';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { syncAppointmentToFirestore } from '../lib/firebase';

export const AppointmentBookingForm: React.FC = () => {
  const { services, clinic, settings, doctor } = useClinic();
  const { firebaseUser, loginWithGoogleAuth } = useAuth();

  // Form inputs
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  // If firebaseUser is available and fields are empty, prefill
  useEffect(() => {
    if (firebaseUser) {
      if (!patientName && firebaseUser.displayName) {
        setPatientName(firebaseUser.displayName);
      }
      if (!email && firebaseUser.email) {
        setEmail(firebaseUser.email);
      }
    }
  }, [firebaseUser]);

  const handleGoogleAutofill = async () => {
    setGoogleAuthLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginWithGoogleAuth();
      if (!res.success) {
        setErrorMessage(res.message || 'Google sign-in could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in error.');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  // Slots loading & availability state
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    appointmentId: string;
    appointmentNumber: number;
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    message: string;
  } | null>(null);

  const [copiedNumber, setCopiedNumber] = useState(false);

  // Minimum date is today
  const today = new Date().toISOString().split('T')[0];

  // Maximum date is 30 days from today
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // When date changes, fetch available time slots from server
  useEffect(() => {
    if (!appointmentDate) {
      setSlots([]);
      setSlotMessage(null);
      return;
    }

    let active = true;
    setSlotsLoading(true);
    setAppointmentTime('');
    setSlotMessage(null);

    api.getSlots(appointmentDate).then((res) => {
      if (!active) return;
      setSlotsLoading(false);
      if (res.success && res.data) {
        if (!res.data.isWorkingDay) {
          setSlotMessage('The clinic is closed on this day of the week. Please choose another date.');
          setSlots([]);
        } else if (res.data.isBlocked) {
          setSlotMessage('This date is currently blocked for consultations. Please select another date.');
          setSlots([]);
        } else if (res.data.slots.length === 0) {
          setSlotMessage('All appointment slots for this date are fully booked.');
          setSlots([]);
        } else {
          setSlots(res.data.slots);
        }
      } else {
        setSlotMessage(res.error?.message || 'Unable to load available slots.');
      }
    });

    return () => {
      active = false;
    };
  }, [appointmentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!patientName.trim() || patientName.trim().length < 2) {
      setErrorMessage('Please enter the patient full name.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!appointmentDate) {
      setErrorMessage('Please select an appointment date.');
      return;
    }

    if (!appointmentTime) {
      setErrorMessage('Please select a preferred time slot.');
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMessage('Please specify the reason for your visit.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.createAppointment({
        patientName,
        phone,
        email: email.trim() || undefined,
        appointmentDate,
        appointmentTime,
        reason,
        message: message.trim() || undefined,
      });

      if (res.success && res.data) {
        setSuccessData(res.data);
        // Sync appointment to Firebase Firestore
        syncAppointmentToFirestore({
          appointmentId: res.data.appointmentId,
          appointmentNumber: res.data.appointmentNumber,
          patientName,
          phone,
          email: email.trim() || undefined,
          appointmentDate,
          appointmentTime,
          reason,
          message: message.trim() || undefined,
          status: 'PENDING',
        });
      } else {
        setErrorMessage(res.error?.message || 'Failed to submit appointment. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please contact the clinic.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAppointmentNumber = () => {
    if (successData?.appointmentNumber !== undefined) {
      navigator.clipboard.writeText(String(successData.appointmentNumber));
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2500);
    }
  };

  const resetForm = () => {
    setPatientName('');
    setPhone('');
    setEmail('');
    setAppointmentDate('');
    setAppointmentTime('');
    setReason('');
    setMessage('');
    setSuccessData(null);
    setErrorMessage(null);
  };

  // SUCCESS CONFIRMATION STATE
  if (successData) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold ring-1 ring-amber-600/20 mb-3">
          Status: PENDING CLINIC CONFIRMATION
        </span>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
          APPOINTMENT BOOKED SUCCESSFULLY
        </h3>

        <div className="mt-2 space-y-1">
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            Your appointment request has been recorded successfully.
          </p>
          <p className="text-sm sm:text-base font-semibold text-slate-800">
            Your Appointment Number is{' '}
            <span className="font-mono font-bold text-sky-950 px-2 py-0.5 bg-sky-50 rounded-md border border-sky-200">
              {successData.appointmentNumber}
            </span>
          </p>
        </div>

        {/* Appointment Number Card */}
        <div className="my-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                APPOINTMENT NUMBER
              </span>
              <p className="text-3xl font-mono font-extrabold text-sky-950 mt-0.5">
                {successData.appointmentNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={copyAppointmentNumber}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              {copiedNumber ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copiedNumber ? 'Copied' : 'Copy Number'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Patient Name:</span>
              <span className="font-semibold text-slate-900 text-sm">{successData.patientName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Doctor:</span>
              <span className="font-semibold text-slate-900 text-sm">{doctor?.name || 'Dr. Gultun Paswan'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Requested Date:</span>
              <span className="font-semibold text-slate-900 text-sm">{successData.appointmentDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Requested Time Slot:</span>
              <span className="font-semibold text-slate-900 text-sm">{successData.appointmentTime}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer"
          >
            Book Another Appointment
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-6 italic">
          * Please remember your Appointment Number ({successData.appointmentNumber}). You can use it anytime on our website to check your consultation status.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 sm:p-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              Outpatient Consultation Booking
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              Request an Appointment
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Please complete the form below. Submitting will register a <strong className="text-slate-700">PENDING</strong> request. Our clinic staff will review and contact you to confirm your consultation.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Please resolve the following:</strong>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Google Sign-in / Autofill Section */}
          <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {firebaseUser ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white">
                  {firebaseUser.displayName ? firebaseUser.displayName.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      Signed in as {firebaseUser.displayName || 'Google User'}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">{firebaseUser.email}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div className="text-xs text-slate-700">
                  <span className="font-semibold block">Book faster with Google</span>
                  <span className="text-[11px] text-slate-500">Auto-fills your name and email instantly</span>
                </div>
              </div>
            )}

            {!firebaseUser && (
              <button
                type="button"
                disabled={googleAuthLoading}
                onClick={handleGoogleAutofill}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                {googleAuthLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign in with Google</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </>
                )}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Patient Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* 2. Phone and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  We will call this number to confirm the booking.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Receive confirmation and receipt by email.
                </span>
              </div>
            </div>

            {/* 3. Preferred Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Consultation Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  min={today}
                  max={maxDate}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 text-sm text-slate-900 bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* 4. Preferred Time Slot */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Time Slot <span className="text-red-500">*</span>
              </label>

              {!appointmentDate ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center">
                  Please select an appointment date above to view available time slots.
                </div>
              ) : slotsLoading ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-sky-800 border-t-transparent rounded-full animate-spin" />
                  <span>Loading available doctor slots...</span>
                </div>
              ) : slotMessage ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center">
                  {slotMessage}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((s) => {
                    const isSelected = appointmentTime === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAppointmentTime(s)}
                        className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-sky-800 border-sky-800 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Reason for Visit */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Reason for Visit <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. General checkup, Fever, Blood pressure consultation, Follow-up"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {services.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setReason(srv.title)}
                    className="text-[11px] bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-900 px-2.5 py-1 rounded-md transition-colors"
                  >
                    {srv.title}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Additional Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Additional Notes / Past History <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Mention any symptoms, ongoing medications, or specific requests..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 text-sm text-slate-900 bg-white placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            {/* Clarification Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-800 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy & Booking Notice:</strong> Your information is used solely for clinical scheduling at Priya Health Care, Singahi. Submitting this form requests a slot; confirmation is given after clinic reception review.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-xl bg-sky-800 hover:bg-sky-900 disabled:bg-slate-300 text-white font-bold text-base shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <span>Submit Appointment Request</span>
                  <ArrowRight className="w-4 h-4 text-cyan-300" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
