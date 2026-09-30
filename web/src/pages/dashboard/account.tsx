import {
  Calendar,
  Clock,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { useAuth } from "@/hooks/useAuth";
import { capitalise, getInitials } from "@/utils/string-operations";

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-[#2457e6]/10 text-[#2457e6] border-[#2457e6]/20",
  operator: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  client: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
      <div className="h-9 w-9 rounded-lg bg-[#2457e6]/10 text-[#2457e6] flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
          {label}
        </span>
        <p className="text-[13px] font-semibold text-[#0f172a] truncate mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

export function Account() {
  const { user } = useAuth();

  if (!user) return null;

  const roleStyle = ROLE_STYLES[user.role] ?? ROLE_STYLES.client;

  return (
    <div className="flex min-h-screen bg-[#f4f6fa] font-sans antialiased text-[#17243b]">
      <Sidebar />
      <main className="flex-1 lg:ml-65 min-w-0">
        <DashboardHeader
          title="My Account"
          subtitle="Your profile, role and session details"
        />

        <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
          {/* Profile card */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#2457e6]/10 text-[#2457e6] border border-[#2457e6]/20 font-bold flex items-center justify-center text-xl uppercase shrink-0">
                {getInitials(user.full_name || user.email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg font-bold text-[#0f172a] truncate">
                    {user.full_name}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${roleStyle}`}
                  >
                    {capitalise(user.role)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
                      user.is_active
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 border-red-500/20"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-[13px] text-[#64748b] mt-1 truncate flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailRow
              icon={Phone}
              label="Phone Number"
              value={user.phone_number || "Not provided"}
            />
            <DetailRow
              icon={ShieldCheck}
              label="Role"
              value={capitalise(user.role)}
            />
            <DetailRow
              icon={Calendar}
              label="Member Since"
              value={new Date(user.created_at).toLocaleDateString()}
            />
            <DetailRow
              icon={Clock}
              label="Last Login"
              value={
                user.last_login
                  ? new Date(user.last_login).toLocaleString()
                  : "No login recorded"
              }
            />
            <DetailRow
              icon={UserRound}
              label="Account Type"
              value={user.client_id ? "Client organization" : "Staff account"}
            />
          </div>

          {user.client_id && (
            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[12px] text-[#64748b]">
              Your account is linked to a client organization. Contact an
              administrator for client profile changes.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
