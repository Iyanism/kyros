import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { add_rack } from "@/lib/api/chamber";
import { getApiErrorMessage } from "@/lib/api/apiClient";

interface AddRackDialogProps {
  chamberId: string | null;
  onRackAdded: () => void;
}

const INITIAL_FORM = {
  bays_per_rack: 5,
  levels_per_rack: 2,
  rack_number: "",
};

export function AddRackDialog({ chamberId, onRackAdded }: AddRackDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamberId) return;

    setIsSubmitting(true);
    try {
      await add_rack(chamberId, {
        bays_per_rack: form.bays_per_rack,
        levels_per_rack: form.levels_per_rack,
        rack_number: form.rack_number.trim() || undefined,
      });
      toast.success("Rack added successfully");
      setForm(INITIAL_FORM);
      setOpen(false);
      onRackAdded();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) setForm(INITIAL_FORM);
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            disabled={!chamberId}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#2457e6]/30 bg-white text-[#2457e6] hover:bg-[#2457e6]/5 shadow-xs font-semibold text-[12px] px-3.5 py-2"
          >
            <Plus className="h-4 w-4" /> Add Rack
          </Button>
        }
      />
      <DialogContent className="sm:max-w-96 bg-white rounded-2xl p-6 border border-[#e2e8f0]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a]">
              Add Rack to Chamber
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">
              Creates the rack together with its bay × level slot grid.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rack-bays" className="text-[12px] font-semibold text-[#0f172a]">
                  Bays <span className="text-[#ef4444]">*</span>
                </Label>
                <Input
                  id="rack-bays"
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g. 5"
                  value={form.bays_per_rack || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bays_per_rack: e.target.value ? parseInt(e.target.value) : 0,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rack-levels" className="text-[12px] font-semibold text-[#0f172a]">
                  Levels <span className="text-[#ef4444]">*</span>
                </Label>
                <Input
                  id="rack-levels"
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g. 2"
                  value={form.levels_per_rack || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      levels_per_rack: e.target.value ? parseInt(e.target.value) : 0,
                    })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rack-number" className="text-[12px] font-semibold text-[#0f172a]">
                Rack Number
              </Label>
              <Input
                id="rack-number"
                placeholder="Auto (e.g. R06) if left blank"
                value={form.rack_number}
                onChange={(e) => setForm({ ...form, rack_number: e.target.value })}
              />
            </div>
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
              disabled={isSubmitting}
              className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white"
            >
              {isSubmitting ? "Adding..." : "Add Rack"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
