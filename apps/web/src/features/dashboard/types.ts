export interface MerchantListing {
  id: string;
  publicId: string;
  shopName: string;
  category: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  locationSource: string;
  isPublicOnMap: boolean;
  status: "listed" | "hidden" | "rejected";
  isSupporter: boolean;
  supporterSince: number | null;
  phone: string;
  whatsapp: string | null;
  telegram: string | null;
  fullName: string;
  createdAt: number;
  updatedAt: number;
}

export interface LatestRelease {
  version: string;
  channel?: string;
  publishedAt?: string;
  notes?: string;
}

export interface DashboardTicket {
  id: string;
  publicNumber: number;
  type: string;
  title: string;
  status: string;
  adminResponseMd: string | null;
  adminRespondedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardDonation {
  id: string;
  referenceCode: string;
  amountCents: number;
  method: string;
  status: string;
  rejectionReason: string | null;
  createdAt: number;
}
