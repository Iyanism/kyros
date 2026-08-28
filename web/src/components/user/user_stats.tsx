import { Building2, Shield, UserCog, Users as UsersIcon } from "lucide-react";

interface UserStatsProps {
  stats: {
    total: number;
    admin: number;
    operator: number;
    client: number;
  };
}

export function UserStats({ stats }: UserStatsProps) {
  const statCards = [
    {
      label: "Total Accounts",
      value: stats.total,
      icon: UsersIcon,
      bg: "bg-[#eff6ff]",
      color: "text-[#2457e6]",
    },
    {
      label: "System Admins",
      value: stats.admin,
      icon: Shield,
      bg: "bg-[#eff6ff]",
      color: "text-[#2457e6]",
    },
    {
      label: "Operators",
      value: stats.operator,
      icon: UserCog,
      bg: "bg-[#f0fdf4]",
      color: "text-[#166534]",
    },
    {
      label: "Client Users",
      value: stats.client,
      icon: Building2,
      bg: "bg-[#f5f3ff]",
      color: "text-[#6d28d9]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-xs flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] font-semibold text-[#64748b]">
              {card.label}
            </div>
            <div className="text-[22px] font-bold text-[#0f172a] mt-0.5">
              {card.value}
            </div>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>
            <card.icon className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  );
}