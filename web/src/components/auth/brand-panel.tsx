import { KyrosLogo } from "@/components/shared/logo";

export function BrandPanel() {
  return (
    <section className="relative isolate flex min-h-screen flex-col overflow-hidden bg-primary px-7 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-11">
      <div className="absolute inset-0 -z-10 bg-primary/85" />
      <div className="pointer-events-none absolute right-[-5%] top-[18%] -z-10 h-48 w-48 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute right-[2%] top-[25%] -z-10 h-32 w-32 rounded-full border border-white/10" />

      <div className="relative z-10 flex items-center animate-fade-up">
        <KyrosLogo />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center py-10 sm:py-12 lg:py-10">
        <div className="mb-8 max-w-110 animate-fade-up [animation-delay:80ms]">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c6d4ff]"><span className="h-px w-7 bg-[#9bb6ff]" /> The client portal for your cold storage</div>
          <h1 className="max-w-112.5 font-display text-[clamp(2.15rem,4vw,3.55rem)] font-semibold leading-[0.98] tracking-[-0.07em]">
            Request, track,<br />
            <span className="text-[#d9e3ff]">and pay, no phone calls to check.</span>
          </h1>
          <p className="mt-5 max-w-93.75 text-[14px] leading-6 text-[#d2dcff]">
            Submit storage and retrieval requests, watch your goods move through the warehouse in real time, and settle invoices online the moment they're due.
          </p>
        </div>
        <img src="/login/demo_dashboard.png" alt="" height={700} width={700} className="rounded-md"/>
      </div>

      <div className="relative z-10 mt-auto flex items-end justify-between gap-6 border-t border-white/15 pt-5 animate-fade-up [animation-delay:220ms]">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Built for your whole storage cycle</div>
          <p className="mt-1 max-w-[320px] text-[12px] leading-5 text-white/75">From the pallet you send in to the invoice you settle online, it's one account — not three phone calls.</p>
        </div>
        <div className="hidden shrink-0 text-right text-[10px] leading-5 text-white/50 sm:block">UPI<span className="mx-1.5 text-white/30">·</span>cards<span className="mx-1.5 text-white/30">·</span>net banking</div>
      </div>
    </section>
  );
}