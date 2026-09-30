import { getApiErrorMessage } from "@/lib/api/apiClient";
import { create_user } from "@/lib/api/user";
import { userPhoneSchema } from "@/lib/validators/auth";
import type { UserInfo, UserClientResponse, UserRole } from "@/types/user";
import { useEffect, useState, type SubmitEventHandler } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus } from "lucide-react";
import { PasswordInput } from "../ui/password-input";
import type { ClientResponse } from "@/types/client";
import { get_clients } from "@/lib/api/client";

interface CreateUserDialogProps {
  onAddUser: (user: UserClientResponse) => void;
}

export function CreateUserDialog({ onAddUser }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserInfo>({
    full_name: "",
    email: "",
    password: "",
    phone_number: "",
    role: "client",
    client_id: null,
  });
  const [clients, setClients] = useState<ClientResponse[] | null>(null);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const parsedPhone = userPhoneSchema.safeParse(user.phone_number ?? "");
    if (!parsedPhone.success) {
      toast.error(parsedPhone.error.issues[0]?.message ?? "Invalid phone number");
      return;
    }
    try {
      const res = await create_user({ ...user, phone_number: parsedPhone.data });
      onAddUser(res);
      toast.success(`User Successfully Created: ${user.full_name}`);
      setOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadClient = async () => {
      try {
        const data = await get_clients();
        if (cancelled) return;
        setClients(data);
      } catch (error) {
        console.error("Failed to load clients:", error);
      }
    };
    void loadClient();
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="flex items-center gap-1.5 rounded-[10px] bg-[#2457e6] hover:bg-[#1d4ed8] text-white shadow-xs font-semibold text-[12px] px-3.5 py-2">
            <Plus className="h-4 w-4" /> Create New User
          </Button>
        }
      />
      <DialogContent className="sm:max-w-106.25 bg-white rounded-2xl p-6 border border-[#e2e8f0]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a]">
              Create New User
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">
              Create a new User for the system
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label
                htmlFor="fullname"
                className="text-[12px] font-semibold text-[#0f172a]"
              >
                Full Name
              </Label>
              <Input
                id="fullname"
                placeholder="e.g. Ravi Kishan"
                value={user.full_name}
                onChange={(e) =>
                  setUser({ ...user, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[12px] font-semibold text-[#0f172a]"
              >
                Email
              </Label>
              <Input
                id="email"
                placeholder="e.g. ravikishan@gmail.com"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-[12px] font-semibold text-[#0f172a]"
              >
                Password
              </Label>
              <PasswordInput
                id="password"
                placeholder="e.g. @ravikishan123."
                value={user.password}
                onChange={(e) => setUser({ ...user, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="phone"
                className="text-[12px] font-semibold text-[#0f172a]"
              >
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 9823198456"
                value={user.phone_number || ""}
                onChange={(e) =>
                  setUser({ ...user, phone_number: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="role"
                className="text-[12px] font-semibold text-[#0f172a]"
              >
                User Role
              </Label>
              <select
                id="role"
                value={user.role}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  setUser({
                    ...user,
                    role,
                    client_id: role === "client" ? user.client_id : null,
                  });
                }}
                className="w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#2457e6] focus:ring focus:ring-[#2457e6]/50"
                required
              >
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="client">Client</option>
              </select>
            </div>
            {user.role === "client" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="clients"
                  className="text-[12px] font-semibold text-[#0f172a]"
                >
                  Clients
                </Label>
                <select
                  id="clients"
                  value={user.client_id || ""}
                  onChange={(e) => {
                    const clientId = e.target.value;
                    setUser({
                      ...user,
                      client_id: clientId || null,
                    });
                  }}
                  className="w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#2457e6] focus:ring focus:ring-[#2457e6]/50"
                  required
                >
                  <option value="">Select a Client</option>
                  {clients && clients.length > 0 ? (
                    clients.map((client) => (
                      <option value={client.id} key={client.id}>
                        {client.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No Client Found</option>
                  )}
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="text-[#64748b]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white"
            >
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
