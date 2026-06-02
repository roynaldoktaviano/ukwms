import type { Role, User } from "./types";

// Cookie ringan agar middleware bisa membaca role untuk proteksi rute.
// CATATAN PRODUKSI: token sebaiknya httpOnly cookie yang di-set backend.
// Cookie role di sini hanya untuk UX routing, BUKAN sumber otorisasi —
// otorisasi tetap divalidasi backend pada tiap request.

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${exp}; samesite=lax`;
}
function delCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function persistSession(user: User, tkn?: string) {
  setCookie("cbt_uid", user.id);
  setCookie("cbt_role", user.role);
  if (tkn) setCookie("cbt_token", tkn);
}

export function clearSession() {
  ["cbt_uid", "cbt_role", "cbt_token"].forEach(delCookie);
}

export function getRoleCookie(): Role | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/cbt_role=([^;]+)/);
  return m ? (decodeURIComponent(m[1]) as Role) : null;
}

const SSO_LOGIN = process.env.NEXT_PUBLIC_SSO_LOGIN_URL ?? "";
const SSO_LOGOUT = process.env.NEXT_PUBLIC_SSO_LOGOUT_URL ?? "";

export function ssoLoginUrl(): string {
  const cb = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";
  // Backend memulai alur SSO lalu redirect balik ke `redirect` membawa token.
  return `${SSO_LOGIN}?redirect=${encodeURIComponent(cb)}`;
}
export function ssoLogoutUrl(): string {
  return SSO_LOGOUT;
}

// Tujuan default setelah login, per role.
export function homeForRole(role: Role): string {
  return "/dashboard";
}
