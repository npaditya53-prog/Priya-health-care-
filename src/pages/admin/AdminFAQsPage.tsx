import React, { useEffect, useState } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { api, FAQData } from '../../lib/api';
import { useClinic } from '../../context/ClinicContext';

export const AdminFAQsPage: React.FC = () => {
  const { reloadAll } = useClinic();
  const [faqs, setFaqs] = useState<FAQData[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingFaq, setEditingFaq] = useState<Partial<FAQData> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    const res = await api.getAllFaqs();
    setLoading(false);
    if (res.success && res.data) {
      setFaqs(res.data);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openNew = () => {
    setEditingFaq({
      question: '',
      answer: '',
      is_published: 1,
      display_order: faqs.length + 1,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;
    setSaving(true);

    let res;
    if (editingFaq.id) {
      res = await api.updateFaq(editingFaq.id, editingFaq);
    } else {
      res = await api.createFaq({
        question: editingFaq.question || '',
        answer: editingFaq.answer || '',
        displayOrder: editingFaq.display_order || 1,
      });
    }

    setSaving(false);
    if (res.success) {
      setEditingFaq(null);
      fetchFaqs();
      reloadAll();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this question?')) return;
    const res = await api.deleteFaq(id);
    if (res.success) {
      fetchFaqs();
      reloadAll();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            FAQ Management
          </h1>
          <p className="text-xs text-slate-500">
            Publish and manage patient questions and clinic answers
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New FAQ</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading questions...</div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No FAQs created yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-bold">
                      #{faq.display_order}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{faq.question}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        faq.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {faq.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 pl-6 leading-relaxed">{faq.answer}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingFaq(faq)}
                    className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
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

      {editingFaq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingFaq.id ? 'Edit FAQ' : 'Create FAQ'}
              </h3>
              <button
                onClick={() => setEditingFaq(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={editingFaq.question || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-cyan-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Answer</label>
                <textarea
                  rows={4}
                  required
                  value={editingFaq.answer || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-cyan-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={editingFaq.display_order ?? 1}
                    onChange={(e) =>
                      setEditingFaq({
                        ...editingFaq,
                        display_order: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-cyan-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Publish Status</label>
                  <select
                    value={editingFaq.is_published ? '1' : '0'}
                    onChange={(e) =>
                      setEditingFaq({ ...editingFaq, is_published: e.target.value === '1' ? 1 : 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-cyan-600 outline-none bg-white"
                  >
                    <option value="1">Published</option>
                    <option value="0">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-cyan-600 text-white font-bold"
                >
                  {saving ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
