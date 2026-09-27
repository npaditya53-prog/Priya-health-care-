import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="text-center max-w-md bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
        <span className="text-4xl font-extrabold text-sky-800">404</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Page Not Found</h1>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          The medical page or resource you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-800 text-white font-semibold text-xs hover:bg-sky-900 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
};
