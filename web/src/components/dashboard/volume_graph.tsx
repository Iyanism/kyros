import { VOLUME_BY_DAY } from "@/lib/data/dashboard";

export function VolumeGraph() {
    return (
        <div className="lg:col-span-4 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">Fulfillment Volume</h3>
                    <span className="text-[11px] font-medium text-[#64748b]">7 Days</span>
                </div>
                <p className="text-[12px] text-[#64748b]">Daily Inbound & Outbound order throughput</p>
            </div>

            {/* Bar Graph with Gaps and Vertical Gradient (low at bottom, high at top) */}
            <div className="my-6 flex h-48 items-end justify-between gap-3 px-2">
                {VOLUME_BY_DAY.map((bar) => (
                    <div key={bar.day} className="group relative flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 text-[10px] font-bold text-[#0f172a] bg-[#f1f5f9] px-1.5 py-0.5 rounded border border-[#cbd5e1]">
                            {bar.val}
                        </div>
                        <div className="w-full bg-[#f1f5f9] rounded-t-md h-full flex items-end overflow-hidden">
                            <div
                                className="w-full rounded-t-md bg-linear-to-t from-[#93c5fd] via-[#3b82f6] to-[#1d4ed8] transition-all duration-500 group-hover:brightness-110"
                                style={{ height: bar.height }}
                            />
                        </div>
                        <span className="text-[10px] font-semibold text-[#64748b]">{bar.day}</span>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#f1f5f9] pt-3 text-[11px]">
                <span className="font-semibold text-[#3b82f6]">Avg. 38 orders/day</span>
                <span className="text-[#64748b]">Peak Load: Friday</span>
            </div>
        </div>
    )
}
