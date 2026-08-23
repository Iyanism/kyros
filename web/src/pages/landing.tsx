import { useState } from "react";
import { Link } from "react-router";
import {
  Thermometer,
  Receipt,
  Truck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Phone,
  Mail,
  Menu,
  X,
  Globe,
  Boxes,
  Layers,
  CreditCard,
  Shield,
  CheckSquare,
  Clock,
  Lock,
  FileText
} from "lucide-react";

import { KyrosLogo } from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Client Portal", href: "#portal" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const CLIENT_FEATURES = [
  {
    tag: "FEATURE 01",
    title: "Dedicated Chamber & Slot Allocation",
    subtitle: "Real-Time Space & Pallet Tracking",
    description:
      "View your dedicated cold storage slots, chamber climate conditions, and exact pallet coordinates across our temperature-controlled facilities.",
    icon: Boxes,
    highlights: [
      "Exact slot location tracking (e.g. WH-01 / CH-A / RK-03)",
      "Live chamber temperature and humidity telemetry",
      "Dedicated rack reservation for your high-value produce",
    ],
  },
  {
    tag: "FEATURE 02",
    title: "Seamless Inbound Storage Requests",
    subtitle: "Submit Deposit Orders Online 24/7",
    description:
      "Submit inward storage requests directly from your portal. Specify product details, expected arrival dates, and batch weights, and receive instant arrival confirmations.",
    icon: Truck,
    highlights: [
      "Online deposit request submission with batch tags",
      "Automated weight and quality inspection records",
      "Real-time status updates from receipt to slot storage",
    ],
  },
  {
    tag: "FEATURE 03",
    title: "Instant Retrieval & FIFO Dispatches",
    subtitle: "Expiry-Aware Dispatch Clearance",
    description:
      "Request partial or full stock dispatches online. Our automated FIFO (First-In, First-Out) and FEFO (First-Expired, First-Out) engine ensures your produce stays fresh.",
    icon: Layers,
    highlights: [
      "One-click outbound retrieval request generation",
      "Automated earliest-expiring batch prioritization",
      "Instant stock balance update upon gate dispatch",
    ],
  },
  {
    tag: "FEATURE 04",
    title: "Transparent Razorpay Invoicing",
    subtitle: "UPI, Cards & Net Banking Online Checkout",
    description:
      "Clear, itemized invoices calculated on exact stored weight (MT) and duration. Pay instantly online via Razorpay and download official payment receipts.",
    icon: Receipt,
    highlights: [
      "Itemized storage charges, handling fees & GST breakdown",
      "Instant online Razorpay checkout (UPI, Credit Cards, Net Banking)",
      "Downloadable proof of storage & digital payment receipts",
    ],
  },
];

const PORTAL_CAPABILITIES = [
  {
    icon: Clock,
    title: "24/7 Real-Time Stock Balance",
    description: "Inspect live metric tonne (MT) inventory, batch numbers, and production dates anytime from your phone or desktop.",
  },
  {
    icon: Lock,
    title: "Private & Secure Account Isolation",
    description: "Your storage data, invoices, and dispatch orders are strictly isolated within your encrypted client portal.",
  },
  {
    icon: FileText,
    title: "Verified Proof of Storage",
    description: "Generate official digital storage certificates with chamber temperature logs for export compliance and bank verification.",
  },
  {
    icon: CreditCard,
    title: "Instant Razorpay Invoice Settlement",
    description: "Settle outstanding invoices in seconds using UPI, Credit/Debit cards, or Net Banking with instant receipt matching.",
  },
];

