import type {
  InboundOrderRequest,
  InboundOrderResponse,
  OrderItemCreate,
} from "@/types/order";
import { useMemo, useState, type SubmitEventHandler } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Calendar,
  Hash,
  Layers,
  Package,
  Plus,
  Thermometer,
  Trash2,
  Truck,
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { create_inbound_order } from "@/lib/api/order";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import type { ChamberCategory } from "@/types/chamber";

interface CreateInboundOrderDialogProps {
  onAddOrder: (order: InboundOrderResponse) => void;
}

const DEFAULT_ITEM: OrderItemCreate = {
  product_name: "",
  quantity: 0,
  temperature_category: "frozen",
  batch_number: "",
  expiry_date: "",
};

const INITIAL_FORM: InboundOrderRequest = {
  client_id: "",
  vehicle_number: "",
  total_quantity: 0,
  items: [DEFAULT_ITEM],
};

export function CreateInboundOrderDialog({
  onAddOrder,
}: CreateInboundOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InboundOrderRequest>(INITIAL_FORM);
  const { user } = useAuth();

  const totalQuantity = useMemo(() => {
    return form.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );
  }, [form.items]);

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { ...DEFAULT_ITEM }] });
  };

  const handleRemoveItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const handleUpdateItem = (idx: number, item: OrderItemCreate) => {
    setForm({
      ...form,
      items: form.items.map((i, iIdx) => (iIdx === idx ? item : i)),
    });
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const clientId = user?.client_id || form.client_id;
    if (!clientId) {
      toast.error("Please select or log in with an associated client.");
      return;
    }
    if (totalQuantity === 0) {
      toast.error("Total quantity must be greater than 0.");
      return;
    }

    const payload: InboundOrderRequest = {
      ...form,
      client_id: clientId,
      total_quantity: totalQuantity,
      items: form.items.map((it) => ({
        ...it,
        expiry_date: it.expiry_date ? new Date(it.expiry_date).toISOString() : new Date().toISOString(),
      })),
    };

    try {
      const response = await create_inbound_order(payload);
      onAddOrder(response);
      toast.success("Inbound order created successfully");
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) handleReset();
      }}
    >
      <DialogTrigger
        render={
          <Button className="flex items-center gap-2 rounded-[10px] bg-[#2457e6] hover:bg-[#1d4ed8] text-white shadow-xs font-semibold text-[13px] px-4 py-2">
            <Plus className="h-4 w-4" /> Create Inbound Order
          </Button>
        }
      />
      <DialogContent className="sm:max-w-3xl bg-white rounded-2xl p-6 border border-[#e2e8f0] max-h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-3 border-b border-[#e2e8f0]">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-display text-[19px] font-bold text-[#0f172a] flex items-center gap-2">
                <Package className="h-5 w-5 text-[#2457e6]" />
                Create Inbound Order
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[#64748b] mt-0.5">
                Record new incoming shipment and batch items for cold storage intake.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
          <ScrollArea className="flex-1 px-6 py-4 max-h-[calc(90vh-140px)]">
            <div className="space-y-6 pr-3">
              {/* Order Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200/80">
                {/* Vehicle Number */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="order-vehicle"
                    className="text-[12px] font-semibold text-[#0f172a] flex items-center gap-1.5"
                  >
                    <Truck className="h-3.5 w-3.5 text-[#2457e6]" /> Vehicle Number
                  </Label>
                  <Input
                    id="order-vehicle"
                    placeholder="e.g. MH-12-PQ-4821"
                    value={form.vehicle_number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        vehicle_number: e.target.value.toUpperCase(),
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Order Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0f172a] flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#2457e6]" />
                      Order Items Breakdown ({form.items.length})
                    </h3>
                    <p className="text-[11px] text-[#64748b]">
                      Specify products, quantities, temperature zone, batch code, and expiry date.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    variant="outline"
                    className="flex items-center gap-1.5 text-[12px] font-semibold border-[#2457e6] text-[#2457e6] hover:bg-[#2457e6]/5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Line Item
                  </Button>
                </div>

                {/* Items Table / List */}
                <div
                  className="rounded-xl border border-[#e2e8f0] bg-white max-h-72 overflow-y-auto p-3 space-y-3"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#cbd5e1 transparent",
                  }}
                >
                  {form.items.map((item, idx) => (
                    <div
                      key={`item-${idx}`}
                      className="p-3.5 rounded-lg border border-[#e2e8f0] bg-[#fafbfc] hover:border-[#cbd5e1] transition-all space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2457e6] text-white text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-[12px] font-bold text-[#0f172a]">
                            Item #{idx + 1}
                          </span>
                        </div>
                        {form.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-[#94a3b8] hover:text-[#ef4444] transition-colors p-1 rounded-md hover:bg-[#fee2e2]"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        {/* Product Name (5 cols) */}
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px] font-semibold text-[#475569]">
                            Product Name <span className="text-[#ef4444]">*</span>
                          </Label>
                          <Input
                            placeholder="e.g. Frozen Atlantic Salmon"
                            value={item.product_name}
                            onChange={(e) =>
                              handleUpdateItem(idx, {
                                ...item,
                                product_name: e.target.value,
                              })
                            }
                            required
                            className="bg-white text-xs h-9"
                          />
                        </div>

                        {/* Quantity (3 cols) */}
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-semibold text-[#475569]">
                            Quantity (kg) <span className="text-[#ef4444]">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="e.g. 500"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(idx, {
                                ...item,
                                quantity: Number(e.target.value),
                              })
                            }
                            required
                            className="bg-white text-xs h-9"
                          />
                        </div>

                        {/* Temp Category (4 cols) */}
                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px] font-semibold text-[#475569] flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-[#2457e6]" /> Temp Zone <span className="text-[#ef4444]">*</span>
                          </Label>
                          <Select
                            value={item.temperature_category}
                            onValueChange={(val) =>
                              handleUpdateItem(idx, {
                                ...item,
                                temperature_category: val as ChamberCategory,
                              })
                            }
                          >
                            <SelectTrigger className="w-full bg-white text-xs h-9 border-[#e2e8f0] focus:ring-[#2457e6] focus:border-[#2457e6]">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#e2e8f0]">
                              <SelectItem value="frozen" className="text-xs">
                                Frozen Zone
                              </SelectItem>
                              <SelectItem value="chilled" className="text-xs">
                                Chilled Zone
                              </SelectItem>
                              <SelectItem value="ambient" className="text-xs">
                                Ambient Zone
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Batch Number & Expiry Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#f1f5f9]">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium text-[#64748b] flex items-center gap-1">
                            <Hash className="h-3 w-3 text-[#94a3b8]" /> Batch Number <span className="text-[#ef4444]">*</span>
                          </Label>
                          <Input
                            placeholder="e.g. BAT-2026-09"
                            value={item.batch_number}
                            onChange={(e) =>
                              handleUpdateItem(idx, {
                                ...item,
                                batch_number: e.target.value,
                              })
                            }
                            required
                            className="bg-white text-xs h-8"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium text-[#64748b] flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-[#94a3b8]" /> Expiry Date <span className="text-[#ef4444]">*</span>
                          </Label>
                          <Input
                            type="date"
                            value={item.expiry_date}
                            onChange={(e) =>
                              handleUpdateItem(idx, {
                                ...item,
                                expiry_date: e.target.value,
                              })
                            }
                            required
                            className="bg-white text-xs h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Control Bar */}
              <div className="p-4 rounded-xl bg-[#eef2ff] border border-[#c7d2fe] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#c7d2fe]/60">
                  <div>
                    <Label
                      htmlFor="total-quantity"
                      className="text-[11px] font-bold uppercase tracking-wider text-[#3730a3]"
                    >
                      Total Line Items
                    </Label>
                    <div className="text-[18px] font-black text-[#2457e6] mt-0.5">
                      {form.items.length}{" "}
                      <span className="text-[12px] font-semibold text-[#4338ca]">
                        items
                      </span>
                    </div>
                  </div>
                  <div className="sm:border-l sm:border-[#c7d2fe]/60 sm:pl-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#3730a3] block">
                      Total Inbound Net Weight
                    </span>
                    <div className="text-[16px] font-extrabold text-[#1e1b4b] mt-0.5">
                      {totalQuantity.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[12px] font-medium text-[#4338ca]">
                        kg
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0] px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white"
            >
              Save Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
