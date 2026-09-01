import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileSidebar } from "@/components/shared/sidebar";

export {
  BrandHeader,
  SidebarItem,
  SidebarNav,
  SidebarUserCard,
  Sidebar,
  MobileSidebar,
} from "@/components/shared/sidebar";

export type { SidebarNavItem } from "@/lib/data/sidebar-nav";

export function DashboardHeader({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className="sticky top-0 z-10 bg-[#f4f6fa]/90 backdrop-blur-md border-b border-[#e2e8f0] px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-[20px] font-semibold tracking-[-0.03em] text-[#0f172a]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[12px] text-[#64748b]">{subtitle}</p>
            )}
          </div>
        </div>
        {(actions || children) && (
          <div className="flex items-center gap-3">
            {actions}
            {children}
          </div>
        )}
      </header>
    </>
  );
}
