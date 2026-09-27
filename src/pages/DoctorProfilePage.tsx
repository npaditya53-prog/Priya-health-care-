import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Calendar,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ArrowRight,
  GraduationCap,
  Award,
  Stethoscope,
  FileCheck2,
  Share2,
  Copy,
  Check,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  ExternalLink,
  X,
  ChevronLeft,
  Info,
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { api, GalleryImageData } from '../lib/api';
import { subscribeToDoctor, DoctorRealtimeData } from '../lib/firebase';

export const DoctorProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { doctor: contextDoctor, clinic, settings, services, faqs, loading: contextLoading, isVerified, reloadAll } = useClinic();

  const [firestoreDoctor, setFirestoreDoctor] = useState<any>(null);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [firestoreStatus, setFirestoreStatus] = useState<'loading' | 'found' | 'not_found' | 'error'>('loading');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [galleryImages, setGalleryImages] = useState<GalleryImageData[]>([]);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  // Real-time Firestore subscription to canonical /doctor/doctor-gultun-paswan
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToDoctor(
      (data, fromCache) => {
        if (!isMounted) return;
        if (data) {
          setFirestoreDoctor(data);
          setFirestoreStatus('found');
          setFirestoreError(null);
        } else {
          setFirestoreDoctor(null);
          setFirestoreStatus('not_found');
        }
        setFirestoreLoading(false);
      },
      (err) => {
        if (!isMounted) return;
        console.warn('[DoctorProfilePage] Firestore doctor listener notice:', err);
        setFirestoreError(err.message || 'Error subscribing to doctor data');
        setFirestoreStatus('error');
        setFirestoreLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Merge real-time Firestore doctor with context doctor (Firestore takes highest precedence)
  const doctor = useMemo(() => {
    if (firestoreDoctor) {
      return {
        ...contextDoctor,
        ...firestoreDoctor,
      };
    }
    return contextDoctor;
  }, [firestoreDoctor, contextDoctor]);

  // Reset image load state whenever doctor photo URL updates
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [doctor?.image_url]);

  // Load verified gallery images
  useEffect(() => {
    api.getGallery().then((res) => {
      if (res.success && res.data) {
        setGalleryImages(res.data);
      }
    });
  }, []);

  // Sync SEO Title and Meta Description
  useEffect(() => {
    const pageTitle = 'Dr. Gultun Paswan | Priya Health Care, Singahi';
    const pageDesc =
      'Learn more about Dr. Gultun Paswan and consultation information at Priya Health Care, Singahi.';

    document.title = pageTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageDesc);

    // Schema.org structured data for Physician
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'Physician',
      name: doctor?.name || 'Dr. Gultun Paswan',
      jobTitle: doctor?.designation || 'Lead Consulting Physician',
      worksFor: {
        '@type': 'MedicalClinic',
        name: clinic?.name || 'Priya Health Care',
        address: {
          '@type': 'PostalAddress',
          addressLocality: clinic?.city || 'Singahi',
          addressRegion: isVerified(clinic?.state) ? clinic?.state : 'Uttar Pradesh',
          addressCountry: 'IN',
        },
      },
      medicalSpecialty: isVerified(doctor?.specialties) ? doctor?.specialties : 'General Practice',
      url: 'https://priya-health-care.vercel.app/doctor/dr-gultun-paswan',
    };

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', 'https://priya-health-care.vercel.app/doctor/dr-gultun-paswan');

    let scriptTag = document.getElementById('doctor-profile-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'doctor-profile-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(schemaData);

    return () => {
      const existingScript = document.getElementById('doctor-profile-schema');
      if (existingScript) existingScript.remove();
    };
  }, [doctor, clinic, isVerified]);

  // Lightbox keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') setActiveLightboxIndex(null);
      if (e.key === 'ArrowRight' && galleryImages.length > 0) {
        setActiveLightboxIndex((prev) => ((prev ?? 0) + 1) % galleryImages.length);
      }
      if (e.key === 'ArrowLeft' && galleryImages.length > 0) {
        setActiveLightboxIndex((prev) =>
          (prev ?? 0) === 0 ? galleryImages.length - 1 : (prev ?? 0) - 1
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, galleryImages]);

  // Parsed Specialties array
  const specialtiesList: string[] = useMemo(() => {
    if (!doctor?.specialties || !isVerified(doctor.specialties)) return [];
    return String(doctor.specialties)
      .split(/[,;\n•]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }, [doctor?.specialties, isVerified]);

  // Toggle FAQ accordion item
  const toggleFaq = (index: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Production public URL for Dr. Gultun Paswan's profile
  const publicBaseUrl = 'https://priya-health-care.vercel.app';
  const profileUrl = `${publicBaseUrl}/doctor/dr-gultun-paswan`;

  // Robust copy helper with fallback
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (err) {
      console.error('Fallback copy error:', err);
      return false;
    }
  };

  // Copy Profile Link to Clipboard (priya-health-care.vercel.app)
  const handleCopyLink = () => {
    copyToClipboard(profileUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  // WhatsApp and Facebook share handlers (using priya-health-care.vercel.app)
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Consult with Dr. Gultun Paswan at Priya Health Care, Singahi:\n${profileUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(profileUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  // 1. Loading Skeleton State: Show while real-time data is actively loading and no profile exists yet
  const isPageLoading = (firestoreStatus === 'loading' && !doctor) || (contextLoading && !doctor && firestoreLoading);
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-slate-200 rounded" />

        {/* Hero skeleton */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-72 sm:h-96 bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-8 space-y-4">
            <div className="h-6 w-36 bg-slate-200 rounded-full" />
            <div className="h-10 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-20 w-full bg-slate-200 rounded-xl mt-4" />
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-40 bg-slate-200 rounded-xl" />
              <div className="h-12 w-36 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 bg-white rounded-3xl border border-slate-200 p-6" />
          <div className="h-56 bg-white rounded-3xl border border-slate-200 p-6" />
        </div>
      </div>
    );
  }

  // 2. Error Fallback State: Show explicit error instead of falsely claiming "Not Found"
  if (firestoreStatus === 'error' && !doctor) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Connection Notice</h1>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            {firestoreError || 'Unable to connect to live healthcare records. Please check your network connection.'}
          </p>
          <button
            onClick={() => reloadAll()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // 3. Genuine Missing State: ONLY when confirmed nonexistent by Firestore & backend
  if (!doctor && (firestoreStatus === 'not_found' || !isPageLoading)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Profile Not Found</h1>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            The requested doctor profile is currently unavailable or has not been published yet.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-sm shadow-xs transition-colors"
          >
            Return to Priya Health Care
          </Link>
        </div>
      </div>
    );
  }

  // 4. Doctor record unpublished state
  const isPublished =
    doctor &&
    (doctor.is_published === undefined ||
      doctor.is_published === true ||
      Number(doctor.is_published) === 1 ||
      doctor.is_published === '1');

  if (!isPublished) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Profile Pending Publication</h1>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            This doctor profile is currently undergoing updates and will be available shortly.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-sm shadow-xs transition-colors"
          >
            Return to Priya Health Care
          </Link>
        </div>
      </div>
    );
  }

  // 4. Error Fallback State
  if (!doctor.name) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Profile Unavailable</h1>
          <p className="text-sm text-slate-600 mt-2 mb-6">
            We couldn't load the profile information right now. Please try again or contact Priya
            Health Care directly.
          </p>
          <button
            onClick={() => reloadAll()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isPhotoVerified = isVerified(doctor.image_url);
  const isBioVerified = isVerified(doctor.bio);
  const isQualVerified = isVerified(doctor.qualifications);
  const isExpVerified = isVerified(doctor.experience);
  const isSpecVerified = isVerified(doctor.specialties);
  const isRegVerified = isVerified(doctor.registration);
  const isPhoneVerified = isVerified(clinic?.phone);
  const isWhatsappVerified = isVerified(clinic?.whatsapp);
  const isAddressVerified = isVerified(clinic?.address);
  const isMapsVerified = Boolean(clinic?.google_maps_url && clinic.google_maps_url.trim().length > 0);

  // Dynamic OPD timings display
  const consultationTimings =
    settings?.opening_time && settings?.closing_time
      ? `${settings.opening_time} - ${settings.closing_time} (${settings.working_days || 'Monday to Saturday'})`
      : isVerified(clinic?.opening_hours)
      ? clinic?.opening_hours
      : isVerified(doctor.consultation_info)
      ? doctor.consultation_info
      : 'Consultation timings will be updated soon.';

  // Default dynamic FAQs
  const dynamicFaqs = [
    {
      question: 'How can I book an appointment with Dr. Gultun Paswan?',
      answer:
        'You can request a consultation appointment online by clicking "Book Appointment" on this portal, or by contacting the clinic directly via phone or WhatsApp during outpatient consultation hours.',
    },
    {
      question: 'Where does Dr. Gultun Paswan consult patients?',
      answer: `Dr. Gultun Paswan consults at Priya Health Care located in Singahi, Uttar Pradesh. ${
        isAddressVerified ? `Clinic address: ${clinic?.address}.` : ''
      }`,
    },
    {
      question: 'What are the consultation timings?',
      answer: `Outpatient consultation hours are: ${consultationTimings}. Patients are advised to arrive 10-15 minutes prior to their scheduled consultation slot.`,
    },
    // Include published FAQs from the database that are relevant
    ...faqs.slice(0, 3).map((f) => ({ question: f.question, answer: f.answer })),
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-24 lg:pb-16 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-10">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-slate-500 font-medium"
          >
            <Link to="/" className="hover:text-sky-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/doctor" className="hover:text-sky-900 transition-colors">
              Doctor
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold" aria-current="page">
              Dr. Gultun Paswan
            </span>
          </nav>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-sky-900 font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>← Back to Home</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 3. DOCTOR PROFILE HERO (Two-column desktop layout / Mobile-first) */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 lg:p-12 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Doctor Photograph Area */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-sky-900 via-slate-800 to-sky-950 border-4 border-slate-100 shadow-md flex items-center justify-center">
                {isPhotoVerified && !imageError ? (
                  <div className="relative w-full h-full">
                    {!imageLoaded && (
                      <div className="absolute inset-0 bg-slate-800/80 animate-pulse flex items-center justify-center">
                        <User className="w-12 h-12 text-slate-500" />
                      </div>
                    )}
                    <img
                      src={doctor.image_url!}
                      alt={`${doctor.name || 'Dr. Gultun Paswan'} - ${doctor.designation || 'Lead Consulting Physician'}`}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      loading="eager"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  /* Professional Placeholder: Never fake artificial face */
                  <div className="flex flex-col items-center justify-center p-8 text-center text-sky-200">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 mb-4 shadow">
                      <User className="w-10 h-10 text-cyan-200" />
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">Doctor Profile</span>
                    <span className="text-xs text-sky-200 mt-1 font-medium">Priya Health Care • Singahi</span>
                    <span className="mt-4 text-[11px] bg-sky-950/80 border border-sky-700/60 text-cyan-300 px-3 py-1 rounded-full font-semibold">
                      Official Medical Practitioner
                    </span>
                  </div>
                )}

                {/* Verified badge pill */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/95 text-white text-[11px] font-bold shadow-xs backdrop-blur-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Physician</span>
                  </span>
                </div>
              </div>

              {/* Consultation availability tag */}
              <div className="mt-3.5 inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Available by appointment in Singahi</span>
              </div>
            </div>

            {/* Right Column: Doctor Title, Intro, and Primary CTAs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Small Label */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/90 border border-sky-200 text-sky-900 text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-cyan-700" />
                <span>PRIYA HEALTH CARE • SINGAHI</span>
              </div>

              {/* Main Heading */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
                  {doctor.name || 'Dr. Gultun Paswan'}
                </h1>
                <p className="text-lg sm:text-xl font-bold text-cyan-800 mt-1.5">
                  {doctor.designation || 'Lead Consulting Physician'}
                </p>
              </div>

              {/* Short Introduction */}
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                Dr. Gultun Paswan is associated with Priya Health Care, Singahi. Explore the doctor's
                professional profile, consultation information and available healthcare services.
              </p>

              {/* Key Practice Highlights (Verified Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <Stethoscope className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Outpatient Consultations</span>
                    <span className="text-slate-500">Priya Health Care Clinic</span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">Consultation Schedule</span>
                    <span className="text-slate-500">Structured appointment slots</span>
                  </div>
                </div>
              </div>

              {/* Two CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/appointments"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all active:scale-98"
                >
                  <Calendar className="w-4 h-4 text-cyan-300" />
                  <span>Book Appointment</span>
                  <ArrowRight className="w-4 h-4 text-sky-300" />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all"
                >
                  <Phone className="w-4 h-4 text-cyan-700" />
                  <span>Contact Clinic</span>
                </Link>
              </div>

              {/* Social Sharing Toolbar */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="font-semibold flex items-center gap-1.5 text-slate-700">
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share Profile:</span>
                </span>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  aria-label="Share on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleFacebookShare}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  aria-label="Share on Facebook"
                >
                  <span>Facebook</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  aria-label="Copy page link"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold hidden sm:inline">
                        priya-health-care.vercel.app Copied!
                      </span>
                      <span className="text-emerald-700 font-bold sm:hidden">
                        Link Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. VERIFIED INFORMATION SECTION */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-900 text-xs font-bold mb-1">
                <FileCheck2 className="w-3.5 h-3.5 text-cyan-700" />
                <span>Verified Credentials</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Professional Information
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-sm sm:text-right">
              Priya Health Care enforces strict information accuracy. Unverified fields are
              respectfully labeled.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Name */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Doctor Name
              </span>
              <p className="text-sm font-bold text-slate-900">{doctor.name || 'Dr. Gultun Paswan'}</p>
            </div>

            {/* Designation */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Designation
              </span>
              <p className="text-sm font-bold text-slate-900">
                {doctor.designation || 'Lead Consulting Physician'}
              </p>
            </div>

            {/* Qualifications */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Qualifications
              </span>
              {isQualVerified ? (
                <p className="text-sm font-semibold text-slate-900">{doctor.qualifications}</p>
              ) : (
                <p className="text-xs text-slate-500 italic">Information will be updated soon.</p>
              )}
            </div>

            {/* Medical Specialization */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Medical Specialization
              </span>
              {isSpecVerified ? (
                <p className="text-sm font-semibold text-slate-900">{doctor.specialties}</p>
              ) : (
                <p className="text-xs text-slate-500 italic">Information will be updated soon.</p>
              )}
            </div>

            {/* Experience */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Experience
              </span>
              {isExpVerified ? (
                <p className="text-sm font-semibold text-slate-900">{doctor.experience}</p>
              ) : (
                <p className="text-xs text-slate-500 italic">Information will be updated soon.</p>
              )}
            </div>

            {/* Registration */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Registration
              </span>
              {isRegVerified ? (
                <p className="text-sm font-semibold text-slate-900">{doctor.registration}</p>
              ) : (
                <p className="text-xs text-slate-500 italic">Information will be updated soon.</p>
              )}
            </div>

            {/* Consultation Location */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 md:col-span-2 lg:col-span-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Consultation Location
              </span>
              <p className="text-sm font-bold text-slate-900">
                Priya Health Care, Singahi, Uttar Pradesh
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. ABOUT THE DOCTOR */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              <User className="w-4 h-4 text-sky-700" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              About Dr. Gultun Paswan
            </h2>
          </div>

          <div className="text-slate-600 leading-relaxed text-sm sm:text-base pt-2">
            {isBioVerified ? (
              <div className="space-y-4 whitespace-pre-line">{doctor.bio}</div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Biographical Profile</span>
                  <p className="mt-1 text-amber-800">
                    Doctor's professional biography will be updated soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. CONSULTATION INFORMATION */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-900 text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-700" />
              <span>OPD Schedule</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Consultation at Priya Health Care
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              General outpatient timings and location details for Dr. Gultun Paswan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Clinic */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Clinic
              </span>
              <p className="text-sm font-bold text-slate-900">Priya Health Care</p>
              <span className="text-xs text-slate-500 mt-0.5 block">Singahi Center</span>
            </div>

            {/* Location */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Location
              </span>
              <p className="text-sm font-bold text-slate-900">Singahi, Uttar Pradesh</p>
              <span className="text-xs text-slate-500 mt-0.5 block">Lakhimpur Kheri Dist.</span>
            </div>

            {/* Consultation Hours */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Consultation Hours
              </span>
              <p className="text-sm font-bold text-slate-900">{consultationTimings}</p>
            </div>

            {/* Appointment */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Appointment
              </span>
              <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Available by appointment
              </p>
              <span className="text-xs text-slate-500 mt-0.5 block">Prior booking advised</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. APPOINTMENT CTA (Visually strong section) */}
        {/* ========================================================================= */}
        <section className="rounded-3xl bg-gradient-to-r from-sky-900 via-sky-800 to-slate-900 p-8 sm:p-12 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold border border-white/15">
              <Calendar className="w-3.5 h-3.5" />
              <span>Outpatient Consultations</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Consult With Dr. Gultun Paswan
            </h2>
            <p className="text-sky-200 text-sm sm:text-base leading-relaxed">
              Request an appointment at Priya Health Care, Singahi. Our staff confirms slots quickly
              to ensure patient convenience and minimal waiting time.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/appointments"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-98"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
              >
                <span>Direct Contact Details</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. SERVICES ASSOCIATED WITH THE DOCTOR */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-900 text-xs font-bold mb-1">
                <Stethoscope className="w-3.5 h-3.5 text-sky-700" />
                <span>Clinic Capabilities</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Healthcare Services
              </h2>
            </div>
            <Link
              to="/services"
              className="text-xs font-semibold text-sky-800 hover:text-cyan-700 flex items-center gap-1 transition-colors"
            >
              <span>View all services catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.slice(0, 6).map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-between hover:border-sky-300 hover:shadow-xs transition-all"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5 text-sky-700" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{service.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {service.short_description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                  <Link
                    to={`/services/${service.slug}`}
                    className="text-xs font-bold text-sky-800 hover:text-cyan-700 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to="/appointments"
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10 & 11. CLINIC INFORMATION & GOOGLE MAPS */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-900 text-xs font-bold mb-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-700" />
              <span>Location & Directions</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Where to Find Dr. Gultun Paswan
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Clinic Details */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {clinic?.name || 'Priya Health Care'}
                  </h3>
                  <p className="text-xs text-cyan-700 font-semibold mt-0.5">Singahi Center</p>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800 block mb-0.5">Address:</span>
                  {isAddressVerified ? (
                    <p>{clinic?.address}</p>
                  ) : (
                    <p className="text-slate-500 italic">Address details will be updated soon.</p>
                  )}
                  <p className="mt-1 font-semibold text-slate-700">
                    Singahi, {isVerified(clinic?.state) ? clinic?.state : 'Uttar Pradesh'}
                    {isVerified(clinic?.pincode) ? ` - ${clinic?.pincode}` : ''}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                  {isMapsVerified ? (
                    <a
                      href={clinic?.google_maps_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Get Directions</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Directions link pending clinic map setup
                    </span>
                  )}

                  {isPhoneVerified && (
                    <a
                      href={`tel:${clinic?.phone}`}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Call Clinic</span>
                    </a>
                  )}

                  {isWhatsappVerified && (
                    <a
                      href={`https://wa.me/${clinic?.whatsapp?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Google Maps View */}
            <div className="lg:col-span-7">
              {isMapsVerified ? (
                <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative">
                  <iframe
                    title="Priya Health Care Singahi Location Map"
                    src={clinic?.google_maps_url!}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div className="w-full h-64 sm:h-72 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <MapPin className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Clinic location map will be available soon.
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Verified Google Maps coordinates and embedded map will be activated once supplied
                    by the clinic administrator.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 12. PROFESSIONAL TIMELINE (Verified Content Only) */}
        {/* ========================================================================= */}
        {(isQualVerified || isExpVerified) && (
          <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-900 text-xs font-bold mb-1">
                <Award className="w-3.5 h-3.5 text-sky-700" />
                <span>Verified Milestones</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Professional Journey
              </h2>
            </div>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-sky-100 space-y-6">
              {isQualVerified && (
                <div className="relative">
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full bg-cyan-600 border-4 border-white shadow-xs" />
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider block">
                      Education & Training
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {doctor.qualifications}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verified medical qualifications & academic credentials
                    </p>
                  </div>
                </div>
              )}

              {isExpVerified && (
                <div className="relative">
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full bg-cyan-600 border-4 border-white shadow-xs" />
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider block">
                      Professional Experience
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {doctor.experience}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Clinical practice and patient care background
                    </p>
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow-xs" />
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wider block">
                    Current Clinical Practice
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    Lead Consulting Physician — Priya Health Care, Singahi
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Consulting outpatient cases, diagnostic evaluations, and ongoing health management.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 13. DOCTOR & CLINIC PHOTO GALLERY (If verified images exist) */}
        {/* ========================================================================= */}
        {galleryImages.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-900 text-xs font-bold mb-1">
                  <span>Photo Gallery</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Doctor & Clinic
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Click any photograph to view high-resolution details.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveLightboxIndex(idx)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-left cursor-pointer"
                  aria-label={`View ${img.title || 'Clinic photo'}`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs font-bold text-white line-clamp-1">{img.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 14. FAQ SECTION */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 text-cyan-900 text-xs font-bold mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-700" />
              <span>Patient Inquiries</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {dynamicFaqs.map((faq, index) => {
              const isOpen = openFaqIndices.includes(index);
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-bold text-slate-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Clinical Notice */}
        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/60 text-xs text-sky-950 flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Clinical Practice Notice:</strong> All consultations with Dr. Gultun Paswan are
            conducted in accordance with professional outpatient medical standards. For acute or
            life-threatening conditions, please visit the nearest hospital emergency department immediately.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 18. MOBILE STICKY CTA ACTION BAR */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          {isPhoneVerified ? (
            <a
              href={`tel:${clinic?.phone}`}
              className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Phone className="w-4 h-4 text-cyan-700" />
              <span>Call</span>
            </a>
          ) : (
            <button
              disabled
              className="py-2.5 px-2 rounded-xl bg-slate-50 text-slate-400 font-medium text-xs flex flex-col items-center justify-center gap-1"
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </button>
          )}

          {isWhatsappVerified ? (
            <a
              href={`https://wa.me/${clinic?.whatsapp?.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <button
              disabled
              className="py-2.5 px-2 rounded-xl bg-slate-50 text-slate-400 font-medium text-xs flex flex-col items-center justify-center gap-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          )}

          <Link
            to="/appointments"
            className="py-2.5 px-2 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-xs transition-colors"
          >
            <Calendar className="w-4 h-4 text-cyan-300" />
            <span>Book</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Lightbox Modal for Photo Gallery */}
      {/* ========================================================================= */}
      {activeLightboxIndex !== null && galleryImages[activeLightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveLightboxIndex(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setActiveLightboxIndex(null)}
              className="absolute -top-12 right-0 text-white hover:text-cyan-300 p-2 text-sm font-semibold flex items-center gap-1 cursor-pointer"
              aria-label="Close image viewer"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>

            {/* Main Lightbox Image */}
            <img
              src={galleryImages[activeLightboxIndex].image_url}
              alt={
                galleryImages[activeLightboxIndex].alt_text ||
                galleryImages[activeLightboxIndex].title
              }
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            <div className="mt-3 text-center text-white">
              <h4 className="text-base font-bold">
                {galleryImages[activeLightboxIndex].title}
              </h4>
              <p className="text-xs text-sky-200 mt-0.5">
                {galleryImages[activeLightboxIndex].alt_text || 'Priya Health Care, Singahi'}
              </p>
            </div>

            {/* Next / Previous Controls */}
            {galleryImages.length > 1 && (
              <div className="mt-4 flex items-center gap-4 text-white">
                <button
                  type="button"
                  onClick={() =>
                    setActiveLightboxIndex((prev) =>
                      (prev ?? 0) === 0 ? galleryImages.length - 1 : (prev ?? 0) - 1
                    )
                  }
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Previous photograph"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-xs text-slate-300">
                  {activeLightboxIndex + 1} / {galleryImages.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveLightboxIndex((prev) => ((prev ?? 0) + 1) % galleryImages.length)
                  }
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="Next photograph"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
