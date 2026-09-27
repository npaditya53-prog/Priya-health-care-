import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  HeartPulse,
  DoorClosed,
  FileSpreadsheet,
  Accessibility,
  Flame,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const FacilitiesPage: React.FC = () => {
  const { clinic, settings } = useClinic();

  const facilitiesList = [
    {
      icon: DoorClosed,
      title: 'Private Doctor Consultation Room',
      description:
        'A quiet, private examination room where patients can discuss sensitive medical matters and symptoms with Dr. Gultun Paswan in total confidentiality.',
    },
    {
      icon: Sparkles,
      title: 'Hygienic & Ventilated Waiting Area',
      description:
        'A clean, comfortable seating lounge maintained with regular sanitization, adequate ventilation, and drinking water for visiting families.',
    },
    {
      icon: HeartPulse,
      title: 'Clinical Vital Assessment Station',
      description:
        'Accurate baseline measurement equipment for blood pressure, pulse rate, oxygen saturation (SpO2), body temperature, and weight tracking.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Digital Scheduling & Records',
      description:
        'Modern appointment queue and record archiving ensuring that past consultation notes and follow-up plans are readily accessible.',
    },
    {
      icon: Accessibility,
      title: 'Ground-Level Access',
      description:
        'Accessible ground-floor clinic layout designed to accommodate elderly patients and individuals with restricted mobility comfortably.',
    },
    {
      icon: ShieldCheck,
      title: 'Strict Infection Prevention Protocol',
      description:
        'Adherence to standard clinical hygiene, single-use examination sheets, disposable consumables, and medical waste disposal guidelines.',
    },
  ];

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-2">
            Singahi • Clinic Environment
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Clinic Facilities & Amenities
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
            At Priya Health Care, we maintain a calm, hygienic, and organized clinic environment tailored for reliable outpatient healthcare delivery.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilitiesList.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-cyan-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  <span>Verified Standard</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Emergency clarification notice */}
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto">
          <strong className="block text-amber-900 font-bold mb-1">
            Clinical Scope Reminder:
          </strong>
          Priya Health Care provides outpatient (OPD) clinical consultations, preventive screenings, and routine illness management. Our facility is not an inpatient casualty hospital. For trauma, severe accidents, acute surgical emergencies, or critical care requirements, please seek immediate emergency transport to a tertiary hospital.
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <Link
            to="/appointments"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <Calendar className="w-4 h-4 text-cyan-300" />
            <span>Book Consultation at Priya Health Care</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
