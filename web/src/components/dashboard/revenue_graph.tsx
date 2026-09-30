import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { REVENUE_BY_MONTH } from "@/lib/data/dashboard";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#2457e6",
  },
} satisfies ChartConfig;

interface RevenueGraphProps {
  data?: { month: string; revenue: number }[];
  title?: string;
  subtitle?: string;
  legendLabel?: string;
  headerStat?: { label: string; value: string };
  footerText?: string;
  showExtras?: boolean;
}

export function RevenueGraph({
  data,
  title,
  subtitle,
  legendLabel,
  headerStat,
  footerText,
  showExtras = true,
}: RevenueGraphProps) {
  const chartData = data && data.length > 0 ? data : REVENUE_BY_MONTH;

  return (
    <div className="lg:col-span-8 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">
              {title ?? "Revenue & Billing Velocity"}
            </h3>
            {showExtras && (
              <span className="rounded-md bg-[#e0e7ff] px-2 py-0.5 text-[10px] font-semibold text-[#3730a3]">
                FY 2026
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#64748b]">
            {subtitle ?? "Monthly aggregation of storage duration rates & handling charges"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {headerStat && (
            <div className="flex items-center gap-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                {headerStat.label}
              </span>
              <span className="text-[13px] font-bold text-[#1d4ed8]">{headerStat.value}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2457e6] bg-[#eff6ff] px-3 py-1.5 rounded-lg border border-[#bfdbfe]">
            <span className="h-2 w-2 rounded-full bg-[#2457e6]" /> {legendLabel ?? "Revenue (₹)"}
          </div>
          {showExtras && (
            <button
              type="button"
              className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-[11px] font-semibold text-[#475569] hover:bg-[#f1f5f9] transition"
            >
              Export Report
            </button>
          )}
        </div>
      </div>

      <div className="w-full h-64">
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2457e6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2457e6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: number) =>
                value >= 100000
                  ? `₹${(value / 100000).toFixed(1)}L`
                  : value >= 1000
                  ? `₹${(value / 1000).toFixed(0)}k`
                  : `₹${value}`
              }
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            />
            <ChartTooltip
              cursor={{ stroke: "#bfdbfe", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  hideIndicator={false}
                  indicator="dot"
                  formatter={(value) => (
                    <span className="font-semibold text-[#0f172a]">
                      ₹{Number(value || 0).toLocaleString()}
                    </span>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2457e6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#revenueGradient)"
              activeDot={{
                r: 6,
                fill: "#ffffff",
                stroke: "#2457e6",
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {footerText && (
        <div className="mt-4 border-t border-[#f1f5f9] pt-3 text-[11px] text-[#64748b]">
          <span className="font-semibold text-[#0f172a]">{footerText}</span>
        </div>
      )}
    </div>
  );
}