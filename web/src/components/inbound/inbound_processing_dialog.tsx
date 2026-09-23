import { useState, useEffect } from "react";
import type { InboundOrderResponse } from "@/types/order";
import type { PalletResponse, SlotAllocationResponse } from "@/types/inventory";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InboundOrderStatusBadge } from "./inbound_status_badge";
import { InboundItemsList } from "./inbound_items_list";
import { palletise_order, allocate_order, list_order_pallets, list_order_allocations } from "@/lib/api/inventory";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { toast } from "sonner";
import { CheckCircle2, Layers, MapPin, Package, ArrowRight, Loader2, Warehouse, Thermometer } from "lucide-react";
import { capitalise } from "@/utils/string-operations";

interface InboundProcessingDialogProps {
  order: InboundOrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (updatedOrder: InboundOrderResponse) => void;
}

export function InboundProcessingDialog({
  order,
  open,
  onOpenChange,
  onComplete,
}: InboundProcessingDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pallets, setPallets] = useState<PalletResponse[]>([]);
  const [allocations, setAllocations] = useState<SlotAllocationResponse[]>([]);

  useEffect(() => {
    if (open && order) {
      setStep(1);
      setPallets([]);
      setAllocations([]);
      // Check if pallets or allocations already exist
      void checkExistingState();
    }
  }, [open, order?.id]);

  const checkExistingState = async () => {
    if (!order) return;
    try {
      const existingPallets = await list_order_pallets(order.id).catch(() => []);
      if (existingPallets.length > 0) {
        setPallets(existingPallets);
        const existingAllocations = await list_order_allocations(order.id).catch(() => []);
        if (existingAllocations.length > 0) {
          setAllocations(existingAllocations);
          setStep(3);
        } else {
          setStep(2);
        }
      }
    } catch {
      // ignore
    }
  };

  if (!order) return null;

  // Step 1 -> Step 2: Palletise Order
  const handleStartPalletisation = async () => {
    setIsLoading(true);
    try {
      let resPallets = pallets;
      if (resPallets.length === 0) {
        const res = await palletise_order(order.id);
        resPallets = res.pallets;
        setPallets(resPallets);
        toast.success(`Palletised order into ${res.total_pallets} pallets (${res.total_weight_mt} MT)`);
      }
      setStep(2);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 -> Step 3 & Finalise: Allocate Slots & Mark Stored
  const handleAllocateAndStore = async () => {
    setIsLoading(true);
    try {
      const resAllocations = await allocate_order(order.id, null);
      setAllocations(resAllocations);
      setStep(3);
      toast.success(`Allocated ${resAllocations.length} slots and marked order as STORED!`);
      
      const updatedOrder: InboundOrderResponse = {
        ...order,
        status: "stored",
        updated_at: new Date().toISOString(),
      };
      onComplete(updatedOrder);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="font-display text-[20px] font-bold text-[#0f172a]">
                  Intake & Palletisation Processing — INB-{order.id.slice(0, 8)}
                </DialogTitle>
                <InboundOrderStatusBadge status={order.status} />
              </div>
              <DialogDescription className="text-[12px] text-[#64748b] mt-1">
                Review goods, palletise shipment items, and allocate reserved cold storage slots
              </DialogDescription>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#f1f5f9]">
            <div
              className={`flex items-center gap-2 text-xs font-semibold p-2 rounded-lg transition-colors ${
                step === 1 ? "bg-[#2457e6]/10 text-[#2457e6] border border-[#2457e6]/30" : step > 1 ? "bg-emerald-50 text-emerald-700" : "bg-[#f8fafc] text-[#94a3b8]"
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-[#2457e6] text-white" : "bg-[#cbd5e1] text-white"}`}>
                1
              </span>
              <span>1. Review Goods</span>
            </div>

            <div
              className={`flex items-center gap-2 text-xs font-semibold p-2 rounded-lg transition-colors ${
                step === 2 ? "bg-[#2457e6]/10 text-[#2457e6] border border-[#2457e6]/30" : step > 2 ? "bg-emerald-50 text-emerald-700" : "bg-[#f8fafc] text-[#94a3b8]"
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-[#2457e6] text-white" : "bg-[#cbd5e1] text-white"}`}>
                2
              </span>
              <span>2. Palletisation</span>
            </div>

            <div
              className={`flex items-center gap-2 text-xs font-semibold p-2 rounded-lg transition-colors ${
                step === 3 ? "bg-[#2457e6]/10 text-[#2457e6] border border-[#2457e6]/30" : "bg-[#f8fafc] text-[#94a3b8]"
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? "bg-[#2457e6] text-white" : "bg-[#cbd5e1] text-white"}`}>
                3
              </span>
              <span>3. Storage Allocation</span>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1" style={{ scrollbarWidth: "thin" }}>
          {/* STEP 1: Goods Review */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] text-xs text-[#1e40af] flex items-center gap-2">
                <Package className="h-4 w-4 shrink-0 text-[#2457e6]" />
                <span>
                  Please inspect the incoming shipment items, batch codes, and quantities below before starting the automated palletisation process.
                </span>
              </div>

              <InboundItemsList items={order.items} totalQuantityOverride={order.total_quantity} maxHeight="max-h-72" />
            </div>
          )}

          {/* STEP 2: Palletisation Result */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    Order successfully palletised into <strong>{pallets.length} pallets</strong> (Strict 1.0 MT max weight rule enforced).
                  </span>
                </div>
              </div>

              {/* Pallets Table */}
              <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
                <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#2457e6]" /> Generated Pallets List ({pallets.length})
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto p-2 space-y-2" style={{ scrollbarWidth: "thin" }}>
                  {pallets.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#2457e6] px-2 py-0.5 rounded bg-[#2457e6]/10">
                          {p.pallet_code}
                        </span>
                        <div>
                          <div className="font-semibold text-[#0f172a]">{p.product_name || "Pallet Item"}</div>
                          <div className="text-[11px] text-[#64748b]">Batch: {p.batch_code}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="font-bold text-[#0f172a]">{p.quantity} kg</span>
                          <span className="text-[11px] text-[#64748b] block">({p.weight} MT)</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                          <Thermometer className="h-3 w-3" /> {capitalise(p.temperature_category)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Storage Allocations Complete */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-[14px]">Order Storage Complete & Slots Allocated!</h4>
                  <p className="mt-0.5">
                    All pallets have been stored in their assigned temperature zone slots. Inbound order status updated to <strong>STORED</strong>.
                  </p>
                </div>
              </div>

              {/* Slot Allocations Grid */}
              <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
                <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                    <Warehouse className="h-4 w-4 text-[#2457e6]" /> Cold Storage Slot Allocations ({allocations.length})
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto p-2 space-y-2" style={{ scrollbarWidth: "thin" }}>
                  {allocations.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#0f172a]">{a.pallet_code}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono font-extrabold text-[#2457e6] flex items-center gap-1 bg-[#2457e6]/10 px-2 py-0.5 rounded">
                          <MapPin className="h-3.5 w-3.5" /> Slot {a.slot_code}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {capitalise(a.temperature_category)} Zone
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="pt-4 border-t border-[#e2e8f0] flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {step === 1 && (
            <Button
              type="button"
              className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white flex items-center gap-2"
              onClick={handleStartPalletisation}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Goods & Start Palletisation <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {step === 2 && (
            <Button
              type="button"
              className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white flex items-center gap-2"
              onClick={handleAllocateAndStore}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Allocate Reserved Slots & Mark Stored <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {step === 3 && (
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              onClick={() => onOpenChange(false)}
            >
              <CheckCircle2 className="h-4 w-4" /> Complete & Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
