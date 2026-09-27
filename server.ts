import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import {
  AppointmentRepository,
  AdminUserRepository,
  DoctorRepository,
  ClinicRepository,
  ServiceRepository,
  ContactMessageRepository,
  FAQRepository,
  TestimonialRepository,
  GalleryRepository,
  SiteSettingsRepository,
  AuditLogRepository,
} from './src/server/repositories.js';

import {
  Auth,
  requireAuth,
  requireRole,
  createRateLimiter,
  AuthenticatedRequest,
} from './src/server/auth.js';
import { getDoctorFromFirestore, syncDoctorDocumentToFirestore } from './src/server/firestore.js';

import {
  LoginSchema,
  AppointmentCreateSchema,
  AppointmentUpdateSchema,
  ContactMessageSchema,
  ServiceSchema,
  DoctorUpdateSchema,
  ClinicUpdateSchema,
  SiteSettingsUpdateSchema,
  FAQSchema,
  TestimonialSchema,
} from './src/server/validation.js';

import { EmailService } from './src/server/email.js';
import { uploadMiddleware, UPLOAD_DIR } from './src/server/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security & Parsing Middlewares
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Normalize Vercel serverless request URLs: if request was stripped of /api prefix by serverless gateway
app.use((req, _res, next) => {
  if (!req.url.startsWith('/api/') && !req.url.startsWith('/uploads') && !req.url.startsWith('/sitemap.xml') && !req.url.startsWith('/robots.txt')) {
    const knownApiPaths = ['/appointments', '/contact', '/doctor', '/clinic', '/services', '/settings', '/faqs', '/testimonials', '/gallery', '/auth', '/admin', '/upload'];
    if (knownApiPaths.some(p => req.url === p || req.url.startsWith(p + '/') || req.url.startsWith(p + '?'))) {
      req.url = '/api' + req.url;
    }
  }
  next();
});

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Structured request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Serve uploaded assets statically
try {
  const publicUploads = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(publicUploads)) {
    fs.mkdirSync(publicUploads, { recursive: true });
  }
  app.use('/uploads', express.static(publicUploads));
} catch (_e) {
  // Read-only filesystem fallback
}

if (UPLOAD_DIR) {
  app.use('/uploads', express.static(UPLOAD_DIR));
}

// Rate Limiters
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

const appointmentLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'You have submitted multiple appointment requests recently. Please wait a few minutes.',
});

const contactLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many enquiries submitted. Please wait a few minutes.',
});

// ============================================================================
// 1. AUTHENTICATION APIS
// ============================================================================

app.post('/api/auth/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid input' },
      });
    }

    const { email, password } = parse.data;
    const user = AdminUserRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email address or password.' },
      });
    }

    const valid = Auth.comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email address or password.' },
      });
    }

    // Update last login
    AdminUserRepository.updateLastLogin(user.id);
    const token = Auth.generateToken(user);

    // Set secure cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    AuditLogRepository.log('LOGIN', 'AdminUser', user.id, `User ${user.email} logged in successfully`, user.id, user.name);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Authentication failed.' } });
  }
});

// Google Authentication endpoint for verified Google sign-ins
app.post('/api/auth/google-login', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'A valid email address is required for Google Sign-in.' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (typeof name === 'string' && name.trim()) || cleanEmail.split('@')[0];

    // Upsert admin user for verified Google user
    const user = AdminUserRepository.upsertGoogleUser(cleanEmail, cleanName);
    AdminUserRepository.updateLastLogin(user.id);
    const token = Auth.generateToken(user);

    // Set secure cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    AuditLogRepository.log('LOGIN_GOOGLE', 'AdminUser', user.id, `Google Sign-In: ${user.email}`, user.id, user.name);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Google login route error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Google authentication processing failed.' },
    });
  }
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('admin_token');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: { user: req.user },
  });
});

