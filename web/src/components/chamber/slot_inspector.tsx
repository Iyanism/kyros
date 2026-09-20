import { Calendar, Info, Tag, Package, User, Weight, MapPin } from "lucide-react";
import type { SlotResponse } from "@/types/chamber";

interface SlotInspectorProps {
  activeSlot: SlotResponse | null;
}

// Helper to format dates
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// Helper to get status color
const getStatusColor = (status: SlotResponse['status']) => {
  switch (status) {
    case 'occupied':
      return 'bg-[#2457e6] text-white';
    case 'reserved':
      return 'bg-amber-500 text-white';
    case 'maintenance':
      return 'bg-red-500 text-white';
    case 'available':
    default:
      return 'bg-[#f8fafc] text-[#94a3b8] border border-dashed border-[#cbd5e1]';
  }
};

export function SlotInspector({ activeSlot }: SlotInspectorProps) {
  // If no slot selected, show empty state
  if (!activeSlot) {
    return (
      <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-2 border-b border-[#f1f5f9] pb-3 mb-4">
            <Info className="h-4 w-4 text-[#2457e6]" />
            <h3 className="font-display text-[15px] font-semibold text-[#0f172a]">
              Slot Position Details
            </h3>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center text-[#94a3b8]">
            <div className="h-12 w-12 rounded-full bg-[#f8fafc] flex items-center justify-center mb-3 border border-[#e2e8f0]">
              <MapPin className="h-6 w-6 text-[#2457e6]" />
            </div>
            <p className="text-[13px] font-medium text-[#64748b]">
              Select a slot position
            </p>
            <p className="text-[11px] mt-1 text-[#94a3b8] max-w-xs">
              Click any slot in the rack structure to view detailed information about its contents and status.
            </p>
          </div>
        </div>

        <div className="border-t border-[#f1f5f9] pt-4 text-[11px] text-[#64748b] text-center mt-6">
          Strict 1 MT per slot capacity rule enforced
        </div>
      </div>
    );
  }

  const isOccupied = activeSlot.status === 'occupied';
  const statusColor = getStatusColor(activeSlot.status);
  const formattedQuantity = isOccupied ? '1,000' : '0';

  return (
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 border-b border-[#f1f5f9] pb-3 mb-4">
          <Info className="h-4 w-4 text-[#2457e6]" />
          <h3 className="font-display text-[15px] font-semibold text-[#0f172a]">
            Slot Position Details
          </h3>
        </div>

        <div className="space-y-4">
          {/* Address Location - Most important info */}
          <div className="rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Location Address
                </div>
                <div className="font-display text-[15px] font-bold text-[#0f172a] mt-1 break-all">
                  {activeSlot.location_code}
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${statusColor}`}>
                {activeSlot.status}
              </div>
            </div>
          </div>

          {/* Slot Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f8fafc] rounded-lg p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1">
                <Tag className="h-3 w-3" /> Position
              </div>
              <div className="font-semibold text-[13px] text-[#0f172a] mt-1">
                Bay {activeSlot.bay}, Level {activeSlot.level}
              </div>
            </div>

            <div className="bg-[#f8fafc] rounded-lg p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1">
                <Package className="h-3 w-3" /> Status
              </div>
              <div className="font-semibold text-[13px] text-[#0f172a] mt-1 capitalize">
                {activeSlot.status}
              </div>
            </div>
          </div>

          {/* Client & Quantity Details */}
          <div className="space-y-3 text-[12px]">
            <div className="flex justify-between border-b border-[#f1f5f9] pb-2">
              <span className="text-[#64748b] flex items-center gap-1">
                <User className="h-3 w-3 text-[#2457e6]" /> Client
              </span>
              <span className="font-semibold text-[#2457e6]">
                {isOccupied && activeSlot.allocated_client_id
                  ? activeSlot.allocated_client_id
                  : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between border-b border-[#f1f5f9] pb-2">
              <span className="text-[#64748b] flex items-center gap-1">
                <Weight className="h-3 w-3 text-[#2457e6]" /> Weight
              </span>
              <span className="font-bold text-[#0f172a]">
                {formattedQuantity} kg / 1,000 kg
              </span>
            </div>

            <div className="flex justify-between border-b border-[#f1f5f9] pb-2">
              <span className="text-[#64748b] flex items-center gap-1">
                <Calendar className="h-3 w-3 text-[#2457e6]" /> Last Updated
              </span>
              <span className="font-semibold text-[#0f172a] text-[11px]">
                {formatDate(activeSlot.updated_at)}
              </span>
            </div>
          </div>

          {/* Progress Bar for Capacity */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-[#64748b] mb-1">
              <span>Capacity Used</span>
              <span>{isOccupied ? '100%' : '0%'}</span>
            </div>
            <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#2457e6] h-full rounded-full transition-all duration-300"
                style={{ width: isOccupied ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#f1f5f9] pt-4 text-[11px] text-[#64748b] text-center mt-6">
        Maximum capacity: 1,000 kg per slot
      </div>
    </div>
  );
}
