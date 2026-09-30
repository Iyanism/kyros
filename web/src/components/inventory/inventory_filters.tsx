import { Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DateRangeFilter,
  EMPTY_DATE_RANGE,
  type DateRange,
} from "@/components/shared/date_range_filter";

interface InventoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedZone: string;
  onZoneChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onReset: () => void;
  /** Client options (staff only). Select is hidden when the list is empty. */
  clientsList?: { id: string; name: string }[];
  selectedClient?: string;
  onClientChange?: (value: string) => void;
  /** Filter on pallet received date (created_at). */
  receivedRange?: DateRange;
  onReceivedRangeChange?: (range: DateRange) => void;
  /** Filter on batch expiry date. */
  expiryRange?: DateRange;
  onExpiryRangeChange?: (range: DateRange) => void;
}

export function InventoryFilters({
  searchTerm,
  onSearchChange,
  selectedZone,
  onZoneChange,
  selectedStatus,
  onStatusChange,
  onReset,
  clientsList,
  selectedClient = "all",
  onClientChange,
  receivedRange = EMPTY_DATE_RANGE,
  onReceivedRangeChange,
  expiryRange = EMPTY_DATE_RANGE,
  onExpiryRangeChange,
}: InventoryFiltersProps) {
  const hasDateFilters =
    receivedRange.from !== "" ||
    receivedRange.to !== "" ||
    expiryRange.from !== "" ||
    expiryRange.to !== "";

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
      <div className="flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by pallet code, product, batch, chamber..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2457e6] focus:ring-1 focus:ring-[#2457e6] text-[#0f172a] placeholder-[#94a3b8] transition-colors"
          />
        </div>

        {/* Client Filter (staff only) */}
        {clientsList && clientsList.length > 0 && onClientChange && (
          <select
            value={selectedClient}
            onChange={(e) => onClientChange(e.target.value)}
            className="px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl bg-white focus:outline-none focus:border-[#2457e6] text-[#0f172a] cursor-pointer"
          >
            <option value="all">All Clients</option>
            {clientsList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Temperature Zone Filter */}
        <select
          value={selectedZone}
          onChange={(e) => onZoneChange(e.target.value)}
          className="px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl bg-white focus:outline-none focus:border-[#2457e6] text-[#0f172a] cursor-pointer"
        >
          <option value="all">All Temperature Zones</option>
          <option value="ambient">Ambient (+15°C to +25°C)</option>
          <option value="chilled">Chilled (+2°C to +8°C)</option>
          <option value="frozen">Frozen (-18°C to -22°C)</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl bg-white focus:outline-none focus:border-[#2457e6] text-[#0f172a] cursor-pointer"
        >
          <option value="all">All Pallet Statuses</option>
          <option value="STORED">Stored</option>
          <option value="RESERVED">Reserved</option>
          <option value="PICKED">Picked</option>
          <option value="DISPATCHED">Dispatched</option>
        </select>

        {onReceivedRangeChange && (
          <DateRangeFilter
            label="Received"
            value={receivedRange}
            onChange={onReceivedRangeChange}
          />
        )}

        {onExpiryRangeChange && (
          <DateRangeFilter
            label="Expiry"
            value={expiryRange}
            onChange={onExpiryRangeChange}
          />
        )}
      </div>

      {/* Reset button */}
      {(searchTerm ||
        selectedZone !== "all" ||
        selectedStatus !== "all" ||
        selectedClient !== "all" ||
        hasDateFilters) && (
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