app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 6 characters long.' },
    });
  }

  const user = AdminUserRepository.findById(req.user!.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'Admin user not found.' },
    });
  }

  // If current password provided, verify; if not provided but user is the primary admin npaditya53@gmail.com, allow direct update
  if (currentPassword && !Auth.comparePassword(currentPassword, user.password_hash)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PASSWORD', message: 'Current password does not match.' },
    });
  }

  const newHash = Auth.hashPassword(newPassword);
  AdminUserRepository.updatePassword(user.id, newHash);
  AuditLogRepository.log('CHANGE_PASSWORD', 'AdminUser', user.id, `Password changed for ${user.email}`, user.id, user.name);

  return res.json({ success: true, message: 'Password changed successfully.' });
});

// Admin Direct Set/Reset Password endpoint (allows admin like npaditya53@gmail.com to set new password anytime)
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Please provide a valid admin email address.' },
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 6 characters long.' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = AdminUserRepository.findByEmail(cleanEmail);

    // If user is npaditya53@gmail.com and not yet in table, upsert as ADMIN
    if (!user && cleanEmail === 'npaditya53@gmail.com') {
      user = AdminUserRepository.upsertGoogleUser(cleanEmail, 'Aditya (Clinic Admin)');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'No administrator account found with this email.' },
      });
    }

    const newHash = Auth.hashPassword(newPassword.trim());
    AdminUserRepository.updatePassword(user.id, newHash);
    AuditLogRepository.log('RESET_PASSWORD', 'AdminUser', user.id, `Admin password updated for: ${user.email}`, user.id, user.name);

    // Also generate a fresh login token
    const token = Auth.generateToken(user);
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'New password has been set successfully! You can now log in.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update admin password.' },
    });
  }
});

// ============================================================================
// 2. APPOINTMENT APIS
// ============================================================================

// Helper to generate available slots based on clinic settings
function computeAvailableSlots(dateStr: string): { slots: string[]; workingDay: boolean; blocked: boolean } {
  const settings = SiteSettingsRepository.get();

  // Check blocked dates
  let blockedDates: string[] = [];
  try {
    blockedDates = JSON.parse(settings.blocked_dates || '[]');
  } catch {}

  if (blockedDates.includes(dateStr)) {
    return { slots: [], workingDay: true, blocked: true };
  }

  // Check working day of week
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const workingDays = settings.working_days.split(',').map(d => d.trim().toLowerCase());

  if (!workingDays.includes(dayName.toLowerCase())) {
    return { slots: [], workingDay: false, blocked: false };
  }

  // Generate slots between opening and closing time
  // E.g. "09:00 AM" to "07:00 PM"
  const booked = AppointmentRepository.getBookedTimes(dateStr);
  const slots: string[] = [];

  const parseTimeToMinutes = (timeStr: string): number => {
    const parts = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!parts) return 540; // 9:00 AM default
    let h = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const meridian = parts[3]?.toUpperCase();
    if (meridian === 'PM' && h < 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const formatMinutesToTime = (min: number): string => {
    let h = Math.floor(min / 60);
    const m = min % 60;
    const meridian = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    const mm = m.toString().padStart(2, '0');
    const hh = h.toString().padStart(2, '0');
    return `${hh}:${mm} ${meridian}`;
  };

  const startMin = parseTimeToMinutes(settings.opening_time);
  const endMin = parseTimeToMinutes(settings.closing_time);
  const breakStartMin = parseTimeToMinutes(settings.break_start);
  const breakEndMin = parseTimeToMinutes(settings.break_end);
  const duration = settings.appointment_duration || 20;

  for (let current = startMin; current + duration <= endMin; current += duration) {
    // Skip lunch/break slot
    if (current >= breakStartMin && current < breakEndMin) continue;

    const slotTime = formatMinutesToTime(current);
    // Only include if not booked
    if (!booked.includes(slotTime)) {
      slots.push(slotTime);
    }
  }

  return { slots, workingDay: true, blocked: false };
}

// Public: Get available slots for a given date
app.get('/api/appointments/slots', (req: Request, res: Response) => {
  const { date } = req.query;
  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_DATE', message: 'Please provide a valid date format (YYYY-MM-DD).' },
    });
  }

  // Prevent past dates
  const today = new Date().toISOString().split('T')[0];
  if (date < today) {
    return res.json({
      success: true,
      data: { date, slots: [], isPast: true, message: 'Cannot select past dates.' },
    });
  }

  const result = computeAvailableSlots(date);
  return res.json({
    success: true,
    data: {
      date,
      slots: result.slots,
      isWorkingDay: result.workingDay,
      isBlocked: result.blocked,
    },
  });
});

