export interface PublicFeedbackTicket {
  id: string;
  publicNumber: number;
  formattedNumber: string;
  type: "bug" | "feature";
  title: string;
  bodyMd: string;
  appVersion?: string | null;
  windowsVersion?: string | null;
  severity?: "crash" | "blocks_billing" | "wrong_output" | "cosmetic" | null;
  status: "open" | "triaged" | "planned" | "in_progress" | "shipped" | "closed" | "duplicate" | "wont_fix";
  voteCount: number;
  hasVoted?: boolean;
  screenshotPublicKey?: string | null;
  duplicateOfId?: string | null;
  resolvedInReleaseId?: string | null;
  releaseVersion?: string | null;
  adminResponseMd?: string | null;
  adminRespondedAt?: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface FeedbackListResponse {
  items: PublicFeedbackTicket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SimilarTicket {
  id: string;
  publicNumber: number;
  formattedNumber: string;
  title: string;
  status: string;
  voteCount: number;
}
