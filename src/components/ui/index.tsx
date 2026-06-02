"use client";

import { Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

// ----------------------------- Button -----------------------------
type BtnVariant = "primary" | "outline" | "ghost" | "danger" | "subtle";
type BtnSize = "sm" | "md" | "lg";

const btnBase =
  "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-[.98] whitespace-nowrap";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
  outline: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink hover:bg-black/5",
  danger: "bg-danger text-white hover:brightness-95 shadow-sm",
  subtle: "bg-primary-soft text-primary hover:bg-primary/15",
};
const btnSizes: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
}) {
  return (
    <button className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ----------------------------- Card -----------------------------
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

// ----------------------------- Badge -----------------------------
type BadgeTone = "neutral" | "primary" | "success" | "danger" | "warn" | "accent";
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-soft border-line",
  primary: "bg-primary-soft text-primary border-transparent",
  success: "bg-success-soft text-success border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  accent: "bg-accent-soft text-accent border-transparent",
};
export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral", pulse }: { tone?: BadgeTone; pulse?: boolean }) {
  const color: Record<BadgeTone, string> = {
    neutral: "bg-ink-faint", primary: "bg-primary", success: "bg-success",
    danger: "bg-danger", warn: "bg-warn", accent: "bg-accent",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", color[tone], pulse && "animate-pulse-ring")} />;
}

// ----------------------------- Form -----------------------------
export function Label({ className, children, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-ink", className)} {...p}>{children}</label>;
}

const fieldCls =
  "w-full h-10 rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-primary";

export function Input({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldCls, className)} {...p} />;
}
export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldCls, "h-auto min-h-[88px] py-2.5 leading-relaxed", className)} {...p} />;
}
export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldCls, "appearance-none bg-[length:18px] bg-[right_12px_center] bg-no-repeat pr-9", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2351605c' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")" }}
      {...p}>
      {children}
    </select>
  );
}

export function Field({ label, hint, error, children }: { label?: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      {children}
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Checkbox({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn("h-4 w-4 rounded border-line text-primary accent-[var(--primary)]", className)} {...p} />;
}

// ----------------------------- Progress -----------------------------
export function ProgressBar({ value, tone = "primary", className }: { value: number; tone?: BadgeTone; className?: string }) {
  const bar: Record<BadgeTone, string> = {
    neutral: "bg-ink-faint", primary: "bg-primary", success: "bg-success",
    danger: "bg-danger", warn: "bg-warn", accent: "bg-accent",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-line", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", bar[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ----------------------------- Avatar -----------------------------
export function Avatar({ name, className }: { name: string; className?: string }) {
  const init = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full bg-primary text-xs font-semibold text-white", className)}>
      {init}
    </span>
  );
}

// ----------------------------- Spinner / Empty -----------------------------
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-ink-faint", className)} />;
}

export function CenterSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-faint">
      <Spinner className="h-6 w-6" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon?: React.ReactNode; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-2 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ink-faint">{icon}</div>}
      <p className="font-medium text-ink">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-ink-soft">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ----------------------------- Modal -----------------------------
export function Modal({ open, onClose, title, desc, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title?: string; desc?: string;
  children: React.ReactNode; footer?: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" | "2xl";
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl", "2xl": "max-w-6xl" }[size];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
      {/* backdrop */}
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* modal box — flex column, constrained to viewport */}
      <div
        className={cn("relative w-full rounded-2xl border border-line bg-surface shadow-pop animate-scale-in", w)}
        style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 64px)" }}
      >
        {/* header — fixed, tidak scroll */}
        {(title || desc) && (
          <div style={{ flexShrink: 0 }} className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div>
              {title && <h2 className="font-display text-lg text-ink">{title}</h2>}
              {desc && <p className="mt-0.5 text-sm text-ink-soft">{desc}</p>}
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-ink-faint hover:bg-black/5 hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* body — satu-satunya bagian yang scroll */}
        <div style={{ flex: "1 1 0", minHeight: 0, overflowY: "auto" }} className="px-6 py-4">
          {children}
        </div>

        {/* footer — fixed, tidak scroll */}
        {footer && (
          <div style={{ flexShrink: 0 }} className="flex justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------- Tabs -----------------------------
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface-2 p-1 no-scrollbar">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cn("flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === t.id ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink")}>
          {t.label}
          {t.count != null && <span className={cn("rounded-full px-1.5 text-xs", value === t.id ? "bg-primary-soft text-primary" : "bg-line text-ink-soft")}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