// Public: Create an appointment request
app.post('/api/appointments', appointmentLimiter, async (req: Request, res: Response) => {
  try {
    const parse = AppointmentCreateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid form input' },
      });
    }

    const data = parse.data;

    // Validate date is not in past
    const today = new Date().toISOString().split('T')[0];
    if (data.appointmentDate < today) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE', message: 'Appointment date cannot be in the past.' },
      });
    }

    // Check slot availability
    const bookedTimes = AppointmentRepository.getBookedTimes(data.appointmentDate);
    if (bookedTimes.includes(data.appointmentTime)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SLOT_UNAVAILABLE',
          message: 'This time slot is no longer available. Please select another slot.',
        },
      });
    }

    const appointment = await AppointmentRepository.create(data);

    // Send notifications in background
    EmailService.sendAppointmentReceivedToPatient(appointment).catch(console.error);
    EmailService.sendAppointmentAlertToAdmin(appointment).catch(console.error);

    return res.status(201).json({
      success: true,
      appointment: {
        id: appointment.id,
        appointmentId: appointment.appointment_id,
        appointmentNumber: appointment.appointment_number,
        status: appointment.status,
      },
      data: {
        id: appointment.id,
        appointmentId: appointment.appointment_id,
        appointmentNumber: appointment.appointment_number,
        patientName: appointment.patient_name,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        status: appointment.status,
        message: 'Your appointment request has been submitted successfully. The clinic will contact you to confirm the appointment.',
      },
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to process appointment request.' },
    });
  }
});

// Public: Check appointment status by Appointment Number, ID, or phone number
app.get('/api/appointments/track', (req: Request, res: Response) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Please enter your Appointment Number or registered phone number.' },
    });
  }

  const cleanQuery = query.trim();

  // 1. Check if numeric: can be Appointment Number (e.g. 1, 2) or Phone Number (e.g. 9876543210)
  if (/^\d+$/.test(cleanQuery)) {
    const num = parseInt(cleanQuery, 10);
    // Short numbers are typically Appointment Numbers
    if (cleanQuery.length < 10) {
      const apts = AppointmentRepository.findByAppointmentNumber(num);
      if (apts.length > 0) {
        return res.json({
          success: true,
          data: apts.map(apt => ({
            appointmentId: apt.appointment_id,
            appointmentNumber: apt.appointment_number,
            patientName: apt.patient_name,
            appointmentDate: apt.appointment_date,
            appointmentTime: apt.appointment_time,
            status: apt.status,
            createdAt: apt.created_at,
          })),
        });
      }
    }

    // Check phone lookup
    const list = AppointmentRepository.findByPhone(cleanQuery);
    if (list.length > 0) {
      return res.json({
        success: true,
        data: list.map(apt => ({
          appointmentId: apt.appointment_id,
          appointmentNumber: apt.appointment_number,
          patientName: apt.patient_name,
          appointmentDate: apt.appointment_date,
          appointmentTime: apt.appointment_time,
          status: apt.status,
          createdAt: apt.created_at,
        })),
      });
    }

    // Try appointmentNumber lookup even if longer string
    const apts = AppointmentRepository.findByAppointmentNumber(num);
    if (apts.length > 0) {
      return res.json({
        success: true,
        data: apts.map(apt => ({
          appointmentId: apt.appointment_id,
          appointmentNumber: apt.appointment_number,
          patientName: apt.patient_name,
          appointmentDate: apt.appointment_date,
          appointmentTime: apt.appointment_time,
          status: apt.status,
          createdAt: apt.created_at,
        })),
      });
    }

    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No appointment found matching this Appointment Number or phone number.' },
    });
  }

  // 2. Reference ID lookup (e.g. APT-2026-0001) for backwards compatibility
  if (cleanQuery.toUpperCase().startsWith('APT-')) {
    const apt = AppointmentRepository.findByAppointmentId(cleanQuery.toUpperCase());
    if (!apt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No appointment found matching this reference ID.' },
      });
    }
    return res.json({
      success: true,
      data: [{
        appointmentId: apt.appointment_id,
        appointmentNumber: apt.appointment_number,
        patientName: apt.patient_name,
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        status: apt.status,
        createdAt: apt.created_at,
      }],
    });
  }

  // 3. Fallback phone lookup
  const list = AppointmentRepository.findByPhone(cleanQuery);
  if (list.length === 0) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No appointments found matching your query.' },
    });
  }
  return res.json({
    success: true,
    data: list.map(apt => ({
      appointmentId: apt.appointment_id,
      appointmentNumber: apt.appointment_number,
      patientName: apt.patient_name,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      status: apt.status,
      createdAt: apt.created_at,
    })),
  });
});

