export interface SlotItem {
  code: string;
  locationAddress: string;
  status: "filled" | "partial" | "empty";
  weight: string;
  client: string;
  item: string;
  batchNumber?: string;
  rackId?: string;
  chamberCode?: string;
  allocatedDate?: string;
}

export interface RackStructureData {
  id: string;
  name: string;
  slots: SlotItem[];
}

export interface ChamberData {
  id: string;
  code: string;
  name: string;
  temp: string;
  tempRange: string;
  type: "Frozen" | "Chilled" | "Ambient";
  totalCapacity: number;
  usedCapacity: number;
  status: "Optimal" | "Near Capacity" | "Critical" | "Available";
  racks: RackStructureData[];
}

export const CHAMBERS_DATA: ChamberData[] = [
  {
    id: "ch-a",
    code: "CH-A",
    name: "Deep Frozen Storage",
    temp: "-25°C",
    tempRange: "-22°C to -28°C",
    type: "Frozen",
    totalCapacity: 500,
    usedCapacity: 410,
    status: "Near Capacity",
    racks: [
      {
        id: "R-01",
        name: "Rack A1 · Heavy Duty Bay",
        slots: [
          { code: "SL-01", locationAddress: "WH-01 / CH-A / RK-01 / SL-01", status: "filled", weight: "1.0 MT", client: "Meridian Foods", item: "Frozen Shrimp Batch B82", batchNumber: "B-8821", allocatedDate: "2026-08-10" },
          { code: "SL-02", locationAddress: "WH-01 / CH-A / RK-01 / SL-02", status: "filled", weight: "1.0 MT", client: "Meridian Foods", item: "Frozen Shrimp Batch B82", batchNumber: "B-8821", allocatedDate: "2026-08-10" },
          { code: "SL-03", locationAddress: "WH-01 / CH-A / RK-01 / SL-03", status: "partial", weight: "0.6 MT", client: "Apex Agritech", item: "Cold Butter Blocks", batchNumber: "B-9102", allocatedDate: "2026-08-14" },
          { code: "SL-04", locationAddress: "WH-01 / CH-A / RK-01 / SL-04", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
          { code: "SL-05", locationAddress: "WH-01 / CH-A / RK-01 / SL-05", status: "filled", weight: "1.0 MT", client: "BlueOcean Exports", item: "Frozen Tuna Crates", batchNumber: "B-7741", allocatedDate: "2026-08-18" },
          { code: "SL-06", locationAddress: "WH-01 / CH-A / RK-01 / SL-06", status: "filled", weight: "1.0 MT", client: "BlueOcean Exports", item: "Frozen Tuna Crates", batchNumber: "B-7741", allocatedDate: "2026-08-18" },
        ],
      },
      {
        id: "R-02",
        name: "Rack A2 · Pallet Flow Racking",
        slots: [
          { code: "SL-07", locationAddress: "WH-01 / CH-A / RK-02 / SL-07", status: "filled", weight: "1.0 MT", client: "Meridian Foods", item: "Ice Cream Tub Pallets", batchNumber: "B-6632", allocatedDate: "2026-08-12" },
          { code: "SL-08", locationAddress: "WH-01 / CH-A / RK-02 / SL-08", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
          { code: "SL-09", locationAddress: "WH-01 / CH-A / RK-02 / SL-09", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
          { code: "SL-10", locationAddress: "WH-01 / CH-A / RK-02 / SL-10", status: "partial", weight: "0.4 MT", client: "FreshCorp Logistics", item: "Frozen Berries Pack", batchNumber: "B-5510", allocatedDate: "2026-08-20" },
          { code: "SL-11", locationAddress: "WH-01 / CH-A / RK-02 / SL-11", status: "filled", weight: "1.0 MT", client: "Meridian Foods", item: "Frozen Poultry", batchNumber: "B-4419", allocatedDate: "2026-08-08" },
          { code: "SL-12", locationAddress: "WH-01 / CH-A / RK-02 / SL-12", status: "filled", weight: "1.0 MT", client: "Meridian Foods", item: "Frozen Poultry", batchNumber: "B-4419", allocatedDate: "2026-08-08" },
        ],
      },
    ],
  },
  {
    id: "ch-b",
    code: "CH-B",
    name: "Chilled Dairy & Produce",
    temp: "+4°C",
    tempRange: "+2°C to +6°C",
    type: "Chilled",
    totalCapacity: 450,
    usedCapacity: 288,
    status: "Optimal",
    racks: [
      {
        id: "R-01",
        name: "Rack B1 · Cold Produce Shelf",
        slots: [
          { code: "SL-01", locationAddress: "WH-01 / CH-B / RK-01 / SL-01", status: "filled", weight: "1.0 MT", client: "FreshCorp Logistics", item: "Fresh Milk Drums", batchNumber: "B-3310", allocatedDate: "2026-08-21" },
          { code: "SL-02", locationAddress: "WH-01 / CH-B / RK-01 / SL-02", status: "partial", weight: "0.5 MT", client: "FreshCorp Logistics", item: "Cheddar Cheese Pallets", batchNumber: "B-3311", allocatedDate: "2026-08-21" },
          { code: "SL-03", locationAddress: "WH-01 / CH-B / RK-01 / SL-03", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
          { code: "SL-04", locationAddress: "WH-01 / CH-B / RK-01 / SL-04", status: "filled", weight: "1.0 MT", client: "AgroFresh Supplies", item: "Apples Cold Stock", batchNumber: "B-2201", allocatedDate: "2026-08-19" },
        ],
      },
      {
        id: "R-02",
        name: "Rack B2 · Dairy Crates Rack",
        slots: [
          { code: "SL-05", locationAddress: "WH-01 / CH-B / RK-02 / SL-05", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
          { code: "SL-06", locationAddress: "WH-01 / CH-B / RK-02 / SL-06", status: "filled", weight: "1.0 MT", client: "AgroFresh Supplies", item: "Citrus Fruits", batchNumber: "B-2204", allocatedDate: "2026-08-19" },
          { code: "SL-07", locationAddress: "WH-01 / CH-B / RK-02 / SL-07", status: "filled", weight: "1.0 MT", client: "Meridian Foods", item: "Yogurt Crates", batchNumber: "B-1190", allocatedDate: "2026-08-22" },
          { code: "SL-08", locationAddress: "WH-01 / CH-B / RK-02 / SL-08", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
        ],
      },
    ],
  },
  {
    id: "ch-c",
    code: "CH-C",
    name: "Frozen Meat Vault",
    temp: "-18°C",
    tempRange: "-16°C to -20°C",
    type: "Frozen",
    totalCapacity: 400,
    usedCapacity: 192,
    status: "Available",
    racks: [
      {
        id: "R-01",
        name: "Rack C1 · Meat Carcass & Cut Storage",
        slots: [
          { code: "SL-01", locationAddress: "WH-01 / CH-C / RK-01 / SL-01", status: "filled", weight: "1.0 MT", client: "Meridian Foods", item: "Frozen Mutton Carcasses", batchNumber: "B-9901", allocatedDate: "2026-08-15" },
          { code: "SL-02", locationAddress: "WH-01 / CH-C / RK-01 / SL-02", status: "filled", weight: "1.0 MT", client: "Meridian Foods", item: "Frozen Mutton Carcasses", batchNumber: "B-9901", allocatedDate: "2026-08-15" },
          { code: "SL-03", locationAddress: "WH-01 / CH-C / RK-01 / SL-03", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
          { code: "SL-04", locationAddress: "WH-01 / CH-C / RK-01 / SL-04", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
        ],
      },
    ],
  },
  {
    id: "ch-d",
    code: "CH-D",
    name: "Pharma Controlled Ambient",
    temp: "+15°C",
    tempRange: "+14°C to +18°C",
    type: "Ambient",
    totalCapacity: 300,
    usedCapacity: 273,
    status: "Critical",
    racks: [
      {
        id: "R-01",
        name: "Rack D1 · Medical Supplies Zone",
        slots: [
          { code: "SL-01", locationAddress: "WH-01 / CH-D / RK-01 / SL-01", status: "filled", weight: "1.0 MT", client: "Apex Agritech", item: "Vaccine Storage Vials", batchNumber: "B-8812", allocatedDate: "2026-08-17" },
          { code: "SL-02", locationAddress: "WH-01 / CH-D / RK-01 / SL-02", status: "filled", weight: "1.0 MT", client: "Apex Agritech", item: "Insulin Boxes", batchNumber: "B-8814", allocatedDate: "2026-08-17" },
          { code: "SL-03", locationAddress: "WH-01 / CH-D / RK-01 / SL-03", status: "partial", weight: "0.8 MT", client: "Apex Agritech", item: "Medical Reagents", batchNumber: "B-8819", allocatedDate: "2026-08-23" },
          { code: "SL-04", locationAddress: "WH-01 / CH-D / RK-01 / SL-04", status: "filled", weight: "1.0 MT", client: "Apex Agritech", item: "Oral Suspensions", batchNumber: "B-8820", allocatedDate: "2026-08-23" },
        ],
      },
    ],
  },
  {
    id: "ch-e",
    code: "CH-E",
    name: "Blast Freezer Room",
    temp: "-30°C",
    tempRange: "-28°C to -34°C",
    type: "Frozen",
    totalCapacity: 200,
    usedCapacity: 70,
    status: "Available",
    racks: [
      {
        id: "R-01",
        name: "Rack E1 · Rapid Freeze Pallet Station",
        slots: [
          { code: "SL-01", locationAddress: "WH-01 / CH-E / RK-01 / SL-01", status: "filled", weight: "1.0 MT", client: "BlueOcean Exports", item: "Shrimp Quick Freeze", batchNumber: "B-7001", allocatedDate: "2026-08-24" },
          { code: "SL-02", locationAddress: "WH-01 / CH-E / RK-01 / SL-02", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
          { code: "SL-03", locationAddress: "WH-01 / CH-E / RK-01 / SL-03", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
          { code: "SL-04", locationAddress: "WH-01 / CH-E / RK-01 / SL-04", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
        ],
      },
    ],
  },
  {
    id: "ch-f",
    code: "CH-F",
    name: "Produce Chilled Zone",
    temp: "+2°C",
    tempRange: "+1°C to +4°C",
    type: "Chilled",
    totalCapacity: 350,
    usedCapacity: 252,
    status: "Optimal",
    racks: [
      {
        id: "R-01",
        name: "Rack F1 · Exotic Fruits & Veg Shelf",
        slots: [
          { code: "SL-01", locationAddress: "WH-01 / CH-F / RK-01 / SL-01", status: "filled", weight: "1.0 MT", client: "AgroFresh Supplies", item: "Avocado Crates", batchNumber: "B-6101", allocatedDate: "2026-08-22" },
          { code: "SL-02", locationAddress: "WH-01 / CH-F / RK-01 / SL-02", status: "partial", weight: "0.7 MT", client: "AgroFresh Supplies", item: "Berry Cartons", batchNumber: "B-6105", allocatedDate: "2026-08-23" },
          { code: "SL-03", locationAddress: "WH-01 / CH-F / RK-01 / SL-03", status: "empty", weight: "0.0 MT", client: "Unallocated", item: "Empty Position", batchNumber: "N/A" },
          { code: "SL-04", locationAddress: "WH-01 / CH-F / RK-01 / SL-04", status: "filled", weight: "1.0 MT", client: "FreshCorp Logistics", item: "Exotic Mushroom Trays", batchNumber: "B-5091", allocatedDate: "2026-08-20" },
        ],
      },
    ],
  },
];
