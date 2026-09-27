import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Search, Calendar, Phone } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

export const FAQPage: React.FC = () => {
  const { faqs, loading } = useClinic();
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 block mb-2">
            Patient Guide & Answers
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-3 max-w-2xl mx-auto">
            Find answers to common questions about consultations, appointment bookings, clinic timings, and visiting Priya Health Care in Singahi.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-700 shadow-2xs"
            />
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-sky-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading answers...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500">No questions found matching your query.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-sky-800 transition-colors"
                  >
                    <span className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                      <span>{faq.question}</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      <div className="pl-8">{faq.answer}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Banner */}
        <div className="bg-sky-900 rounded-3xl p-8 text-white text-center space-y-4 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold">Have a Question Not Answered Here?</h3>
          <p className="text-xs sm:text-sm text-sky-200 max-w-lg mx-auto">
            Our clinic reception is happy to assist with any questions regarding treatments, schedules, or directions.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/contact"
              className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Contact Reception
            </Link>
            <Link
              to="/appointments"
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
