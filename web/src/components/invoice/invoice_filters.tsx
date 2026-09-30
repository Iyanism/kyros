import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DateRangeFilter,
  EMPTY_DATE_RANGE,
  type DateRange,
} from "@/components/shared/date_range_filter";

interface InvoiceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onReset: () => void;
  /** Filter on invoice creation date. */
  createdRange?: DateRange;
  onCreatedRangeChange?: (range: DateRange) => void;
}

export function InvoiceFilters({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onReset,
  createdRange = EMPTY_DATE_RANGE,
  onCreatedRangeChange,
}: InvoiceFiltersProps) {
  const hasDateFilter = createdRange.from !== "" || createdRange.to !== "";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
      <div className="flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by invoice #, client name, GSTIN..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2457e6] focus:ring-1 focus:ring-[#2457e6] text-[#0f172a] placeholder-[#94a3b8] transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl bg-white focus:outline-none focus:border-[#2457e6] text-[#0f172a] cursor-pointer"
        >
          <option value="all">All Invoice Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="paid">Paid</option>
        </select>

        {onCreatedRangeChange && (
          <DateRangeFilter
            label="Invoice Date"
            value={createdRange}
            onChange={onCreatedRangeChange}
          />
        )}
      </div>

      {/* Reset button */}
      {(searchTerm || selectedStatus !== "all" || hasDateFilter) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-[#64748b] hover:text-[#0f172a] h-9 px-3 shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Filters
        </Button>
      )}
    </div>
  );
}
