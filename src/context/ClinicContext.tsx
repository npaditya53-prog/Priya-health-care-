import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  api,
  ClinicData,
  DoctorData,
  SiteSettingsData,
  ServiceData,
  FAQData,
} from '../lib/api';
import { subscribeToDoctor } from '../lib/firebase';

interface ClinicContextType {
  clinic: ClinicData | null;
  doctor: DoctorData | null;
  settings: SiteSettingsData | null;
  services: ServiceData[];
  faqs: FAQData[];
  loading: boolean;
  reloadAll: () => Promise<void>;
  isVerified: (value: string | null | undefined) => boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [doctor, setDoctor] = useState<DoctorData | null>(() => {
    try {
      const cached = localStorage.getItem('priya_cached_doctor');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [faqs, setFaqs] = useState<FAQData[]>([]);
  const [loading, setLoading] = useState(true);

  const firestoreDoctorLoadedRef = useRef(false);

  const reloadAll = async () => {
    try {
      const [clinicRes, doctorRes, settingsRes, servicesRes, faqsRes] = await Promise.all([
        api.getClinic(),
        api.getDoctor(),
        api.getSettings(),
        api.getServices(),
        api.getFaqs(),
      ]);

      if (clinicRes.success && clinicRes.data) setClinic(clinicRes.data);
      if (doctorRes.success && doctorRes.data) {
        const d = doctorRes.data;
        const cleanDoctor: DoctorData = {
          ...d,
          bio: d.bio && d.bio !== '[ADD VERIFIED INFORMATION]' ? d.bio : '',
          qualifications: d.qualifications && d.qualifications !== '[ADD VERIFIED INFORMATION]' ? d.qualifications : '',
          experience: d.experience && d.experience !== '[ADD VERIFIED INFORMATION]' ? d.experience : '',
          specialties: d.specialties && d.specialties !== '[ADD VERIFIED INFORMATION]' ? d.specialties : '',
          registration: d.registration && d.registration !== '[ADD VERIFIED INFORMATION]' ? d.registration : '',
          consultation_info: d.consultation_info && d.consultation_info !== '[ADD VERIFIED INFORMATION]' ? d.consultation_info : '',
          image_url: d.image_url || d.photo_base64 || '',
          photo_base64: d.photo_base64 || d.image_url || '',
          phone: d.phone && d.phone !== '[ADD VERIFIED INFORMATION]' ? d.phone : '',
          email: d.email && d.email !== '[ADD VERIFIED INFORMATION]' ? d.email : '',
        };

        setDoctor((prev) => {
          if (!prev) return cleanDoctor;
          return {
            ...cleanDoctor,
            ...prev,
            qualifications: prev.qualifications || cleanDoctor.qualifications,
            image_url: prev.image_url || cleanDoctor.image_url,
          };
        });
      }
      if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data);
      if (servicesRes.success && servicesRes.data) setServices(servicesRes.data);
      if (faqsRes.success && faqsRes.data) setFaqs(faqsRes.data);
    } catch (e) {
      console.error('Failed to load clinic information:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadAll();

    // Canonical real-time listener to Firestore doctor document /doctor/doctor-gultun-paswan
    const unsubscribeDoctor = subscribeToDoctor(
      (data) => {
        if (data) {
          firestoreDoctorLoadedRef.current = true;
          const freshDoc: DoctorData = {
            id: 'doctor-gultun-paswan',
            name: data.name || 'Dr. Gultun Paswan',
            designation: data.designation || 'Lead Consulting Physician',
            bio: data.bio && data.bio !== '[ADD VERIFIED INFORMATION]' ? data.bio : '',
            qualifications: data.qualifications && data.qualifications !== '[ADD VERIFIED INFORMATION]' ? data.qualifications : '',
            experience: data.experience && data.experience !== '[ADD VERIFIED INFORMATION]' ? data.experience : '',
            specialties: data.specialties && data.specialties !== '[ADD VERIFIED INFORMATION]' ? data.specialties : '',
            registration: data.registration && data.registration !== '[ADD VERIFIED INFORMATION]' ? data.registration : '',
            consultation_info: data.consultation_info && data.consultation_info !== '[ADD VERIFIED INFORMATION]' ? data.consultation_info : '',
            is_published:
              data.is_published !== undefined
                ? typeof data.is_published === 'boolean'
                  ? (data.is_published ? 1 : 0)
                  : Number(data.is_published)
                : 1,
            image_url: data.image_url || (data as any).photo_base64 || '',
            photo_base64: (data as any).photo_base64 || data.image_url || '',
            phone: data.phone && data.phone !== '[ADD VERIFIED INFORMATION]' ? data.phone : '',
            email: data.email && data.email !== '[ADD VERIFIED INFORMATION]' ? data.email : '',
            created_at: '',
            updated_at: data.updatedAt || new Date().toISOString(),
          };

          setDoctor(freshDoc);

          // Update local cache for instant retrieval across browser reopens
          try {
            localStorage.setItem('priya_cached_doctor', JSON.stringify(freshDoc));
          } catch {
            // ignore
          }
        }
      },
      (err) => {
        console.warn('[ClinicContext] Real-time Doctor listener warning:', err);
      }
    );

    return () => {
      unsubscribeDoctor();
    };
  }, []);

  // Helper to distinguish verified clinic info vs placeholder
  const isVerified = (value: string | null | undefined): boolean => {
    if (!value) return false;
    const trimmed = value.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.includes('[ADD VERIFIED INFORMATION]') &&
      !trimmed.toLowerCase().includes('pending verification')
    );
  };

  return (
    <ClinicContext.Provider
      value={{
        clinic,
        doctor,
        settings,
        services,
        faqs,
        loading,
        reloadAll,
        isVerified,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
