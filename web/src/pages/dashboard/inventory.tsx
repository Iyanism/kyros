import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { InventoryStats } from "@/components/inventory/inventory_stats";
import { InventoryFilters } from "@/components/inventory/inventory_filters";
import { InventoryTable } from "@/components/inventory/inventory_table";
import { get_all_inventory } from "@/lib/api/inventory";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import type { PalletItemResponse } from "@/types/inventory";

export function Inventory() {
  const [items, setItems] = useState<PalletItemResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const inventoryData = await get_all_inventory();
        if (cancelled) return;
        setItems(inventoryData);
      } catch (error) {
        console.error("Failed to load inventory items:", error);
        toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      item.pallet_code.toLowerCase().includes(term) ||
      item.product_name.toLowerCase().includes(term) ||
      item.batch_code.toLowerCase().includes(term) ||
      item.chamber_code.toLowerCase().includes(term) ||
      item.chamber_name.toLowerCase().includes(term) ||
      item.slot_code.toLowerCase().includes(term);

    const matchesZone =
      selectedZone === "all" || item.temperature_category === selectedZone;
    const matchesStatus =
      selectedStatus === "all" ||
      (item.status && item.status.toUpperCase() === selectedStatus.toUpperCase());

    return matchesSearch && matchesZone && matchesStatus;
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedZone("all");
    setSelectedStatus("all");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f6fa]">
        <Sidebar />
        <main className="flex-1 lg:ml-65">
          <div className="flex flex-col items-center justify-center h-screen gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
            <div className="text-sm font-medium text-[#64748b]">
              Loading cold storage inventory...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fa] font-sans antialiased text-[#17243b]">
      <Sidebar />
      <main className="flex-1 lg:ml-65 min-w-0">
        <DashboardHeader
          title="Stock & Inventory Lookup"
          subtitle="Real-time view of stored pallets, chamber slot allocations, and batch expiration"
        />

        <div className="p-6 lg:p-8 space-y-6">
          <InventoryStats items={items} />

          <InventoryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedZone={selectedZone}
            onZoneChange={setSelectedZone}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            onReset={handleResetFilters}
          />

          <InventoryTable items={filteredItems} />
        </div>
      </main>
    </div>
  );
}
