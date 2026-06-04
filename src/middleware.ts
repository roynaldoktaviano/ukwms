import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/types";

const PUBLIC = ["/login", "/auth/callback"];

const RULES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/ujian",        roles: ["student"] },
  { prefix: "/hasil-ujian",  roles: ["student"] },
  { prefix: "/exam",         roles: ["student"] },
  { prefix: "/blok-saya",    roles: ["BLOCK_COORDINATOR"] },
  { prefix: "/dept-saya",    roles: ["DEPT_COORDINATOR"] },
  { prefix: "/blocks",       roles: ["ADMIN", "EXAM_MANAGER"] },
  { prefix: "/kelola-ujian", roles: ["ADMIN", "EXAM_MANAGER"] },
  { prefix: "/periode",      roles: ["ADMIN", "EXAM_MANAGER"] },
  { prefix: "/bank-soal",    roles: ["ADMIN", "QUESTION_MANAGER", "QUESTION_REVIEWER"] },
  { prefix: "/analitik",     roles: ["ADMIN", "ANALYTICS_VIEWER"] },
  { prefix: "/pengguna",     roles: ["ADMIN"] },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const role = req.cookies.get("cbt_role")?.value as Role | undefined;

  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (rule && !rule.roles.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
