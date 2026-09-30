import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { InventoryStats } from "@/components/inventory/inventory_stats";
import { InventoryFilters } from "@/components/inventory/inventory_filters";
import { InventoryTable } from "@/components/inventory/inventory_table";
import { ClientInventorySummaryPanel } from "@/components/inventory/client_inventory_summary";
import {
  dateInRange,
  EMPTY_DATE_RANGE,
  type DateRange,
} from "@/components/shared/date_range_filter";
import {
  get_all_inventory,
  get_client_inventory,
  get_client_inventory_summary,
} from "@/lib/api/inventory";
import { get_clients } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import type { ClientInventorySummary, PalletItemResponse } from "@/types/inventory";
import type { ClientResponse } from "@/types/client";

export function Inventory() {
  const [items, setItems] = useState<PalletItemResponse[]>([]);
  const [clientSummaries, setClientSummaries] = useState<
    ClientInventorySummary[] | null
  >(null);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [receivedRange, setReceivedRange] = useState<DateRange>(EMPTY_DATE_RANGE);
  const [expiryRange, setExpiryRange] = useState<DateRange>(EMPTY_DATE_RANGE);
  const [isLoading, setIsLoading] = useState(true);

  // Client list is admin-only; operators/clients simply get no filter
  useEffect(() => {
    let cancelled = false;
    get_clients()
      .then((data) => {
        if (!cancelled) setClients(data);
      })
      .catch(() => {
        if (!cancelled) setClients([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        if (selectedClient === "all") {
          const inventoryData = await get_all_inventory();
          if (cancelled) return;
          setItems(inventoryData);
          setClientSummaries(null);
        } else {
          const [inventoryData, summaryData] = await Promise.all([
            get_client_inventory(selectedClient),
            get_client_inventory_summary(selectedClient).catch(() => null),
          ]);
          if (cancelled) return;
          setItems(inventoryData);
          setClientSummaries(summaryData);
        }
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
  }, [selectedClient]);

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
    const matchesReceived = dateInRange(item.created_at, receivedRange);
    const matchesExpiry = dateInRange(item.expiry_date, expiryRange);

    return (
      matchesSearch &&
      matchesZone &&
      matchesStatus &&
      matchesReceived &&
      matchesExpiry
    );
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedZone("all");
    setSelectedStatus("all");
    setSelectedClient("all");
    setReceivedRange(EMPTY_DATE_RANGE);
    setExpiryRange(EMPTY_DATE_RANGE);
  };

  const hasLocalFilters =
    searchTerm.trim() !== "" ||
    selectedZone !== "all" ||
    selectedStatus !== "all" ||
    receivedRange.from !== "" ||
    receivedRange.to !== "" ||
    expiryRange.from !== "" ||
    expiryRange.to !== "";

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
            clientsList={clients.map((c) => ({ id: c.id, name: c.name }))}
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
            receivedRange={receivedRange}
            onReceivedRangeChange={setReceivedRange}
            expiryRange={expiryRange}
            onExpiryRangeChange={setExpiryRange}
            onReset={handleResetFilters}
          />

          <ClientInventorySummaryPanel
            items={filteredItems}
            summaries={
              selectedClient !== "all" && !hasLocalFilters && clientSummaries
                ? clientSummaries
                : undefined
            }
          />

          <InventoryTable items={filteredItems} />
        </div>
      </main>
    </div>
  );
}
