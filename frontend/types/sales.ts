export interface SalesProvider {
  id: number;
  name: string;
  address: string;
  website: string;
  phoneNumber: string;
  reviewsCount: number | null;
  reviewsAverage: number | null;
  placeType: string;
  opensAt: string;
  searchCategory: string;
  searchArea: string;
  pincode: string;
  googleMapLink: string;
  sheetCategory: string;
  // CRM
  status: SalesStatus;
  notes: string;
  lastContacted: string | null;
  followUpDate: string | null;
  isWhale: boolean;
}

export type SalesStatus = 'Lead' | 'Contacted' | 'Demo Booked' | 'Converted' | 'Not Interested';

export interface SalesStats {
  totalProviders: number;
  totalAreas: number;
  converted: number;
  demosBooked: number;
  whales: number;
  contacted: number;
  leads: number;
  notInterested: number;
}

export interface SalesFilters {
  categories: string[];
  areas: string[];
  pincodes: string[];
}

export interface SalesTask {
  providerId: number;
  providerName: string;
  address: string;
  status: string;
  followUpDate: string;
}

export interface CrmUpdateRequest {
  status?: string;
  notes?: string;
  lastContacted?: string;
  followUpDate?: string;
  isWhale?: boolean;
}
