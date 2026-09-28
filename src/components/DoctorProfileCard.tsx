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
  FileText,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { VerifiedField } from './VerifiedNotice';

export const DoctorProfileCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { doctor, clinic, isVerified } = useClinic();
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const effectivePhoto = doctor?.image_url || doctor?.photo_base64;

  React.useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [effectivePhoto]);

  const bioVerified = isVerified(doctor?.bio);
  const qualVerified = isVerified(doctor?.qualifications);
  const expVerified = isVerified(doctor?.experience);
  const specVerified = isVerified(doctor?.specialties);
  const phoneVerified = isVerified(doctor?.phone);
  const photoVerified = isVerified(effectivePhoto);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Doctor Portrait / Professional Placeholder */}
          <div className="lg:col-span-4 flex flex-col items-center text-center">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-800 to-slate-900 border-4 border-slate-100 shadow-md flex items-center justify-center">
              {photoVerified && !imageError ? (
                <div className="relative w-full h-full">
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
                      <User className="w-10 h-10 text-slate-500" />
                    </div>
                  )}
                  <img
                    src={effectivePhoto!}
                    alt={doctor?.name || 'Dr. Gultun Paswan'}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                /* Verified placeholder: Do NOT fake identity */
                <div className="flex flex-col items-center justify-center p-4 text-sky-200">
                  <User className="w-20 h-20 text-sky-300/80 mb-2" />
                  <span className="text-xs font-semibold text-white">Dr. Gultun Paswan</span>
                  <span className="text-[11px] text-cyan-300 mt-1">Official Doctor Profile</span>
                </div>
              )}

              {/* Status tag */}
              <div className="absolute bottom-2 right-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 text-white px-2 py-0.5 text-[10px] font-bold shadow-xs">
                  <ShieldCheck className="w-3 h-3" />
                  Active
                </span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-slate-950">
                {doctor?.name || 'Dr. Gultun Paswan'}
              </h3>
              <p className="text-sm font-semibold text-cyan-700">
                {doctor?.designation || 'Doctor'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Priya Health Care • Singahi</p>
            </div>

            <div className="mt-5 w-full flex flex-col gap-2">
              <Link
                to="/appointments"
                className="w-full py-2.5 px-4 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Calendar className="w-4 h-4 text-cyan-300" />
                Book Consultation
              </Link>
              {!compact && (
                <Link
                  to="/doctor/dr-gultun-paswan"
                  className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center transition-colors"
                >
                  View Full Profile
                </Link>
              )}
            </div>
          </div>

          {/* Doctor Details & Strict Data Accuracy Block */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold mb-2">
                <span>Physician Overview</span>
              </div>
              <h4 className="text-2xl font-bold text-slate-900 tracking-tight">
                About Dr. Gultun Paswan
              </h4>

              <div className="mt-3 text-slate-600 leading-relaxed text-sm">
                {bioVerified ? (
                  <p className="whitespace-pre-line">{doctor?.bio}</p>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Professional Biography</span>
                      <p className="mt-0.5 text-amber-800">
                        Professional information will be updated soon. The clinic is in the process of verifying and publishing Dr. Gultun Paswan's detailed biographical profile.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid of Qualifications, Experience, and Specialties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Qualifications */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  <GraduationCap className="w-4 h-4 text-cyan-700" />
                  <span>Qualifications</span>
                </div>
                {qualVerified ? (
                  <p className="text-sm font-semibold text-slate-900">{doctor?.qualifications}</p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Professional qualifications will be updated soon.
                  </p>
                )}
              </div>

              {/* Experience */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  <Award className="w-4 h-4 text-cyan-700" />
                  <span>Clinical Experience</span>
                </div>
                {expVerified ? (
                  <p className="text-sm font-semibold text-slate-900">{doctor?.experience}</p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Clinical experience details will be updated soon.
                  </p>
                )}
              </div>

              {/* Medical Specialties */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 md:col-span-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  <Stethoscope className="w-4 h-4 text-cyan-700" />
                  <span>Practice Areas & Focus</span>
                </div>
                {specVerified ? (
                  <p className="text-sm font-semibold text-slate-900">{doctor?.specialties}</p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Clinical focus and specialty details will be updated soon.
                  </p>
                )}
              </div>
            </div>

            {/* Clinic Commitment */}
            <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-sky-800 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-900 block font-semibold mb-0.5">
                  Verified Outpatient Practice in Singahi
                </strong>
                Dr. Gultun Paswan consults patients at Priya Health Care, focusing on patient comfort, attentive listening, and structured treatment follow-up.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
