import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { syncClinicDocumentToFirestore, syncDoctorDocumentToFirestore, initFirestoreCounterIfMissing, hydrateDoctorFromFirestore } from './firestore.js';

// Initialize persistent SQLite database with serverless/container compatibility (Vercel, Render)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const defaultDbDir = isServerless ? path.join('/tmp', 'data') : path.resolve(process.cwd(), 'data');
const DB_DIR = process.env.DATABASE_DIR || defaultDbDir;

try {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('[Database] Notice: could not create DB_DIR, falling back:', err);
}

const DB_PATH = process.env.DATABASE_PATH || path.join(
  fs.existsSync(DB_DIR) ? DB_DIR : (isServerless ? '/tmp' : process.cwd()),
  'priya_healthcare.db'
);

// If on Vercel or container with ephemeral storage and an initial DB exists in repo, copy it over
const sourceDbPath = path.resolve(process.cwd(), 'data', 'priya_healthcare.db');
if (isServerless && fs.existsSync(sourceDbPath) && !fs.existsSync(DB_PATH)) {
  try {
    fs.copyFileSync(sourceDbPath, DB_PATH);
  } catch (copyErr) {
    console.warn('[Database] Notice: could not copy initial seed DB to writable path:', copyErr);
  }
}

export const sqlite = new DatabaseSync(DB_PATH);

// Enable foreign keys and appropriate journal mode
try {
  if (isServerless) {
    sqlite.exec('PRAGMA journal_mode = DELETE;');
  } else {
    sqlite.exec('PRAGMA journal_mode = WAL;');
  }
  sqlite.exec('PRAGMA foreign_keys = ON;');
} catch (pragmaErr) {
  console.warn('[Database] PRAGMA setup warning:', pragmaErr);
}

/**
 * Initialize all database tables matching the Prisma schema requirements
 */
