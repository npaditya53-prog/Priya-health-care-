import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Heart,
  Users,
  Compass,
  CheckCircle2,
  Calendar,
  Phone,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const AboutPage: React.FC = () => {
  const { doctor, clinic, settings, isVerified } = useClinic();

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-2">
            Singahi • Healthcare Excellence
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            About Priya Health Care
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            A patient-focused clinic in Singahi dedicated to high standards of outpatient consultation, wellness assessment, and compassionate clinical dialogue.
          </p>
        </div>

        {/* Narrative Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 lg:p-16 shadow-sm mb-12 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Our Medical Mission in Singahi
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Priya Health Care was founded with a singular purpose: providing the residents of Singahi with accessible, attentive, and reliable primary health consultations.
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Led by <strong>{doctor?.name || 'Dr. Gultun Paswan'}</strong>, the clinic operates on the conviction that healing begins with understanding. Every patient receives attentive time to explain their concerns, understand their diagnoses, and participate actively in their care decisions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2">
                <Heart className="w-8 h-8 text-sky-800" />
                <h3 className="font-bold text-slate-900 text-base">Compassionate Care</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Treating every patient with dignity, patience, and empathetic care.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-cyan-50/70 border border-cyan-100 space-y-2">
                <ShieldCheck className="w-8 h-8 text-cyan-800" />
                <h3 className="font-bold text-slate-900 text-base">Clear Guidance</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Transparent clinical advice without medical jargon or rushed appointments.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                <Users className="w-8 h-8 text-emerald-800" />
                <h3 className="font-bold text-slate-900 text-base">Community Focus</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Rooted in Singahi, dedicated to family wellness and continuity of care.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                <Compass className="w-8 h-8 text-indigo-800" />
                <h3 className="font-bold text-slate-900 text-base">Prevention First</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Focusing on routine health screening before chronic illnesses develop.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Core Values */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">
              Our Clinical Standards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 text-base mb-2">1. Patient Communication</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We believe patients should thoroughly understand why a test is advised or what a medication does. Dr. Gultun Paswan ensures open dialogue during every visit.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 text-base mb-2">2. Respect for Patient Time</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our organized appointment system is designed to minimize excessive waiting room congestion while giving adequate consultation time to each scheduled individual.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 text-base mb-2">3. Ethical Clinical Practice</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We adhere strictly to professional medical guidelines, prioritizing patient well-being, rational prescribing, and proper referral when secondary hospital care is needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-sky-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-4">
          <h3 className="text-2xl font-bold">Have Questions or Need a Consultation?</h3>
          <p className="text-sm text-sky-200 max-w-xl mx-auto">
            Reach out to Priya Health Care in Singahi or request your consultation date online.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/appointments"
              className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm shadow-xs transition-colors"
            >
              Book Appointment
            </Link>
            <Link
              to="/doctor"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors"
            >
              Doctor Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
