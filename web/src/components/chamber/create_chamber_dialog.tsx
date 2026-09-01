import { useState } from "react";
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
import type { ChamberDetail, ChamberRequest } from "@/types/chamber";
import { create_chamber } from "@/lib/api/chamber";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/apiClient";

interface CreateChamberDialogProp {
  onSubmitChamber: (chamberSummary: ChamberDetail) => void;
}


export function CreateChamberDialog({ onSubmitChamber }: CreateChamberDialogProp) {
  const [open, setOpen] = useState(false);
  const [chamber, setChamber] = useState<ChamberRequest>({
    name: "",
    code: "",
    category: "frozen",
    temperature: 0.0,
    num_racks: 0,
    slots_per_rack: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await create_chamber(chamber);
      onSubmitChamber(res);
      setChamber({
        name: "",
        code: "",
        category: "frozen",
        temperature: 0.0,
        num_racks: 0,
        slots_per_rack: 0,
      });
      setOpen(false); // Only close on success
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="flex items-center gap-1.5 rounded-[10px] bg-[#2457e6] hover:bg-[#1d4ed8] text-white shadow-xs font-semibold text-[12px] px-3.5 py-2">
            <Plus className="h-4 w-4" /> Create New Chamber
          </Button>
        }
      />
      <DialogContent className="sm:max-w-106.25 bg-white rounded-2xl p-6 border border-[#e2e8f0]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a]">
              Create New Storage Chamber
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">
              Configure physical capacity, target temperature control zone, and rack layouts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-[12px] font-semibold text-[#0f172a]">
                Chamber Code
              </Label>
              <Input
                id="code"
                placeholder="e.g. CH-G"
                value={chamber.code}
                onChange={(e) => setChamber({ ...chamber, code: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[12px] font-semibold text-[#0f172a]">
                Chamber Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Blast Freezer Room 2"
                value={chamber.name}
                onChange={(e) => setChamber({ ...chamber, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="temp" className="text-[12px] font-semibold text-[#0f172a]">
                  Target Temp (°C)
                </Label>
                <Input
                  id="temp"
                  placeholder="e.g. -20°C"
                  value={chamber.temperature || ""}
                  onChange={(e) => setChamber({ ...chamber, temperature: e.target.value ? parseFloat(e.target.value) : 0 })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-[12px] font-semibold text-[#0f172a]">
                  Chamber Category
                </Label>
                <select
                  id="category"
                  value={chamber.category}
                  onChange={(e) => setChamber({ ...chamber, category: e.target.value as "frozen" | "chilled" | "ambient" })}
                  className="w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#2457e6] focus:ring focus:ring-[#2457e6]/50"
                  required
                >
                  <option value="frozen">Frozen</option>
                  <option value="chilled">Chilled</option>
                  <option value="ambient">Ambient</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="num_racks" className="text-[12px] font-semibold text-[#0f172a]">
                  Number of Racks
                </Label>
                <Input
                  id="num_racks"
                  type="number"
                  placeholder="500"
                  value={chamber.num_racks || ""}
                  onChange={(e) => setChamber({ ...chamber, num_racks: e.target.value ? parseInt(e.target.value) : 0 })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slots_per_racks" className="text-[12px] font-semibold text-[#0f172a]">
                  Slots per Rack
                </Label>
                <Input
                  id="slots_per_racks"
                  type="number"
                  placeholder="500"
                  value={chamber.slots_per_rack || ""}
                  onChange={(e) => setChamber({ ...chamber, slots_per_rack: e.target.value ? parseInt(e.target.value) : 0 })}
                  required
                />
              </div>
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
            <Button type="submit" className="bg-[#2457e6] hover:bg-[#1d4ed8] text-white">
              Create Chamber
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