// Admin: List appointments with filters
app.get('/api/appointments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status, date, search, page = '1', limit = '50', sortBy = 'created_at', order = 'DESC' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const result = AppointmentRepository.list({
    status: status as string,
    date: date as string,
    search: search as string,
    limit: limitNum,
    offset,
    sortBy: sortBy as string,
    order: (order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
  });

  return res.json({
    success: true,
    data: {
      appointments: result.appointments,
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum),
    },
  });
});

// Admin: Update appointment status, reschedule, or notes
app.patch('/api/appointments/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const parse = AppointmentUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid input' },
    });
  }

  const existing = AppointmentRepository.findById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Appointment not found.' },
    });
  }

  const { status, notes, rescheduleDate, rescheduleTime } = parse.data;

  let updated = existing;

  // Handle rescheduling
  if (rescheduleDate && rescheduleTime) {
    updated = AppointmentRepository.reschedule(id, rescheduleDate, rescheduleTime, notes) || updated;
    AuditLogRepository.log(
      'RESCHEDULE_APPOINTMENT',
      'Appointment',
      id,
      `Rescheduled from ${existing.appointment_date} ${existing.appointment_time} to ${rescheduleDate} ${rescheduleTime}`,
      req.user!.userId,
      req.user!.name
    );
  }

  // Handle status update
  if (status && status !== existing.status) {
    updated = AppointmentRepository.updateStatus(id, status, notes) || updated;
    AuditLogRepository.log(
      'STATUS_CHANGE',
      'Appointment',
      id,
      `Changed status from ${existing.status} to ${status}`,
      req.user!.userId,
      req.user!.name
    );

    // Send notifications on confirmation or cancellation
    if (status === 'CONFIRMED') {
      EmailService.sendAppointmentConfirmed(updated).catch(console.error);
    } else if (status === 'CANCELLED') {
      EmailService.sendAppointmentCancelled(updated, notes || 'Slot unavailable').catch(console.error);
    }
  } else if (notes !== undefined) {
    updated = AppointmentRepository.updateStatus(id, updated.status, notes) || updated;
  }

  return res.json({
    success: true,
    data: updated,
  });
});

// Admin: Delete appointment
app.delete('/api/appointments/:id', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = AppointmentRepository.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found.' } });
  }

  AppointmentRepository.delete(id);
  AuditLogRepository.log('DELETE_APPOINTMENT', 'Appointment', id, `Deleted appointment ${existing.appointment_id}`, req.user!.userId, req.user!.name);

  return res.json({ success: true, message: 'Appointment deleted successfully.' });
});

// Admin: Reset appointment counter (and optionally clear test appointments)
app.post('/api/admin/appointments/reset-counter', requireAuth, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startFrom = 0, clearExisting = false, date } = req.body || {};
    const parsedStart = typeof startFrom === 'number' && startFrom >= 0 ? Math.floor(startFrom) : 0;
    const shouldClear = Boolean(clearExisting);
    const dateFilter = typeof date === 'string' && date.trim().length > 0 ? date.trim() : undefined;

    await AppointmentRepository.resetCounter(parsedStart, shouldClear, dateFilter);

    AuditLogRepository.log(
      'RESET_APPOINTMENT_COUNTER',
      'AppointmentCounter',
      dateFilter ? `counters/appointments_${dateFilter}` : 'counters/appointments',
      `Reset appointment counter to ${parsedStart}${dateFilter ? ` for date ${dateFilter}` : ''}${shouldClear ? ' and cleared matching appointments' : ''}`,
      req.user!.userId,
      req.user!.name
    );

    return res.json({
      success: true,
      data: {
        date: dateFilter || 'GLOBAL',
        lastAppointmentNumber: parsedStart,
        nextAppointmentNumber: parsedStart + 1,
        message: dateFilter
          ? `Appointment counter for ${dateFilter} reset successfully to ${parsedStart}. Next appointment for ${dateFilter} will be #${parsedStart + 1}.`
          : `Global appointment counter reset successfully to ${parsedStart}. Next appointment will be #${parsedStart + 1}.`,
      },
    });
  } catch (err: any) {
    console.error('Failed to reset appointment counter:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to reset appointment counter.' },
    });
  }
});

