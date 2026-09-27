export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface DoctorData {
  id: string;
  name: string;
  designation: string;
  bio: string;
  qualifications: string;
  experience: string;
  specialties: string;
  registration?: string | null;
  consultation_info?: string | null;
  is_published?: number | boolean;
  image_url: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  whatsapp: string;
  email: string;
  opening_hours: string;
  google_maps_url: string | null;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceData {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  icon: string;
  image_url: string | null;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentData {
  id: string;
  appointment_id: string;
  appointment_number: number;
  appointmentNumber?: number;
  patient_name: string;
  phone: string;
  email: string | null;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  message: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW' | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingsData {
  id: string;
  clinic_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  google_maps_url: string;
  logo_url: string;
  favicon_url: string;
  hero_image_url: string;
  doctor_image_url: string;
  social_links: string;
  seo_title: string;
  seo_description: string;
  working_days: string;
  opening_time: string;
  closing_time: string;
  appointment_duration: number;
  buffer_time: number;
  break_start: string;
  break_end: string;
  blocked_dates: string;
  updated_at: string;
}

export interface FAQData {
  id: string;
  question: string;
  answer: string;
  is_published: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContactMessageData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: 'NEW' | 'READ' | 'RESOLVED';
  created_at: string;
  updated_at: string;
}

export interface GalleryImageData {
  id: string;
  title: string;
  image_url: string;
  alt_text: string;
  category: string;
  display_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface TestimonialData {
  id: string;
  name: string;
  content: string;
  rating: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  todayAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  unreadMessages: number;
  activeServices: number;
}

export interface AuditLogData {
  id: string;
  admin_user_id: string | null;
  admin_user_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string | null;
  timestamp: string;
}

// Helper to retrieve auth token
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('priya_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {}),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Unable to connect to the clinic server. Please check your network connection.',
      },
    };
  }
}

export const api = {
  // Public APIs
  getSettings: () => request<SiteSettingsData>('/api/settings'),
  getClinic: () => request<ClinicData>('/api/clinic'),
  getDoctor: () => request<DoctorData>('/api/doctor'),
  getServices: () => request<ServiceData[]>('/api/services'),
  getServiceBySlug: (slug: string) => request<ServiceData>(`/api/services/${slug}`),
  getFaqs: () => request<FAQData[]>('/api/faqs'),
  getGallery: () => request<GalleryImageData[]>('/api/gallery'),
  getTestimonials: () => request<TestimonialData[]>('/api/testimonials'),

  // Available appointment slots
  getSlots: (date: string) =>
    request<{ date: string; slots: string[]; isWorkingDay: boolean; isBlocked: boolean }>(
      `/api/appointments/slots?date=${encodeURIComponent(date)}`
    ),

  // Submit appointment request
  createAppointment: (data: {
    patientName: string;
    phone: string;
    email?: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    message?: string;
  }) =>
    request<{
      appointmentId: string;
      appointmentNumber: number;
      patientName: string;
      appointmentDate: string;
      appointmentTime: string;
      status: string;
      message: string;
    }>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Track appointment status by Appointment Number, ID or Phone
  trackAppointment: (query: string) =>
    request<
      Array<{
        appointmentId: string;
        appointmentNumber: number;
        patientName: string;
        appointmentDate: string;
        appointmentTime: string;
        status: string;
        createdAt: string;
      }>
    >(`/api/appointments/track?query=${encodeURIComponent(query)}`),

  // Submit contact message
  sendContact: (data: { name: string; phone: string; email?: string; message: string }) =>
    request<{ id: string; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin APIs
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; name: string; email: string; role: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  googleLogin: (data: { email: string; name?: string; uid?: string }) =>
    request<{ token: string; user: { id: string; name: string; email: string; role: string } }>('/api/auth/google-login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<{ user: { userId: string; name: string; email: string; role: string } }>('/api/auth/me'),

  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAdminStats: () => request<AdminStats>('/api/admin/stats'),

  getAppointments: (params?: { status?: string; date?: string; search?: string; page?: number; limit?: number; sortBy?: string; order?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.date) query.set('date', params.date);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.order) query.set('order', params.order);
    return request<{ appointments: AppointmentData[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/appointments?${query.toString()}`
    );
  },

  updateAppointment: (id: string, updates: { status?: string; notes?: string; rescheduleDate?: string; rescheduleTime?: string }) =>
    request<AppointmentData>(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteAppointment: (id: string) =>
    request<{ message: string }>(`/api/appointments/${id}`, {
      method: 'DELETE',
    }),

  resetAppointmentCounter: (params?: { startFrom?: number; clearExisting?: boolean; date?: string }) =>
    request<{ date: string; lastAppointmentNumber: number; nextAppointmentNumber: number; message: string }>(
      '/api/admin/appointments/reset-counter',
      {
        method: 'POST',
        body: JSON.stringify(params || {}),
      }
    ),

  getContactMessages: () => request<ContactMessageData[]>('/api/contact'),

  updateContactMessage: (id: string, status: 'NEW' | 'READ' | 'RESOLVED') =>
    request<ContactMessageData>(`/api/contact/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteContactMessage: (id: string) =>
    request<{ message: string }>(`/api/contact/${id}`, {
      method: 'DELETE',
    }),

  getAllServices: () => request<ServiceData[]>('/api/services/all'),

  createService: (data: any) =>
    request<ServiceData>('/api/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateService: (id: string, data: any) =>
    request<ServiceData>(`/api/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteService: (id: string) =>
    request<{ message: string }>(`/api/services/${id}`, {
      method: 'DELETE',
    }),

  getAdminDoctor: () => request<DoctorData>('/api/admin/doctor'),

  updateDoctor: (data: Partial<DoctorData>) =>
    request<DoctorData>('/api/admin/doctor', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateClinic: (data: Partial<ClinicData>) =>
    request<ClinicData>('/api/clinic', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateSettings: (data: Partial<SiteSettingsData>) =>
    request<SiteSettingsData>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAllFaqs: () => request<FAQData[]>('/api/faqs/all'),

  createFaq: (data: { question: string; answer: string; displayOrder?: number }) =>
    request<FAQData>('/api/faqs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFaq: (id: string, data: Partial<FAQData>) =>
    request<FAQData>(`/api/faqs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteFaq: (id: string) =>
    request<{ message: string }>(`/api/faqs/${id}`, {
      method: 'DELETE',
    }),

  getAllTestimonials: () => request<TestimonialData[]>('/api/testimonials/all'),

  createTestimonial: (data: { name: string; content: string; rating?: number; isPublished?: boolean }) =>
    request<TestimonialData>('/api/testimonials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTestimonial: (id: string, data: Partial<TestimonialData>) =>
    request<TestimonialData>(`/api/testimonials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTestimonial: (id: string) =>
    request<{ message: string }>(`/api/testimonials/${id}`, {
      method: 'DELETE',
    }),

  addGalleryImage: (data: { title: string; imageUrl: string; altText: string; category?: string; displayOrder?: number }) =>
    request<GalleryImageData>('/api/gallery', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteGalleryImage: (id: string) =>
    request<{ message: string }>(`/api/gallery/${id}`, {
      method: 'DELETE',
    }),

  getAuditLogs: () => request<AuditLogData[]>('/api/admin/audit-logs'),

  uploadFile: async (file: File): Promise<ApiResult<{ url: string; filename: string }>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('priya_admin_token');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData,
      });

      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'UPLOAD_ERROR', message: err.message || 'File upload failed' },
      };
    }
  },
};
