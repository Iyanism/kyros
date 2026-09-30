import { CalendarRange, X } from "lucide-react";

export interface DateRange {
  from: string;
  to: string;
}

export const EMPTY_DATE_RANGE: DateRange = { from: "", to: "" };

/** Inclusive day comparison on the ISO date prefix (YYYY-MM-DD). */
export function dateInRange(
  iso: string | null | undefined,
  range: DateRange
): boolean {
  if (!range.from && !range.to) return true;
  if (!iso) return false;
  const day = iso.slice(0, 10);
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

interface DateRangeFilterProps {
  label: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ label, value, onChange }: DateRangeFilterProps) {
  const inputClass =
    "px-2 py-2 text-xs border border-[#e2e8f0] rounded-xl bg-white focus:outline-none focus:border-[#2457e6] focus:ring-1 focus:ring-[#2457e6] text-[#0f172a] transition-colors";

  return (
    <div className="flex items-center gap-1.5">
      <CalendarRange className="h-3.5 w-3.5 text-[#64748b] shrink-0" />
      <span className="text-[11px] font-semibold text-[#64748b] whitespace-nowrap">
        {label}
      </span>
      <input
        type="date"
        aria-label={`${label} from`}
        value={value.from}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
        className={inputClass}
      />
      <span className="text-[11px] text-[#94a3b8]">–</span>
      <input
        type="date"
        aria-label={`${label} to`}
        value={value.to}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
        className={inputClass}
      />
      {(value.from || value.to) && (
        <button
          type="button"
          aria-label={`Clear ${label} range`}
          onClick={() => onChange(EMPTY_DATE_RANGE)}
          className="p-1 text-[#94a3b8] hover:text-[#ef4444] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
