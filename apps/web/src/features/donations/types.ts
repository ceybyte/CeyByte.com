export interface DonationPaymentOption {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  qrImageKey?: string | null;
  isEnabled: boolean;
  notes?: string | null;
}

export interface PublicSupporter {
  id: string;
  displayName: string;
  month: string;
  isMerchantSupporter: boolean;
  amountCents: number | null;
  publicMessage: string | null;
}

export interface DonationSummary {
  monthlyTotalCents: number;
  totalSupportersCount: number;
  supporters: PublicSupporter[];
  paymentOptions: DonationPaymentOption[];
}

export interface DonationCreateInput {
  amountCents: number;
  displayName?: string | null;
  isAnonymous?: boolean;
  publicMessage?: string | null;
  showAmountPublicly?: boolean;
  contactPrivate?: string | null;
  linkMerchantPhone?: string | null;
  turnstileToken: string;
}

export interface DonationCreateResult {
  id: string;
  referenceCode: string;
  amountCents: number;
  status: string;
  paymentOptions: DonationPaymentOption[];
}

export interface DonationSubmitInput {
  slipKey: string;
  txnReference?: string | null;
}

export interface DonationStatusResult {
  id: string;
  referenceCode: string;
  amountCents: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  displayName?: string | null;
  createdAt: number;
  paymentOptions: DonationPaymentOption[];
}