const PRICING_PLANS = [
  {
    name: "Starter Account",
    tagline: "Ideal for growers and small exporters storing up to 1,000 MT of produce.",
    monthlyPrice: 49,
    annualPrice: 39,
    features: [
      "Up to 1,000 MT Cold Storage Space Access",
      "24/7 Real-Time Stock & Batch Tracking",
      "Digital Inbound Store & Outbound Retrieval Requests",
      "Standard PDF Invoices & Receipts",
      "Email & In-App Customer Support",
    ],
    cta: "Start 14-Day Free Trial",
    popular: false,
  },
  {
    name: "Professional Client",
    tagline: "Complete client portal experience with Razorpay online payments & FIFO dispatches.",
    monthlyPrice: 129,
    annualPrice: 99,
    features: [
      "Up to 10,000 MT Storage Space Allocation",
      "Automated FIFO / FEFO Expiry Dispatch Engine",
      "Full Self-Service Client Portal & Multi-User Access",
      "Instant Razorpay Payments (UPI, Cards, Net Banking)",
      "Real-Time Chamber Temperature Compliance Logs",
      "WhatsApp & Email Dispatch Notifications",
      "Priority 24/7 Dedicated Client Support",
    ],
    cta: "Create Client Account",
    popular: true,
  },
  {
    name: "Enterprise Exporter",
    tagline: "Custom solution for large multi-location exporters and corporate food brands.",
    monthlyPrice: 299,
    annualPrice: 249,
    features: [
      "Unlimited Storage Capacity Across Facilities",
      "Custom ERP & Logistics Integration",
      "Dedicated Account Manager",
      "Custom Export Compliance & HACCP Certifications",
      "Multi-Department User Permissions",
      "99.99% Guaranteed Platform Uptime",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const FAQS = [
  {
    question: "How do I create a client account and request storage space?",
    answer:
      "Creating an account takes less than 2 minutes. Simply click 'Start for free', register your company details, and you'll immediately gain access to your private client portal where you can submit inbound storage requests.",
  },
  {
    question: "How is my stored inventory balance calculated and tracked?",
    answer:
      "Kyros tracks inventory down to exact slot coordinates and batch numbers. Every 1 Metric Tonne (1 MT) pallet position is updated in real time so you always know your exact available and stored quantities.",
  },
  {
    question: "How do outbound dispatch requests work?",
    answer:
      "When you need to retrieve stock, log into your portal and submit a retrieval request specifying the item and quantity. Our automated FIFO/FEFO system selects the earliest-expiring batch and processes your gate dispatch.",
  },
  {
    question: "How do online invoice payments work with Razorpay?",
    answer:
      "Invoices are generated based on your exact stored weight and duration. You can click 'Pay Now' directly inside your portal to launch Razorpay's secure checkout supporting UPI, Credit Cards, Debit Cards, and Net Banking.",
  },
  {
    question: "Is my company's inventory data kept private?",
    answer:
      "Yes. Your client account is completely isolated. You have private credentials and only ever see your own company's stored produce, invoices, and dispatch orders.",
  },
];

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-primary/20 selection:text-primary">
      {/* FLOATING HEADER NAVBAR */}
      <div className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-slate-200/80 bg-white/90 px-5 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <KyrosLogo dark />
          </Link>

          {/* Nav Links */}
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-slate-700 hover:text-primary hover:bg-slate-100 font-semibold rounded-full px-4"
              )}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-primary hover:bg-primary-hover text-white font-semibold rounded-full px-5 shadow-sm"
              )}
            >
              Start for free
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-full p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:hidden">
            <div className="flex flex-col space-y-2 pb-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center rounded-full")}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(buttonVariants({ variant: "default" }), "w-full justify-center rounded-full bg-primary text-white")}
              >
                Start for free
              </Link>
            </div>
          </div>
        )}
      </div>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#2457e6] via-[#2563eb] to-[#3b82f6] text-white pt-16 pb-28 lg:pt-24 lg:pb-36 -mt-16">
          <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-2xl" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
                Your Perishables Secured. <br />
                <span className="font-serif italic font-normal text-blue-100">One Portal for Your Entire Storage Cycle.</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-blue-50/90 leading-relaxed max-w-3xl mx-auto font-normal">
                Request storage space online, track your produce batch balances in real-time, order instant dispatches, and settle invoices seamlessly via Razorpay.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full sm:w-auto h-13 px-8 text-base font-bold bg-white text-primary hover:bg-slate-100 shadow-xl shadow-blue-950/20 rounded-full transition-all gap-2"
                  )}
                >
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto h-13 px-8 text-base font-semibold border-white/40 bg-white/10 text-white hover:bg-white/20 rounded-full backdrop-blur-sm"
                  )}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Client Portal Login
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-blue-100 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  24/7 Real-Time Stock Balance
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Instant Online Dispatch Requests
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Razorpay UPI & Card Checkout
                </span>
              </div>
            </div>

            {/* DASHBOARD PREVIEW */}
            <div className="mt-14 max-w-5xl mx-auto relative">
              <div className="rounded-2xl border border-white/20 bg-white p-2.5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
                    <span className="ml-3 text-xs font-medium text-slate-500 font-mono">app.kyrosstorage.com/client-portal</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Client Portal Active
                  </div>
                </div>

                <div className="overflow-hidden rounded-b-xl bg-slate-900">
                  <img
                    src="/login/demo_dashboard.png"
                    alt="Kyros Client Storage Portal Interface"
                    className="w-full h-auto object-cover block"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOGO STRIP / TRUSTED EXPORTERS */}
        <section className="bg-slate-50 border-b border-slate-200 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
              Trusted by Leading Agriculture Exporters, Food Processors & Cold Chain Partners
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all">
              <div className="flex items-center gap-2 font-bold text-slate-700 text-lg tracking-tight">
                <Boxes className="h-5 w-5 text-primary" /> AgriHarvest Exporters
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-700 text-lg tracking-tight">
                <Thermometer className="h-5 w-5 text-primary" /> FreshVault Cold Chain
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-700 text-lg tracking-tight">
                <Shield className="h-5 w-5 text-primary" /> BioCold Pharma
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-700 text-lg tracking-tight">
                <Truck className="h-5 w-5 text-primary" /> Global Produce Logistics
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="py-16 bg-white border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "24/7 Stock Control", desc: "Track exact metric tonne balances and batch production dates anytime.", icon: Boxes },
                { title: "FIFO Dispatches", desc: "Automated retrieval prioritization to preserve produce freshness.", icon: Layers },
                { title: "Razorpay Checkout", desc: "Instant online UPI, credit card, and net banking invoice payments.", icon: CreditCard },
                { title: "Zero Phone Calls", desc: "Submit store & dispatch requests online without calling warehouse managers.", icon: CheckSquare },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="flex flex-col p-6 rounded-2xl bg-blue-50/50 border border-blue-100/80 hover:border-primary/30 transition-all"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white mb-4 shadow-md shadow-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{stat.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{stat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CLIENT PORTAL FEATURES */}
        <section id="features" className="py-20 lg:py-28 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Self-Service Portal</span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Complete Command Over Your Stored Goods
              </h2>
              <p className="mt-4 text-slate-600 text-base sm:text-lg">
                Four core portal features built specifically for agricultural exporters, food processors, and goods owners.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
              {CLIENT_FEATURES.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.title}
                    className="flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-8 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-primary">
                          {module.tag}
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <h3 className="font-display text-2xl font-bold text-slate-900">{module.title}</h3>
                      <div className="text-xs font-semibold text-primary mt-1">{module.subtitle}</div>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{module.description}</p>
                    </div>

                    <ul className="mt-6 pt-6 border-t border-slate-100 space-y-2.5">
                      {module.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CLIENT PORTAL CAPABILITIES SPOTLIGHT */}
        <section id="portal" className="py-20 lg:py-28 bg-white border-y border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Built For Exporters & Goods Owners</span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Why Clients Trust Kyros for Storage
              </h2>
              <p className="mt-4 text-slate-600">
                Experience full transparency from the moment your produce arrives to the instant invoice payment.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
              {PORTAL_CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div key={cap.title} className="flex items-start gap-5 p-7 rounded-2xl bg-blue-50/60 border border-blue-100">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{cap.title}</h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{cap.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-20 lg:py-28 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Transparent Pricing</span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Predictable Plans for Storage Clients
              </h2>
              <p className="mt-4 text-slate-600">
                Choose the right plan for your produce volume. Upgrade anytime as your storage needs expand.
              </p>

              {/* Billing Toggle */}
              <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-white p-1 border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                    "rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all",
                    billingCycle === "monthly" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={cn(
                    "rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5",
                    billingCycle === "annual" ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <span>Annual Billing</span>
                  <span className="rounded-full bg-emerald-400 text-slate-950 px-2 py-0.5 text-[10px] font-bold uppercase">Save 20%</span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {PRICING_PLANS.map((plan) => {
                const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
                return (
                  <div
                    key={plan.name}
                    className={cn(
                      "relative rounded-2xl bg-white p-8 flex flex-col justify-between transition-all border",
                      plan.popular
                        ? "border-primary shadow-xl ring-2 ring-primary/20 scale-102"
                        : "border-slate-200 shadow-sm hover:shadow-md"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                        Most Popular
                      </div>
                    )}

                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[36px]">{plan.tagline}</p>

                      <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-slate-900">${price}</span>
                        <span className="text-sm font-medium text-slate-500">/ month</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {billingCycle === "annual" ? "Billed annually" : "Billed monthly"}
                      </div>

                      <div className="mt-8 border-t border-slate-100 pt-6">
                        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Included Features</div>
                        <ul className="space-y-3">
                          {plan.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-2.5 text-xs text-slate-700">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <Link
                        to="/register"
                        className={cn(
                          buttonVariants({
                            variant: plan.popular ? "default" : "outline",
                            size: "lg",
                          }),
                          "w-full justify-center font-semibold rounded-full",
                          plan.popular ? "bg-primary hover:bg-primary-hover text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {plan.cta}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" className="py-20 lg:py-28 bg-white border-t border-slate-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Got Questions?</span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={faq.question}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 transition-colors overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="flex w-full items-center justify-between p-5 text-left font-bold text-slate-900 hover:text-primary transition-colors"
                    >
                      <span className="text-base sm:text-lg pr-4">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
                          isOpen ? "rotate-180 text-primary" : ""
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-4 bg-white">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONVERSION BANNER */}
        <section className="py-16 sm:py-24 bg-gradient-to-r from-primary to-blue-600 text-white relative overflow-hidden">
          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready for Total Control Over Your Stored Produce?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-blue-100">
              Join agricultural exporters, growers, and food processors using Kyros for 24/7 stock tracking, online retrieval orders, and Razorpay invoice payments.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full sm:w-auto h-12 px-8 bg-white text-primary hover:bg-slate-100 font-bold rounded-full shadow-lg"
                )}
              >
                Start for free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto h-12 px-8 border-white/30 text-white hover:bg-white/10 rounded-full font-bold"
                )}
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
            {/* Logo & Info */}
            <div className="lg:col-span-2 space-y-4">
              <KyrosLogo />
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                Kyros is the client storage portal for cold storage facilities, allowing exporters and produce owners to track batch balances, order dispatches, and pay invoices online.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                System Status: Client Portal Online
              </div>
            </div>

            {/* Client Portal Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Client Portal</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Stock Tracking</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Inbound Requests</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Outbound Dispatches</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Razorpay Payments</a></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Industries Served</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li><a href="#portal" className="hover:text-white transition-colors">Agri Produce & Growers</a></li>
                <li><a href="#portal" className="hover:text-white transition-colors">Fruit & Spice Exporters</a></li>
                <li><a href="#portal" className="hover:text-white transition-colors">Pharma Cold Chain</a></li>
                <li><a href="#portal" className="hover:text-white transition-colors">Frozen Foods & Seafood</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Support & Legal</h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span>support@kyrosstorage.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span>+1 (800) 597-6771</span>
                </li>
                <li className="pt-2"><a href="#faq" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Kyros Storage Systems. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Razorpay UPI / Credit Cards / Net Banking</span>
              <span>•</span>
              <span>ISO 27001 Certified Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}