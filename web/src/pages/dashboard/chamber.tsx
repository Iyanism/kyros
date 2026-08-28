import { useEffect, useState } from "react";

import { ChamberTabs } from "@/components/chamber/chamber_tabs";
import { CreateChamberDialog } from "@/components/chamber/create_chamber_dialog";
import { RackStructure } from "@/components/chamber/rack_structure";
import { SlotInspector } from "@/components/chamber/slot_inspector";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { get_chamber_detail, get_chambers } from "@/lib/api/chamber";
import type { ChamberDetail, ChamberSummary, SlotResponse } from "@/types/chamber";

export function Chamber() {
  const [chambers, setChambers] = useState<ChamberSummary[]>([]);
  const [selectedChamber, setSelectedChamber] = useState<ChamberDetail | null>(null);
  const [activeSlot, setActiveSlot] = useState<SlotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSelectChamber = async (chamber: ChamberSummary) => {
    setActiveSlot(null);
    try {
      setSelectedChamber(await get_chamber_detail(chamber.id));
    } catch (error) {
      console.error("Error fetching chamber detail:", error);
    }
  };

  const handleAddNewChamber = async (chamber: ChamberDetail) => {
    setChambers({ ...chambers, ...chamber })
  }

  useEffect(() => {
    let cancelled = false;

    const loadInitialChambers = async () => {
      try {
        const chamberData = await get_chambers();
        if (cancelled) return;
        setChambers(chamberData);
        if (chamberData.length > 0) {
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
          />

          {/* Canvas & Inspector Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <RackStructure
                selectedChamber={selectedChamber}
                activeSlot={activeSlot}
                onSelectSlot={setActiveSlot}
              />
            </div>

            <div className="lg:col-span-4 sticky top-24">
              <SlotInspector activeSlot={activeSlot} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
