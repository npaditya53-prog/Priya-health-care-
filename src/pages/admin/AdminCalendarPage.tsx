import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api, AppointmentData } from '../../lib/api';

export const AdminCalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDayAppointments = async (date: string) => {
    setLoading(true);
    const res = await api.getAppointments({ date, limit: 100 });
    setLoading(false);
    if (res.success && res.data) {
      // Sort appointments by time
      setAppointments(res.data.appointments);
    }
  };

  useEffect(() => {
    fetchDayAppointments(selectedDate);
  }, [selectedDate]);

  const changeDay = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">CONFIRMED</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">PENDING</span>;
      case 'COMPLETED':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">CANCELLED</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const formattedHeaderDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header & Date picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Daily Clinic Calendar
          </h1>
          <p className="text-xs text-slate-500">
            View all scheduled consultation slots for any selected date
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => changeDay(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none bg-transparent"
          />

          <button
            onClick={() => changeDay(1)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 ml-1"
          >
            Today
          </button>
        </div>
      </div>

      {/* Date Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-5 h-5 text-cyan-600" />
          <span className="font-bold text-slate-900 text-sm">{formattedHeaderDate}</span>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {appointments.length} Consultations Booked
        </span>
      </div>

      {/* Daily Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading day schedule...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No consultations registered for {formattedHeaderDate}.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-cyan-400 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="px-3 py-2 rounded-xl bg-cyan-50 border border-cyan-200/80 text-cyan-950 font-bold text-xs flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-cyan-700" />
                    <span>{apt.appointment_time}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{apt.patient_name}</span>
                      <span className="font-mono text-xs text-slate-500 font-semibold">(#{apt.appointment_number || apt.appointment_id})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <strong>Reason:</strong> {apt.reason}
                    </p>
                    {apt.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        Notes: {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-auto sm:ml-0">
                  <a
                    href={`tel:${apt.phone}`}
                    className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{apt.phone}</span>
                  </a>

                  {getStatusBadge(apt.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
