import type {
  ChamberDetail,
  ChamberRequest,
  ChamberSummary,
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
