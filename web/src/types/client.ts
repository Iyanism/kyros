export interface ClientCreate {
  name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  pin_code: number;
  gstin?: string | null;
}

export interface ClientResponse {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  pin_code: number;
  gstin: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientUpdate {
  name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: number;
  gstin?: string | null;
}