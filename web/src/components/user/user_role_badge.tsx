import type { UserRole } from "@/types/user";

interface UserRoleBadgeProps {
  role: UserRole;
}

const roleStyles: Record<UserRole, { bg: string; text: string; border: string }> = {
  admin: { bg: "bg-[#eff6ff]", text: "text-[#2457e6]", border: "border-[#bfdbfe]" },
  operator: { bg: "bg-[#f0fdf4]", text: "text-[#166534]", border: "border-[#bbf7d0]" },
  client: { bg: "bg-[#f5f3ff]", text: "text-[#6d28d9]", border: "border-[#ddd6fe]" },
};

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const style = roleStyles[role];
  
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase border ${style.bg} ${style.text} ${style.border}`}
    >
      {role}
    </span>
  );
}