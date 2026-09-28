import { Layers, Trash2 } from "lucide-react";
import type { ChamberDetail, RackSummary, SlotResponse } from "@/types/chamber";
import { capitalise } from "@/utils/string-operations";

interface RackStructureProps {
  selectedChamber: ChamberDetail | null;
  activeSlot: SlotResponse | null;
  onSelectSlot: (slot: SlotResponse) => void;
  onDeleteRack: (rack: RackSummary) => void;
}

export function RackStructure({
  selectedChamber,
  activeSlot,
  onSelectSlot,
  onDeleteRack,
}: RackStructureProps) {
  // Early return for no chamber or no racks
  if (!selectedChamber) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-[#e2e8f0]">
        <p className="text-[#64748b]">No chamber selected</p>
      </div>
    );
  }

  if (selectedChamber.racks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-[#e2e8f0]">
        <p className="text-[#64748b]">No racks available in this chamber</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedChamber.racks.map((rack) => (
        <div
          key={rack.id}
          className="rounded-[16px] border border-[#e2e8f0] bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#2457e6]" />
              <h3 className="font-display text-[15px] font-semibold text-[#0f172a]">
                Rack {rack.rack_number}
              </h3>
              <span className={`ml-2 px-2 py-0.5 text-[10px] font-medium rounded ${
                rack.status === 'active' ? 'bg-[#ecfdf5] text-[#065f46]' :
                rack.status === 'full' ? 'bg-[#eff6ff] text-[#1e40af]' :
                'bg-[#fffbeb] text-[#92400e]'
              }`}>
                {capitalise(rack.status)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-semibold text-[#64748b]">
                {rack.slot_count} Positions ({rack.occupied_count} occupied)
              </span>
              <button
                type="button"
                onClick={() => onDeleteRack(rack)}
                title={`Delete rack ${rack.rack_number}`}
                className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2 py-1 text-[11px] font-semibold text-[#94a3b8] hover:border-red-200 hover:bg-red-50 hover:text-[#dc2626] transition"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>

          {/* Slot Matrix Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {rack.slots.map((slot) => {
              const isOccupied = slot.status === "occupied";
              const isReserved = slot.status === "reserved";
              const isMaintenance = slot.status === "maintenance";
              const isSelected = activeSlot?.id === slot.id;

              return (
                <div
                  key={slot.id}
                  onClick={() => onSelectSlot(slot)}
                  className={`group relative cursor-pointer rounded-[12px] p-3.5 transition-all ${
                    isSelected ? "ring-2 ring-[#2457e6] ring-offset-2" : ""
                  } ${
                    isOccupied
                      ? "bg-[#2457e6] text-white shadow-sm hover:brightness-110"
                      : isReserved
                      ? "bg-amber-500 text-white shadow-sm hover:brightness-110"
                      : isMaintenance
                      ? "bg-red-500 text-white shadow-sm hover:brightness-110"
                      : "bg-[#f8fafc] border border-dashed border-[#cbd5e1] text-[#94a3b8] hover:border-[#94a3b8] hover:text-[#475569]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-[12px] font-bold">
                      B{slot.bay}-L{slot.level}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 ${
                        isOccupied || isReserved || isMaintenance
                          ? "bg-white/20 text-white"
                          : "bg-[#e2e8f0] text-[#64748b]"
                      }`}
                    >
                      {slot.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-medium truncate">
                    {isOccupied && slot.allocated_client_id
                      ? `Client ${slot.allocated_client_id.slice(0, 8)}`
                      : slot.status === "available"
                      ? "Available Slot"
                      : capitalise(slot.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
