import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Trash2,
  Eye,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { api, DoctorData } from '../../lib/api';
import { useClinic } from '../../context/ClinicContext';
import { syncDoctorToFirestore, subscribeToDoctor, DoctorRealtimeData } from '../../lib/firebase';
import { uploadDoctorPhoto } from '../../lib/photoUpload';

export const AdminDoctorPage: React.FC = () => {
  const { reloadAll } = useClinic();
  const isEditingRef = useRef(false);

  const [formData, setFormData] = useState<Partial<DoctorData>>({
    name: 'Dr. Gultun Paswan',
    designation: 'Lead Consulting Physician',
    bio: '',
    qualifications: '',
    experience: '',
    specialties: '',
    registration: '',
    consultation_info: '',
    is_published: 1,
    image_url: '',
    phone: '',
    email: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Real-time Firestore subscription to canonical /doctor/doctor-gultun-paswan
  useEffect(() => {
    let isMounted = true;

    // 1. Initial backend load
    api.getAdminDoctor().then((res) => {
      if (!isMounted) return;
      const docData = res.data;
      if (res.success && docData) {
        setFormData((prev) => {
          if (isEditingRef.current) return prev;
          return {
            ...docData,
            is_published: docData.is_published !== undefined ? Number(docData.is_published) : 1,
          };
        });
      }
      setLoading(false);
    });

    // 2. Real-time Firestore synchronization
    const unsubscribe = subscribeToDoctor((data: DoctorRealtimeData | null) => {
      if (!isMounted || !data) return;
      setLoading(false);
      // Only auto-populate if user is not currently in the middle of active keystroke editing
      if (!isEditingRef.current) {
        setFormData((prev) => ({
          ...prev,
          name: data.name || prev.name || 'Dr. Gultun Paswan',
          designation: data.designation || prev.designation || 'Lead Consulting Physician',
          bio: data.bio !== undefined ? data.bio : prev.bio,
          qualifications: data.qualifications !== undefined ? data.qualifications : prev.qualifications,
          experience: data.experience !== undefined ? data.experience : prev.experience,
          specialties: data.specialties !== undefined ? data.specialties : prev.specialties,
          registration: data.registration !== undefined ? data.registration : prev.registration,
          consultation_info: data.consultation_info !== undefined ? data.consultation_info : prev.consultation_info,
          is_published: data.is_published !== undefined ? (typeof data.is_published === 'boolean' ? (data.is_published ? 1 : 0) : Number(data.is_published)) : (prev.is_published ?? 1),
          image_url: data.image_url !== undefined ? data.image_url : prev.image_url,
          phone: data.phone !== undefined ? data.phone : prev.phone,
          email: data.email !== undefined ? data.email : prev.email,
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleFieldChange = (key: keyof DoctorData, value: any) => {
    isEditingRef.current = true;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFeedback(null);
    isEditingRef.current = true;

    try {
      const { url } = await uploadDoctorPhoto(file);
      setFormData((prev) => ({ ...prev, image_url: url }));
      setFeedback({
        type: 'success',
        message: 'Doctor portrait uploaded and optimized. Click "Save Changes" to publish.',
      });
    } catch (err: any) {
      console.error('Doctor photo upload error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'File upload failed. Please try a valid JPG, PNG, or WebP image.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    isEditingRef.current = true;
    setFormData((prev) => ({ ...prev, image_url: '' }));
    setFeedback({
      type: 'success',
      message: 'Doctor portrait removed. Remember to click "Save Changes".',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading) return;

    if (!formData.name?.trim()) {
      setFeedback({ type: 'error', message: 'Doctor Full Name is required.' });
      return;
    }
    if (!formData.designation?.trim()) {
      setFeedback({ type: 'error', message: 'Doctor Designation is required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const isPubVal = formData.is_published ? 1 : 0;
    const cleanPayload = {
      name: formData.name.trim(),
      designation: formData.designation.trim(),
      bio: formData.bio || '',
      qualifications: formData.qualifications || '',
      experience: formData.experience || '',
      specialties: formData.specialties || '',
      registration: formData.registration || '',
      consultation_info: formData.consultation_info || '',
      is_published: Boolean(formData.is_published),
      image_url: formData.image_url || '',
      phone: formData.phone || '',
      email: formData.email || '',
    };

    try {
      // 1. Primary Source of Truth: Canonical Firestore write
      await syncDoctorToFirestore(cleanPayload);

      // 2. Secondary Backend Sync (SQLite & audit logs)
      await api.updateDoctor({
        ...cleanPayload,
        is_published: isPubVal,
      });

      isEditingRef.current = false;
      setFeedback({
        type: 'success',
        message: 'Doctor profile updated successfully! Real-time sync updated all open pages.',
      });
      await reloadAll();
    } catch (err: any) {
      console.error('[AdminDoctorPage] Save error:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update doctor profile. Please check your connection.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="bg-white rounded-3xl border border-slate-200 p-8 h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Return to Dashboard Navigation */}
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-cyan-700 transition-colors mb-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header and Preview Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Doctor Profile Management
          </h1>
          <p className="text-xs text-slate-500">
            Edit verified biographical, clinical, and registration details for Dr. Gultun Paswan
          </p>
        </div>

        {/* 20 & 22: Preview Doctor Profile Button (opens in new tab) */}
        <Link
          to="/doctor/dr-gultun-paswan"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200/80 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Eye className="w-4 h-4 text-cyan-700" />
          <span>Preview Doctor Profile</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor Portrait Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Profile Photo
            </label>
            <div className="flex flex-wrap items-center gap-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center relative shadow-inner">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Dr. Gultun Paswan"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors border border-slate-200">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Doctor Photo'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>

                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <span className="block text-[11px] text-slate-400">
                  JPG, PNG, or WebP. Max 5MB. Verified authentic portrait only.
                </span>
              </div>
            </div>
          </div>

          {/* Name & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Doctor Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Designation *
              </label>
              <input
                type="text"
                required
                placeholder="Lead Consulting Physician"
                value={formData.designation || ''}
                onChange={(e) => handleFieldChange('designation', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          {/* Biography */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Biography
            </label>
            <textarea
              rows={4}
              placeholder="Overview of Dr. Gultun Paswan's medical background, clinic commitment, and patient care approach..."
              value={formData.bio || ''}
              onChange={(e) => handleFieldChange('bio', e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs leading-relaxed focus:border-cyan-600 outline-none"
            />
            <span className="text-[11px] text-slate-400 block mt-0.5">
              If left blank or contains unverified placeholder, the public profile will display "Doctor's professional biography will be updated soon."
            </span>
          </div>

          {/* Qualifications & Specialties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Qualifications
              </label>
              <input
                type="text"
                placeholder="e.g. MBBS / Medical Degrees"
                value={formData.qualifications || ''}
                onChange={(e) => handleFieldChange('qualifications', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Specialties (Comma Separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Primary Care, Family Medicine, Outpatient Consultations"
                value={formData.specialties || ''}
                onChange={(e) => handleFieldChange('specialties', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          {/* Experience & Registration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Clinical Experience
              </label>
              <input
                type="text"
                placeholder="e.g. 10+ Years Clinical Practice"
                value={formData.experience || ''}
                onChange={(e) => handleFieldChange('experience', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Medical Registration
              </label>
              <input
                type="text"
                placeholder="e.g. State Medical Council Registration No."
                value={formData.registration || ''}
                onChange={(e) => handleFieldChange('registration', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          {/* Consultation Information */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Consultation Information
            </label>
            <input
              type="text"
              placeholder="e.g. Mon-Sat: 09:00 AM - 07:00 PM (By Appointment)"
              value={formData.consultation_info || ''}
              onChange={(e) => handleFieldChange('consultation_info', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Direct Phone (Optional)
              </label>
              <input
                type="text"
                placeholder="+91..."
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Direct Email (Optional)
              </label>
              <input
                type="email"
                placeholder="doctor@priyahealthcare.com"
                value={formData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-cyan-600 outline-none"
              />
            </div>
          </div>

          {/* Published Status Checkbox */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Published Status</span>
              <span className="text-[11px] text-slate-500">
                When enabled, Dr. Gultun Paswan's profile is accessible to the public at /doctor/dr-gultun-paswan.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.is_published)}
                onChange={(e) =>
                  handleFieldChange('is_published', e.target.checked ? 1 : 0)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Action Buttons: Save Changes & Preview Profile */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/doctor/dr-gultun-paswan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Eye className="w-4 h-4 text-cyan-700" />
              <span>Preview Profile</span>
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
