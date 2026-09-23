import { Search, Filter, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InboundFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  clientsList?: { id: string; name: string }[];
  selectedClient: string;
  onClientChange: (clientId: string) => void;
  onReset: () => void;
}

export function InboundFilters({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  clientsList = [],
  selectedClient,
  onClientChange,
  onReset,
}: InboundFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-xs">
      {/* Search bar */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
        <Input
          placeholder="Search by order #, vehicle, product or client..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 text-xs rounded-xl bg-[#f8fafc] border-[#e2e8f0] focus:bg-white"
        />
      </div>

      {/* Filters group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5 bg-[#f8fafc] px-3 py-1.5 rounded-xl border border-[#e2e8f0]">
          <Filter className="h-3.5 w-3.5 text-[#64748b]" />
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#0f172a] focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="in_transit">In Transit</option>
            <option value="arrived">Arrived</option>
            <option value="processing">Processing</option>
            <option value="stored">Stored</option>
          </select>
        </div>

        {/* Client Dropdown */}
        {clientsList.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#f8fafc] px-3 py-1.5 rounded-xl border border-[#e2e8f0]">
            <select
              value={selectedClient}
              onChange={(e) => onClientChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0f172a] focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">All Clients</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset button */}
        {(searchTerm || selectedStatus !== "all" || selectedClient !== "all") && (
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="h-9 px-3 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
