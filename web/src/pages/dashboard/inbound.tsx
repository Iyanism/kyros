import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { InboundStats } from "@/components/inbound/inbound_stats";
import { InboundFilters } from "@/components/inbound/inbound_filters";
import { InboundTable } from "@/components/inbound/inbound_table";
import { CreateInboundOrderDialog } from "@/components/inbound/create_inbound_order_dialog";
import { InboundDetailDialog } from "@/components/inbound/inbound_detail_dialog";
import { get_inbound_orders, update_inbound_order_status, delete_inbound_order } from "@/lib/api/order";
import { get_clients } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import type { InboundOrderResponse, OrderStatus } from "@/types/order";
import type { ClientResponse } from "@/types/client";

export function Inbound() {
  const [orders, setOrders] = useState<InboundOrderResponse[]>([]);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Active detail modal order
  const [activeDetailOrder, setActiveDetailOrder] = useState<InboundOrderResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [ordersData, clientsData] = await Promise.all([
          get_inbound_orders(),
          get_clients().catch(() => []),
        ]);
        if (cancelled) return;
        setOrders(ordersData);
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to load inbound orders:", error);
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

  const handleAddOrder = (newOrder: InboundOrderResponse) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await update_inbound_order_status(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (activeDetailOrder && activeDetailOrder.id === orderId) {
        setActiveDetailOrder(updated);
      }
      toast.success(`Order ${updated.order_number} status updated to '${newStatus}'`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = window.confirm("Delete this inbound order manifest? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await delete_inbound_order(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (activeDetailOrder?.id === orderId) {
        setDetailModalOpen(false);
        setActiveDetailOrder(null);
      }
      toast.success("Inbound order deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleOpenDetail = (order: InboundOrderResponse) => {
    setActiveDetailOrder(order);
    setDetailModalOpen(true);
  };

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      o.order_number.toLowerCase().includes(term) ||
      o.vehicle_number.toLowerCase().includes(term) ||
      (o.client_name && o.client_name.toLowerCase().includes(term)) ||
      o.items.some(
        (it) =>
          it.product_name.toLowerCase().includes(term) ||
          (it.batch_number && it.batch_number.toLowerCase().includes(term))
      );

    const matchesStatus = selectedStatus === "all" || o.status === selectedStatus;
    const matchesClient = selectedClient === "all" || o.client_id === selectedClient;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedClient("all");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f6fa]">
        <Sidebar />
        <main className="flex-1 lg:ml-65">
          <div className="flex flex-col items-center justify-center h-screen gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
            <div className="text-sm font-medium text-[#64748b]">Loading inbound orders...</div>
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
          title="Inbound Orders"
          subtitle="Manage cold storage shipment intake, vehicle logging, and batch manifests"
          actions={<CreateInboundOrderDialog clients={clients} onAddOrder={handleAddOrder} />}
        />

        <div className="p-6 lg:p-8 space-y-6">
          <InboundStats orders={orders} />

          <InboundFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            clientsList={clients.map((c) => ({ id: c.id, name: c.name }))}
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
            onReset={handleResetFilters}
          />

          <InboundTable
            orders={filteredOrders}
            onSelectOrder={handleOpenDetail}
            onStatusChange={handleStatusChange}
            onDeleteOrder={handleDeleteOrder}
          />
        </div>
      </main>

      <InboundDetailDialog
        order={activeDetailOrder}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
