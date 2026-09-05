/** Style: Aviation Operations Room — compact, instrumental branding with an aircraft-vector mark. */
import { Radar } from "lucide-react";

type BrandProps = { compact?: boolean; light?: boolean; onClick?: () => void };

export function Brand({ compact = false, light = false, onClick }: BrandProps) {
  return (
    <button onClick={onClick} className={`group flex items-center gap-3 text-left ${light ? "text-white" : "text-foreground"}`} aria-label="Go to AeroIndex India home">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-primary/40 bg-primary/10 shadow-[0_0_28px_rgba(95,224,207,.16)]">
        <img src="/aeroindex-logo.svg" alt="AeroIndex India Logo" className="absolute inset-0 h-full w-full object-contain p-1.5" />
        <Radar className="h-5 w-5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      {!compact && <span className="leading-none"><span className="block font-display text-[15px] font-bold tracking-[0.16em]">AERO<span className="text-primary">INDEX</span></span><span className="mt-1 block text-[9px] font-semibold tracking-[0.23em] text-muted-foreground">INDIA · SIGNAL DESK</span></span>}
    </button>
  );
}
