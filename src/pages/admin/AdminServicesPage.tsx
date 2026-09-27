import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { api, ServiceData } from '../../lib/api';
import { useClinic } from '../../context/ClinicContext';

export const AdminServicesPage: React.FC = () => {
  const { reloadAll } = useClinic();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal editor state
  const [editingService, setEditingService] = useState<Partial<ServiceData> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    const res = await api.getAllServices();
    setLoading(false);
    if (res.success && res.data) {
      setServices(res.data);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openNewServiceModal = () => {
    setEditingService({
      title: '',
      slug: '',
      short_description: '',
      description: '',
      icon: 'Stethoscope',
      is_active: 1,
      display_order: services.length + 1,
    });
    setError(null);
  };

  const openEditModal = (s: ServiceData) => {
    setEditingService({ ...s });
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setError(null);
    setSaving(true);

    let res;
    if (editingService.id) {
      res = await api.updateService(editingService.id, editingService);
    } else {
      res = await api.createService(editingService);
    }

    setSaving(false);

    if (res.success) {
      setEditingService(null);
      fetchServices();
      reloadAll();
    } else {
      setError(res.error?.message || 'Failed to save service.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    const res = await api.deleteService(id);
    if (res.success) {
      fetchServices();
      reloadAll();
    } else {
      alert(res.error?.message || 'Could not delete service.');
    }
  };

  const toggleActive = async (s: ServiceData) => {
    const res = await api.updateService(s.id, { is_active: s.is_active ? 0 : 1 });
    if (res.success) {
      fetchServices();
      reloadAll();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Medical Services Catalog
          </h1>
          <p className="text-xs text-slate-500">
            Manage clinical offerings displayed on the website
          </p>
        </div>

        <button
          onClick={openNewServiceModal}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No services configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Service Title</th>
                  <th className="px-5 py-3">URL Slug</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-400 font-bold">
                      {s.display_order}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block text-sm">{s.title}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">
                        {s.short_description}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">/services/{s.slug}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleActive(s)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          s.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {s.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{s.is_active ? 'Active' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Editor Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingService.id ? 'Edit Service' : 'Add New Medical Service'}
              </h3>
              <button
                onClick={() => setEditingService(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Health Consultation"
                  value={editingService.title || ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)+/g, '');
                    setEditingService({
                      ...editingService,
                      title,
                      slug: editingService.id ? editingService.slug : slug,
                    });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="general-health-consultation"
                    value={editingService.slug || ''}
                    onChange={(e) =>
                      setEditingService({ ...editingService, slug: e.target.value.toLowerCase() })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-cyan-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingService.display_order ?? 1}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        display_order: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Short Description (Card Summary)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief 1-2 sentence overview for the homepage card"
                  value={editingService.short_description || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, short_description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Full Description & Patient Instructions
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed clinical scope, symptoms evaluated, and consultation expectations..."
                  value={editingService.description || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, description: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
