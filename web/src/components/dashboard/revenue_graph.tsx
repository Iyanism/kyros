

export function RevenueGraph() {
    return (
        <div className="lg:col-span-8 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">Revenue & Billing Velocity</h3>
                        <span className="rounded-md bg-[#e0e7ff] px-2 py-0.5 text-[10px] font-semibold text-[#3730a3]">FY 2026</span>
                    </div>
                    <p className="text-[12px] text-[#64748b]">Monthly aggregation of storage duration rates & handling charges</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2457e6] bg-[#eff6ff] px-3 py-1.5 rounded-lg border border-[#bfdbfe]">
                        <span className="h-2 w-2 rounded-full bg-[#2457e6]" /> Revenue (₹)
                    </div>
                    <button className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-semibold text-[#475569] hover:bg-[#f1f5f9] transition">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Styled Vector SVG Line Chart with Blue Accent Gradient */}
            <div className="relative h-64 w-full">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2457e6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#2457e6" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    <line x1="0" y1="0" x2="700" y2="0" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="50" x2="700" y2="50" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="100" x2="700" y2="100" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="150" x2="700" y2="150" stroke="#f1f5f9" strokeDasharray="4 4" />

                    {/* Area fill under curve */}
                    <path
                        d="M 0 160 Q 100 120 175 110 T 350 70 T 525 40 T 700 20 L 700 200 L 0 200 Z"
                        fill="url(#blueGradient)"
                    />

                    {/* Line stroke */}
                    <path
                        d="M 0 160 Q 100 120 175 110 T 350 70 T 525 40 T 700 20"
                        fill="none"
                        stroke="#2457e6"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />

                    {/* Highlighting active points */}
                    <circle cx="175" cy="110" r="5" fill="#ffffff" stroke="#2457e6" strokeWidth="3" />
                    <circle cx="350" cy="70" r="5" fill="#ffffff" stroke="#2457e6" strokeWidth="3" />
                    <circle cx="525" cy="40" r="5" fill="#ffffff" stroke="#2457e6" strokeWidth="3" />
                    <circle cx="700" cy="20" r="6" fill="#2457e6" stroke="#ffffff" strokeWidth="2.5" />
                </svg>

                {/* X Axis Labels */}
                <div className="mt-4 flex justify-between text-[11px] font-medium text-[#94a3b8]">
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                </div>
            </div>
        </div>
    )
}