import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageSquare } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { generateWhatsAppLink } from '../lib/whatsapp';

export const MobileActionBar: React.FC = () => {
  const { clinic, isVerified } = useClinic();

  const phoneVerified = isVerified(clinic?.phone);
  const wa = generateWhatsAppLink(clinic?.whatsapp);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-2 px-3">
      <div className="grid grid-cols-2 gap-2">
        {/* CALL */}
        {phoneVerified ? (
          <a
            href={`tel:${clinic?.phone}`}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-800 transition-colors"
          >
            <Phone className="w-5 h-5 text-sky-800" />
            <span className="text-[11px] font-bold mt-1 tracking-wide">CALL</span>
          </a>
        ) : (
          <Link
            to="/contact"
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-800 transition-colors"
          >
            <Phone className="w-5 h-5 text-sky-800" />
            <span className="text-[11px] font-bold mt-1 tracking-wide">CALL</span>
          </Link>
        )}

        {/* WHATSAPP */}
        <a
          href={wa.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-emerald-50 active:bg-emerald-100 text-emerald-800 transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <span className="text-[11px] font-bold mt-1 tracking-wide">WHATSAPP</span>
        </a>
      </div>
    </div>
  );
};
