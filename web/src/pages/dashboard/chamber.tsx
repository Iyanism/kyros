import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ChamberTabs } from "@/components/chamber/chamber_tabs";
import { CreateChamberDialog } from "@/components/chamber/create_chamber_dialog";
import { RackStructure } from "@/components/chamber/rack_structure";
import { SlotInspector } from "@/components/chamber/slot_inspector";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import {
  delete_chamber,
  delete_rack,
  delete_slot,
  get_chamber_detail,
  get_chambers,
} from "@/lib/api/chamber";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import type {
  ChamberDetail,
  ChamberSummary,
  RackSummary,
  SlotResponse,
} from "@/types/chamber";

export function Chamber() {
  const [chambers, setChambers] = useState<ChamberSummary[]>([]);
  const [selectedChamber, setSelectedChamber] = useState<ChamberDetail | null>(null);
  const [activeSlot, setActiveSlot] = useState<SlotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSelectChamber = async (chamber: ChamberSummary) => {
    setActiveSlot(null);
    try {
      const detail = await get_chamber_detail(chamber.id);
      setSelectedChamber(detail);
    } catch (error) {
      console.error("Error fetching chamber detail:", error);
      toast.error(getApiErrorMessage(error));
    }
  };

  /** Re-read chamber list + selected detail after any structural change */
  const refreshChambers = async (focusChamberId?: string) => {
    try {
      const list = await get_chambers();
      setChambers(list);

      const targetId =
        focusChamberId ?? (selectedChamber ? selectedChamber.id : undefined);
      const next =
        (targetId ? list.find((c) => c.id === targetId) : undefined) ?? list[0];
      setSelectedChamber(next ? await get_chamber_detail(next.id) : null);
    } catch (error) {
      console.error("Error refreshing chambers:", error);
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRackAdded = () => {
    void refreshChambers(selectedChamber?.id);
  };

  const handleDeleteRack = async (rack: RackSummary) => {
    const confirmed = window.confirm(
      `Delete rack ${rack.rack_number}? This also removes its ${rack.slot_count} slots.`
    );
    if (!confirmed) return;
    try {
      await delete_rack(rack.id);
      setActiveSlot(null);
      toast.success(`Rack ${rack.rack_number} deleted`);
      await refreshChambers(selectedChamber?.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDeleteSlot = async (slot: SlotResponse) => {
    const confirmed = window.confirm(
      `Delete slot ${slot.location_code}? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await delete_slot(slot.id);
      setActiveSlot(null);
      toast.success(`Slot ${slot.location_code} deleted`);
      await refreshChambers(selectedChamber?.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDeleteChamber = async (chamber: ChamberSummary) => {
    const confirmed = window.confirm(
      `Delete chamber ${chamber.code} · ${chamber.name}? All of its racks and slots are removed too.`
    );
    if (!confirmed) return;
    try {
      await delete_chamber(chamber.id);
      setActiveSlot(null);
      toast.success(`Chamber ${chamber.code} deleted`);
      await refreshChambers();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleAddNewChamber = (newChamber: ChamberDetail) => {
    const summaryItem: ChamberSummary = {
      id: newChamber.id,
      code: newChamber.code,
      name: newChamber.name,
      category: newChamber.category,
      status: newChamber.status,
      temperature: newChamber.temperature,
      total_racks: newChamber.total_racks,
      total_slots: newChamber.total_slots,
      total_capacity: newChamber.total_capacity,
      used_capacity: newChamber.used_capacity,
      created_at: newChamber.created_at,
      updated_at: newChamber.updated_at,
    };
    setChambers((prev) => [...prev, summaryItem]);
    setSelectedChamber(newChamber);
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialChambers = async () => {
      try {
        const chamberData = await get_chambers();
        if (cancelled) return;
        setChambers(chamberData);
        if (chamberData.length > 0 && chamberData[0]) {
          setSelectedChamber(await get_chamber_detail(chamberData[0].id));
        }
      } catch (error) {
        console.error("Error fetching chambers:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadInitialChambers();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfcfe]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
          <p className="text-[15px] text-[#7b8799]">Loading chambers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fa] font-sans antialiased text-[#17243b]">
      <Sidebar />

      <main className="flex-1 lg:ml-65 min-w-0">
        <DashboardHeader
          title="Chamber & Physical Slot Map"
          subtitle="Configure chambers, inspect racks, and track pallet positions"
          actions={<CreateChamberDialog onSubmitChamber={handleAddNewChamber}/>}
        />

        <div className="p-6 lg:p-8 space-y-6">
          <ChamberTabs
            chambers={chambers}
            selectedChamber={selectedChamber}
            onSelectChamber={(c) => void handleSelectChamber(c)}
            onRackAdded={handleRackAdded}
            onDeleteChamber={(c) => void handleDeleteChamber(c)}
          />

          {/* Canvas & Inspector Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <RackStructure
                selectedChamber={selectedChamber}
                activeSlot={activeSlot}
                onSelectSlot={setActiveSlot}
                onDeleteRack={(r) => void handleDeleteRack(r)}
              />
            </div>

            <div className="lg:col-span-4 sticky top-24">
              <SlotInspector
                activeSlot={activeSlot}
                onDeleteSlot={(s) => void handleDeleteSlot(s)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