// ============================================================================
// 3. CONTACT MESSAGES APIS
// ============================================================================

app.post('/api/contact', contactLimiter, (req: Request, res: Response) => {
  const parse = ContactMessageSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid form input' },
    });
  }

  const msg = ContactMessageRepository.create(parse.data);
  return res.status(201).json({
    success: true,
    data: { id: msg.id, message: 'Thank you for reaching out. Your enquiry has been received.' },
  });
});

app.get('/api/contact', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const messages = ContactMessageRepository.listAll();
  return res.json({ success: true, data: messages });
});

app.patch('/api/contact/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['NEW', 'READ', 'RESOLVED'].includes(status)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid message status.' } });
  }

  const updated = ContactMessageRepository.updateStatus(id, status);
  if (!updated) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Message not found.' } });
  }

  return res.json({ success: true, data: updated });
});

app.delete('/api/contact/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const ok = ContactMessageRepository.delete(id);
  if (!ok) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Message not found.' } });
  }
  return res.json({ success: true, message: 'Message removed successfully.' });
});

// ============================================================================
// 4. SERVICES APIS
// ============================================================================

app.get('/api/services', (_req: Request, res: Response) => {
  const services = ServiceRepository.listActive();
  return res.json({ success: true, data: services });
});

app.get('/api/services/all', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const services = ServiceRepository.listAll();
  return res.json({ success: true, data: services });
});

app.get('/api/services/:slug', (req: Request, res: Response) => {
  const service = ServiceRepository.findBySlug(req.params.slug);
  if (!service) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found.' } });
  }
  return res.json({ success: true, data: service });
});

app.post('/api/services', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const parse = ServiceSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid service details' },
    });
  }

  // Check unique slug
  if (ServiceRepository.findBySlug(parse.data.slug)) {
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_SLUG', message: 'A service with this URL slug already exists.' },
    });
  }

  const srv = ServiceRepository.create(parse.data);
  AuditLogRepository.log('CREATE_SERVICE', 'Service', srv.id, `Created service ${srv.title}`, req.user!.userId, req.user!.name);
  return res.status(201).json({ success: true, data: srv });
});

app.patch('/api/services/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = ServiceRepository.update(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found.' } });
  }
  AuditLogRepository.log('UPDATE_SERVICE', 'Service', id, `Updated service ${updated.title}`, req.user!.userId, req.user!.name);
  return res.json({ success: true, data: updated });
});

app.delete('/api/services/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = ServiceRepository.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found.' } });
  }

  ServiceRepository.delete(id);
  AuditLogRepository.log('DELETE_SERVICE', 'Service', id, `Deleted service ${existing.title}`, req.user!.userId, req.user!.name);
  return res.json({ success: true, message: 'Service deleted.' });
});

// ============================================================================
// 5. DOCTOR & CLINIC APIS
// ============================================================================

app.get('/api/doctor', async (_req: Request, res: Response) => {
  let doctor = DoctorRepository.get();
  try {
    const fsDoctor = await getDoctorFromFirestore();
    if (fsDoctor && fsDoctor.name) {
      doctor = { ...(doctor || {}), ...fsDoctor } as any;
    }
  } catch (e) {
    console.warn('[Server] Firestore doctor fetch notice:', e);
  }
  return res.json({ success: true, data: doctor });
});

// Admin Doctor Endpoints
app.get('/api/admin/doctor', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  let doctor = DoctorRepository.get();
  try {
    const fsDoctor = await getDoctorFromFirestore();
    if (fsDoctor && fsDoctor.name) {
      doctor = { ...(doctor || {}), ...fsDoctor } as any;
    }
  } catch (e) {
    console.warn('[Server] Admin Firestore doctor fetch notice:', e);
  }
  return res.json({ success: true, data: doctor });
});

