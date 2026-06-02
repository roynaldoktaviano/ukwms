import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-9 w-9 shrink-0", className)}>
      <Image
        src="/logo_gambar.png"
        alt="Logo Widya Mandala"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}

export function Wordmark({ subtitle = true, dark }: { subtitle?: boolean; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-tight">
        <p className={cn("font-display text-[17px] font-semibold", dark ? "text-nav-text" : "text-ink")}>
          CBT <span className="text-accent">FK</span>
        </p>
        {subtitle && (
          <p className={cn("text-[10px] font-medium tracking-wide uppercase", dark ? "text-nav-muted" : "text-ink-faint")}>
            Widya Mandala Surabaya
          </p>
        )}
      </div>
    </div>
  );
}
