/**
 * Centralized Single Authorized Admin Configuration (Client)
 * 
 * Single source of truth for authorized admin access.
 * Configurable via VITE_ADMIN_EMAIL in .env.
 * Defaults to 'kumaraditye9@gmail.com'.
 */

export const PRIMARY_ADMIN_EMAIL = (
  (import.meta.env.VITE_ADMIN_EMAIL as string) ||
  'kumaraditye9@gmail.com'
).trim().toLowerCase();

/**
 * Checks if a given email is the single authorized clinic administrator.
 * Case-normalized and whitespace-trimmed.
 */
export function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;
}
