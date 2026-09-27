import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Stethoscope,
  User,
  Settings,
  ArrowRight,
  Search,
  X,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { api, AdminStats, AppointmentData } from '../../lib/api';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { generateWhatsAppLink } from '../../lib/whatsapp';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allAppointments, setAllAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Selected Appointment for Details & Management Modal
  const [selectedApt, setSelectedApt] = useState<AppointmentData | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [confirmingDelete, setConfirmingDelete] = useState<boolean>(false);
  const [modalUpdating, setModalUpdating] = useState<boolean>(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.getAdminStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Failed to load stats:', err);
    }
  }, []);

  // Fetch All Appointments from Backend (Newest Booking First)
  const fetchAppointments = useCallback(async (quiet: boolean = false) => {
    if (!quiet) setLoading(true);
    else setIsRefreshing(true);

    try {
      // Query appointments with newest booking first (sortBy = created_at, order = DESC)
      const res = await api.getAppointments({
        limit: 100,
        sortBy: 'created_at',
        order: 'DESC',
      });

      if (res.success && res.data) {
        setAllAppointments(res.data.appointments);
      }
    } catch (err) {
      console.warn('Failed to load appointments:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchAppointments();
  }, [fetchStats, fetchAppointments]);

  // Real-time Firestore sync & smart polling
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    // Listen to Firebase Auth state for Firestore listener
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        try {
          const aptsCollection = collection(db, 'appointments');
          const q = query(aptsCollection);
          unsubscribeFirestore = onSnapshot(
            q,
            () => {
              // Real-time notification from Firestore: sync state
              fetchAppointments(true);
              fetchStats();
            },
            (error) => {
              console.warn('[Firestore] Real-time listener notice:', error.message);
            }
          );
        } catch (e) {
          console.warn('[Firestore] Real-time init notice:', e);
        }
      }
    });

    // Periodic background sync interval (every 10 seconds)
    const intervalId = setInterval(() => {
      fetchAppointments(true);
      fetchStats();
    }, 10000);

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
      clearInterval(intervalId);
    };
  }, [fetchAppointments, fetchStats]);

  // Format booking creation date/time nicely
  const formatBookingTime = (isoString?: string | null) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  // Status Badge Component
  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            CONFIRMED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            PENDING
          </span>
        );
      case 'RESCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
            <Clock className="w-3 h-3 text-purple-600" />
            RESCHEDULED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
            <CheckCircle2 className="w-3 h-3 text-sky-600" />
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-red-200">
            <X className="w-3 h-3 text-red-600" />
            CANCELLED
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
            NO SHOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Status Filter Tabs
  const statusTabs = [
    { label: 'ALL', value: 'ALL' },
    { label: 'PENDING', value: 'PENDING' },
    { label: 'CONFIRMED', value: 'CONFIRMED' },
    { label: 'RESCHEDULED', value: 'RESCHEDULED' },
    { label: 'CANCELLED', value: 'CANCELLED' },
    { label: 'COMPLETED', value: 'COMPLETED' },
  ];

  // Client-side filtering & search on the collection
  const filteredAppointments = allAppointments.filter((apt) => {
    // 1. Status Filter
    if (statusFilter !== 'ALL') {
      const aptStatus = (apt.status || '').toUpperCase();
      if (aptStatus !== statusFilter) return false;
    }

    // 2. Search Query (Appointment Number, Patient Name, Phone Number)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const aptNum = (apt.appointment_number ?? apt.appointmentNumber ?? '').toString();
      const aptId = (apt.appointment_id || '').toLowerCase();
      const patient = (apt.patient_name || '').toLowerCase();
      const phone = (apt.phone || '').replace(/\D/g, '');
      const cleanQ = q.replace(/\D/g, '');

      const matchNum = aptNum === q || aptNum === q.replace(/^#/, '');
      const matchId = aptId.includes(q);
      const matchPatient = patient.includes(q);
      const matchPhone = (phone && cleanQ && phone.includes(cleanQ)) || (apt.phone || '').toLowerCase().includes(q);

      return matchNum || matchId || matchPatient || matchPhone;
    }

    return true;
  });

  // Calculate pagination
  const totalItems = filteredAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Open Details Modal
  const openDetailsModal = (apt: AppointmentData) => {
    setSelectedApt(apt);
    setActionStatus(apt.status);
    setActionNotes(apt.notes || '');
    setRescheduleDate(apt.appointment_date);
    setRescheduleTime(apt.appointment_time);
    setIsRescheduling(false);
    setConfirmingDelete(false);
    setModalFeedback(null);
  };

  // Delete Appointment Handler
  const handleDeleteAppointment = async (id: string) => {
    setModalUpdating(true);
    setModalFeedback(null);
    try {
      const res = await api.deleteAppointment(id);
      if (res.success) {
        setSelectedApt(null);
        setConfirmingDelete(false);
        await Promise.all([fetchAppointments(true), fetchStats()]);
      } else {
        setModalFeedback({
          type: 'error',
          message: res.error?.message || 'Failed to delete appointment.',
        });
      }
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: err.message || 'An error occurred while deleting.',
      });
    } finally {
      setModalUpdating(false);
    }
  };

  // Quick Action Handler (Confirm, Cancel, Reschedule, Complete)
  const handleQuickAction = async (newStatus: string) => {
    if (!selectedApt) return;
    setModalUpdating(true);
    setModalFeedback(null);

    try {
      const res = await api.updateAppointment(selectedApt.id, {
        status: newStatus,
        notes: actionNotes,
      });

      if (res.success && res.data) {
        setSelectedApt(res.data);
        setActionStatus(res.data.status);
        setModalFeedback({
          type: 'success',
          message: `Appointment status updated to ${newStatus}. Appointment number #${selectedApt.appointment_number || selectedApt.appointment_id} preserved.`,
        });
        // Immediately refresh queue and stats
        await Promise.all([fetchAppointments(true), fetchStats()]);
      } else {
        setModalFeedback({
          type: 'error',
          message: res.error?.message || 'Failed to update appointment status.',
        });
      }
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setModalUpdating(false);
    }
  };

  // Full Save Handler (Status, Rescheduled Date/Time, and Staff Notes)
  const handleSaveModalUpdates = async () => {
    if (!selectedApt) return;
    setModalUpdating(true);
    setModalFeedback(null);

    const isRescheduleChanged =
      rescheduleDate !== selectedApt.appointment_date ||
      rescheduleTime !== selectedApt.appointment_time;

    // If rescheduled date/time changed, automatically set status to RESCHEDULED unless explicitly set
    let finalStatus = actionStatus;
    if (isRescheduleChanged && actionStatus === selectedApt.status) {
      finalStatus = 'RESCHEDULED';
    }

    try {
      const res = await api.updateAppointment(selectedApt.id, {
        status: finalStatus,
        notes: actionNotes,
        rescheduleDate: isRescheduleChanged ? rescheduleDate : undefined,
        rescheduleTime: isRescheduleChanged ? rescheduleTime : undefined,
      });

      if (res.success && res.data) {
        setSelectedApt(res.data);
        setActionStatus(res.data.status);
        setIsRescheduling(false);
        setModalFeedback({
          type: 'success',
          message: 'Appointment updated successfully. Global Appointment Number remains unchanged.',
        });
        // Immediately refresh queue and stats
        await Promise.all([fetchAppointments(true), fetchStats()]);
      } else {
        setModalFeedback({
          type: 'error',
          message: res.error?.message || 'Failed to save appointment updates.',
        });
      }
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        message: err.message || 'An error occurred while saving updates.',
      });
    } finally {
      setModalUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Quick actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Clinic Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Welcome to Priya Health Care Singahi Administration Portal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchAppointments();
            }}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            to="/admin/appointments"
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Manage Appointments</span>
          </Link>
          <Link
            to="/admin/services"
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />
            <span>Add Service</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <Link
          to="/admin/appointments?filter=today"
          className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-500 hover:shadow-md transition-all block group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-sky-700 uppercase tracking-wider transition-colors">
              Today's Schedule
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 group-hover:text-sky-800 transition-colors">
              {stats?.todayAppointments ?? 0}
            </span>
            <span className="text-xs text-slate-500">appointments today</span>
          </div>
          <span className="mt-2 text-[11px] font-semibold text-sky-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>View today's schedule</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* Pending Requests */}
        <Link
          to="/admin/appointments?status=PENDING"
          className="p-6 rounded-2xl bg-white border border-amber-200/80 hover:border-amber-500 hover:shadow-md transition-all block group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Pending Confirmation
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">
              {stats?.pendingAppointments ?? 0}
            </span>
            <span className="text-xs text-slate-500">requests waiting</span>
          </div>
          <span className="mt-2 text-[11px] font-semibold text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Review pending</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* Confirmed Appointments */}
        <Link
          to="/admin/appointments?status=CONFIRMED"
          className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all block group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Confirmed Total
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">
              {stats?.confirmedAppointments ?? 0}
            </span>
            <span className="text-xs text-slate-500">confirmed</span>
          </div>
          <span className="mt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>View confirmed list</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        {/* Unread Inquiries */}
        <Link
          to="/admin/messages"
          className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all block group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-700 uppercase tracking-wider transition-colors">
              New Inquiries
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 group-hover:text-indigo-800 transition-colors">
              {stats?.unreadMessages ?? 0}
            </span>
            <span className="text-xs text-slate-500">unread messages</span>
          </div>
          <span className="mt-2 text-[11px] font-semibold text-indigo-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            <span>Manage inquiries</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/admin/appointments"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-cyan-500 transition-all flex items-center gap-3 shadow-2xs"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900">Manage Appointments</span>
            <span className="block text-[11px] text-slate-500">Confirm, reschedule, cancel</span>
          </div>
        </Link>

        <Link
          to="/admin/doctor"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-cyan-500 transition-all flex items-center gap-3 shadow-2xs"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900">Doctor Profile</span>
            <span className="block text-[11px] text-slate-500">Edit Dr. Gultun Paswan info</span>
          </div>
        </Link>

        <Link
          to="/admin/clinic"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-cyan-500 transition-all flex items-center gap-3 shadow-2xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900">Clinic Details</span>
            <span className="block text-[11px] text-slate-500">Phone, address, timings</span>
          </div>
        </Link>

        <Link
          to="/admin/settings"
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-cyan-500 transition-all flex items-center gap-3 shadow-2xs"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-900">Schedule & Duration</span>
            <span className="block text-[11px] text-slate-500">Working days & slot rules</span>
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* ALL APPOINTMENT QUEUE (REPLACES OLD PENDING APPOINTMENT QUEUE)            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                All Appointment Queue
              </h2>
              <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                {allAppointments.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              All appointments across every status
            </p>
          </div>

          <Link
            to="/admin/appointments"
            className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>View All Appointments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Appointment No., Patient, Phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Loading, Empty States, Desktop Table & Mobile Cards */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading appointments queue...</span>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Calendar className="w-5 h-5" />
            </div>
            {allAppointments.length === 0 ? (
              <p className="font-semibold text-slate-700">No appointments found.</p>
            ) : searchQuery.trim() ? (
              <div>
                <p className="font-semibold text-slate-700">No matching appointments found.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Try searching with a different patient name, phone number, or appointment number.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-semibold text-cyan-600 hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-700">No appointments found for this status.</p>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="mt-2 text-xs font-semibold text-cyan-600 hover:underline"
                >
                  Show all appointments
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table Layout (visible on screens sm and up) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Appointment No.</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Requested Date</th>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAppointments.map((apt) => {
                    const aptNum = apt.appointment_number ?? apt.appointmentNumber ?? apt.appointment_id;
                    return (
                      <tr
                        key={apt.id || apt.appointment_id}
                        onClick={() => openDetailsModal(apt)}
                        className="hover:bg-cyan-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-cyan-700">
                            #{aptNum}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{apt.patient_name}</div>
                          {apt.reason && (
                            <div className="text-[11px] text-slate-500 max-w-xs truncate">
                              {apt.reason}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <a
                            href={`tel:${apt.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-cyan-700 hover:text-cyan-900 font-medium hover:underline inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{apt.phone}</span>
                          </a>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-medium whitespace-nowrap">
                          {apt.appointment_date}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-semibold whitespace-nowrap">
                          {apt.appointment_time}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {getStatusBadge(apt.status)}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailsModal(apt);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-cyan-600 hover:text-white text-slate-700 font-bold transition-all text-xs cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List Layout (visible on screens smaller than sm) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {paginatedAppointments.map((apt) => {
                const aptNum = apt.appointment_number ?? apt.appointmentNumber ?? apt.appointment_id;
                return (
                  <div
                    key={apt.id || apt.appointment_id}
                    onClick={() => openDetailsModal(apt)}
                    className="p-4 hover:bg-cyan-50/30 active:bg-cyan-50/50 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                          #{aptNum}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {apt.patient_name}
                        </span>
                      </div>
                      <div>{getStatusBadge(apt.status)}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <a
                        href={`tel:${apt.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-cyan-700 font-medium hover:underline inline-flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.phone}</span>
                      </a>

                      <div className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{apt.appointment_date}</span>
                        <span className="text-slate-300">•</span>
                        <span>{apt.appointment_time}</span>
                      </div>
                    </div>

                    {apt.reason && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 bg-slate-50 px-2.5 py-1 rounded-md">
                        Reason: {apt.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls & View All Link */}
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} appointments
              </span>

              <div className="flex items-center gap-3">
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white bg-white text-slate-700 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-semibold text-slate-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white bg-white text-slate-700 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <Link
                  to="/admin/appointments"
                  className="inline-flex items-center gap-1 font-bold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100/70 border border-cyan-200 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <span>View All Appointments →</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* APPOINTMENT DETAILS & ACTIONS MODAL                                       */}
      {/* ========================================================================= */}
      {selectedApt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider block">
                  Consultation Details
                </span>
                <div className="flex items-center gap-2.5 mt-1">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
                    Appointment #{selectedApt.appointment_number ?? selectedApt.appointmentNumber ?? selectedApt.appointment_id}
                  </h3>
                  <div>{getStatusBadge(selectedApt.status)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Message */}
            {modalFeedback && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  modalFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border border-red-200 text-red-900'
                }`}
              >
                {modalFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{modalFeedback.message}</span>
              </div>
            )}

            {/* Appointment Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {selectedApt.patient_name}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Contact Phone</span>
                <div className="flex items-center justify-between mt-0.5">
                  <a
                    href={`tel:${selectedApt.phone}`}
                    className="font-bold text-cyan-700 text-sm hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedApt.phone}</span>
                  </a>
                  <a
                    href={generateWhatsAppLink(
                      selectedApt.phone,
                      {
                        customMessage: `Hello ${selectedApt.patient_name}, regarding your appointment #${selectedApt.appointment_number || selectedApt.appointment_id} with Priya Health Care on ${selectedApt.appointment_date} at ${selectedApt.appointment_time}:`,
                      }
                    ).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Requested Consultation</span>
                <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{selectedApt.appointment_date}</span>
                  <span className="text-slate-300">•</span>
                  <Clock className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{selectedApt.appointment_time}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-medium">Booking Created Date/Time</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {formatBookingTime(selectedApt.created_at)}
                </span>
              </div>

              {Boolean((selectedApt as any).age || (selectedApt as any).gender) && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block font-medium">Age & Gender</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {[(selectedApt as any).age ? `${(selectedApt as any).age} yrs` : '', (selectedApt as any).gender].filter(Boolean).join(' • ')}
                  </span>
                </div>
              )}

              {Boolean((selectedApt as any).appointment_type || (selectedApt as any).type) && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block font-medium">Appointment Type</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {(selectedApt as any).appointment_type || (selectedApt as any).type}
                  </span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                <span className="text-slate-400 block font-medium">Reason for Visit</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {selectedApt.reason || 'General Health Consultation'}
                </span>
              </div>

              {selectedApt.email && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                  <span className="text-slate-400 block font-medium">Email Address</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {selectedApt.email}
                  </span>
                </div>
              )}

              {selectedApt.message && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                  <span className="text-slate-400 block font-medium mb-1">Additional Patient Note</span>
                  <p className="text-slate-700 leading-relaxed">{selectedApt.message}</p>
                </div>
              )}
            </div>

            {/* Quick Admin Action Buttons */}
            <div className="mt-6 pt-5 border-t border-slate-200 space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Quick Actions
              </span>
              <div className="flex flex-wrap gap-2">
                {/* [Confirm] */}
                <button
                  type="button"
                  disabled={modalUpdating || selectedApt.status === 'CONFIRMED'}
                  onClick={() => handleQuickAction('CONFIRMED')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm</span>
                </button>

                {/* [Reschedule Toggle] */}
                <button
                  type="button"
                  disabled={modalUpdating}
                  onClick={() => setIsRescheduling(!isRescheduling)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors border flex items-center gap-1.5 cursor-pointer ${
                    isRescheduling
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isRescheduling ? 'Hide Reschedule' : 'Reschedule'}</span>
                </button>

                {/* [Mark Completed] */}
                <button
                  type="button"
                  disabled={modalUpdating || selectedApt.status === 'COMPLETED'}
                  onClick={() => handleQuickAction('COMPLETED')}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Completed</span>
                </button>

                {/* [Cancel] */}
                <button
                  type="button"
                  disabled={modalUpdating || selectedApt.status === 'CANCELLED'}
                  onClick={() => handleQuickAction('CANCELLED')}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-40 text-red-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ml-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>

              {/* Reschedule Inputs (if activated) */}
              {isRescheduling && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-700" />
                      Select New Date & Time Slot
                    </span>
                    <span className="text-[11px] text-purple-700">
                      Preserves Appointment #{selectedApt.appointment_number || selectedApt.appointment_id}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">
                        New Date (YYYY-MM-DD)
                      </label>
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full py-2 px-3 rounded-xl border border-purple-300 text-xs bg-white text-slate-800 focus:outline-none focus:border-purple-600 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">
                        New Time Slot
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 10:30 AM"
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        className="w-full py-2 px-3 rounded-xl border border-purple-300 text-xs bg-white text-slate-800 focus:outline-none focus:border-purple-600 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Select & Staff Notes Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white font-bold text-slate-800 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="NO_SHOW">NO_SHOW</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Internal Staff Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Add confirmation notes or staff remarks..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                {confirmingDelete ? (
                  <div className="flex items-center gap-2 bg-red-50 p-1.5 px-3 rounded-xl border border-red-200">
                    <span className="text-[11px] font-bold text-red-700">Delete this appointment?</span>
                    <button
                      type="button"
                      disabled={modalUpdating}
                      onClick={() => handleDeleteAppointment(selectedApt.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={modalUpdating}
                    onClick={() => setConfirmingDelete(true)}
                    className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Appointment</span>
                  </button>
                )}

                <div className="flex items-center gap-2.5 ml-auto">
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
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {modalUpdating ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
