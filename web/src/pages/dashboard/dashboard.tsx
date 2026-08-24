import { ActivityRow } from "@/components/dashboard/activity";
import { AlertBox } from "@/components/dashboard/alert_log";
import { ChamberProgressCard } from "@/components/dashboard/chamber_progress";
import { KpiCard } from "@/components/dashboard/kpi";
import { RevenueGraph } from "@/components/dashboard/revenue_graph";
import { VolumeGraph } from "@/components/dashboard/volume_graph";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import {
  CHAMBER_SUMMARIES,
  KPIS,
  RECENT_ACTIVITIES,
  SYSTEM_ALERTS,
} from "@/lib/data/dashboard";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

export function Dashboard() {
  return (
    <div className="flex min-h-screen bg-[#f4f6fa] font-sans antialiased text-[#17243b]">
      <Sidebar />

      <main className="flex-1 lg:ml-65 min-w-0">
        <DashboardHeader
          title="Dashboard Overview"
          subtitle="Operational & Financial Health · Real-time Execution"
        />

        <div className="p-6 lg:p-8 space-y-6">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {KPIS.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>

          {/* Chamber Capacity & Temperature Status */}
          <section className="rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">Chamber Capacity & Temperature Status</h3>
                  <span className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">{CHAMBER_SUMMARIES.length} Rooms Active</span>
                </div>
                <p className="text-[12px] text-[#64748b]">Physical storage utilization and real-time environment status</p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-[#475569]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2457e6]" /> Frozen (-18°C to -30°C)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#475569]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0d9488]" /> Chilled (2°C to 8°C)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#475569]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" /> Ambient (15°C+)
                </span>
                <button className="hidden sm:inline-flex text-[#2457e6] hover:text-[#1d4ed8] font-semibold transition items-center gap-1 ml-2">
                  Chamber Details <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {CHAMBER_SUMMARIES.map((chamber) => (
                <ChamberProgressCard key={chamber.code} {...chamber} />
              ))}
            </div>
          </section>

          {/* Commercial Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <RevenueGraph />
            <VolumeGraph />
          </div>

          {/* Live Activity & System Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#2457e6]" />
                    <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">Live Warehouse Activity</h3>
                  </div>
                  <button className="text-[12px] font-semibold text-[#2457e6] hover:text-[#1d4ed8]">View Audit Trail</button>
                </div>

                <div className="space-y-4">
                  {RECENT_ACTIVITIES.map((activity) => (
                    <ActivityRow key={activity.id} {...activity} />
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-[#f1f5f9] pt-3 text-center text-[12px] text-[#64748b]">
                Showing latest {RECENT_ACTIVITIES.length} transactions · Auto-updated 1 min ago
              </div>
            </div>

            <div className="lg:col-span-5 rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-[#d97706]" />
                    <h3 className="font-display text-[16px] font-semibold text-[#0f172a]">System Alerts & Actions</h3>
                  </div>
                  <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[10px] font-bold text-[#b45309]">{SYSTEM_ALERTS.length} Unresolved</span>
                </div>

                <div className="space-y-3.5">
                  {SYSTEM_ALERTS.map((alert) => (
                    <AlertBox key={alert.title} {...alert} />
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-[#f1f5f9] pt-3 flex items-center justify-between text-[11px] text-[#64748b]">
                <span>Monitoring {CHAMBER_SUMMARIES.length} Chambers</span>
                <button className="font-semibold text-[#2457e6] hover:underline">Notification Settings</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
