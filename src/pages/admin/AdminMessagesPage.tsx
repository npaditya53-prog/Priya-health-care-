import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Trash2,
  CheckCircle2,
  Mail,
  Phone,
  Clock,
  Search,
  X,
  AlertCircle,
  ChevronLeft,
  Eye,
  Check,
} from 'lucide-react';
import { api, ContactMessageData } from '../../lib/api';

export const AdminMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<ContactMessageData | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchMessages = async () => {
    setLoading(true);
    const res = await api.getContactMessages();
    setLoading(false);
    if (res.success && res.data) {
      setMessages(res.data);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'NEW' | 'READ' | 'RESOLVED', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = await api.updateContactMessage(id, status);
    if (res.success && res.data) {
      if (selectedMsg?.id === id) {
        setSelectedMsg(res.data);
      }
      fetchMessages();
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    const res = await api.deleteContactMessage(id);
    if (res.success) {
      if (selectedMsg?.id === id) setSelectedMsg(null);
      fetchMessages();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            UNREAD / NEW
          </span>
        );
      case 'READ':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
            READ
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            RESOLVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const unreadCount = messages.filter((m) => m.status === 'NEW').length;

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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Manage Inquiries
              </h1>
              {unreadCount > 0 ? (
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                  {unreadCount} Unread
                </span>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                  {messages.length} Total
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient contact requests, questions, and inquiries submitted via the website
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient Name, Phone, Email, or Message keywords..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 focus:outline-none"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading inquiries...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <p className="font-semibold text-slate-700 text-sm">No inquiries found.</p>
            <p className="text-slate-400 mt-1">
              {searchFilter ? 'Try clearing your search query.' : 'New patient enquiries will appear here in real time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMsg(msg);
                  if (msg.status === 'NEW') {
                    handleUpdateStatus(msg.id, 'READ');
                  }
                }}
                className={`p-5 cursor-pointer hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  msg.status === 'NEW' ? 'bg-amber-50/40 border-l-4 border-l-amber-500' : ''
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{msg.name}</span>
                    {getStatusBadge(msg.status)}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Phone: {msg.phone}</span>
                    {msg.email && <span className="text-slate-500">• Email: {msg.email}</span>}
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-2 max-w-3xl leading-relaxed">
                    {msg.message}
                  </p>
                </div>

                {/* Actions: View, Mark as Read, Call, Email, Delete */}
                <div
                  className="flex flex-wrap items-center gap-2 text-xs pt-2 md:pt-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMsg(msg);
                      if (msg.status === 'NEW') {
                        handleUpdateStatus(msg.id, 'READ');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="View details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  {msg.status === 'NEW' && (
                    <button
                      type="button"
                      onClick={(e) => handleUpdateStatus(msg.id, 'READ', e)}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Mark as Read"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Read</span>
                    </button>
                  )}

                  <a
                    href={`tel:${msg.phone}`}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 transition-colors"
                    title="Call Patient"
                  >
                    <Phone className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Call</span>
                  </a>

                  {msg.email && (
                    <a
                      href={`mailto:${msg.email}?subject=Regarding your inquiry at Priya Health Care`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 transition-colors"
                      title="Email Patient"
                    >
                      <Mail className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Email</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(msg.id, e)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
                    title="Delete inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
                  Inquiry Details
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedMsg.name}</h3>
              </div>
              <button
                onClick={() => setSelectedMsg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block font-semibold mb-0.5">Phone Number:</span>
                  <a href={`tel:${selectedMsg.phone}`} className="font-bold text-cyan-700 text-sm hover:underline">
                    {selectedMsg.phone}
                  </a>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block font-semibold mb-0.5">Email:</span>
                  {selectedMsg.email ? (
                    <a href={`mailto:${selectedMsg.email}`} className="font-semibold text-cyan-700 hover:underline">
                      {selectedMsg.email}
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-600">None provided</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block font-semibold mb-0.5">Submitted On:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedMsg.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Message Content:</span>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedMsg.message}
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={`tel:${selectedMsg.phone}`}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {selectedMsg.phone}</span>
                </a>

                {selectedMsg.email && (
                  <a
                    href={`mailto:${selectedMsg.email}?subject=Regarding your inquiry at Priya Health Care`}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Send Email</span>
                  </a>
                )}
              </div>

              {/* Status Toggles */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-slate-500 font-semibold">Change Status:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedMsg.id, 'NEW')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                      selectedMsg.status === 'NEW'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    New
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedMsg.id, 'READ')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                      selectedMsg.status === 'READ'
                        ? 'bg-sky-100 text-sky-900 border border-sky-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Read
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedMsg.id, 'RESOLVED')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold cursor-pointer transition-colors ${
                      selectedMsg.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDelete(selectedMsg.id)}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMsg(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminMessagesPage;
