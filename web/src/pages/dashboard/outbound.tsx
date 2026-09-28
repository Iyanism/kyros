import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { OutboundStats } from "@/components/outbound/outbound_stats";
import { OutboundFilters } from "@/components/outbound/outbound_filters";
import { OutboundTable } from "@/components/outbound/outbound_table";
import { CreateOutboundOrderDialog } from "@/components/outbound/create_outbound_order_dialog";
import { OutboundDetailDialog } from "@/components/outbound/outbound_detail_dialog";
import { OutboundPickListDialog } from "@/components/outbound/outbound_pick_list_dialog";
import {
  get_outbound_orders,
  get_outbound_order,
  get_outbound_orders_by_client,
  update_outbound_order_status,
  delete_outbound_order,
} from "@/lib/api/outbound";
import { get_clients } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { useAuth } from "@/hooks/useAuth";
import type { OutboundOrderResponse, OutboundOrderStatus } from "@/types/outbound";
import type { ClientResponse } from "@/types/client";

export function Outbound() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OutboundOrderResponse[]>([]);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Active detail modal
  const [activeDetailOrder, setActiveDetailOrder] =
    useState<OutboundOrderResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Active pick list wizard modal
  const [activePickListOrder, setActivePickListOrder] =
    useState<OutboundOrderResponse | null>(null);
  const [pickListModalOpen, setPickListModalOpen] = useState(false);

  // Client list is admin-only; operators simply get no client filter
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
        const ordersData =
          selectedClient === "all"
            ? await get_outbound_orders()
            : await get_outbound_orders_by_client(selectedClient);
        if (cancelled) return;
        setOrders(ordersData);
      } catch (error) {
        console.error("Failed to load outbound orders:", error);
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

  const handleAddOrder = (newOrder: OutboundOrderResponse) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: OutboundOrderStatus
  ) => {
    try {
      const updated = await update_outbound_order_status(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (activeDetailOrder && activeDetailOrder.id === orderId) {
        setActiveDetailOrder(updated);
      }
      toast.success(
        `Outbound Order OUT-${updated.id.slice(0, 8)} status updated to '${newStatus}'`
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      "Delete this outbound dispatch manifest? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await delete_outbound_order(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (activeDetailOrder?.id === orderId) {
        setDetailModalOpen(false);
        setActiveDetailOrder(null);
      }
      toast.success("Outbound order deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleOpenDetail = async (order: OutboundOrderResponse) => {
    // Show the row immediately, then refresh with the latest server state
    setActiveDetailOrder(order);
    setDetailModalOpen(true);
    try {
      const fresh = await get_outbound_order(order.id);
      setOrders((prev) => prev.map((o) => (o.id === fresh.id ? fresh : o)));
      setActiveDetailOrder(fresh);
    } catch {
      // Keep the row data if the refresh fails (offline / permission edge cases)
    }
  };

  const handleOpenPickListFlow = (order: OutboundOrderResponse) => {
    setActivePickListOrder(order);
    setPickListModalOpen(true);
  };

  const handlePickListComplete = (updatedOrder: OutboundOrderResponse) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    if (activeDetailOrder?.id === updatedOrder.id) {
      setActiveDetailOrder(updatedOrder);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      `out-${o.id}`.toLowerCase().includes(term) ||
      (o.client_name && o.client_name.toLowerCase().includes(term)) ||
      o.items.some((it) => it.product_name.toLowerCase().includes(term));

    const matchesStatus =
      selectedStatus === "all" || o.status === selectedStatus;

    return matchesSearch && matchesStatus;
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
            <div className="text-sm font-medium text-[#64748b]">
              Loading outbound orders...
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
          title="Outbound Orders"
          subtitle="Manage cold storage dispatch manifests, pick list executions, and client releases"
          actions={
            user?.role === "client" ? (
              <CreateOutboundOrderDialog onAddOrder={handleAddOrder} />
            ) : null
          }
        />

        <div className="p-6 lg:p-8 space-y-6">
          <OutboundStats orders={orders} />

          <OutboundFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            clientsList={clients.map((c) => ({ id: c.id, name: c.name }))}
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
            onReset={handleResetFilters}
          />

          <OutboundTable
            orders={filteredOrders}
            onSelectOrder={handleOpenDetail}
            onStatusChange={handleStatusChange}
            onDeleteOrder={handleDeleteOrder}
            onOpenPickListFlow={handleOpenPickListFlow}
          />
        </div>
      </main>

      <OutboundDetailDialog
        order={activeDetailOrder}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onStatusChange={handleStatusChange}
        onOpenPickListFlow={handleOpenPickListFlow}
      />

      <OutboundPickListDialog
        order={activePickListOrder}
        open={pickListModalOpen}
        onOpenChange={setPickListModalOpen}
        onComplete={handlePickListComplete}
      />
    </div>
  );
}

