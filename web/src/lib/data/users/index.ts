export type UserRole = "admin" | "operator" | "client";

export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  clientId?: string;
  clientName?: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

export const USERS_DATA: UserItem[] = [
  {
    id: "usr-001",
    fullName: "Alesia Rahman",
    email: "alesia.r@kyros.com",
    phoneNumber: "+91 98765 43210",
    role: "admin",
    isActive: true,
    lastLogin: "10 mins ago",
    createdAt: "2026-01-15",
  },
  {
    id: "usr-002",
    fullName: "Rajesh Kumar",
    email: "rajesh.k@kyros.com",
    phoneNumber: "+91 98123 45678",
    role: "operator",
    isActive: true,
    lastLogin: "25 mins ago",
    createdAt: "2026-02-01",
  },
  {
    id: "usr-003",
    fullName: "Suresh Sharma",
    email: "suresh.s@kyros.com",
    phoneNumber: "+91 98234 56789",
    role: "operator",
    isActive: true,
    lastLogin: "2 hours ago",
    createdAt: "2026-02-10",
  },
  {
    id: "usr-004",
    fullName: "Vikram Mehta",
    email: "v.mehta@meridianfoods.com",
    phoneNumber: "+91 99887 76655",
    role: "client",
    clientId: "cli-001",
    clientName: "Meridian Foods Pvt Ltd",
    isActive: true,
    lastLogin: "1 hour ago",
    createdAt: "2026-03-05",
  },
  {
    id: "usr-005",
    fullName: "Priya Nair",
    email: "p.nair@freshcorp.in",
    phoneNumber: "+91 97766 55443",
    role: "client",
    clientId: "cli-002",
    clientName: "FreshCorp Logistics",
    isActive: true,
    lastLogin: "Yesterday, 4:15 PM",
    createdAt: "2026-03-12",
  },
  {
    id: "usr-006",
    fullName: "Amitabh Patel",
    email: "a.patel@apexagri.com",
    phoneNumber: "+91 96655 44332",
    role: "client",
    clientId: "cli-003",
    clientName: "Apex Agritech Ltd",
    isActive: true,
    lastLogin: "3 days ago",
    createdAt: "2026-04-01",
  },
  {
    id: "usr-007",
    fullName: "Deepak Verma",
    email: "deepak.v@blueocean.com",
    phoneNumber: "+91 95544 33221",
    role: "client",
    clientId: "cli-004",
    clientName: "BlueOcean Exports",
    isActive: false,
    lastLogin: "2 weeks ago",
    createdAt: "2026-04-18",
  },
  {
    id: "usr-008",
    fullName: "Ananya Deshmukh",
    email: "ananya.d@agrofresh.com",
    phoneNumber: "+91 94433 22110",
    role: "client",
    clientId: "cli-005",
    clientName: "AgroFresh Supplies",
    isActive: true,
    lastLogin: "5 hours ago",
    createdAt: "2026-05-02",
  },
];
