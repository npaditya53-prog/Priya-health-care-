import { sqlite } from './db.js';
import crypto from 'node:crypto';
import {
  createAppointmentInFirestoreAtomic,
  resetFirestoreAppointmentCounter,
  syncAppointmentDocumentToFirestore,
  syncClinicDocumentToFirestore,
  syncDoctorDocumentToFirestore,
  getDoctorFromFirestore,
  deleteAppointmentFromFirestore,
  syncContactMessageToFirestore,
  deleteContactMessageFromFirestore,
} from './firestore.js';

const cast = <T>(val: any): T => val as unknown as T;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface Doctor {
  id: string;
  name: string;
  designation: string;
  bio: string;
  qualifications: string;
  experience: string;
  specialties: string;
  registration?: string | null;
  consultation_info?: string | null;
  is_published?: number;
  image_url: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
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
  phone_verified?: number;
  email_verified?: number;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
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

export interface Appointment {
  id: string;
  appointment_id: string;
  appointment_number: number;
  patient_name: string;
  phone: string;
  email: string | null;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  message: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: 'NEW' | 'READ' | 'RESOLVED';
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  is_published: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
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

export interface SiteSettings {
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

export interface AuditLog {
  id: string;
  admin_user_id: string | null;
  admin_user_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string | null;
  timestamp: string;
}

// -------------------------------------------------------------
// APPOINTMENTS REPOSITORY
// -------------------------------------------------------------

export const AppointmentRepository = {
  getMaxAppointmentNumber(date?: string): number {
    if (date) {
      const row = sqlite.prepare("SELECT MAX(appointment_number) as maxNum FROM appointments WHERE appointment_date = ?").get(date) as { maxNum: number | null };
      const counterRow = sqlite.prepare("SELECT last_value FROM counters WHERE id = ?").get(`appointments_${date}`) as { last_value: number } | undefined;
      return Math.max(row?.maxNum || 0, counterRow?.last_value || 0);
    }
    const row = sqlite.prepare("SELECT MAX(appointment_number) as maxNum FROM appointments").get() as { maxNum: number | null };
    const counterRow = sqlite.prepare("SELECT last_value FROM counters WHERE id = 'appointments'").get() as { last_value: number } | undefined;
    return Math.max(row?.maxNum || 0, counterRow?.last_value || 0);
  },

  async create(data: {
    patientName: string;
    phone: string;
    email?: string | null;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    message?: string | null;
  }): Promise<Appointment> {
    const id = crypto.randomUUID();
    const dateStr = data.appointmentDate.trim();
    const currentDateMax = this.getMaxAppointmentNumber(dateStr);
    const now = new Date().toISOString();
    const tempAppointmentId = `APT-${dateStr.replace(/-/g, '')}-${id.slice(0, 6)}`;

    const preliminaryData = {
      id,
      appointment_id: tempAppointmentId,
      patient_name: data.patientName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      appointment_date: dateStr,
      appointment_time: data.appointmentTime.trim(),
      reason: data.reason.trim(),
      message: data.message?.trim() || null,
      status: 'PENDING',
      notes: null,
      created_at: now,
      updated_at: now,
    };

    // Atomically obtain per-date sequential number and create Firestore document
    const appointmentNumber = await createAppointmentInFirestoreAtomic(preliminaryData, currentDateMax);
    const dateCompact = dateStr.replace(/-/g, '');
    const finalAppointmentId = `APT-${dateCompact}-${appointmentNumber.toString().padStart(4, '0')}`;

    // Insert into local SQLite table with unique constraint on (appointment_date, appointment_number)
    sqlite.prepare(`
      INSERT INTO appointments (
        id, appointment_id, appointment_number, patient_name, phone, email, appointment_date, appointment_time,
        reason, message, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, ?, ?)
    `).run(
      id,
      finalAppointmentId,
      appointmentNumber,
      data.patientName.trim(),
      data.phone.trim(),
      data.email?.trim() || null,
      dateStr,
      data.appointmentTime.trim(),
      data.reason.trim(),
      data.message?.trim() || null,
      now,
      now
    );

    // Keep local counters table synchronized for this specific appointment date
    sqlite.prepare(`
      INSERT INTO counters (id, last_value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET last_value = excluded.last_value, updated_at = excluded.updated_at
    `).run(`appointments_${dateStr}`, appointmentNumber, now);

    const createdApt = this.findById(id)!;
    return createdApt;
  },

  findById(id: string): Appointment | null {
    const row = sqlite.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    return row ? cast<Appointment>(row) : null;
  },

  findByAppointmentNumber(num: number, date?: string): Appointment[] {
    if (date) {
      const rows = sqlite.prepare('SELECT * FROM appointments WHERE appointment_number = ? AND appointment_date = ?').all(num, date);
      return cast<Appointment[]>(rows);
    }
    const rows = sqlite.prepare('SELECT * FROM appointments WHERE appointment_number = ? ORDER BY appointment_date DESC, created_at DESC').all(num);
    return cast<Appointment[]>(rows);
  },

  findByAppointmentId(appointmentId: string): Appointment | null {
    const row = sqlite.prepare('SELECT * FROM appointments WHERE appointment_id = ?').get(appointmentId);
    return row ? cast<Appointment>(row) : null;
  },

  findByPhone(phone: string): Appointment[] {
    const rows = sqlite.prepare('SELECT * FROM appointments WHERE phone = ? ORDER BY created_at DESC').all(phone);
    return cast<Appointment[]>(rows);
  },

  list(filters?: {
    status?: string;
    date?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }): { appointments: Appointment[]; total: number } {
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (filters?.status && filters.status !== 'ALL') {
      whereClauses.push('status = ?');
      params.push(filters.status);
    }

    if (filters?.date) {
      whereClauses.push('appointment_date = ?');
      params.push(filters.date);
    }

    if (filters?.search) {
      const trimmed = filters.search.trim();
      const q = `%${trimmed}%`;
      const numSearch = parseInt(trimmed.replace(/^#/, ''), 10);
      if (!isNaN(numSearch) && numSearch > 0 && String(numSearch) === trimmed.replace(/^#/, '')) {
        whereClauses.push('(patient_name LIKE ? OR phone LIKE ? OR appointment_id LIKE ? OR email LIKE ? OR appointment_number = ?)');
        params.push(q, q, q, q, numSearch);
      } else {
        whereClauses.push('(patient_name LIKE ? OR phone LIKE ? OR appointment_id LIKE ? OR email LIKE ?)');
        params.push(q, q, q, q);
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = cast<{ total: number }>(
      sqlite.prepare(`SELECT COUNT(*) as total FROM appointments ${whereSql}`).get(...params)
    );
    const total = countRow?.total || 0;

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const sortClause = (filters?.sortBy === 'appointment_date' || filters?.sortBy === 'appointment_time')
      ? 'ORDER BY appointment_date ASC, appointment_time ASC, appointment_number ASC, COALESCE(created_at, appointment_date) DESC'
      : 'ORDER BY COALESCE(created_at, appointment_date) DESC, appointment_number DESC';

    const rows = sqlite.prepare(`
      SELECT * FROM appointments
      ${whereSql}
      ${sortClause}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return { appointments: cast<Appointment[]>(rows), total };
  },

  updateStatus(id: string, status: Appointment['status'], notes?: string): Appointment | null {
    const now = new Date().toISOString();
    if (notes !== undefined) {
      sqlite.prepare('UPDATE appointments SET status = ?, notes = ?, updated_at = ? WHERE id = ?')
        .run(status, notes, now, id);
    } else {
      sqlite.prepare('UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?')
        .run(status, now, id);
    }
    const apt = this.findById(id);
    if (apt) {
      syncAppointmentDocumentToFirestore(apt).catch(() => {});
    }
    return apt;
  },

  reschedule(id: string, newDate: string, newTime: string, notes?: string): Appointment | null {
    const now = new Date().toISOString();
    sqlite.prepare('UPDATE appointments SET appointment_date = ?, appointment_time = ?, notes = COALESCE(?, notes), updated_at = ? WHERE id = ?')
      .run(newDate, newTime, notes || null, now, id);
    const apt = this.findById(id);
    if (apt) {
      syncAppointmentDocumentToFirestore(apt).catch(() => {});
    }
    return apt;
  },

  getBookedTimes(date: string): string[] {
    const rows = sqlite.prepare(`
      SELECT appointment_time FROM appointments
      WHERE appointment_date = ? AND status IN ('PENDING', 'CONFIRMED')
    `).all(date) as { appointment_time: string }[];
    return rows.map(r => r.appointment_time);
  },

  delete(id: string): boolean {
    const existing = this.findById(id);
    const res = sqlite.prepare('DELETE FROM appointments WHERE id = ?').run(id);
    if (existing) {
      deleteAppointmentFromFirestore(existing.appointment_id).catch(() => {});
      if (existing.id && existing.id !== existing.appointment_id) {
        deleteAppointmentFromFirestore(existing.id).catch(() => {});
      }
    }
    return res.changes > 0;
  },

  async resetCounter(newStart: number = 0, clearExistingRecords: boolean = false, date?: string): Promise<number> {
    const now = new Date().toISOString();
    if (clearExistingRecords) {
      if (date) {
        sqlite.prepare('DELETE FROM appointments WHERE appointment_date = ?').run(date);
      } else {
        sqlite.prepare('DELETE FROM appointments').run();
      }
    }
    const counterId = date ? `appointments_${date}` : 'appointments';
    sqlite.prepare(`
      INSERT INTO counters (id, last_value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET last_value = excluded.last_value, updated_at = excluded.updated_at
    `).run(counterId, newStart, now);

    await resetFirestoreAppointmentCounter(newStart, date);
    return newStart;
  }
};

// -------------------------------------------------------------
// ADMIN USERS REPOSITORY
// -------------------------------------------------------------

export const AdminUserRepository = {
  findByEmail(email: string): AdminUser | null {
    const row = sqlite.prepare('SELECT * FROM admin_users WHERE LOWER(email) = LOWER(?)').get(email);
    return row ? cast<AdminUser>(row) : null;
  },

  findById(id: string): AdminUser | null {
    const row = sqlite.prepare('SELECT * FROM admin_users WHERE id = ?').get(id);
    return row ? cast<AdminUser>(row) : null;
  },

  updateLastLogin(id: string): void {
    const now = new Date().toISOString();
    sqlite.prepare('UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);
  },

  updatePassword(id: string, newHash: string): void {
    const now = new Date().toISOString();
    sqlite.prepare('UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, id);
  },

  upsertGoogleUser(email: string, name: string): AdminUser {
    const existing = this.findByEmail(email);
    const now = new Date().toISOString();
    if (existing) {
      sqlite.prepare('UPDATE admin_users SET name = ?, last_login_at = ?, updated_at = ? WHERE id = ?')
        .run(name || existing.name, now, now, existing.id);
      return this.findById(existing.id)!;
    }
    const id = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO admin_users (id, name, email, password_hash, role, created_at, updated_at, last_login_at)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, ?)
    `).run(id, name || email.split('@')[0], email.toLowerCase(), 'GOOGLE_AUTH_VERIFIED', now, now, now);
    return this.findById(id)!;
  },

  listAll(): Omit<AdminUser, 'password_hash'>[] {
    const rows = sqlite.prepare('SELECT id, name, email, role, created_at, updated_at, last_login_at FROM admin_users ORDER BY created_at ASC').all();
    return cast<Omit<AdminUser, 'password_hash'>[]>(rows);
  }
};

// -------------------------------------------------------------
// DOCTOR REPOSITORY
// -------------------------------------------------------------

export const DoctorRepository = {
  get(): Doctor {
    const row = sqlite.prepare('SELECT * FROM doctor LIMIT 1').get();
    return cast<Doctor>(row);
  },

  async update(data: Partial<Doctor>): Promise<Doctor> {
    const current = this.get();
    const now = new Date().toISOString();

    sqlite.prepare(`
      UPDATE doctor SET
        name = ?, designation = ?, bio = ?, qualifications = ?, experience = ?,
        specialties = ?, registration = ?, consultation_info = ?, is_published = ?,
        image_url = ?, phone = ?, email = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.name ?? current.name,
      data.designation ?? current.designation,
      data.bio ?? current.bio,
      data.qualifications ?? current.qualifications,
      data.experience ?? current.experience,
      data.specialties ?? current.specialties,
      data.registration !== undefined ? data.registration : (current.registration ?? '[ADD VERIFIED INFORMATION]'),
      data.consultation_info !== undefined ? data.consultation_info : (current.consultation_info ?? '[ADD VERIFIED INFORMATION]'),
      data.is_published !== undefined ? (data.is_published ? 1 : 0) : (current.is_published ?? 1),
      data.image_url !== undefined ? data.image_url : current.image_url,
      data.phone !== undefined ? data.phone : current.phone,
      data.email !== undefined ? data.email : current.email,
      now,
      current.id
    );

    const updated = this.get();

    // Canonical Firestore Synchronization
    try {
      await syncDoctorDocumentToFirestore({
        name: updated.name,
        designation: updated.designation,
        bio: updated.bio,
        qualifications: updated.qualifications,
        experience: updated.experience,
        specialties: updated.specialties,
        registration: updated.registration,
        consultation_info: updated.consultation_info,
        is_published: updated.is_published,
        image_url: updated.image_url,
        phone: updated.phone,
        email: updated.email,
      });
    } catch (e) {
      console.warn('[DoctorRepository] Firestore sync notice:', e);
    }

    return updated;
  }
};

// -------------------------------------------------------------
// CLINIC REPOSITORY
// -------------------------------------------------------------

export const ClinicRepository = {
  get(): Clinic {
    const row = sqlite.prepare('SELECT * FROM clinic LIMIT 1').get() as any;
    if (!row) return cast<Clinic>({});
    return cast<Clinic>({
      ...row,
      phoneVerified: row.phone_verified !== undefined ? Boolean(row.phone_verified) : true,
      emailVerified: row.email_verified !== undefined ? Boolean(row.email_verified) : true,
    });
  },

  update(data: Partial<Clinic>): Clinic {
    const current = this.get();
    const now = new Date().toISOString();

    const phoneVerifiedVal =
      data.phoneVerified !== undefined
        ? data.phoneVerified ? 1 : 0
        : data.phone_verified !== undefined
        ? data.phone_verified
        : (current.phone_verified ?? 1);

    const emailVerifiedVal =
      data.emailVerified !== undefined
        ? data.emailVerified ? 1 : 0
        : data.email_verified !== undefined
        ? data.email_verified
        : (current.email_verified ?? 1);

    sqlite.prepare(`
      UPDATE clinic SET
        name = ?, address = ?, city = ?, state = ?, pincode = ?,
        latitude = ?, longitude = ?, phone = ?, whatsapp = ?, email = ?,
        opening_hours = ?, google_maps_url = ?, phone_verified = ?, email_verified = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.name ?? current.name,
      data.address ?? current.address,
      data.city ?? current.city,
      data.state ?? current.state,
      data.pincode ?? current.pincode,
      data.latitude !== undefined ? data.latitude : current.latitude,
      data.longitude !== undefined ? data.longitude : current.longitude,
      data.phone ?? current.phone,
      data.whatsapp ?? current.whatsapp,
      data.email ?? current.email,
      data.opening_hours ?? current.opening_hours,
      data.google_maps_url !== undefined ? data.google_maps_url : current.google_maps_url,
      phoneVerifiedVal,
      emailVerifiedVal,
      now,
      current.id
    );

    const updated = this.get();

    // Sync to Firestore
    syncClinicDocumentToFirestore({
      name: updated.name,
      city: updated.city,
      address: updated.address,
      state: updated.state,
      pincode: updated.pincode,
      phone: updated.phone,
      whatsapp: updated.whatsapp,
      email: updated.email,
      opening_hours: updated.opening_hours,
      google_maps_url: updated.google_maps_url,
      phoneVerified: updated.phoneVerified,
      emailVerified: updated.emailVerified,
    }).catch(() => {});

    return updated;
  }
};

// -------------------------------------------------------------
// SERVICES REPOSITORY
// -------------------------------------------------------------

export const ServiceRepository = {
  listAll(): Service[] {
    const rows = sqlite.prepare('SELECT * FROM services ORDER BY display_order ASC, created_at DESC').all();
    return cast<Service[]>(rows);
  },

  listActive(): Service[] {
    const rows = sqlite.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC').all();
    return cast<Service[]>(rows);
  },

  findBySlug(slug: string): Service | null {
    const row = sqlite.prepare('SELECT * FROM services WHERE slug = ?').get(slug);
    return row ? cast<Service>(row) : null;
  },

  findById(id: string): Service | null {
    const row = sqlite.prepare('SELECT * FROM services WHERE id = ?').get(id);
    return row ? cast<Service>(row) : null;
  },

  create(data: {
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    icon?: string;
    imageUrl?: string;
    displayOrder?: number;
    isActive?: boolean;
  }): Service {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO services (
        id, title, slug, short_description, description, icon, image_url,
        is_active, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.title.trim(),
      data.slug.trim(),
      data.shortDescription.trim(),
      data.description.trim(),
      data.icon || 'Stethoscope',
      data.imageUrl || '',
      data.isActive === false ? 0 : 1,
      data.displayOrder ?? 0,
      now,
      now
    );

    return this.findById(id)!;
  },

  update(id: string, data: Partial<Service>): Service | null {
    const current = this.findById(id);
    if (!current) return null;
    const now = new Date().toISOString();

    sqlite.prepare(`
      UPDATE services SET
        title = ?, slug = ?, short_description = ?, description = ?,
        icon = ?, image_url = ?, is_active = ?, display_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.title ?? current.title,
      data.slug ?? current.slug,
      data.short_description ?? current.short_description,
      data.description ?? current.description,
      data.icon ?? current.icon,
      data.image_url ?? current.image_url,
      data.is_active !== undefined ? data.is_active : current.is_active,
      data.display_order !== undefined ? data.display_order : current.display_order,
      now,
      id
    );

    return this.findById(id);
  },

  delete(id: string): boolean {
    const res = sqlite.prepare('DELETE FROM services WHERE id = ?').run(id);
    return res.changes > 0;
  }
};

// -------------------------------------------------------------
// CONTACT MESSAGES REPOSITORY
// -------------------------------------------------------------

export const ContactMessageRepository = {
  create(data: { name: string; phone: string; email?: string | null; message: string }): ContactMessage {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO contact_messages (id, name, phone, email, message, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'NEW', ?, ?)
    `).run(id, data.name.trim(), data.phone.trim(), data.email?.trim() || null, data.message.trim(), now, now);

    const row = sqlite.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
    const msg = cast<ContactMessage>(row);
    if (msg) {
      syncContactMessageToFirestore({
        id: msg.id,
        name: msg.name,
        phone: msg.phone,
        email: msg.email,
        message: msg.message,
        status: msg.status,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
      }).catch(() => {});
    }
    return msg;
  },

  listAll(): ContactMessage[] {
    const rows = sqlite.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    return cast<ContactMessage[]>(rows);
  },

  findById(id: string): ContactMessage | null {
    const row = sqlite.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
    return row ? cast<ContactMessage>(row) : null;
  },

  updateStatus(id: string, status: ContactMessage['status']): ContactMessage | null {
    const now = new Date().toISOString();
    sqlite.prepare('UPDATE contact_messages SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    const updated = this.findById(id);
    if (updated) {
      syncContactMessageToFirestore({
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        message: updated.message,
        status: updated.status,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      }).catch(() => {});
    }
    return updated;
  },

  delete(id: string): boolean {
    const existing = this.findById(id);
    const res = sqlite.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
    if (existing) {
      deleteContactMessageFromFirestore(existing.id).catch(() => {});
    }
    return res.changes > 0;
  }
};

// -------------------------------------------------------------
// FAQS REPOSITORY
// -------------------------------------------------------------

export const FAQRepository = {
  listPublished(): FAQ[] {
    const rows = sqlite.prepare('SELECT * FROM faqs WHERE is_published = 1 ORDER BY display_order ASC, created_at ASC').all();
    return cast<FAQ[]>(rows);
  },

  listAll(): FAQ[] {
    const rows = sqlite.prepare('SELECT * FROM faqs ORDER BY display_order ASC, created_at ASC').all();
    return cast<FAQ[]>(rows);
  },

  findById(id: string): FAQ | null {
    const row = sqlite.prepare('SELECT * FROM faqs WHERE id = ?').get(id);
    return row ? cast<FAQ>(row) : null;
  },

  create(question: string, answer: string, displayOrder = 0): FAQ {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO faqs (id, question, answer, is_published, display_order, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `).run(id, question.trim(), answer.trim(), displayOrder, now, now);
    return this.findById(id)!;
  },

  update(id: string, data: { question?: string; answer?: string; isPublished?: boolean; displayOrder?: number }): FAQ | null {
    const current = this.findById(id);
    if (!current) return null;
    const now = new Date().toISOString();

    sqlite.prepare(`
      UPDATE faqs SET
        question = ?, answer = ?, is_published = ?, display_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.question ?? current.question,
      data.answer ?? current.answer,
      data.isPublished !== undefined ? (data.isPublished ? 1 : 0) : current.is_published,
      data.displayOrder !== undefined ? data.displayOrder : current.display_order,
      now,
      id
    );

    return this.findById(id);
  },

  delete(id: string): boolean {
    const res = sqlite.prepare('DELETE FROM faqs WHERE id = ?').run(id);
    return res.changes > 0;
  }
};

// -------------------------------------------------------------
// TESTIMONIALS REPOSITORY (Strictly authorized only)
// -------------------------------------------------------------

export const TestimonialRepository = {
  listPublished(): Testimonial[] {
    const rows = sqlite.prepare('SELECT * FROM testimonials WHERE is_published = 1 ORDER BY created_at DESC').all();
    return cast<Testimonial[]>(rows);
  },

  listAll(): Testimonial[] {
    const rows = sqlite.prepare('SELECT * FROM testimonials ORDER BY created_at DESC').all();
    return cast<Testimonial[]>(rows);
  },

  findById(id: string): Testimonial | null {
    const row = sqlite.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
    return row ? cast<Testimonial>(row) : null;
  },

  create(name: string, content: string, rating = 5, isPublished = false): Testimonial {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO testimonials (id, name, content, rating, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), content.trim(), rating, isPublished ? 1 : 0, now, now);
    return this.findById(id)!;
  },

  update(id: string, data: { name?: string; content?: string; rating?: number; isPublished?: boolean }): Testimonial | null {
    const current = this.findById(id);
    if (!current) return null;
    const now = new Date().toISOString();

    sqlite.prepare(`
      UPDATE testimonials SET
        name = ?, content = ?, rating = ?, is_published = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.name ?? current.name,
      data.content ?? current.content,
      data.rating ?? current.rating,
      data.isPublished !== undefined ? (data.isPublished ? 1 : 0) : current.is_published,
      now,
      id
    );

    return this.findById(id);
  },

  delete(id: string): boolean {
    const res = sqlite.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
    return res.changes > 0;
  }
};

// -------------------------------------------------------------
// GALLERY REPOSITORY
// -------------------------------------------------------------

export const GalleryRepository = {
  listPublished(): GalleryImage[] {
    const rows = sqlite.prepare('SELECT * FROM gallery_images WHERE is_published = 1 ORDER BY display_order ASC, created_at DESC').all();
    return cast<GalleryImage[]>(rows);
  },

  listAll(): GalleryImage[] {
    const rows = sqlite.prepare('SELECT * FROM gallery_images ORDER BY display_order ASC, created_at DESC').all();
    return cast<GalleryImage[]>(rows);
  },

  findById(id: string): GalleryImage | null {
    const row = sqlite.prepare('SELECT * FROM gallery_images WHERE id = ?').get(id);
    return row ? cast<GalleryImage>(row) : null;
  },

  create(title: string, imageUrl: string, altText: string, category = 'Clinic', displayOrder = 0): GalleryImage {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO gallery_images (id, title, image_url, alt_text, category, display_order, is_published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, title.trim(), imageUrl.trim(), altText.trim(), category, displayOrder, now, now);
    return this.findById(id)!;
  },

  delete(id: string): boolean {
    const res = sqlite.prepare('DELETE FROM gallery_images WHERE id = ?').run(id);
    return res.changes > 0;
  }
};

// -------------------------------------------------------------
// SITE SETTINGS REPOSITORY
// -------------------------------------------------------------

export const SiteSettingsRepository = {
  get(): SiteSettings {
    const row = sqlite.prepare('SELECT * FROM site_settings WHERE id = ?').get('settings');
    return cast<SiteSettings>(row);
  },

  update(data: Partial<SiteSettings>): SiteSettings {
    const current = this.get();
    const now = new Date().toISOString();

    sqlite.prepare(`
      UPDATE site_settings SET
        clinic_name = ?, tagline = ?, phone = ?, whatsapp = ?, email = ?,
        address = ?, city = ?, state = ?, pincode = ?, google_maps_url = ?,
        logo_url = ?, favicon_url = ?, hero_image_url = ?, doctor_image_url = ?,
        social_links = ?, seo_title = ?, seo_description = ?, working_days = ?,
        opening_time = ?, closing_time = ?, appointment_duration = ?, buffer_time = ?,
        break_start = ?, break_end = ?, blocked_dates = ?, updated_at = ?
      WHERE id = 'settings'
    `).run(
      data.clinic_name ?? current.clinic_name,
      data.tagline ?? current.tagline,
      data.phone ?? current.phone,
      data.whatsapp ?? current.whatsapp,
      data.email ?? current.email,
      data.address ?? current.address,
      data.city ?? current.city,
      data.state ?? current.state,
      data.pincode ?? current.pincode,
      data.google_maps_url ?? current.google_maps_url,
      data.logo_url ?? current.logo_url,
      data.favicon_url ?? current.favicon_url,
      data.hero_image_url ?? current.hero_image_url,
      data.doctor_image_url ?? current.doctor_image_url,
      data.social_links ?? current.social_links,
      data.seo_title ?? current.seo_title,
      data.seo_description ?? current.seo_description,
      data.working_days ?? current.working_days,
      data.opening_time ?? current.opening_time,
      data.closing_time ?? current.closing_time,
      data.appointment_duration !== undefined ? data.appointment_duration : current.appointment_duration,
      data.buffer_time !== undefined ? data.buffer_time : current.buffer_time,
      data.break_start ?? current.break_start,
      data.break_end ?? current.break_end,
      data.blocked_dates ?? current.blocked_dates,
      now
    );

    return this.get();
  }
};

// -------------------------------------------------------------
// AUDIT LOG REPOSITORY
// -------------------------------------------------------------

export const AuditLogRepository = {
  log(action: string, entity: string, entityId?: string | null, details?: string | null, adminUserId?: string | null, adminUserName?: string | null): void {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      sqlite.prepare(`
        INSERT INTO audit_logs (id, admin_user_id, admin_user_name, action, entity, entity_id, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, adminUserId || null, adminUserName || null, action, entity, entityId || null, details || null, now);
    } catch (e) {
      console.error('[AuditLog] Failed to write log:', e);
    }
  },

  listRecent(limit = 100): AuditLog[] {
    const rows = sqlite.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
    return cast<AuditLog[]>(rows);
  }
};
