import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClinicProvider } from './context/ClinicContext';

// Public Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileActionBar } from './components/MobileActionBar';

// Public Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { DoctorPage } from './pages/DoctorPage';
import { DoctorProfilePage } from './pages/DoctorProfilePage';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage';
import { AdminCalendarPage } from './pages/admin/AdminCalendarPage';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminDoctorPage } from './pages/admin/AdminDoctorPage';
import { AdminClinicPage } from './pages/admin/AdminClinicPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminFAQsPage } from './pages/admin/AdminFAQsPage';
import { AdminTestimonialsPage } from './pages/admin/AdminTestimonialsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Scroll to top on navigation helper
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Public Website Layout wrapper
const PublicLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileActionBar />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ClinicProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Website Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/doctor" element={<DoctorProfilePage />} />
              <Route path="/doctor/dr-gultun-paswan" element={<DoctorProfilePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:slug" element={<ServiceDetailPage />} />
              <Route path="/facilities" element={<FacilitiesPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Dashboard Protected Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="appointments" element={<AdminAppointmentsPage />} />
              <Route path="calendar" element={<AdminCalendarPage />} />
              <Route path="messages" element={<AdminMessagesPage />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="doctor" element={<AdminDoctorPage />} />
              <Route path="clinic" element={<AdminClinicPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="faqs" element={<AdminFAQsPage />} />
              <Route path="testimonials" element={<AdminTestimonialsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ClinicProvider>
    </AuthProvider>
  );
}

export default App;
