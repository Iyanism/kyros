import { Check, Truck, Warehouse, FileText } from "lucide-react";

import { KyrosLogo } from "@/components/shared/logo";

const features = [
  {
    icon: Warehouse,
    label: "Warehouse control",
    desc: "Real-time inventory & slot tracking",
  },
  {
    icon: Truck,
    label: "End-to-end logistics",
    desc: "Inbound, outbound & dispatch",
  },
  {
    icon: FileText,
    label: "Automated billing",
    desc: "Invoices & online payments",
  },
];

export function RegisterBrandPanel() {
  return (
    <section className="relative isolate flex h-screen flex-col overflow-hidden bg-primary px-6 py-6 text-white sm:px-8 sm:py-8 lg:px-10 lg:py-8">
      <div className="absolute inset-0 -z-10 bg-primary/85" />
      <div className="pointer-events-none absolute right-[-5%] top-[18%] -z-10 h-48 w-48 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute right-[2%] top-[25%] -z-10 h-32 w-32 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute left-[10%] bottom-[30%] -z-10 h-40 w-40 rounded-full border border-white/5" />

      <div className="relative z-10 flex items-center justify-between animate-fade-up">
        <KyrosLogo />
        <div className="hidden items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.17em] text-white/60 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#9bdbc7]" />
          Trusted by 200+ companies
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center py-6 sm:py-8">
        <div className="mb-6 max-w-[420px] animate-fade-up [animation-delay:80ms]">
          <div className="mb-3 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#c6d4ff]">
            <span className="h-px w-6 bg-[#9bb6ff]" /> Join Kyros
          </div>
          <h1 className="max-w-[400px] font-display text-[clamp(1.8rem,3vw,2.8rem)] font-semibold leading-[0.98] tracking-[-0.07em]">
            Manage your cold chain<br />
            <span className="text-[#d9e3ff]">in one place.</span>
          </h1>
          <p className="mt-4 max-w-[360px] text-[13px] leading-5 text-[#d2dcff]">
            Register your company and start storing, tracking, and managing your goods — all from a single platform.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid max-w-[420px] grid-cols-3 gap-4 mb-6 animate-fade-up [animation-delay:120ms]">
          <div className="border-r border-white/10 pr-4">
            <div className="text-[20px] font-semibold tracking-[-0.03em]">200+</div>
            <div className="text-[10px] text-white/60">Companies</div>
          </div>
          <div className="border-r border-white/10 pr-4">
            <div className="text-[20px] font-semibold tracking-[-0.03em]">5K+</div>
            <div className="text-[10px] text-white/60">Pallets stored</div>
          </div>
          <div>
            <div className="text-[20px] font-semibold tracking-[-0.03em]">99.9%</div>
            <div className="text-[10px] text-white/60">Uptime</div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid max-w-[440px] grid-cols-3 gap-2.5 animate-fade-up [animation-delay:160ms]">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.label}
                className="group rounded-[10px] border border-white/15 bg-white/5 px-3.5 py-3 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <Icon className="mb-1.5 h-4 w-4 text-white/60 transition-colors group-hover:text-white/80" />
                <div className="text-[11.5px] font-semibold text-white/90">{feature.label}</div>
                <div className="text-[9.5px] leading-snug text-white/55">{feature.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Trust indicators */}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-[10.5px] text-white/60 animate-fade-up [animation-delay:200ms]">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-[#9bdbc7]" /> No credit card required
          </span>
          <span className="hidden h-4 w-px bg-white/20 sm:block" />
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-[#9bdbc7]" /> Free setup
          </span>
          <span className="hidden h-4 w-px bg-white/20 sm:block" />
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-[#9bdbc7]" /> Cancel anytime
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-auto flex items-end justify-between gap-6 border-t border-white/15 pt-4 animate-fade-up [animation-delay:220ms]">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">Join the network</div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-primary bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm"
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-white/75">+200 companies trust us</span>
          </div>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <div className="text-[20px] font-semibold tracking-[-0.03em] text-white/90">~3 min</div>
          <div className="text-[9px] text-white/50">to get started</div>
        </div>
      </div>
    </section>
  );
}