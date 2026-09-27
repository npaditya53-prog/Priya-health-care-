import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { api } from '../lib/api';
import { generateWhatsAppLink } from '../lib/whatsapp';
import { VerifiedField } from '../components/VerifiedNotice';
import { syncContactMessageToFirestore } from '../lib/firebase';

export const ContactPage: React.FC = () => {
  const { clinic, settings, doctor, isVerified } = useClinic();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const phoneVerified = clinic?.phoneVerified ?? (isVerified(clinic?.phone) || true);
  const emailVerified = clinic?.emailVerified ?? (isVerified(clinic?.email) || true);
  const wa = generateWhatsAppLink(clinic?.whatsapp || '+918809743614');

  const googleMapsUrl =
    settings?.google_maps_url && settings.google_maps_url.trim().length > 0
      ? settings.google_maps_url
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Priya Health Care Singahi')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please provide your name.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!message.trim() || message.trim().length < 5) {
      setErrorMessage('Please enter your message or query.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.sendContact({
        name,
        phone,
        email: email.trim() || undefined,
        message,
      });

      if (res.success) {
        setSentSuccess(true);
        // Sync message to Firestore
        syncContactMessageToFirestore({
          name,
          phone,
          email: email.trim() || undefined,
          message,
        });
        setName('');
        setPhone('');
        setEmail('');
        setMessage('');
      } else {
        setErrorMessage(res.error?.message || 'Failed to submit enquiry. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-2">
            Singahi, Uttar Pradesh
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Contact Priya Health Care
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            Get in touch with our clinic reception for consultation schedules, appointments, or general healthcare enquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Clinic Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Clinic Information
              </h2>

              <div className="space-y-4 text-sm">
                <VerifiedField
                  label="Address"
                  value={clinic?.address}
                  fallbackText="Singahi, Uttar Pradesh [Detailed street address pending verification]"
                  icon={<MapPin className="w-4 h-4 text-cyan-700" />}
                />

                <VerifiedField
                  label="Phone Number"
                  value={clinic?.phone || '+91 8809743614'}
                  fallbackText="Phone number verification pending"
                  icon={<Phone className="w-4 h-4 text-cyan-700" />}
                  href={`tel:${(clinic?.phone || '+918809743614').replace(/\s+/g, '')}`}
                  isVerified={phoneVerified}
                />

                <VerifiedField
                  label="Email"
                  value={clinic?.email || 'yoonekaditya.ai@gmail.com'}
                  fallbackText="Email pending verification"
                  icon={<Mail className="w-4 h-4 text-cyan-700" />}
                  href={`mailto:${clinic?.email || 'yoonekaditya.ai@gmail.com'}`}
                  isVerified={emailVerified}
                />

                <VerifiedField
                  label="Consulting Doctor"
                  value={doctor?.name || 'Dr. Gultun Paswan'}
                  fallbackText="Dr. Gultun Paswan"
                />

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Consultation Hours
                  </span>
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Clock className="w-4 h-4 text-cyan-700 shrink-0" />
                    <span>
                      {settings?.working_days || 'Monday - Saturday'}: {settings?.opening_time || '09:00 AM'} - {settings?.closing_time || '07:00 PM'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                <a
                  href={`tel:${(clinic?.phone || '+918809743614').replace(/\s+/g, '')}`}
                  className="w-full py-3 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-sky-700" />
                  <span>Call {clinic?.phone || '+91 8809743614'}</span>
                </a>

                <a
                  href={wa.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </a>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-cyan-700" />
                  <span>Get Directions on Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Send Us a Message
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Fill out the form below and our staff will respond to your message promptly.
              </p>

              {sentSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="font-bold text-emerald-950 text-lg">Message Sent Successfully</h3>
                  <p className="text-xs sm:text-sm text-emerald-800">
                    Thank you for reaching out to Priya Health Care. We have received your enquiry and will be in touch soon.
                  </p>
                  <button
                    onClick={() => setSentSuccess(false)}
                    className="mt-2 text-xs font-semibold text-emerald-900 underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Message or Enquiry <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="How can Priya Health Care assist you?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:border-sky-700 focus:ring-2 focus:ring-sky-600/20 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-5 rounded-xl bg-sky-800 hover:bg-sky-900 disabled:bg-slate-300 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Enquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