const handleDoctorUpdate = async (req: AuthenticatedRequest, res: Response) => {
  const parse = DoctorUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid input' },
    });
  }

  const data = parse.data;
  const updated = await DoctorRepository.update({
    name: data.name,
    designation: data.designation,
    bio: data.bio ?? undefined,
    qualifications: data.qualifications ?? undefined,
    experience: data.experience ?? undefined,
    specialties: data.specialties ?? undefined,
    registration: data.registration ?? undefined,
    consultation_info: (data.consultation_info ?? data.consultationInfo) ?? undefined,
    is_published: data.is_published !== undefined ? (Number(data.is_published) ? 1 : 0) : (data.isPublished !== undefined ? (data.isPublished ? 1 : 0) : undefined),
    image_url: (data.image_url ?? data.imageUrl) ?? undefined,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
  });

  AuditLogRepository.log('UPDATE_DOCTOR', 'Doctor', updated.id, 'Updated Dr. Gultun Paswan profile', req.user!.userId, req.user!.name);
  return res.json({ success: true, data: updated });
};

app.patch('/api/doctor', requireAuth, handleDoctorUpdate);
app.patch('/api/admin/doctor', requireAuth, handleDoctorUpdate);

app.get('/api/clinic', (_req: Request, res: Response) => {
  const clinic = ClinicRepository.get();
  return res.json({ success: true, data: clinic });
});

app.patch('/api/clinic', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const parse = ClinicUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid input' },
    });
  }

  const d = parse.data;
  const updated = ClinicRepository.update({
    ...d,
    opening_hours: d.opening_hours ?? d.openingHours,
    google_maps_url: d.google_maps_url !== undefined ? d.google_maps_url : d.googleMapsUrl,
  });
  AuditLogRepository.log('UPDATE_CLINIC', 'Clinic', updated.id, 'Updated clinic details', req.user!.userId, req.user!.name);
  return res.json({ success: true, data: updated });
});

// ============================================================================
// 6. SITE SETTINGS & FAQS APIS
// ============================================================================

app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = SiteSettingsRepository.get();
  return res.json({ success: true, data: settings });
});

app.patch('/api/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const parse = SiteSettingsUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid settings' },
    });
  }

  const updated = SiteSettingsRepository.update(parse.data);
  AuditLogRepository.log('UPDATE_SETTINGS', 'SiteSettings', 'settings', 'Updated clinic settings & schedule', req.user!.userId, req.user!.name);
  return res.json({ success: true, data: updated });
});

app.get('/api/faqs', (_req: Request, res: Response) => {
  const faqs = FAQRepository.listPublished();
  return res.json({ success: true, data: faqs });
});

app.get('/api/faqs/all', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const faqs = FAQRepository.listAll();
  return res.json({ success: true, data: faqs });
});

app.post('/api/faqs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const parse = FAQSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message } });
  }
  const faq = FAQRepository.create(parse.data.question, parse.data.answer, parse.data.displayOrder);
  return res.status(201).json({ success: true, data: faq });
});

app.patch('/api/faqs/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = FAQRepository.update(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'FAQ not found.' } });
  }
  return res.json({ success: true, data: updated });
});

app.delete('/api/faqs/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  FAQRepository.delete(id);
  return res.json({ success: true, message: 'FAQ deleted.' });
});

// ============================================================================
// 7. TESTIMONIALS & GALLERY APIS
// ============================================================================

app.get('/api/testimonials', (_req: Request, res: Response) => {
  const items = TestimonialRepository.listPublished();
  return res.json({ success: true, data: items });
});

app.get('/api/testimonials/all', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const items = TestimonialRepository.listAll();
  return res.json({ success: true, data: items });
});

app.post('/api/testimonials', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const parse = TestimonialSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message } });
  }
  const t = TestimonialRepository.create(parse.data.name, parse.data.content, parse.data.rating, parse.data.isPublished);
  return res.status(201).json({ success: true, data: t });
});

