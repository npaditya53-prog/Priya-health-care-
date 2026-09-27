import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  api,
  ClinicData,
  DoctorData,
  SiteSettingsData,
  ServiceData,
  FAQData,
} from '../lib/api';

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
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [faqs, setFaqs] = useState<FAQData[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (doctorRes.success && doctorRes.data) setDoctor(doctorRes.data);
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
