import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const AppointmentCreateSchema = z.object({
  patientName: z.string().min(2, 'Full Name must be at least 2 characters').max(100, 'Name is too long'),
  phone: z.string().min(10, 'Please enter a valid phone number (at least 10 digits)').max(15, 'Phone number too long').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  appointmentTime: z.string().min(1, 'Please select an appointment time slot'),
  reason: z.string().min(3, 'Please provide a reason for the visit').max(250, 'Reason too long'),
  message: z.string().max(1000, 'Message cannot exceed 1000 characters').optional().or(z.literal('')),
});

export const AppointmentUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW']).optional(),
  notes: z.string().max(2000).optional(),
  rescheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rescheduleTime: z.string().optional(),
});

export const ContactMessageSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Please enter a valid phone number').max(15).regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  message: z.string().min(5, 'Message must be at least 5 characters').max(2000, 'Message too long'),
});

export const ServiceSchema = z.object({
  title: z.string().min(2, 'Title is required').max(100),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lower-case alphanumeric with hyphens'),
  shortDescription: z.string().min(10, 'Short description is required').max(300),
  description: z.string().min(20, 'Full description is required'),
  icon: z.string().default('Stethoscope'),
  imageUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const DoctorUpdateSchema = z.object({
  name: z.string().min(2).max(100),
  designation: z.string().min(2).max(100),
  bio: z.string().max(10000).optional().nullable().or(z.literal('')),
  qualifications: z.string().max(2000).optional().nullable().or(z.literal('')),
  experience: z.string().max(2000).optional().nullable().or(z.literal('')),
  specialties: z.string().max(2000).optional().nullable().or(z.literal('')),
  registration: z.string().max(1000).optional().nullable().or(z.literal('')),
  consultationInfo: z.string().max(2000).optional().nullable().or(z.literal('')),
  consultation_info: z.string().max(2000).optional().nullable().or(z.literal('')),
  isPublished: z.union([z.boolean(), z.number()]).optional(),
  is_published: z.union([z.boolean(), z.number()]).optional(),
  imageUrl: z.string().max(1000000).optional().nullable(),
  image_url: z.string().max(1000000).optional().nullable(),
  photo_base64: z.string().max(1000000).optional().nullable(),
  phone: z.string().max(100).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
});

export const ClinicUpdateSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(500),
  city: z.string().max(100),
  state: z.string().max(100),
  pincode: z.string().max(20),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  phone: z.string().max(50),
  whatsapp: z.string().max(50),
  email: z.string().max(100),
  openingHours: z.string().max(500).optional(),
  opening_hours: z.string().max(500).optional(),
  googleMapsUrl: z.string().optional().nullable(),
  google_maps_url: z.string().optional().nullable(),
  phoneVerified: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  phone_verified: z.number().optional(),
  email_verified: z.number().optional(),
});

export const SiteSettingsUpdateSchema = z.object({
  clinic_name: z.string().optional(),
  tagline: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  google_maps_url: z.string().optional(),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
  hero_image_url: z.string().optional(),
  doctor_image_url: z.string().optional(),
  social_links: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  working_days: z.string().optional(),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
  appointment_duration: z.number().int().min(5).max(120).optional(),
  buffer_time: z.number().int().min(0).max(60).optional(),
  break_start: z.string().optional(),
  break_end: z.string().optional(),
  blocked_dates: z.string().optional(),
});

export const FAQSchema = z.object({
  question: z.string().min(5).max(300),
  answer: z.string().min(5).max(2000),
  isPublished: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const TestimonialSchema = z.object({
  name: z.string().min(2).max(100),
  content: z.string().min(10).max(1000),
  rating: z.number().int().min(1).max(5).default(5),
  isPublished: z.boolean().default(false),
});
