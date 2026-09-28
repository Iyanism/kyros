import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Trash2, AlertCircle, PackageCheck } from "lucide-react";
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
import { get_client_inventory } from "@/lib/api/inventory";
import { create_outbound_order } from "@/lib/api/outbound";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { useAuth } from "@/hooks/useAuth";
import type { OutboundOrderItemCreate, OutboundOrderResponse } from "@/types/outbound";
import type { PalletItemResponse } from "@/types/inventory";

interface CreateOutboundOrderDialogProps {
  onAddOrder?: (order: OutboundOrderResponse) => void;
}

interface InventoryProductSummary {
  product_name: string;
  total_available: number;
}

export function CreateOutboundOrderDialog({ onAddOrder }: CreateOutboundOrderDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProductSummary[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const [items, setItems] = useState<OutboundOrderItemCreate[]>([
    { product_name: "", quantity: 1 },
  ]);

  const effectiveClient = user?.client_id ?? "";

  // Load this client's stored inventory whenever the dialog opens
  useEffect(() => {
    if (!open || !effectiveClient) return;

    let cancelled = false;
    const fetchInventory = async () => {
      setIsLoadingInventory(true);
      try {
        const stockItems: PalletItemResponse[] = await get_client_inventory(effectiveClient);

        if (cancelled) return;

        // Group by product name and sum stored quantities
        const map = new Map<string, number>();
        for (const item of stockItems) {
          if (item.status && item.status.toUpperCase() === "STORED") {
            const curr = map.get(item.product_name) || 0;
            map.set(item.product_name, curr + (item.quantity || 0));
          }
        }

        const summaries: InventoryProductSummary[] = Array.from(map.entries()).map(
          ([product_name, total_available]) => ({ product_name, total_available })
        );

        setInventoryProducts(summaries);
      } catch (err) {
        console.error("Failed to load stored inventory:", err);
      } finally {
        if (!cancelled) setIsLoadingInventory(false);
      }
    };

    void fetchInventory();
    return () => {
      cancelled = true;
    };
  }, [open, effectiveClient]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { product_name: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof OutboundOrderItemCreate,
    value: string | number
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = copy[index];
      if (target) {
        copy[index] = { ...target, [field]: value };
      }
      return copy;
    });
  };

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Validate quantities against inventory
  const validationErrors: string[] = [];
  items.forEach((item, i) => {
    if (!item.product_name) {
      validationErrors.push(`Item #${i + 1}: Select a stored product.`);
      return;
    }
    const inv = inventoryProducts.find((p) => p.product_name === item.product_name);
    const available = inv ? inv.total_available : 0;
    const reqQty = Number(item.quantity) || 0;

    if (reqQty <= 0) {
      validationErrors.push(`Item #${i + 1} (${item.product_name}): Quantity must be > 0.`);
    } else if (reqQty > available) {
      validationErrors.push(
        `Item #${i + 1} (${item.product_name}): Requested ${reqQty} exceeds available stored stock (${available} units).`
      );
    }
  });

  if (!effectiveClient) {
    validationErrors.push("Your account is not linked to a client organization.");
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        client_id: effectiveClient,
        total_quantity: totalQuantity,
        items: items.map((it) => ({
          product_name: it.product_name,
          quantity: Number(it.quantity),
        })),
      };

      const newOrder = await create_outbound_order(payload);
      toast.success(`Outbound Order OUT-${newOrder.id.slice(0, 8)} created successfully!`);
      if (onAddOrder) onAddOrder(newOrder);
      setOpen(false);
      // Reset form
      setItems([{ product_name: "", quantity: 1 }]);
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
            <Plus className="h-4 w-4" /> Create Outbound Order
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xl bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[90vh] flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogHeader className="pb-3 border-b border-[#e2e8f0]">
            <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a] flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-[#2457e6]" />
              Create Outbound Dispatch Order
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">
              Request release and dispatch of stored stock items from inventory
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1" style={{ scrollbarWidth: "thin" }}>
            {/* Inventory loading state */}
            {isLoadingInventory && (
              <div className="p-3 text-xs text-[#64748b] bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#2457e6]" />
                Loading stored inventory items...
              </div>
            )}

            {!isLoadingInventory && inventoryProducts.length === 0 && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold">No Stored Inventory Available</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    There are no stored pallets available in inventory to request for outbound dispatch.
                  </p>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0f172a]">Requested Dispatch Line Items</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-[11px] text-[#2457e6] hover:bg-[#2457e6]/10 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Product Line
                </Button>
              </div>

              {items.map((item, index) => {
                const inv = inventoryProducts.find((p) => p.product_name === item.product_name);
                const maxAvailable = inv ? inv.total_available : 0;
                const isOverLimit = Number(item.quantity) > maxAvailable;

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border transition-colors ${
                      isOverLimit ? "border-red-300 bg-red-50/50" : "border-[#e2e8f0] bg-[#f8fafc]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Product select */}
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px] font-semibold text-[#64748b]">
                          Select Stored Product #{index + 1}
                        </Label>
                        <select
                          value={item.product_name}
                          onChange={(e) => handleItemChange(index, "product_name", e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl bg-white text-[#0f172a] focus:outline-none focus:border-[#2457e6]"
                          required
                        >
                          <option value="">Select a Product</option>
                          {inventoryProducts.map((p) => (
                            <option key={p.product_name} value={p.product_name}>
                              {p.product_name} (Stored: {p.total_available} units)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity input */}
                      <div className="w-32 space-y-1">
                        <Label className="text-[11px] font-semibold text-[#64748b]">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          max={maxAvailable > 0 ? maxAvailable : undefined}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", Number(e.target.value))
                          }
                          className={`text-xs ${isOverLimit ? "border-red-500 bg-white" : ""}`}
                          required
                        />
                      </div>

                      {/* Remove button */}
                      {items.length > 1 && (
                        <div className="pt-6">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 p-0 text-[#94a3b8] hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Available info & max badge */}
                    {item.product_name && (
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-[#64748b]">
                          Available in Cold Storage:{" "}
                          <strong className="text-[#0f172a]">{maxAvailable} units</strong>
                        </span>
                        {isOverLimit && (
                          <span className="font-bold text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Exceeds stored stock!
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total summary */}
            <div className="p-3 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-between text-xs font-bold text-[#0f172a]">
              <span>Total Requested Quantity:</span>
              <span className="text-[#2457e6] text-sm">{totalQuantity.toLocaleString()} units</span>
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
              disabled={isSubmitting || validationErrors.length > 0}
              className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-4"
            >
              {isSubmitting ? "Submitting Request..." : "Submit Outbound Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
