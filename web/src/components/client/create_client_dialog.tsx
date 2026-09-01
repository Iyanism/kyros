import { useState, type SubmitEventHandler } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { create_client } from "@/lib/api/client";
import { clientSchema } from "@/lib/validators/client";
import type { ClientCreate, ClientResponse } from "@/types/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface CreateClientDialogProps {
  onAddClient: (client: ClientResponse) => void;
}

export function CreateClientDialog({ onAddClient }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClientCreate>({
    name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    pin_code: 0 as unknown as number,
    gstin: "",
  });
  const [pinCodeInput, setPinCodeInput] = useState("");

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const parsed = clientSchema.safeParse({
      ...form,
      pin_code: pinCodeInput === "" ? undefined : Number(pinCodeInput),
      gstin: form.gstin?.trim() === "" ? null : form.gstin,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message ?? "Invalid form input");
      return;
    }

    const payload: ClientCreate = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone_number: parsed.data.phone_number,
      address: parsed.data.address,
      city: parsed.data.city,
      state: parsed.data.state,
      pin_code: parsed.data.pin_code,
      gstin: parsed.data.gstin ?? null,
    };

    try {
      const res = await create_client(payload);
      onAddClient(res);
      toast.success(`Client created: ${res.name}`);
      setOpen(false);
      setForm({ name: "", email: "", phone_number: "", address: "", city: "", state: "", pin_code: 0 as unknown as number, gstin: "" });
      setPinCodeInput("");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="flex items-center gap-1.5 rounded-[10px] bg-[#2457e6] hover:bg-[#1d4ed8] text-white shadow-xs font-semibold text-[12px] px-3.5 py-2">
            <Plus className="h-4 w-4" /> Create Client
          </Button>
        }
      />
      <DialogContent className="sm:max-w-140 bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a]">Create New Client</DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">Add a new client organization</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-name" className="text-[12px] font-semibold text-[#0f172a]">
                  Client Name
                </Label>
                <Input
                  id="client-name"
                  placeholder="e.g. Meridian Foods"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-email" className="text-[12px] font-semibold text-[#0f172a]">
                  Email
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="e.g. contact@meridian.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-phone" className="text-[12px] font-semibold text-[#0f172a]">
                  Phone Number
                </Label>
                <Input
                  id="client-phone"
                  placeholder="e.g. 9823198456"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-gstin" className="text-[12px] font-semibold text-[#0f172a]">
                  GSTIN <span className="text-[#94a3b8] font-normal">(Optional)</span>
                </Label>
                <Input
                  id="client-gstin"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  value={form.gstin ?? ""}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                />
              </div>
            </div>

            {/* Address - free text separate block */}
            <div className="space-y-1.5">
              <Label htmlFor="client-address" className="text-[12px] font-semibold text-[#0f172a]">
                Address
              </Label>
              <textarea
                id="client-address"
                placeholder="e.g. 123 Industrial Area, Phase 2"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                rows={2}
                className="w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2457e6] focus:ring focus:ring-[#2457e6]/10 focus:outline-none resize-none"
              />
            </div>

            {/* City + State - two different blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-city" className="text-[12px] font-semibold text-[#0f172a]">
                  City
                </Label>
                <Input
                  id="client-city"
                  placeholder="e.g. Mumbai"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-state" className="text-[12px] font-semibold text-[#0f172a]">
                  State
                </Label>
                <Input
                  id="client-state"
                  placeholder="e.g. Maharashtra"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Pin Code - integer */}
            <div className="space-y-1.5">
              <Label htmlFor="client-pin" className="text-[12px] font-semibold text-[#0f172a]">
                PIN Code
              </Label>
              <Input
                id="client-pin"
                placeholder="e.g. 400001"
                inputMode="numeric"
                value={pinCodeInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPinCodeInput(v);
                }}
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-[#64748b]">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white">
              Create Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
