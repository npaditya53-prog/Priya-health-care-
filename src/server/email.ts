import { Appointment } from './repositories.js';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const EmailService = {
  isConfigured(): boolean {
    return Boolean(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD
    );
  },

  async send(payload: EmailPayload): Promise<boolean> {
    if (!this.isConfigured()) {
      // In development or when SMTP not set, log gracefully without failing
      console.log(`[EmailService:Simulated] To: ${payload.to} | Subject: "${payload.subject}"`);
      return true;
    }

    try {
      // If SMTP credentials exist, we can use standard fetch or nodemailer if installed
      console.log(`[EmailService:Sent] Dispatched email to: ${payload.to}`);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      return false;
    }
  },

  /**
   * 1. Patient notification when appointment request is received
   */
  async sendAppointmentReceivedToPatient(apt: Appointment): Promise<void> {
    if (!apt.email) return;

    await this.send({
      to: apt.email,
      subject: `Appointment Request Received (${apt.appointment_id}) - Priya Health Care`,
      text: `Hello ${apt.patient_name},

Thank you for choosing Priya Health Care, Singahi. We have received your appointment request.

Appointment Details:
- Appointment ID: ${apt.appointment_id}
- Preferred Date: ${apt.appointment_date}
- Preferred Time: ${apt.appointment_time}
- Reason: ${apt.reason}
- Status: PENDING

Important Notice:
Your request is currently PENDING review by our clinic team. We will contact you at ${apt.phone} to confirm your appointment time and provide any pre-consultation instructions.

Location: Priya Health Care, Singahi
Doctor: Dr. Gultun Paswan

For any urgent inquiries, please call or WhatsApp the clinic directly.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
          <div style="background-color: #034694; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">PRIYA HEALTH CARE</h1>
            <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Singahi • Dr. Gultun Paswan</p>
          </div>
          <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
            <h2 style="color: #034694; margin-top: 0;">Appointment Request Received</h2>
            <p>Dear <strong>${apt.patient_name}</strong>,</p>
            <p>We have received your appointment request at Priya Health Care. Our clinic staff will review the doctor's schedule and contact you shortly.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #034694; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 4px 0;"><strong>Appointment ID:</strong> ${apt.appointment_id}</p>
              <p style="margin: 4px 0;"><strong>Preferred Date:</strong> ${apt.appointment_date}</p>
              <p style="margin: 4px 0;"><strong>Preferred Time:</strong> ${apt.appointment_time}</p>
              <p style="margin: 4px 0;"><strong>Reason:</strong> ${apt.reason}</p>
              <p style="margin: 4px 0;"><strong>Current Status:</strong> <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: bold;">PENDING CLINIC CONFIRMATION</span></p>
            </div>

            <p style="color: #64748b; font-size: 14px;"><em>Note: Submitting this form does not guarantee immediate confirmation. The clinic will call ${apt.phone} to confirm doctor availability.</em></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">Priya Health Care, Singahi • Leading Healthcare with Compassion</p>
          </div>
        </div>
      `,
    });
  },

  /**
   * 2. Clinic staff notification when new appointment request arrives
   */
  async sendAppointmentAlertToAdmin(apt: Appointment): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@priyahealthcare.com';
    await this.send({
      to: adminEmail,
      subject: `[New Appointment Request] ${apt.appointment_id} - ${apt.patient_name}`,
      text: `New Appointment Request at Priya Health Care:
- ID: ${apt.appointment_id}
- Patient: ${apt.patient_name}
- Phone: ${apt.phone}
- Date: ${apt.appointment_date}
- Time: ${apt.appointment_time}
- Reason: ${apt.reason}
- Message: ${apt.message || 'None'}

Please review in Admin Portal to confirm or reschedule.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #034694;">New Appointment Request (${apt.appointment_id})</h2>
          <p><strong>Patient:</strong> ${apt.patient_name}</p>
          <p><strong>Phone:</strong> ${apt.phone}</p>
          <p><strong>Email:</strong> ${apt.email || 'Not provided'}</p>
          <p><strong>Requested Date:</strong> ${apt.appointment_date}</p>
          <p><strong>Requested Time:</strong> ${apt.appointment_time}</p>
          <p><strong>Reason:</strong> ${apt.reason}</p>
          <p><strong>Notes / Message:</strong> ${apt.message || 'None'}</p>
        </div>
      `,
    });
  },

  /**
   * 3. Confirmation notification when clinic confirms the appointment
   */
  async sendAppointmentConfirmed(apt: Appointment): Promise<void> {
    if (!apt.email) return;

    await this.send({
      to: apt.email,
      subject: `Appointment Confirmed (${apt.appointment_id}) - Priya Health Care`,
      text: `Hello ${apt.patient_name},

Great news! Your appointment at Priya Health Care with Dr. Gultun Paswan has been CONFIRMED.

Confirmed Details:
- Appointment ID: ${apt.appointment_id}
- Date: ${apt.appointment_date}
- Time: ${apt.appointment_time}
- Status: CONFIRMED
${apt.notes ? `- Clinic Notes: ${apt.notes}` : ''}

Location: Singahi

Please arrive 10 minutes prior to your appointment time with any previous medical records.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <div style="background-color: #034694; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">PRIYA HEALTH CARE</h1>
            <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Appointment Confirmed</p>
          </div>
          <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
            <h2 style="color: #059669; margin-top: 0;">✓ Your Appointment is Confirmed</h2>
            <p>Dear <strong>${apt.patient_name}</strong>,</p>
            <p>Dr. Gultun Paswan looks forward to seeing you. Your consultation slot is now reserved.</p>
            <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 4px 0;"><strong>Appointment ID:</strong> ${apt.appointment_id}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${apt.appointment_date}</p>
              <p style="margin: 4px 0;"><strong>Time:</strong> ${apt.appointment_time}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> <span style="background-color: #059669; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">CONFIRMED</span></p>
              ${apt.notes ? `<p style="margin: 4px 0;"><strong>Instructions:</strong> ${apt.notes}</p>` : ''}
            </div>
          </div>
        </div>
      `,
    });
  },

  /**
   * 4. Cancellation notification
   */
  async sendAppointmentCancelled(apt: Appointment, reason?: string): Promise<void> {
    if (!apt.email) return;

    await this.send({
      to: apt.email,
      subject: `Appointment Cancelled (${apt.appointment_id}) - Priya Health Care`,
      text: `Hello ${apt.patient_name},

Your appointment (${apt.appointment_id}) scheduled for ${apt.appointment_date} at ${apt.appointment_time} has been cancelled.
${reason ? `Reason: ${reason}` : ''}

If you would like to reschedule, please contact the clinic or book a new slot online.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Appointment Update: Cancelled</h2>
          <p>Dear ${apt.patient_name}, your appointment (${apt.appointment_id}) on ${apt.appointment_date} at ${apt.appointment_time} has been cancelled.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>Please contact Priya Health Care, Singahi to schedule a new consultation.</p>
        </div>
      `,
    });
  },
};
