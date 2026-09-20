export type ChamberCategory = "frozen" | "chilled" | "ambient";
export type ChamberStatus = "active" | "maintenance" | "inactive";
export type RackStatus = "active" | "full" | "maintenance" | "inactive";
export type SlotStatus = "available" | "reserved" | "occupied" | "maintenance";


export interface ChamberRequest {
  name: string;
  code: string;
  category: ChamberCategory;
  temperature: number;
  num_racks: number;
  bays_per_rack: number;
  levels_per_rack: number;
}

export interface ChamberSummary {
  id: string;
  name: string;
  code: string;
  category: ChamberCategory;
  temperature: number;
  status: ChamberStatus;
  total_racks: number;
  total_slots: number;
  total_capacity: number;
  used_capacity: number;
  created_at: string;
  updated_at: string;
}


export interface ChamberDetail extends ChamberSummary {
  racks: RackDetail[];
}
export interface RackSummary {
  id: string;
  chamber_id: string;
  rack_number: string;
  full_code: string;
  slot_count: number;
  occupied_count: number;
  status: RackStatus;
  created_at: string;
  updated_at: string;
}

export interface RackDetail extends RackSummary {
  slots: SlotResponse[];
}

export interface SlotResponse {
  id: string;
  rack_id: string;
  bay: number;
  level: number;
  depth: number;
  location_code: string;
  status: SlotStatus;
  allocated_client_id: string | null;
  created_at: string;
  updated_at: string;
}

