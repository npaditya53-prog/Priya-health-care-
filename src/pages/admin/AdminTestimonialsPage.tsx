import React, { useEffect, useState } from 'react';
import { Quote, Plus, Trash2, Edit2, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { api, TestimonialData } from '../../lib/api';

export const AdminTestimonialsPage: React.FC = () => {
  const [items, setItems] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<TestimonialData> | null>(null);

  const fetchTestimonials = async () => {
    setLoading(true);
    const res = await api.getAllTestimonials();
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    let res;
    if (editingItem.id) {
      res = await api.updateTestimonial(editingItem.id, editingItem);
    } else {
      res = await api.createTestimonial({
        name: editingItem.name || 'Verified Patient',
        content: editingItem.content || '',
        rating: editingItem.rating || 5,
        isPublished: editingItem.is_published === 1,
      });
    }

    if (res.success) {
      setEditingItem(null);
      fetchTestimonials();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this testimonial?')) return;
    const res = await api.deleteTestimonial(id);
    if (res.success) {
      fetchTestimonials();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Patient Feedback & Testimonials
          </h1>
          <p className="text-xs text-slate-500">
            Publish strictly authentic and clinic-authorized patient statements
          </p>
        </div>

        <button
          onClick={() =>
            setEditingItem({
              name: '',
              content: '',
              rating: 5,
              is_published: 1,
            })
          }
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Data Integrity Policy:</strong>
          Only patient testimonials with explicit patient authorization should be entered here. Do not generate fake or unverified reviews.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading feedback...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No testimonials recorded. Testimonials section is kept hidden on public site until authentic reviews are added.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((t) => (
              <div key={t.id} className="p-5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                    <span className="text-amber-500 text-xs font-bold">
                      {'★'.repeat(t.rating)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.is_published ? 'Published' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{t.content}"</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingItem(t)}
                    className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem.id ? 'Edit Testimonial' : 'Add Testimonial'}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Verma (Singahi)"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-cyan-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Testimonial / Review Content
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingItem.content || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-cyan-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rating (1 to 5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={editingItem.rating ?? 5}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        rating: parseInt(e.target.value, 10) || 5,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-cyan-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingItem.is_published ? '1' : '0'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        is_published: e.target.value === '1' ? 1 : 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-cyan-600 outline-none bg-white"
                  >
                    <option value="1">Published</option>
                    <option value="0">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 text-white font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
