export interface ClientItem {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  gstin?: string;
  isActive: boolean;
  allocatedCapacity: string;
  usedCapacity: string;
  activeOrders: number;
  createdAt: string;
}

export const CLIENTS_DATA: ClientItem[] = [
  {
    id: "cli-001",
    name: "Meridian Foods Pvt Ltd",
    email: "info@meridianfoods.com",
    phoneNumber: "+91 22 4912 3400",
    address: "Plot 42, GIDC Industrial Estate, Sector 3",
    city: "Navi Mumbai",
    state: "Maharashtra",
    pinCode: "400705",
    gstin: "27AAACM1234F1Z5",
    isActive: true,
    allocatedCapacity: "500 MT",
    usedCapacity: "410 MT",
    activeOrders: 4,
    createdAt: "2026-01-20",
  },
  {
    id: "cli-002",
    name: "FreshCorp Logistics",
    email: "contact@freshcorp.in",
    phoneNumber: "+91 80 2839 1100",
    address: "Building B, Cold Logistics Hub, Peenya",
    city: "Bengaluru",
    state: "Karnataka",
    pinCode: "560058",
    gstin: "29ABCCF9876E1Z2",
    isActive: true,
    allocatedCapacity: "450 MT",
    usedCapacity: "288 MT",
    activeOrders: 3,
    createdAt: "2026-02-05",
  },
  {
    id: "cli-003",
    name: "Apex Agritech Ltd",
    email: "support@apexagri.com",
    phoneNumber: "+91 11 2618 5500",
    address: "78 Cold Chain Avenue, Okhla Phase III",
    city: "New Delhi",
    state: "Delhi",
    pinCode: "110020",
    gstin: "07AAAAA5555B1Z9",
    isActive: true,
    allocatedCapacity: "300 MT",
    usedCapacity: "273 MT",
    activeOrders: 2,
    createdAt: "2026-02-18",
  },
  {
    id: "cli-004",
    name: "BlueOcean Exports",
    email: "logistics@blueocean.com",
    phoneNumber: "+91 44 2815 9900",
    address: "Port Road Industrial Complex, Guindy",
    city: "Chennai",
    state: "Tamil Nadu",
    pinCode: "600032",
    gstin: "33AAACB4321A1Z8",
    isActive: true,
    allocatedCapacity: "400 MT",
    usedCapacity: "192 MT",
    activeOrders: 2,
    createdAt: "2026-03-01",
  },
  {
    id: "cli-005",
    name: "AgroFresh Supplies",
    email: "orders@agrofresh.com",
    phoneNumber: "+91 79 4001 8822",
    address: "Block C, Agro Park, Changodar",
    city: "Ahmedabad",
    state: "Gujarat",
    pinCode: "382213",
    gstin: "24AAAAA1111A1Z3",
    isActive: true,
    allocatedCapacity: "350 MT",
    usedCapacity: "252 MT",
    activeOrders: 1,
    createdAt: "2026-03-15",
  },
  {
    id: "cli-006",
    name: "FrostBite Processors",
    email: "admin@frostbite.in",
    phoneNumber: "+91 172 2654 321",
    address: "Phase 8B, Industrial Focal Point",
    city: "Mohali",
    state: "Punjab",
    pinCode: "160071",
    gstin: "03AAACF6655D1Z7",
    isActive: false,
    allocatedCapacity: "200 MT",
    usedCapacity: "0 MT",
    activeOrders: 0,
    createdAt: "2026-04-10",
  },
];