app.patch('/api/testimonials/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = TestimonialRepository.update(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Testimonial not found.' } });
  }
  return res.json({ success: true, data: updated });
});

app.delete('/api/testimonials/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  TestimonialRepository.delete(id);
  return res.json({ success: true, message: 'Testimonial deleted.' });
});

app.get('/api/gallery', (_req: Request, res: Response) => {
  const items = GalleryRepository.listPublished();
  return res.json({ success: true, data: items });
});

app.post('/api/gallery', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, imageUrl, altText, category, displayOrder } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Image URL is required.' } });
  }
  const img = GalleryRepository.create(title || 'Clinic Photo', imageUrl, altText || 'Priya Health Care Singahi', category, displayOrder);
  return res.status(201).json({ success: true, data: img });
});

app.delete('/api/gallery/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  GalleryRepository.delete(id);
  return res.json({ success: true, message: 'Image removed.' });
});

// ============================================================================
// 8. FILE UPLOAD API
// ============================================================================

app.post('/api/upload', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  uploadMiddleware.single('file')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: err.message } });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'Please select a file to upload.' } });
    }

    const publicUrl = `/uploads/${req.file.filename}`;
    AuditLogRepository.log('UPLOAD_IMAGE', 'Storage', req.file.filename, `Uploaded file ${req.file.originalname}`, req.user!.userId, req.user!.name);
    return res.json({
      success: true,
      data: {
        url: publicUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  });
});

// ============================================================================
// 9. ADMIN ANALYTICS & AUDIT LOGS
// ============================================================================

app.get('/api/admin/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const today = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const todayApts = AppointmentRepository.list({ date: today }).total;
  const pendingApts = AppointmentRepository.list({ status: 'PENDING' }).total;
  const confirmedApts = AppointmentRepository.list({ status: 'CONFIRMED' }).total;
  const completedApts = AppointmentRepository.list({ status: 'COMPLETED' }).total;
  const cancelledApts = AppointmentRepository.list({ status: 'CANCELLED' }).total;

  const unreadMessages = ContactMessageRepository.listAll().filter(m => m.status === 'NEW').length;
  const activeServices = ServiceRepository.listActive().length;

  return res.json({
    success: true,
    data: {
      todayAppointments: todayApts,
      pendingAppointments: pendingApts,
      confirmedAppointments: confirmedApts,
      completedAppointments: completedApts,
      cancelledAppointments: cancelledApts,
      unreadMessages,
      activeServices,
    },
  });
});

app.get('/api/admin/audit-logs', requireAuth, requireRole(['ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const logs = AuditLogRepository.listRecent(50);
  return res.json({ success: true, data: logs });
});

// ============================================================================
// 10. SEO SITEMAP & ROBOTS
// ============================================================================

app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const baseUrl = process.env.VITE_SITE_URL || 'http://localhost:3000';
  const services = ServiceRepository.listActive();
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    '',
    '/about',
    '/doctor',
    '/services',
    '/facilities',
    '/appointments',
    '/contact',
    '/faq',
    '/privacy-policy',
    '/terms',
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const p of staticPages) {
    xml += `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${p === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  }

  for (const s of services) {
    xml += `  <url>\n    <loc>${baseUrl}/services/${s.slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  return res.send(xml);
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  const baseUrl = process.env.VITE_SITE_URL || 'http://localhost:3000';
  const text = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.setHeader('Content-Type', 'text/plain');
  return res.send(text);
});

// ============================================================================
// 11. VITE / STATIC CLIENT INTEGRATION
// ============================================================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

  if (!isProduction && fs.existsSync(path.resolve(__dirname, 'src'))) {
    try {
      // Development mode: attach Vite dev server middleware
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('[Server] Could not initialize Vite middleware, falling back to static dist:', e);
      const distPath = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          res.sendFile(path.resolve(distPath, 'index.html'));
        });
      }
    }
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Priya Health Care Server] Running on http://0.0.0.0:${PORT}`);
  });
}

export { app };
export default app;

// Only start the standalone HTTP listener when not running inside a serverless platform (like Vercel)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer().catch(err => {
    console.error('[Priya Health Care Server] Fatal start error:', err);
    process.exit(1);
  });
}
