import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Building2, Calculator } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generate_invoice } from "@/lib/api/invoice";
import { get_clients } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import type { InvoiceDetailResponse } from "@/types/invoice";
import type { ClientResponse } from "@/types/client";

interface GenerateInvoiceDialogProps {
  onAddInvoice?: (invoice: InvoiceDetailResponse) => void;
}

export function GenerateInvoiceDialog({ onAddInvoice }: GenerateInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<ClientResponse[]>([]);

  // Form State
  const [clientId, setClientId] = useState("");
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default 1st of current month
    return d.toISOString().split("T")[0]!;
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    return new Date().toISOString().split("T")[0]!;
  });
  const [storageDailyRate, setStorageDailyRate] = useState(50.0);
  const [handlingRate, setHandlingRate] = useState(25.0);

  useEffect(() => {
    if (!open) return;
    get_clients()
      .then((data) => setClients(data))
      .catch(() => {});
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client organization.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        client_id: clientId,
        billing_period_start: new Date(periodStart).toISOString(),
        billing_period_end: new Date(periodEnd).toISOString(),
        storage_daily_rate: Number(storageDailyRate),
        handling_rate: Number(handlingRate),
      };

      const newInvoice = await generate_invoice(payload);
      toast.success(`Invoice ${newInvoice.invoice_number} generated successfully!`);
      if (onAddInvoice) onAddInvoice(newInvoice);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="flex items-center gap-1.5 rounded-[10px] bg-[#2457e6] hover:bg-[#1d4ed8] text-white shadow-xs font-semibold text-[12px] px-3.5 py-2">
            <Plus className="h-4 w-4" /> Generate Invoice
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 border border-[#e2e8f0]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="pb-2 border-b border-[#e2e8f0]">
            <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a] flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#2457e6]" />
              Generate Billing Statement
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">
              Compute storage and handling line items for a client billing period
            </DialogDescription>
          </DialogHeader>

          {/* Client Select */}
          <div className="space-y-1.5">
            <Label htmlFor="gen-client" className="text-xs font-semibold text-[#0f172a]">
              Client Organization <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <select
                id="gen-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#e2e8f0] rounded-xl bg-white text-[#0f172a] focus:outline-none focus:border-[#2457e6]"
                required
              >
                <option value="">Select a Client Organization</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            </div>
          </div>

          {/* Billing Period Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="period-start" className="text-xs font-semibold text-[#0f172a]">
                Period Start Date
              </Label>
              <Input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="period-end" className="text-xs font-semibold text-[#0f172a]">
                Period End Date
              </Label>
              <Input
                id="period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="text-xs"
                required
              />
            </div>
          </div>

          {/* Rates Config */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="storage-rate" className="text-xs font-semibold text-[#0f172a]">
                Daily Storage Rate (₹)
              </Label>
              <Input
                id="storage-rate"
                type="number"
                step="0.01"
                min="0.01"
                value={storageDailyRate}
                onChange={(e) => setStorageDailyRate(Number(e.target.value))}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="handling-rate" className="text-xs font-semibold text-[#0f172a]">
                Handling Rate / MT (₹)
              </Label>
              <Input
                id="handling-rate"
                type="number"
                step="0.01"
                min="0.01"
                value={handlingRate}
                onChange={(e) => setHandlingRate(Number(e.target.value))}
                className="text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-[#e2e8f0] gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !clientId}
              className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-4"
            >
              {isSubmitting ? "Generating..." : "Generate Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
