import React from 'react';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const PrivacyPolicyPage: React.FC = () => {
  const { clinic, settings } = useClinic();

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-2">
            Legal & Patient Confidentiality
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Commitment to Patient Privacy</h2>
            <p>
              Priya Health Care ("we", "us", or "our") located in Singahi, Uttar Pradesh, is committed to safeguarding the privacy and confidentiality of personal and health data provided by patients and website visitors.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Information We Collect</h2>
            <p>
              When you use our online appointment booking system or contact form, we collect the following details:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Patient Full Name</li>
              <li>Phone Number (for booking verification and coordination)</li>
              <li>Email Address (optional, for digital confirmations)</li>
              <li>Preferred appointment date, time, and consultation reason</li>
              <li>Any optional message or health symptoms you submit</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Purpose of Processing</h2>
            <p>
              Your information is collected solely to schedule, confirm, and manage outpatient medical consultations with Dr. Gultun Paswan, as well as to address your queries. We do not sell, rent, or trade patient contact information to third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Medical Records Confidentiality</h2>
            <p>
              All clinical notes, diagnoses, and medical records generated during in-person consultations are governed by medical confidentiality and ethical standards. Access is restricted strictly to authorized clinic staff.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">5. Contact Us Regarding Your Data</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to update your records, please contact Priya Health Care at our Singahi clinic reception.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
