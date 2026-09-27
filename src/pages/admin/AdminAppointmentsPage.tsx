import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
  Phone,
  Mail,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MessageSquare,
  ArrowRight,
  CalendarCheck,
  CalendarX,
  RotateCw,
} from 'lucide-react';
import { api, AppointmentData } from '../../lib/api';
import { useClinic } from '../../context/ClinicContext';
import { generateWhatsAppLink } from '../../lib/whatsapp';

export const AdminAppointmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { clinic } = useClinic();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Determine active tab from URL search parameters
  const tabFromUrl = useMemo(() => {
    const filter = searchParams.get('filter')?.toLowerCase();
    if (filter === 'today') return 'TODAY';
    const status = searchParams.get('status')?.toUpperCase();
    if (status && ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return status;
    }
    const dateParam = searchParams.get('date');
    if (dateParam === todayStr) return 'TODAY';
    return 'ALL';
  }, [searchParams, todayStr]);

  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  const [dateFilter, setDateFilter] = useState<string>(searchParams.get('date') || (tabFromUrl === 'TODAY' ? todayStr : ''));
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [page, setPage] = useState<number>(1);

  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Active appointment for details/status modal
  const [selectedApt, setSelectedApt] = useState<AppointmentData | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [isReschedulingInModal, setIsReschedulingInModal] = useState<boolean>(false);
  const [modalUpdating, setModalUpdating] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Reset Counter modal state
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetStartFrom, setResetStartFrom] = useState<number>(0);
  const [resetClearExisting, setResetClearExisting] = useState<boolean>(false);
  const [resetDate, setResetDate] = useState<string>('');
  const [resettingCounter, setResettingCounter] = useState<boolean>(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Sync tab with URL parameter changes
  useEffect(() => {
    setActiveTab(tabFromUrl);
    if (tabFromUrl === 'TODAY') {
      setDateFilter(todayStr);
    } else if (searchParams.get('date')) {
      setDateFilter(searchParams.get('date') || '');
    } else {
      setDateFilter('');
    }
    setPage(1);
  }, [tabFromUrl, searchParams, todayStr]);

  const fetchAppointments = async () => {
    setLoading(true);

    const isTodayTab = activeTab === 'TODAY';
    const effectiveStatus = (!isTodayTab && activeTab !== 'ALL') ? activeTab : undefined;
    const effectiveDate = isTodayTab ? todayStr : (dateFilter || undefined);
    const effectiveSortBy = isTodayTab ? 'appointment_time' : 'created_at';

    try {
      const res = await api.getAppointments({
        status: effectiveStatus,
        date: effectiveDate,
        search: searchQuery.trim() || undefined,
        sortBy: effectiveSortBy,
        order: isTodayTab ? 'ASC' : 'DESC',
        page,
        limit: 25,
      });

      if (res.success && res.data) {
        setAppointments(res.data.appointments);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeTab, dateFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAppointments();
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setPage(1);

    const newParams = new URLSearchParams();
    if (newTab === 'TODAY') {
      newParams.set('filter', 'today');
      setDateFilter(todayStr);
    } else if (newTab !== 'ALL') {
      newParams.set('status', newTab);
      setDateFilter('');
    } else {
      setDateFilter('');
    }

    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    }
    setSearchParams(newParams);
  };

  const openDetailsModal = (apt: AppointmentData, openWithReschedule = false) => {
    setSelectedApt(apt);
    setActionStatus(apt.status);
    setActionNotes(apt.notes || '');
    setRescheduleDate(apt.appointment_date);
    setRescheduleTime(apt.appointment_time);
    setIsReschedulingInModal(openWithReschedule);
    setFeedbackMsg(null);
  };

  // Quick Action Handlers
  const handleQuickConfirm = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.updateAppointment(id, { status: 'CONFIRMED' });
      if (res.success) {
        if (selectedApt?.id === id && res.data) setSelectedApt(res.data);
        fetchAppointments();
      } else {
        alert(res.error?.message || 'Failed to confirm appointment.');
      }
    } catch (err: any) {
      alert(err.message || 'Error confirming appointment.');
    }
  };

  const handleQuickCancel = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to cancel this appointment? It will be marked as cancelled in the record.');
    if (!confirmed) return;

    try {
      const res = await api.updateAppointment(id, { status: 'CANCELLED' });
      if (res.success) {
        if (selectedApt?.id === id && res.data) setSelectedApt(res.data);
        fetchAppointments();
      } else {
        alert(res.error?.message || 'Failed to cancel appointment.');
      }
    } catch (err: any) {
      alert(err.message || 'Error cancelling appointment.');
    }
  };

  const handleQuickComplete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.updateAppointment(id, { status: 'COMPLETED' });
      if (res.success) {
        if (selectedApt?.id === id && res.data) setSelectedApt(res.data);
        fetchAppointments();
      }
    } catch (err: any) {
      alert(err.message || 'Error marking appointment as completed.');
    }
  };

  const handleSaveModalUpdates = async () => {
    if (!selectedApt) return;
    setModalUpdating(true);
    setFeedbackMsg(null);

    const isRescheduled =
      rescheduleDate !== selectedApt.appointment_date ||
      rescheduleTime !== selectedApt.appointment_time;

    const newStatus = isRescheduled && actionStatus === 'CONFIRMED' ? 'RESCHEDULED' : actionStatus;

    try {
      const res = await api.updateAppointment(selectedApt.id, {
        status: newStatus,
        notes: actionNotes,
        rescheduleDate: isRescheduled ? rescheduleDate : undefined,
        rescheduleTime: isRescheduled ? rescheduleTime : undefined,
      });

      setModalUpdating(false);

      if (res.success && res.data) {
        setFeedbackMsg('Appointment updated successfully. Appointment Number remained unchanged.');
        setSelectedApt(res.data);
        fetchAppointments();
      } else {
        setFeedbackMsg(res.error?.message || 'Failed to update appointment.');
      }
    } catch (err: any) {
      setModalUpdating(false);
      setFeedbackMsg(err.message || 'An error occurred while updating.');
    }
  };

  const handleResetCounter = async () => {
    setResettingCounter(true);
    setResetFeedback(null);
    try {
      const res = await api.resetAppointmentCounter({
        startFrom: resetStartFrom,
        clearExisting: resetClearExisting,
        date: resetDate.trim() || undefined,
      });
      setResettingCounter(false);
      if (res.success && res.data) {
        setResetFeedback(res.data.message);
        setTimeout(() => {
          setShowResetModal(false);
          setResetFeedback(null);
          fetchAppointments();
        }, 1500);
      } else {
        setResetFeedback(res.error?.message || 'Failed to reset appointment number counter.');
      }
    } catch (err: any) {
      setResettingCounter(false);
      setResetFeedback(err.message || 'Error executing counter reset.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            CONFIRMED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            PENDING
          </span>
        );
      case 'RESCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            RESCHEDULED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Header Title & Subtitle based on active tab
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'TODAY':
        return {
          title: "Today's Appointments",
          subtitle: `Showing all consultations scheduled for today (${todayStr})`,
        };
      case 'PENDING':
        return {
          title: 'Pending Appointments',
          subtitle: 'Awaiting phone or SMS confirmation by clinic staff',
        };
      case 'CONFIRMED':
        return {
          title: 'Confirmed Appointments',
          subtitle: 'All confirmed patient appointments',
        };
      case 'RESCHEDULED':
        return {
          title: 'Rescheduled Appointments',
          subtitle: 'Appointments updated with new consultation slots',
        };
      case 'CANCELLED':
        return {
          title: 'Cancelled Appointments',
          subtitle: 'Cancelled records preserved in appointment history',
        };
      case 'COMPLETED':
        return {
          title: 'Completed Consultations',
          subtitle: 'Past finished patient visits',
        };
      default:
        return {
          title: 'Appointment Management',
          subtitle: `Total of ${total} registered consultations across every status`,
        };
    }
  };

  const headerInfo = getHeaderInfo();

  // Tab definitions
  const tabs = [
    { id: 'ALL', label: 'All' },
    { id: 'TODAY', label: "Today's Schedule" },
    { id: 'PENDING', label: 'Pending' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'RESCHEDULED', label: 'Rescheduled' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Return to Dashboard Navigation */}
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-cyan-700 transition-colors mb-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {headerInfo.title}
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                {total}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {headerInfo.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setResetStartFrom(0);
                setResetClearExisting(false);
                setResetFeedback(null);
                setShowResetModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset Counter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Filter Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Custom Date Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Appointment Number (e.g. 1), Patient Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                  fetchAppointments();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter (Only enabled if not locked to Today tab) */}
          <div className="sm:col-span-3">
            <input
              type="date"
              value={dateFilter}
              disabled={activeTab === 'TODAY'}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-cyan-600 focus:outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
              title={activeTab === 'TODAY' ? "Date is locked to today in Today's Schedule view" : "Filter by specific date"}
            />
          </div>

          {/* Filter button */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Filter / Search
            </button>
          </div>
        </form>

        {(searchQuery || (dateFilter && activeTab !== 'TODAY')) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Active filters:</span>
            {searchQuery && <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">Query: "{searchQuery}"</span>}
            {dateFilter && activeTab !== 'TODAY' && (
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">Date: {dateFilter}</span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                if (activeTab !== 'TODAY') setDateFilter('');
                setPage(1);
              }}
              className="text-cyan-700 font-semibold hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Appointments List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading consultations...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <p className="font-semibold text-slate-700 text-sm">
              {activeTab === 'TODAY'
                ? "No appointments scheduled for today."
                : activeTab !== 'ALL'
                ? `No appointments found for status: ${activeTab}.`
                : searchQuery
                ? "No matching appointments found."
                : "No appointments found."}
            </p>
            <p className="text-slate-400 mt-1">
              {activeTab === 'TODAY'
                ? "When patients request or confirm appointments for today's date, they will appear here automatically."
                : "Try clearing search queries or switching filter tabs."}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Appointment No.</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">{activeTab === 'PENDING' ? 'Requested Date' : 'Appointment Date'}</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Reason / Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((apt) => {
                    const waLink = generateWhatsAppLink(
                      apt.phone,
                      { customMessage: `Hello ${apt.patient_name}, this is Priya Health Care regarding your Appointment #${apt.appointment_number || apt.appointment_id}.` }
                    ).url;

                    return (
                      <tr
                        key={apt.id}
                        onClick={() => openDetailsModal(apt, false)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-sm">
                          #{apt.appointment_number ?? apt.appointment_id}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 block">{apt.patient_name}</span>
                          <span className="text-[11px] text-slate-400">
                            Booked: {apt.created_at ? new Date(apt.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={`tel:${apt.phone}`}
                              className="text-cyan-700 font-semibold hover:underline"
                            >
                              {apt.phone}
                            </a>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {apt.appointment_date}
                        </td>
                        <td className="px-4 py-3.5 text-slate-900 font-bold">
                          {apt.appointment_time}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                          {apt.reason || 'General Consultation'}
                        </td>
                        <td className="px-4 py-3.5">
                          {getStatusBadge(apt.status)}
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {apt.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickConfirm(apt.id, e)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                                  title="Confirm Appointment"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDetailsModal(apt, true)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] border border-purple-200 transition-colors cursor-pointer"
                                  title="Reschedule Appointment"
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickCancel(apt.id, e)}
                                  className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[11px] border border-red-200 transition-colors cursor-pointer"
                                  title="Cancel Appointment"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {apt.status === 'CONFIRMED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openDetailsModal(apt, true)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] border border-purple-200 transition-colors cursor-pointer"
                                >
                                  Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickCancel(apt.id, e)}
                                  className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[11px] border border-red-200 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {apt.status === 'RESCHEDULED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickConfirm(apt.id, e)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickCancel(apt.id, e)}
                                  className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[11px] border border-red-200 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => openDetailsModal(apt, false)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {appointments.map((apt) => {
                const waLink = generateWhatsAppLink(
                  apt.phone,
                  { customMessage: `Hello ${apt.patient_name}, this is Priya Health Care regarding your Appointment #${apt.appointment_number || apt.appointment_id}.` }
                ).url;

                return (
                  <div
                    key={apt.id}
                    onClick={() => openDetailsModal(apt, false)}
                    className="p-4 space-y-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-cyan-700">
                          #{apt.appointment_number ?? apt.appointment_id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{apt.patient_name}</h4>
                      </div>
                      <div>{getStatusBadge(apt.status)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Date</span>
                        <span className="font-medium text-slate-800">{apt.appointment_date}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Time</span>
                        <span className="font-bold text-slate-900">{apt.appointment_time}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Phone</span>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <a href={`tel:${apt.phone}`} className="font-semibold text-cyan-700 hover:underline">
                            {apt.phone}
                          </a>
                          <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-emerald-600 text-[11px] flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons on mobile */}
                    <div className="flex flex-wrap items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      {apt.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleQuickConfirm(apt.id, e)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetailsModal(apt, true)}
                            className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleQuickCancel(apt.id, e)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {apt.status === 'CONFIRMED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => openDetailsModal(apt, true)}
                            className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleQuickCancel(apt.id, e)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => openDetailsModal(apt, false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold ml-auto"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
            <span>
              Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, total)} of {total} appointments
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white bg-white text-slate-700 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white bg-white text-slate-700 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Detail & Management Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
                  Consultation Details
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-mono">
                  Appointment #{selectedApt.appointment_number ?? selectedApt.appointment_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApt(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackMsg && (
              <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-sky-700 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedApt.patient_name}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Contact Phone</span>
                <div className="flex items-center gap-3 mt-0.5">
                  <a href={`tel:${selectedApt.phone}`} className="font-bold text-cyan-700 text-sm hover:underline">
                    {selectedApt.phone}
                  </a>
                  <a
                    href={generateWhatsAppLink(
                      selectedApt.phone,
                      { customMessage: `Hello ${selectedApt.patient_name}, regarding your appointment #${selectedApt.appointment_number || selectedApt.appointment_id}...` }
                    ).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Current Status</span>
                <div className="mt-1">{getStatusBadge(selectedApt.status)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Booking Created Date/Time</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {selectedApt.created_at ? new Date(selectedApt.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Appointment Date & Time</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {selectedApt.appointment_date} at {selectedApt.appointment_time}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {selectedApt.email || 'None provided'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                <span className="text-slate-400 block font-medium">Reason for Visit</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {selectedApt.reason || 'General Consultation'}
                </span>
              </div>

              {selectedApt.message && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                  <span className="text-slate-400 block font-medium">Patient Additional Note</span>
                  <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{selectedApt.message}</p>
                </div>
              )}
            </div>

            {/* Quick Status Action Buttons */}
            <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Quick Action Controls:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionStatus('CONFIRMED');
                    handleSaveModalUpdates();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedApt.status === 'CONFIRMED'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  ✓ Confirm
                </button>

                <button
                  type="button"
                  onClick={() => setIsReschedulingInModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer"
                >
                  ↻ Reschedule
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ok = window.confirm('Cancel this appointment? It will remain in the database as CANCELLED.');
                    if (ok) {
                      setActionStatus('CANCELLED');
                      handleSaveModalUpdates();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedApt.status === 'CANCELLED'
                      ? 'bg-red-700 text-white'
                      : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                  }`}
                >
                  ✕ Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionStatus('COMPLETED');
                    handleSaveModalUpdates();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Mark Completed
                </button>
              </div>
            </div>

            {/* Reschedule Section */}
            {isReschedulingInModal && (
              <div className="mt-4 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">
                    Reschedule Appointment (Preserves #{selectedApt.appointment_number ?? selectedApt.appointment_id})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReschedulingInModal(false)}
                    className="text-purple-600 hover:underline"
                  >
                    Hide
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">New Consultation Date</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-white font-semibold text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">New Consultation Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-white font-semibold text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Internal Staff Notes */}
            <div className="mt-4 space-y-1 text-xs">
              <label className="block text-slate-700 font-semibold">
                Staff Internal Notes (Optional):
              </label>
              <textarea
                rows={2}
                placeholder="Add notes about phone confirmation, patient condition or visit instructions..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 focus:outline-none"
              />
            </div>

            {/* Modal Bottom Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={modalUpdating}
                onClick={handleSaveModalUpdates}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {modalUpdating ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Appointment Number Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Reset Appointment Counter
                  </h3>
                  <span className="text-[11px] text-slate-500 block">
                    Global sequence counter configuration
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetFeedback && (
              <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-sky-700 shrink-0" />
                <span>{resetFeedback}</span>
              </div>
            )}

            <div className="mt-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Configure the baseline counter for appointment numbers (1, 2, 3...). The counter will increment from this value for future bookings.
              </p>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Target Appointment Date (Optional):
                </label>
                <input
                  type="date"
                  value={resetDate}
                  onChange={(e) => setResetDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-cyan-600"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Leave empty to reset global counter, or specify a date.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  New Base Counter (Last Assigned Number):
                </label>
                <input
                  type="number"
                  min="0"
                  value={resetStartFrom}
                  onChange={(e) => setResetStartFrom(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-cyan-600"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Next booking will be assigned: <strong className="text-slate-800 font-mono font-bold">#{resetStartFrom + 1}</strong>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetClearExisting}
                    onChange={(e) => setResetClearExisting(e.target.checked)}
                    className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-slate-700 text-xs">
                    <strong>Also clear existing test appointments</strong> {resetDate ? `for ${resetDate}` : 'from database'} so numbering starts cleanly from #1.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resettingCounter}
                  onClick={handleResetCounter}
                  className="px-5 py-2 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{resettingCounter ? 'Resetting...' : 'Confirm Reset'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminAppointmentsPage;
