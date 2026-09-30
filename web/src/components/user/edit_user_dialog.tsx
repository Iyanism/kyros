import { getApiErrorMessage } from "@/lib/api/apiClient";
import { update_user } from "@/lib/api/user";
import { userPhoneSchema } from "@/lib/validators/auth";
import type { UserClientResponse, UserRole, UserUpdate } from "@/types/user";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { PasswordInput } from "../ui/password-input";
import type { ClientResponse } from "@/types/client";
import { get_clients } from "@/lib/api/client";

interface EditUserDialogProps {
  user: UserClientResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (user: UserClientResponse) => void;
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [form, setForm] = useState<UserUpdate>({});
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when user changes
  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        client_id: user.client_id,
        password: "",
      });
    }
  }, [user]);

  // Load clients for the dropdown
  useEffect(() => {
    let cancelled = false;
    const loadClients = async () => {
      try {
        const data = await get_clients();
        if (!cancelled) setClients(data);
      } catch (error) {
        console.error("Failed to load clients:", error);
      }
    };
    void loadClients();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const rawPhone = (form.phone_number ?? "").trim();
    let phone: string | null = null;
    if (rawPhone !== "") {
      const parsedPhone = userPhoneSchema.safeParse(rawPhone);
      if (!parsedPhone.success) {
        toast.error(
          parsedPhone.error.issues[0]?.message ?? "Invalid phone number",
        );
        return;
      }
      phone = parsedPhone.data;
    }

    setIsSubmitting(true);

    // Build payload — omit password if blank
    const payload = {
      full_name: form.full_name ?? user.full_name,
      email: form.email ?? user.email,
      phone_number: phone,
      role: form.role ?? user.role,
      client_id: (form.role ?? user.role) === "client" ? (form.client_id ?? null) : null,
    } satisfies UserUpdate;
    if (form.password && form.password.trim() !== "") {
      (payload as UserUpdate).password = form.password;
    }

    try {
      await update_user(user.id, payload);
      // Merge response back — update_user returns UserResponse (no client), so we merge manually
      const updated: UserClientResponse = {
        ...user,
        full_name: payload.full_name ?? user.full_name,
        email: payload.email ?? user.email,
        phone_number: payload.phone_number,
        role: payload.role ?? user.role,
        client_id: payload.client_id ?? user.client_id,
        client: payload.role === "client"
          ? (clients.find((c) => c.id === payload.client_id) ?? user.client)
          : null,
      };
      onUserUpdated(updated);
      toast.success(`User "${updated.full_name}" updated successfully`);
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25 bg-white rounded-2xl p-6 border border-[#e2e8f0]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a]">
              Edit User
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">
              Update details for {user.full_name}. Leave password blank to keep it unchanged.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="edit-fullname" className="text-[12px] font-semibold text-[#0f172a]">
                Full Name
              </Label>
              <Input
                id="edit-fullname"
                placeholder="e.g. Ravi Kishan"
                value={form.full_name ?? ""}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-[12px] font-semibold text-[#0f172a]">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="e.g. ravikishan@gmail.com"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-password" className="text-[12px] font-semibold text-[#0f172a]">
                New Password <span className="text-[#94a3b8] font-normal">(optional)</span>
              </Label>
              <PasswordInput
                id="edit-password"
                placeholder="Leave blank to keep current password"
                value={form.password ?? ""}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="text-[12px] font-semibold text-[#0f172a]">
                Phone Number
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="e.g. 9823198456"
                value={form.phone_number ?? ""}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-role" className="text-[12px] font-semibold text-[#0f172a]">
                User Role
              </Label>
              <select
                id="edit-role"
                value={form.role ?? "client"}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  setForm({
                    ...form,
                    role,
                    client_id: role === "client" ? (form.client_id ?? null) : null,
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

            {form.role === "client" && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-client" className="text-[12px] font-semibold text-[#0f172a]">
                  Associated Client
                </Label>
                <select
                  id="edit-client"
                  value={form.client_id ?? ""}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value || null })}
                  className="w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#2457e6] focus:ring focus:ring-[#2457e6]/50"
                  required
                >
                  <option value="">Select a Client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-[#64748b]"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
