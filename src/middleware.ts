import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/types";

// Rute publik (tidak butuh sesi)
const PUBLIC = ["/login", "/auth/callback"];

// Hak akses per-prefix rute. (Validasi sebenarnya tetap di backend.)
const RULES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/ujian", roles: ["student"] },
  { prefix: "/hasil-ujian", roles: ["student"] },
  { prefix: "/exam", roles: ["student"] },
  { prefix: "/blok-saya", roles: ["ketua_block"] },
  { prefix: "/blocks", roles: ["admin", "super_admin"] },
  { prefix: "/kelola-ujian", roles: ["admin", "super_admin"] },
  { prefix: "/periode", roles: ["admin", "super_admin"] },
  { prefix: "/bank-soal", roles: ["super_admin"] },
  { prefix: "/pengguna", roles: ["super_admin"] },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const role = req.cookies.get("cbt_role")?.value as Role | undefined;

  // Belum login → ke /login
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Cek rule akses
  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (rule && !rule.roles.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan di semua rute kecuali aset statis & file
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
