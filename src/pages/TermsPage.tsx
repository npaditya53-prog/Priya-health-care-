import React from 'react';
import { ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-2">
            Clinical Terms & Guidelines
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Nature of Website Services</h2>
            <p>
              The website of Priya Health Care (Singahi) is designed to provide informational content about our clinic, consulting physician Dr. Gultun Paswan, available outpatient services, and an interactive system to request consultation appointments.
            </p>
          </section>

          <section className="space-y-2 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            <h2 className="text-base font-bold text-amber-950 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              2. Medical Advice Disclaimer (No Emergency Services)
            </h2>
            <p className="mt-1 leading-relaxed">
              Information on this website is for general educational awareness and appointment coordination only. It does not constitute medical emergency triage. If you are experiencing a life-threatening acute condition, call local emergency services or visit the nearest hospital emergency room immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Appointment Requests & Confirmation</h2>
            <p>
              Submitting an online appointment request registers a tentative, pending slot. An appointment is only confirmed once verified by our clinic reception via call, SMS, or WhatsApp message. Priya Health Care reserves the right to reschedule consultation slots due to unforeseen clinical demands.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Cancellations & Rescheduling</h2>
            <p>
              If you are unable to attend your scheduled appointment, we kindly ask that you inform the clinic reception in advance so that your slot can be allocated to another waiting patient in Singahi.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
