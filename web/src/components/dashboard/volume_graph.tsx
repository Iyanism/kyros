import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { VOLUME_BY_DAY } from "@/lib/data/dashboard";

const chartConfig = {
  orders: {
    label: "Orders",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

interface VolumeGraphProps {
  data?: { day: string; orders: number }[];
  avgOrdersText?: string;
  title?: string;
}

export function VolumeGraph({ data, avgOrdersText, title }: VolumeGraphProps) {
  const chartData = data && data.length > 0 ? data : VOLUME_BY_DAY;

  return (
    <div className="lg:col-span-4 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">
            {title ?? "Fulfillment Volume"}
          </h3>
          <span className="text-[11px] font-medium text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-md">
            7 Days
          </span>
        </div>
        <p className="text-[12px] text-[#64748b] mb-4">
          Daily Inbound & Outbound order throughput
        </p>
      </div>

      <div className="w-full h-48 my-2">
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="volumeBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2457e6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
            />
            <ChartTooltip
              cursor={{ fill: "#f1f5f9", radius: 4 }}
              content={
                <ChartTooltipContent
                  hideIndicator={false}
                  indicator="dot"
                  formatter={(value) => (
                    <span className="font-semibold text-[#0f172a]">
                      {value} Orders
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey="orders"
              fill="url(#volumeBarGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="flex items-center justify-between border-t border-[#f1f5f9] pt-3 text-[11px]">
        <span className="font-semibold text-[#2457e6]">{avgOrdersText || "Avg. 38 orders/day"}</span>
        <span className="text-[#64748b]">Real-Time Monitor</span>
      </div>
    </div>
  );
}
