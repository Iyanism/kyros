import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { ClientStats } from "@/components/client/client_stats";
import { ClientFilters } from "@/components/client/client_filters";
import { ClientsTable } from "@/components/client/clients_table";
import { CreateClientDialog } from "@/components/client/create_client_dialog";
import { EditClientDialog } from "@/components/client/edit_client_dialog";
import { delete_client, get_clients, toggle_client_status } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import type { ClientResponse } from "@/types/client";

export function Clients() {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Edit dialog state
  const [editingClient, setEditingClient] = useState<ClientResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadClients = async () => {
      try {
        const data = await get_clients();
        if (cancelled) return;
        setClients(data);
      } catch (error) {
        console.error("Failed to load clients:", error);
        toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadClients();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term) ||
      c.state.toLowerCase().includes(term) ||
      c.address.toLowerCase().includes(term);
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && c.is_active) ||
      (selectedStatus === "inactive" && !c.is_active);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.is_active).length,
    inactive: clients.filter((c) => !c.is_active).length,
  };

  const handleAddClient = (newClient: ClientResponse) => {
    setClients((prev) => [newClient, ...prev]);
  };

  const handleToggleStatus = async (clientId: string) => {
    try {
      const res = await toggle_client_status(clientId);
      setClients((prev) => prev.map((c) => (c.id === res.id ? res : c)));
      toast.success(`Client ${res.is_active ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleEditClient = (client: ClientResponse) => {
    setEditingClient(client);
    setEditOpen(true);
  };

  const handleClientUpdated = (updated: ClientResponse) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDelete = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    const confirmed = window.confirm(
      `Delete client "${client?.name ?? "this client"}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await delete_client(clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      toast.success("Client deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f6fa]">
        <Sidebar />
        <main className="flex-1 lg:ml-65">
          <div className="flex items-center justify-center h-screen">
            <div className="text-[#64748b]">Loading clients...</div>
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
          title="Clients Master"
          subtitle="Manage client organizations and their contact details"
          actions={<CreateClientDialog onAddClient={handleAddClient} />}
        />

        <div className="p-6 lg:p-8 space-y-6">
          <ClientStats stats={stats} />
          <ClientFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
          <ClientsTable
            clients={filteredClients}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEditClient}
            onDelete={handleDelete}
          />
        </div>
      </main>

      <EditClientDialog
        client={editingClient}
        open={editOpen}
        onOpenChange={setEditOpen}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  );
}
