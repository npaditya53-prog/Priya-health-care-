/**
 * Generates a clean WhatsApp link adhering strictly to:
 * "Use the clinic's verified WhatsApp number. Do not hardcode a fake number."
 */
export function generateWhatsAppLink(
  whatsappNumber: string | null | undefined,
  details?: {
    name?: string;
    date?: string;
    time?: string;
    reason?: string;
    customMessage?: string;
  }
): { url: string; hasVerifiedNumber: boolean } {
  // If number is unverified or placeholder
  const isPlaceholder =
    !whatsappNumber ||
    whatsappNumber.includes('[ADD VERIFIED INFORMATION]') ||
    whatsappNumber.trim() === '';

  // Clean phone number (strip spaces, dashes, plus)
  const cleanNumber = (whatsappNumber || '').replace(/[^0-9]/g, '');

  let text = 'Hello Priya Health Care,\n\nI would like to enquire about a medical consultation.';
  if (details?.customMessage) {
    text = details.customMessage;
  } else if (details?.name || details?.date || details?.time || details?.reason) {
    text = `Hello Priya Health Care,\n\nI would like to enquire about an appointment.\n\nName: ${details.name || ''}\nPreferred Date: ${details.date || ''}\nPreferred Time: ${details.time || ''}\nReason: ${details.reason || ''}`;
  }

  const encodedText = encodeURIComponent(text);

  if (isPlaceholder || cleanNumber.length < 7) {
    // If not verified yet, return a safe fallback or prompt
    return {
      url: `https://wa.me/?text=${encodedText}`,
      hasVerifiedNumber: false,
    };
  }

  return {
    url: `https://wa.me/${cleanNumber}?text=${encodedText}`,
    hasVerifiedNumber: true,
  };
}
