import type {
  ChamberDetail,
  ChamberRequest,
  ChamberSummary,
  RackSummary,
} from "@/types/chamber";
import { apiClient } from "./apiClient";


/** Flat list for tabs/dashboard cards — no racks included */
export async function get_chambers(): Promise<ChamberSummary[]> {
  const { data } = await apiClient.get<ChamberSummary[]>("/warehouses/chambers");
  return data;
}

/** Full chamber tree (racks + slots) for the slot map canvas */
export async function get_chamber_detail(chamber_id: string): Promise<ChamberDetail> {
  const { data } = await apiClient.get<ChamberDetail>(
    `/warehouses/chambers/${chamber_id}/detail`
  );
  return data;
}

/** Atomic create — backend responds with the full tree, ready to render */
export async function create_chamber(payload: ChamberRequest): Promise<ChamberDetail> {
  const { data } = await apiClient.post<ChamberDetail>("/warehouses/chamber", payload);
  return data;
}

/** Appends a rack (with its slots) to an existing chamber.
 *  The backend accepts bays/levels/rack number as query parameters. */
export async function add_rack(
  chamber_id: string,
  payload: {
    bays_per_rack: number;
    levels_per_rack: number;
    rack_number?: string | undefined;
  }
): Promise<RackSummary> {
  const { data } = await apiClient.post<RackSummary>(
    `/warehouses/chambers/${chamber_id}/racks`,
    null,
    {
      params: {
        bays_per_rack: payload.bays_per_rack,
        levels_per_rack: payload.levels_per_rack,
        ...(payload.rack_number ? { rack_number: payload.rack_number } : {}),
      },
    }
  );
  return data;
}

export async function delete_rack(rack_id: string): Promise<void> {
  await apiClient.delete(`/warehouses/racks/${rack_id}`);
}

export async function delete_slot(slot_id: string): Promise<void> {
  await apiClient.delete(`/warehouses/slots/${slot_id}`);
}

export async function delete_chamber(chamber_id: string): Promise<void> {
  await apiClient.delete(`/warehouses/chambers/${chamber_id}`);
}
