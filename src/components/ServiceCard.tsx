import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Activity,
  HeartPulse,
  FileCheck2,
  Thermometer,
  ShieldPlus,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { ServiceData } from '../lib/api';

const ICON_MAP: Record<string, LucideIcon> = {
  Stethoscope,
  Activity,
  HeartPulse,
  FileCheck2,
  Thermometer,
  ShieldPlus,
};

export const ServiceCard: React.FC<{ service: ServiceData }> = ({ service }) => {
  const IconComponent = ICON_MAP[service.icon] || Stethoscope;

  return (
    <div className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5">
      <div>
        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center mb-4 group-hover:bg-sky-800 group-hover:text-white transition-colors">
          <IconComponent className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-sky-900 transition-colors">
          {service.title}
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
          {service.short_description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <Link
          to={`/services/${service.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 group-hover:text-sky-950 transition-colors"
        >
          <span>Learn More</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          to="/appointments"
          className="text-[11px] font-semibold text-slate-500 hover:text-cyan-700 bg-slate-50 hover:bg-cyan-50 px-2.5 py-1 rounded-md transition-colors"
        >
          Book This
        </Link>
      </div>
    </div>
  );
};
