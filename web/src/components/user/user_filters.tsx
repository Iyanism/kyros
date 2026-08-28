import { Filter, Search } from "lucide-react";

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

const ROLES = ["all", "admin", "operator", "client"] as const;

export function UserFilters({
  searchTerm,
  onSearchChange,
  selectedRole,
  onRoleChange,
}: UserFiltersProps) {
  return (
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
      {/* Search */}
      <div className="relative flex-1 min-w-60 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94a3b8]" />
        <input
          type="text"
          placeholder="Search by name, email or company..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] pl-9 pr-4 py-2 text-xs font-medium text-[#0f172a] placeholder-[#94a3b8] focus:border-[#2457e6] focus:bg-white focus:outline-none"
        />
      </div>

      {/* Role Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[#64748b] font-medium">
          <Filter className="h-3.5 w-3.5" /> Filter Role:
        </div>
        <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-lg">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onRoleChange(role)}
              className={`rounded-md px-3 py-1 text-[11px] font-semibold capitalize transition ${
                selectedRole === role
                  ? "bg-white text-[#2457e6] shadow-xs"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}