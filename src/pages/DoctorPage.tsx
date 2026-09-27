import React from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Award,
  Stethoscope,
  Calendar,
  Phone,
  ShieldCheck,
  AlertCircle,
  Clock,
  MapPin,
  Heart,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { DoctorProfileCard } from '../components/DoctorProfileCard';
import { EducationalBadge } from '../components/VerifiedNotice';

export const DoctorPage: React.FC = () => {
  const { doctor, clinic, settings, isVerified } = useClinic();

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-3">
            <EducationalBadge text="Verified Doctor Profile • Priya Health Care" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Dr. Gultun Paswan
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-2">
            Consulting Physician at Priya Health Care, Singahi
          </p>
        </div>

        {/* Doctor Card */}
        <DoctorProfileCard compact={false} />

        {/* Practice Philosophy */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Clinical Approach & Consultation Standard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-cyan-700" />
                Comprehensive Diagnosis
              </h3>
              <p className="text-xs leading-relaxed">
                Rather than treating isolated symptoms, Dr. Gultun Paswan evaluates underlying health drivers, family history, and lifestyle factors to deliver well-rounded clinical solutions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-700" />
                Dedicated Consultation Time
              </h3>
              <p className="text-xs leading-relaxed">
                Each consultation is conducted with adequate time to ensure you can ask questions, understand treatment rationales, and feel comfortable with your care plan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-700" />
                Follow-up & Continuity
              </h3>
              <p className="text-xs leading-relaxed">
                Continuous patient records enable seamless follow-up visits, medication adjustments, and therapy tracking as recovery progresses.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sky-950 text-base">
                Consult with Dr. Gultun Paswan in Singahi
              </h3>
              <p className="text-xs text-sky-800 mt-1">
                Consultation hours: {settings?.working_days || 'Monday to Saturday'}, {settings?.opening_time || '09:00 AM'} - {settings?.closing_time || '07:00 PM'}.
              </p>
            </div>

            <Link
              to="/appointments"
              className="px-5 py-2.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
            >
              Book Consultation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
