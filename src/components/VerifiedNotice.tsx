import React from 'react';
import { ShieldCheck, AlertCircle, Info, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface VerifiedFieldProps {
  label: string;
  value: string | null | undefined;
  fallbackText?: string;
  adminEditPath?: string;
  icon?: React.ReactNode;
  className?: string;
  showBadge?: boolean;
  href?: string;
  isVerified?: boolean;
}

export const VerifiedField: React.FC<VerifiedFieldProps> = ({
  label,
  value,
  fallbackText = 'Information will be updated soon once verified by clinic',
  adminEditPath = '/admin/clinic',
  icon,
  className = '',
  showBadge = true,
  href,
  isVerified: explicitVerified,
}) => {
  const { isAuthenticated } = useAuth();
  const isPlaceholder =
    explicitVerified !== undefined
      ? !explicitVerified
      : !value ||
        value.includes('[ADD VERIFIED INFORMATION]') ||
        value.toLowerCase().includes('pending verification') ||
        value.trim() === '';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        {showBadge && (
          <div>
            {!isPlaceholder ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-600/20 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-600/20 uppercase tracking-wider">
                <AlertCircle className="w-3 h-3" />
                PENDING VERIFICATION
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {!isPlaceholder ? (
          href ? (
            <a
              href={href}
              className="text-slate-800 font-medium text-base hover:text-sky-800 hover:underline transition-colors"
            >
              {value}
            </a>
          ) : (
            <span className="text-slate-800 font-medium text-base">{value}</span>
          )
        ) : (
          <span className="text-slate-400 italic text-sm">{fallbackText}</span>
        )}

        {isAuthenticated && (
          <Link
            to={adminEditPath}
            title="Edit this in Admin Panel"
            className="text-xs text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 font-medium bg-sky-50 px-2 py-1 rounded hover:bg-sky-100 transition-colors ml-2"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </Link>
        )}
      </div>
    </div>
  );
};

export const EducationalBadge: React.FC<{ text?: string }> = ({
  text = 'General Educational Medical Information',
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
      <Info className="w-3.5 h-3.5 text-sky-600" />
      <span>{text}</span>
    </div>
  );
};
