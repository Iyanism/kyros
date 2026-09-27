import { getApiErrorMessage } from "@/lib/api/apiClient";
import { update_client } from "@/lib/api/client";
import type { ClientResponse, ClientUpdate } from "@/types/client";
import { useState, useEffect } from "react";
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

interface EditClientDialogProps {
  client: ClientResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated: (client: ClientResponse) => void;
}

export function EditClientDialog({ client, open, onOpenChange, onClientUpdated }: EditClientDialogProps) {
  const [form, setForm] = useState<ClientUpdate>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when client changes
  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        email: client.email,
        phone_number: client.phone_number,
        address: client.address,
        city: client.city,
        state: client.state,
        pin_code: client.pin_code,
        gstin: client.gstin,
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client) return;
    setIsSubmitting(true);
    try {
      const updated = await update_client(client.id, form);
      onClientUpdated(updated);
      toast.success(`Client "${updated.name}" updated successfully`);
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25 bg-white rounded-2xl p-6 border border-[#e2e8f0]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a]">
              Edit Client
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">
              Update details for {client.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-[12px] font-semibold text-[#0f172a]">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  placeholder="Client name"
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  placeholder="client@example.com"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-[12px] font-semibold text-[#0f172a]">
                  Phone Number
                </Label>
                <Input
                  id="edit-phone"
                  placeholder="9823198456"
                  value={form.phone_number ?? ""}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-gstin" className="text-[12px] font-semibold text-[#0f172a]">
                  GSTIN <span className="text-[#94a3b8] font-normal">(optional)</span>
                </Label>
                <Input
                  id="edit-gstin"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={form.gstin ?? ""}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value || null })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-address" className="text-[12px] font-semibold text-[#0f172a]">
                Address
              </Label>
              <Input
                id="edit-address"
                placeholder="Street address"
                value={form.address ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-city" className="text-[12px] font-semibold text-[#0f172a]">
                  City
                </Label>
                <Input
                  id="edit-city"
                  placeholder="City"
                  value={form.city ?? ""}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-state" className="text-[12px] font-semibold text-[#0f172a]">
                  State
                </Label>
                <Input
                  id="edit-state"
                  placeholder="State"
                  value={form.state ?? ""}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-pin" className="text-[12px] font-semibold text-[#0f172a]">
                  PIN Code
                </Label>
                <Input
                  id="edit-pin"
                  type="number"
                  placeholder="400001"
                  value={form.pin_code ?? ""}
                  onChange={(e) => setForm({ ...form, pin_code: parseInt(e.target.value) || form.pin_code || 0 })}
                  required
                />
              </div>
            </div>
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
