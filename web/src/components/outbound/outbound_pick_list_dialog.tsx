import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { generate_pick_list, get_pick_list, get_pick_list_by_outbound_order } from "@/lib/api/inventory";
import { update_outbound_order_status } from "@/lib/api/outbound";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { Truck, MapPin, Package, AlertCircle, CheckCircle2, ListChecks, RefreshCw } from "lucide-react";
import type { OutboundOrderResponse } from "@/types/outbound";
import type { PickListResponse } from "@/types/inventory";

interface OutboundPickListDialogProps {
  order: OutboundOrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (updatedOrder: OutboundOrderResponse) => void;
}

export function OutboundPickListDialog({
  order,
  open,
  onOpenChange,
  onComplete,
}: OutboundPickListDialogProps) {
  const [pickList, setPickList] = useState<PickListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set of checked pick record IDs
  const [checkedRecordIds, setCheckedRecordIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !order) return;

    let cancelled = false;
    const fetchOrGeneratePickList = async () => {
      setIsLoading(true);
      setCheckedRecordIds(new Set());
      try {
        // Try fetching existing pick list first
        let listData: PickListResponse;
        try {
          listData = await get_pick_list_by_outbound_order(order.id);
        } catch {
          // If not created yet, generate it
          listData = await generate_pick_list(order.id);
        }

        if (cancelled) return;
        setPickList(listData);
      } catch (error) {
        console.error("Failed to load pick list:", error);
        toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchOrGeneratePickList();

    return () => {
      cancelled = true;
    };
  }, [open, order]);

  if (!order) return null;

  const records = pickList?.records || [];
  const totalCount = records.length;
  const checkedCount = checkedRecordIds.size;
  const isAllChecked = totalCount > 0 && checkedCount === totalCount;

  const handleToggleRecord = (recordId: string, checked: boolean) => {
    setCheckedRecordIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(recordId);
      } else {
        next.delete(recordId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isAllChecked) {
      setCheckedRecordIds(new Set());
    } else {
      setCheckedRecordIds(new Set(records.map((r) => r.id)));
    }
  };

  const handleRefresh = async () => {
    if (!pickList || isLoading) return;
    setIsLoading(true);
    try {
      const fresh = await get_pick_list(pickList.id);
      setPickList(fresh);
      setCheckedRecordIds(new Set());
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!isAllChecked) {
      toast.error("Please retrieve and check off all items in the pick list before dispatching.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await update_outbound_order_status(order.id, "dispatched");
      toast.success(
        `Outbound Order OUT-${updated.id.slice(0, 8)} successfully dispatched and inventory updated!`
      );
      if (onComplete) onComplete(updated);
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a] flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-[#2457e6]" />
                Outbound Pick List Execution — OUT-{order.id.slice(0, 8)}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[#64748b] mt-0.5">
                Verify and check off all physical pallets retrieved from cold storage slots
              </DialogDescription>
            </div>
            {pickList && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleRefresh()}
                disabled={isLoading}
                className="text-xs font-semibold border-[#e2e8f0] hover:bg-[#f8fafc] text-[#0f172a] flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />{" "}
                Refresh
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1" style={{ scrollbarWidth: "thin" }}>
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
              <p className="text-xs text-[#64748b] font-medium">Generating pick list allocation...</p>
            </div>
          )}

          {!isLoading && pickList && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                    Total Lines
                  </span>
                  <p className="text-base font-bold text-[#0f172a] mt-0.5">{pickList.total_lines}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                    Total Quantity
                  </span>
                  <p className="text-base font-bold text-[#0f172a] mt-0.5">
                    {pickList.total_quantity.toLocaleString()} units
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                    Total Weight
                  </span>
                  <p className="text-base font-bold text-[#0f172a] mt-0.5">
                    {pickList.total_weight_mt.toFixed(2)} MT
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="p-3 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#0f172a]">Pallet Retrieval Progress:</span>
                  <span className="font-mono font-bold text-[#2457e6]">
                    {checkedCount} of {totalCount} items checked
                  </span>
                </div>
                {isAllChecked ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Ready for Dispatch!
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Tick all items to dispatch
                  </span>
                )}
              </div>

              {/* Checklist Table */}
              <div className="rounded-xl border border-[#e2e8f0] overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-[#f8fafc]">
                    <TableRow className="border-b border-[#e2e8f0]">
                      <TableHead className="w-12 py-3 pl-4">
                        <Checkbox
                          checked={isAllChecked}
                          onCheckedChange={handleToggleSelectAll}
                          aria-label="Select all pick items"
                        />
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3">
                        Pallet Code
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3">
                        Product & Batch
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3">
                        Storage Slot
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] py-3 text-right pr-4">
                        Pick Qty / Weight
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-[#e2e8f0]">
                    {records.map((rec) => {
                      const isChecked = checkedRecordIds.has(rec.id);
                      return (
                        <TableRow
                          key={rec.id}
                          className={`transition-colors cursor-pointer ${
                            isChecked ? "bg-emerald-50/50" : "hover:bg-[#f8fafc]"
                          }`}
                          onClick={() => handleToggleRecord(rec.id, !isChecked)}
                        >
                          <TableCell className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(val) => handleToggleRecord(rec.id, Boolean(val))}
                              aria-label={`Mark ${rec.pallet_code} retrieved`}
                            />
                          </TableCell>
                          <TableCell className="py-3 font-mono text-xs font-bold text-[#2457e6]">
                            <div className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-[#2457e6]" />
                              {rec.pallet_code}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-xs">
                            <p className="font-semibold text-[#0f172a]">{rec.product_name}</p>
                            <p className="text-[10px] text-[#64748b]">Batch: {rec.batch_code}</p>
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f1f5f9] border border-[#e2e8f0] text-[11px] font-mono font-semibold text-[#334155]">
                              <MapPin className="h-3 w-3 text-[#2457e6]" />
                              {rec.slot_code || "Unassigned"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-right pr-4 text-xs font-bold text-[#0f172a]">
                            {rec.quantity.toLocaleString()} units
                            <span className="block text-[10px] font-normal text-[#64748b]">
                              {rec.weight.toFixed(2)} MT
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="pt-3 border-t border-[#e2e8f0] gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isAllChecked || isSubmitting}
            onClick={handleDispatch}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 flex items-center gap-1.5"
          >
            <Truck className="h-4 w-4" />
            {isSubmitting ? "Processing Dispatch..." : "Confirm Retrieval & Dispatch Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
