import { useState, useEffect } from "react";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { CreateUserDialog } from "@/components/user/create_user_dialog";
import { EditUserDialog } from "@/components/user/edit_user_dialog";
import { UserStats } from "@/components/user/user_stats";
import { UserFilters } from "@/components/user/user_filters";
import { UsersTable } from "@/components/user/users_table";
import { get_users, toggle_status, delete_user } from "@/lib/api/user";
import type { UserClientResponse } from "@/types/user";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/apiClient";

export function Users() {
  const [users, setUsers] = useState<UserClientResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<UserClientResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Load users
  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const data = await get_users();
        if (cancelled) return;
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.client?.name && u.client.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    operator: users.filter((u) => u.role === "operator").length,
    client: users.filter((u) => u.role === "client").length,
  };

  const handleAddUser = (newUser: UserClientResponse) => {
    setUsers([newUser, ...users]);
  };

  const handleToggleStatus = async (userId: string) => {
    setIsUpdated(true);
    try {
      const res = await toggle_status(userId);
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === res.id ? res : user)));
      setIsUpdated(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleEditUser = (user: UserClientResponse) => {
    setEditingUser(user);
    setEditOpen(true);
  };

  const handleUserUpdated = (updated: UserClientResponse) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    const confirmed = window.confirm(
      `Delete user "${user?.full_name ?? "this user"}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await delete_user(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted successfully");
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
            <div className="text-[#64748b]">Loading users...</div>
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
          title="Users & Staff Management"
          subtitle="Manage system access, operator accounts, and client representatives"
          actions={<CreateUserDialog onAddUser={handleAddUser} />}
        />

        <div className="p-6 lg:p-8 space-y-6">
          <UserStats stats={stats} />
          <UserFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
          />
          <UsersTable
            users={filteredUsers}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            isUpdated={isUpdated}
          />
        </div>
      </main>

      <EditUserDialog
        user={editingUser}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}