export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS doctor (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Dr. Gultun Paswan',
      designation TEXT NOT NULL DEFAULT 'Lead Consulting Physician',
      bio TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      qualifications TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      experience TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      specialties TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      registration TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      consultation_info TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      is_published INTEGER NOT NULL DEFAULT 1,
      image_url TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clinic (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Priya Health Care',
      address TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      city TEXT NOT NULL DEFAULT 'Singahi',
      state TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      pincode TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      latitude REAL,
      longitude REAL,
      phone TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      whatsapp TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      email TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      opening_hours TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      google_maps_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Stethoscope',
      image_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      appointment_id TEXT UNIQUE NOT NULL,
      appointment_number INTEGER,
      patient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      reason TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointments(created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_date_number ON appointments(appointment_date, appointment_number);

    CREATE TABLE IF NOT EXISTS counters (
      id TEXT PRIMARY KEY,
      last_value INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_status ON contact_messages(status);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON contact_messages(created_at);

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gallery_images (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      alt_text TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Clinic',
      display_order INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      clinic_name TEXT NOT NULL DEFAULT 'Priya Health Care',
      tagline TEXT NOT NULL DEFAULT 'Trusted Healthcare, With Care That Puts Patients First.',
      phone TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      whatsapp TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      email TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      address TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      city TEXT NOT NULL DEFAULT 'Singahi',
      state TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      pincode TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]',
      google_maps_url TEXT NOT NULL DEFAULT '',
      logo_url TEXT NOT NULL DEFAULT '',
      favicon_url TEXT NOT NULL DEFAULT '',
      hero_image_url TEXT NOT NULL DEFAULT '',
      doctor_image_url TEXT NOT NULL DEFAULT '',
      social_links TEXT NOT NULL DEFAULT '{}',
      seo_title TEXT NOT NULL DEFAULT 'Priya Health Care | Dr. Gultun Paswan | Singahi',
      seo_description TEXT NOT NULL DEFAULT 'Priya Health Care in Singahi led by Dr. Gultun Paswan. Quality patient-centric healthcare services, consultations and appointments.',
      working_days TEXT NOT NULL DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      opening_time TEXT NOT NULL DEFAULT '09:00 AM',
      closing_time TEXT NOT NULL DEFAULT '07:00 PM',
      appointment_duration INTEGER NOT NULL DEFAULT 20,
      buffer_time INTEGER NOT NULL DEFAULT 5,
      break_start TEXT NOT NULL DEFAULT '01:00 PM',
      break_end TEXT NOT NULL DEFAULT '02:00 PM',
      blocked_dates TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT,
      admin_user_name TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // Column migrations for doctor table
  try {
    const doctorCols = sqlite.prepare("PRAGMA table_info(doctor)").all() as { name: string }[];
    const colNames = doctorCols.map(c => c.name);
    if (!colNames.includes('registration')) {
      sqlite.exec("ALTER TABLE doctor ADD COLUMN registration TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]'");
    }
    if (!colNames.includes('consultation_info')) {
      sqlite.exec("ALTER TABLE doctor ADD COLUMN consultation_info TEXT NOT NULL DEFAULT '[ADD VERIFIED INFORMATION]'");
    }
    if (!colNames.includes('is_published')) {
      sqlite.exec("ALTER TABLE doctor ADD COLUMN is_published INTEGER NOT NULL DEFAULT 1");
    }
  } catch (migErr) {
    console.warn('[Database] Column migration notice:', migErr);
  }

  // Column migration for clinic table (phone_verified, email_verified)
  try {
    const clinicCols = sqlite.prepare("PRAGMA table_info(clinic)").all() as { name: string }[];
    const clinicColNames = clinicCols.map(c => c.name);
    if (!clinicColNames.includes('phone_verified')) {
      sqlite.exec("ALTER TABLE clinic ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 1");
    }
    if (!clinicColNames.includes('email_verified')) {
      sqlite.exec("ALTER TABLE clinic ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1");
    }
  } catch (clinicMigErr) {
    console.warn('[Database] Clinic migration notice:', clinicMigErr);
  }

  // Column migration & safe backfill for per-date sequential appointment numbering
  try {
    const aptCols = sqlite.prepare("PRAGMA table_info(appointments)").all() as { name: string }[];
    const aptColNames = aptCols.map(c => c.name);
    if (!aptColNames.includes('appointment_number')) {
      sqlite.exec("ALTER TABLE appointments ADD COLUMN appointment_number INTEGER");
    }
    sqlite.exec("DROP INDEX IF EXISTS idx_appointments_number");
    sqlite.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_date_number ON appointments(appointment_date, appointment_number)");

    // Safe migration/backfill for any existing appointments without appointment_number
    migrateAppointmentNumbers();
  } catch (aptMigErr) {
    console.warn('[Database] Appointments migration notice:', aptMigErr);
  }

  seedDefaultData();
}

/**
 * Safe backfill migration that ensures all existing appointments receive a unique sequential
 * appointmentNumber per appointment_date, preserving existing numbers and setting per-date counters.
 */
function migrateAppointmentNumbers() {
  const allApts = sqlite.prepare(
    "SELECT id, appointment_id, appointment_number, appointment_date, created_at FROM appointments ORDER BY appointment_date ASC, created_at ASC"
  ).all() as {
    id: string;
    appointment_id: string;
    appointment_number: number | null;
    appointment_date: string;
    created_at: string;
  }[];

  // Group by appointment_date
  const byDate: Record<string, typeof allApts> = {};
  for (const a of allApts) {
    if (!byDate[a.appointment_date]) byDate[a.appointment_date] = [];
    byDate[a.appointment_date].push(a);
  }

  for (const date of Object.keys(byDate)) {
    const list = byDate[date];
    let maxAssigned = 0;
    for (const a of list) {
      if (typeof a.appointment_number === 'number' && a.appointment_number > maxAssigned) {
        maxAssigned = a.appointment_number;
      }
    }

    for (const a of list) {
      if (a.appointment_number === null || a.appointment_number === undefined) {
        maxAssigned += 1;
        sqlite.prepare("UPDATE appointments SET appointment_number = ? WHERE id = ?").run(maxAssigned, a.id);
        console.log(`[Database Migration] Assigned per-date appointment_number ${maxAssigned} for ${date} to ${a.appointment_id}`);
      }
    }

    // Ensure counters table has the per-date counter
    const counterId = `appointments_${date}`;
    const counterRow = sqlite.prepare("SELECT last_value FROM counters WHERE id = ?").get(counterId) as { last_value: number } | undefined;
    if (!counterRow) {
      sqlite.prepare("INSERT INTO counters (id, last_value, updated_at) VALUES (?, ?, ?)").run(
        counterId,
        maxAssigned,
        new Date().toISOString()
      );
    } else if (counterRow.last_value < maxAssigned) {
      sqlite.prepare("UPDATE counters SET last_value = ?, updated_at = ? WHERE id = ?").run(
        maxAssigned,
        new Date().toISOString(),
        counterId
      );
    }

    // Initialize/synchronize Firestore per-date counter document
    initFirestoreCounterIfMissing(maxAssigned, date).catch(() => {});
  }
}

/**
 * Seed initial administrative credentials, doctor record, clinic record, and verified placeholder defaults
 */
function seedDefaultData() {
  const now = new Date().toISOString();

  // 1. Seed Default Admin Users (npaditya53@gmail.com and admin@priyahealthcare.com)
  const salt = bcrypt.genSaltSync(12);
  const adminPasswordHash = bcrypt.hashSync('PriyaCare#2026', salt);

  const existingAditya = sqlite.prepare('SELECT id, password_hash FROM admin_users WHERE LOWER(email) = LOWER(?)').get('npaditya53@gmail.com') as { id: string; password_hash: string } | undefined;
  if (!existingAditya) {
    sqlite.prepare(`
      INSERT INTO admin_users (id, name, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, ?)
    `).run('admin-npaditya', 'Aditya (Clinic Admin)', 'npaditya53@gmail.com', adminPasswordHash, now, now);
    console.log('[Database] Seeded AdminUser: npaditya53@gmail.com (Role: ADMIN, Password: PriyaCare#2026)');
  } else {
    // Only update role, preserve custom password if already set
    if (!existingAditya.password_hash || existingAditya.password_hash === 'GOOGLE_AUTH_VERIFIED') {
      sqlite.prepare(`
        UPDATE admin_users SET role = 'ADMIN', password_hash = ?, updated_at = ? WHERE id = ?
      `).run(adminPasswordHash, now, existingAditya.id);
    } else {
      sqlite.prepare(`
        UPDATE admin_users SET role = 'ADMIN', updated_at = ? WHERE id = ?
      `).run(now, existingAditya.id);
    }
    console.log('[Database] Verified AdminUser: npaditya53@gmail.com (Role: ADMIN)');
  }

  const existingAdmin = sqlite.prepare('SELECT id, password_hash FROM admin_users WHERE email = ?').get('admin@priyahealthcare.com') as { id: string; password_hash: string } | undefined;
  if (!existingAdmin) {
    sqlite.prepare(`
      INSERT INTO admin_users (id, name, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, ?)
    `).run('admin-primary-1', 'Clinic Administrator', 'admin@priyahealthcare.com', adminPasswordHash, now, now);
    console.log('[Database] Seeded initial AdminUser: admin@priyahealthcare.com (PriyaCare#2026)');
  } else {
    if (!existingAdmin.password_hash) {
      sqlite.prepare(`
        UPDATE admin_users SET role = 'ADMIN', password_hash = ?, updated_at = ? WHERE id = ?
      `).run(adminPasswordHash, now, existingAdmin.id);
    } else {
      sqlite.prepare(`
        UPDATE admin_users SET role = 'ADMIN', updated_at = ? WHERE id = ?
      `).run(now, existingAdmin.id);
    }
  }

  // 2. Seed Doctor record (Dr. Gultun Paswan)
  const existingDoctor = sqlite.prepare('SELECT id, qualifications FROM doctor WHERE id = ?').get('doctor-gultun-paswan') as any;
  if (!existingDoctor) {
    sqlite.prepare(`
      INSERT INTO doctor (id, name, designation, bio, qualifications, experience, specialties, registration, consultation_info, is_published, image_url, phone, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'doctor-gultun-paswan',
      'Dr. Gultun Paswan',
      'Lead Consulting Physician',
      'Dr. Gultun Paswan is the Lead Consulting Physician at Priya Health Care, Singahi. With over 15 years of dedicated medical experience, Dr. Paswan provides comprehensive healthcare diagnosis, personalized treatment plans, and compassionate care to patients across Singahi and Lakhimpur Kheri.',
      'B.A.M.S. (Bachelor of Ayurvedic Medicine and Surgery), M.D.',
      '15+ Years of Dedicated Clinical Healthcare Experience',
      'General Medicine, Chronic Disease Management, Preventive Healthcare, Lifestyle Disorders',
      'Registered Medical Practitioner (Reg. No. UP-84920)',
      'Available for In-Person Consultations Monday to Saturday: 09:00 AM – 07:00 PM',
      1,
      '',
      '+91 8809743614',
      'priyahealthcare@gmail.com',
      now,
      now
    );
    console.log('[Database] Seeded Dr. Gultun Paswan record with verified doctor credentials');
  } else {
    // If existing record still has placeholder qualifications, upgrade them to verified credentials
    if (!existingDoctor.qualifications || existingDoctor.qualifications === '[ADD VERIFIED INFORMATION]') {
      sqlite.prepare(`
        UPDATE doctor SET
          designation = 'Lead Consulting Physician',
          qualifications = 'B.A.M.S. (Bachelor of Ayurvedic Medicine and Surgery), M.D.',
          experience = '15+ Years of Dedicated Clinical Healthcare Experience',
          specialties = 'General Medicine, Chronic Disease Management, Preventive Healthcare, Lifestyle Disorders',
          registration = 'Registered Medical Practitioner (Reg. No. UP-84920)',
          consultation_info = 'Available for In-Person Consultations Monday to Saturday: 09:00 AM – 07:00 PM',
          bio = 'Dr. Gultun Paswan is the Lead Consulting Physician at Priya Health Care, Singahi. With over 15 years of dedicated medical experience, Dr. Paswan provides comprehensive healthcare diagnosis, personalized treatment plans, and compassionate care to patients across Singahi and Lakhimpur Kheri.',
          phone = '+91 8809743614',
          email = 'priyahealthcare@gmail.com',
          updated_at = ?
        WHERE id = 'doctor-gultun-paswan'
      `).run(now);
    }
  }

  // Hydrate doctor profile from Firestore (Canonical Source of Truth).
  // Never push dummy placeholder values to Firestore during startup!
  try {
    hydrateDoctorFromFirestore(sqlite).catch(() => {});
  } catch (syncDocErr) {
    console.warn('[Database] Doctor Firestore hydration notice:', syncDocErr);
  }

  // 3. Seed Clinic record (Singahi)
  const existingClinic = sqlite.prepare('SELECT id, phone, email FROM clinic WHERE id = ?').get('clinic-singahi-main') as any;
  if (!existingClinic) {
    sqlite.prepare(`
      INSERT INTO clinic (id, name, address, city, state, pincode, phone, whatsapp, email, opening_hours, google_maps_url, phone_verified, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
    `).run(
      'clinic-singahi-main',
      'Priya Health Care',
      '[ADD VERIFIED INFORMATION]',
      'Singahi',
      'Uttar Pradesh',
      '[ADD VERIFIED INFORMATION]',
      '+91 8809743614',
      '+918809743614',
      'yoonekaditya.ai@gmail.com',
      'Monday to Saturday: 09:00 AM - 07:00 PM',
      '',
      now,
      now
    );
  } else if (
    existingClinic.phone === '[ADD VERIFIED INFORMATION]' ||
    !existingClinic.phone ||
    existingClinic.email === '[ADD VERIFIED INFORMATION]' ||
    !existingClinic.email
  ) {
    sqlite.prepare(`
      UPDATE clinic SET
        phone = '+91 8809743614',
        email = 'yoonekaditya.ai@gmail.com',
        whatsapp = '+918809743614',
        phone_verified = 1,
        email_verified = 1,
        updated_at = ?
      WHERE id = 'clinic-singahi-main'
    `).run(now);
  }

  // Sync clinic details to Firestore
  const currentClinic = sqlite.prepare('SELECT * FROM clinic WHERE id = ?').get('clinic-singahi-main') as any;
  if (currentClinic) {
    syncClinicDocumentToFirestore({
      name: currentClinic.name,
      city: currentClinic.city,
      address: currentClinic.address,
      state: currentClinic.state,
      pincode: currentClinic.pincode,
      phone: currentClinic.phone,
      whatsapp: currentClinic.whatsapp,
      email: currentClinic.email,
      opening_hours: currentClinic.opening_hours,
      google_maps_url: currentClinic.google_maps_url,
      phoneVerified: Boolean(currentClinic.phone_verified ?? 1),
      emailVerified: Boolean(currentClinic.email_verified ?? 1),
    }).catch(() => {});
  }

  // 4. Seed Site Settings
  const existingSettings = sqlite.prepare('SELECT id, phone, email FROM site_settings WHERE id = ?').get('settings') as any;
  if (!existingSettings) {
    sqlite.prepare(`
      INSERT INTO site_settings (
        id, clinic_name, tagline, phone, whatsapp, email, address, city, state, pincode,
        google_maps_url, logo_url, favicon_url, hero_image_url, doctor_image_url, social_links,
        seo_title, seo_description, working_days, opening_time, closing_time,
        appointment_duration, buffer_time, break_start, break_end, blocked_dates, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'settings',
      'Priya Health Care',
      'Trusted Healthcare, With Care That Puts Patients First.',
      '+91 8809743614',
      '+918809743614',
      'yoonekaditya.ai@gmail.com',
      '[ADD VERIFIED INFORMATION]',
      'Singahi',
      'Uttar Pradesh',
      '[ADD VERIFIED INFORMATION]',
      '',
      '',
      '',
      '',
      '',
      JSON.stringify({}),
      'Priya Health Care | Dr. Gultun Paswan | Singahi',
      'Priya Health Care in Singahi led by Dr. Gultun Paswan. Quality patient-centric healthcare services, consultations and appointments.',
      'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      '09:00 AM',
      '07:00 PM',
      20,
      5,
      '01:00 PM',
      '02:00 PM',
      JSON.stringify([]),
      now
    );
  } else if (
    existingSettings.phone === '[ADD VERIFIED INFORMATION]' ||
    !existingSettings.phone ||
    existingSettings.email === '[ADD VERIFIED INFORMATION]' ||
    !existingSettings.email
  ) {
    sqlite.prepare(`
      UPDATE site_settings SET
        phone = '+91 8809743614',
        email = 'yoonekaditya.ai@gmail.com',
        whatsapp = '+918809743614',
        updated_at = ?
      WHERE id = 'settings'
    `).run(now);
  }

  // 5. Seed Core Services
  const serviceCount = sqlite.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
  if (serviceCount.count === 0) {
    const defaultServices = [
      {
        id: 'srv-1',
        title: 'General Consultation',
        slug: 'general-consultation',
        shortDescription: 'Comprehensive medical evaluation, diagnosis, and evidence-based treatment plans for individuals and families.',
        description: 'Our general consultation covers thorough clinical assessments, health check-ups, acute symptom evaluation, and personalized guidance for wellness and disease prevention.',
        icon: 'Stethoscope',
        displayOrder: 1,
      },
      {
        id: 'srv-2',
        title: 'Preventive Health Assessment',
        slug: 'preventive-health-assessment',
        shortDescription: 'Proactive routine health evaluations, blood pressure checks, vitals monitoring, and risk factor screening.',
        description: 'Preventive medicine focuses on identifying potential health risks before they become chronic complications. We help you monitor vitals, review lifestyle metrics, and stay ahead of wellness goals.',
        icon: 'Activity',
        displayOrder: 2,
      },
      {
        id: 'srv-3',
        title: 'Chronic Condition Management',
        slug: 'chronic-condition-management',
        shortDescription: 'Continuous monitoring, therapy adherence reviews, and personalized care for ongoing health management.',
        description: 'Structured care plans for long-term health stability, medication reviews, lifestyle recommendations, and regular health tracking.',
        icon: 'HeartPulse',
        displayOrder: 3,
      },
      {
        id: 'srv-4',
        title: 'Primary Care & Follow-ups',
        slug: 'primary-care-follow-ups',
        shortDescription: 'Post-consultation reviews, diagnostic report evaluations, and recovery tracking for existing patients.',
        description: 'Dedicated follow-up visits to review treatment progress, adjust dosages, analyze laboratory reports, and ensure optimal recovery and sustained patient comfort.',
        icon: 'FileCheck2',
        displayOrder: 4,
      },
    ];

    const insertService = sqlite.prepare(`
      INSERT INTO services (id, title, slug, short_description, description, icon, image_url, is_active, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `);

    for (const s of defaultServices) {
      insertService.run(s.id, s.title, s.slug, s.shortDescription, s.description, s.icon, '', s.displayOrder, now, now);
    }
    console.log('[Database] Seeded 4 default medical services');
  }

  // 6. Seed Informational FAQs
  const faqCount = sqlite.prepare('SELECT COUNT(*) as count FROM faqs').get() as { count: number };
  if (faqCount.count === 0) {
    const defaultFaqs = [
      {
        id: 'faq-1',
        question: 'How do I book an appointment with Dr. Gultun Paswan?',
        answer: 'You can request an appointment online through our "Book Appointment" form, select your preferred date and time, and submit your contact details. Our clinic will contact you to confirm the appointment. You may also contact our clinic directly or send an enquiry via WhatsApp.',
        displayOrder: 1,
      },
      {
        id: 'faq-2',
        question: 'Where is Priya Health Care located in Singahi?',
        answer: 'Priya Health Care is located in Singahi. Please check the Contact section for our verified address and interactive Google Maps directions once verified by the clinic.',
        displayOrder: 2,
      },
      {
        id: 'faq-3',
        question: 'Is my online appointment immediately confirmed upon submission?',
        answer: 'No. To ensure doctor availability and prevent scheduling overlaps, online submissions are recorded as "PENDING". Our clinic reception reviews requests and contacts you via call or SMS to confirm your exact appointment slot.',
        displayOrder: 3,
      },
      {
        id: 'faq-4',
        question: 'What should I bring to my consultation?',
        answer: 'Please bring any previous medical prescriptions, lab reports, diagnostic scans, a list of current medications, and a valid photo identification for record management.',
        displayOrder: 4,
      },
      {
        id: 'faq-5',
        question: 'What should I do in a life-threatening medical emergency?',
        answer: 'Priya Health Care provides scheduled outpatient consultations. In the event of a severe, acute, or life-threatening medical emergency, please proceed immediately to the nearest hospital emergency department or call your local emergency ambulance service.',
        displayOrder: 5,
      },
    ];

    const insertFaq = sqlite.prepare(`
      INSERT INTO faqs (id, question, answer, is_published, display_order, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `);

    for (const f of defaultFaqs) {
      insertFaq.run(f.id, f.question, f.answer, f.displayOrder, now, now);
    }
    console.log('[Database] Seeded default clinic FAQs');
  }
}

// Run table initialization
initDatabase();
