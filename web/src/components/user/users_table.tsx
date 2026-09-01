import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserStatusBadge } from "./user_status_badge";
import { UserRoleBadge } from "@/components/user/user_role_badge";
import type { UserClientResponse } from "@/types/user";
import { getInitials } from "@/utils/string-operations";

interface UsersTableProps {
  users: UserClientResponse[];
  onToggleStatus: (userId: string) => void;
  isUpdated: boolean;
}

export function UsersTable({ users, onToggleStatus, isUpdated }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-[16px] border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
        <div className="text-center py-12 text-[#94a3b8] text-sm">
          No users found matching your criteria
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f8fafc] border-b border-[#e2e8f0]">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-4 whitespace-nowrap">
              User Name
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              Role
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              Associated Client
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              Phone
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap w-31.5 min-w-31.5">
              Status
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              Last Login
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 pr-6 whitespace-nowrap text-right w-28 min-w-28">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="hover:bg-[#f8fafc]/60 border-b border-[#f1f5f9]"
            >
              <TableCell className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2457e6]/10 text-[#2457e6] font-bold text-xs border border-[#2457e6]/20">
                    {getInitials(user?.full_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#0f172a] leading-tight">
                      {user.full_name}
                    </div>
                    <div className="text-[11px] text-[#64748b] leading-tight truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="px-3">
                <UserRoleBadge role={user.role} />
              </TableCell>

              <TableCell className="px-3 text-[12px] font-medium text-[#475569] whitespace-nowrap">
                {user.client?.name ? (
                  <span className="font-semibold text-[#2457e6]">
                    {user.client.name}
                  </span>
                ) : (
                  <span className="text-[#94a3b8] italic">Internal Staff</span>
                )}
              </TableCell>

              <TableCell className="px-3 text-[12px] font-medium text-[#64748b] whitespace-nowrap">
                {user.phone_number || "—"}
              </TableCell>

              <TableCell className="px-3 w-31.5 min-w-31.5">
                <div className="w-25.5">
                  <UserStatusBadge isActive={user.is_active} />
                </div>
              </TableCell>

              <TableCell className="px-3 text-[11px] text-[#94a3b8] whitespace-nowrap">
                {user.last_login || "Never"}
              </TableCell>

              <TableCell className="px-3 pr-6 text-right w-28 min-w-28">
                <button
                  type="button"
                  onClick={() => onToggleStatus(user.id)}
                  className={`inline-flex items-center justify-center whitespace-nowrap text-[11px] font-semibold px-2.5 py-1 rounded-md transition border ${
                    user.is_active
                      ? "text-[#b91c1c] border-[#fecaca] hover:bg-[#fef2f2]"
                      : "text-[#15803d] border-[#bbf7d0] hover:bg-[#f0fdf4]"
                  }`}
                >
                  {isUpdated ? "Updating..." : user.is_active ? "Deactivate" : "Activate"}
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
