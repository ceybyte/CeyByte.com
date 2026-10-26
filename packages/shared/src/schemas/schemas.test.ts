import { describe, expect, it } from "bun:test";
import { DownloadGateSchema, Step1ShopSchema, Step2LocationSchema } from "./download-gate";
import { Manifest } from "./manifest";
import {
  FeedbackSubmitSchema,
  FeedbackQuerySchema,
  FeedbackVoteSchema,
  FeedbackAdminUpdateSchema,
  formatTicketNumber,
  parseTicketNumber,
} from "./feedback";
import {
  DonationCreateSchema,
  DonationSubmitSchema,
  DonationPaymentOptionsSchema,
} from "./donations";

describe("Shared Schemas", () => {
  describe("Manifest Schema", () => {
    it("validates valid GitHub release latest.json", () => {
      const valid = {
        version: "1.3.0",
        release_date: "2026-09-27",
        download_url:
          "https://github.com/ceybyte/cbpos-releases/releases/download/v1.3.0/CBPOSSetup-1.3.0.exe",
        changelog: "Fixes shift report printer issue",
        min_version: "Windows 10 or later",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        size: 52428800,
        published_at: "2026-09-27T10:00:00Z",
      };

      const result = Manifest.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid download URLs or missing sha256", () => {
      const invalidUrl = {
        version: "1.3.0",
        release_date: "2026-09-27",
        download_url: "https://example.com/CBPOSSetup-1.3.0.exe",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      };
      expect(Manifest.safeParse(invalidUrl).success).toBe(false);

      const invalidSha = {
        version: "1.3.0",
        release_date: "2026-09-27",
        download_url:
          "https://github.com/ceybyte/cbpos-releases/releases/download/v1.3.0/CBPOSSetup-1.3.0.exe",
        sha256: "short-sha",
      };
      expect(Manifest.safeParse(invalidSha).success).toBe(false);
    });
  });

  describe("DownloadGate Schema", () => {
    const validStep1 = {
      fullName: "Kamal Perera",
      shopName: "Perera Grocery",
      category: "grocery" as const,
      phone: "077 123 4567",
      whatsapp: "077 123 4567",
    };

    const validStep2 = {
      district: "colombo" as const,
      city: "Colombo",
      lat: 6.9271,
      lng: 79.8612,
      locationSource: "pin" as const,
      isPublicOnMap: false,
      termsAccepted: true as const,
      termsVersion: "2026-10-01",
      preferredLocale: "en" as const,
    };

    it("validates and normalises Step 1 data", () => {
      const parsed = Step1ShopSchema.safeParse(validStep1);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.phone).toBe("+94771234567");
        expect(parsed.data.whatsapp).toBe("+94771234567");
      }
    });

    it("accepts landline for phone but rejects landline for whatsapp", () => {
      const landline = {
        ...validStep1,
        phone: "011 234 5678",
        whatsapp: "011 234 5678",
      };
      const parsed = Step1ShopSchema.safeParse(landline);
      expect(parsed.success).toBe(false);

      const landlinePhoneOnly = {
        ...validStep1,
        phone: "011 234 5678",
        whatsapp: "",
      };
      const validParsed = Step1ShopSchema.safeParse(landlinePhoneOnly);
      expect(validParsed.success).toBe(true);
      if (validParsed.success) {
        expect(validParsed.data.phone).toBe("+94112345678");
        expect(validParsed.data.whatsapp).toBeNull();
      }
    });

    it("validates Step 2 and rejects coordinates outside Sri Lanka bounds", () => {
      expect(Step2LocationSchema.safeParse(validStep2).success).toBe(true);

      const outOfBounds = {
        ...validStep2,
        lat: 12.5, // outside Sri Lanka
      };
      expect(Step2LocationSchema.safeParse(outOfBounds).success).toBe(false);

      const termsNotAccepted = {
        ...validStep2,
        termsAccepted: false,
      };
      expect(Step2LocationSchema.safeParse(termsNotAccepted).success).toBe(false);
    });

    it("validates full DownloadGate submission", () => {
      const full = { ...validStep1, ...validStep2 };
      const parsed = DownloadGateSchema.safeParse(full);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.phone).toBe("+94771234567");
        expect(parsed.data.isPublicOnMap).toBe(false);
      }
    });
  });

  describe("Feedback Tracker Schemas & Utilities", () => {
    it("formats and parses ticket numbers", () => {
      expect(formatTicketNumber(1)).toBe("CB-0001");
      expect(formatTicketNumber(142)).toBe("CB-0142");
      expect(formatTicketNumber(10050)).toBe("CB-10050");

      expect(parseTicketNumber("CB-0001")).toBe(1);
      expect(parseTicketNumber("CB-0142")).toBe(142);
      expect(parseTicketNumber("cb-0142")).toBe(142);
      expect(parseTicketNumber("142")).toBe(142);
      expect(parseTicketNumber("invalid")).toBeNull();
      expect(parseTicketNumber("CB-xyz")).toBeNull();
    });

    it("validates FeedbackSubmitSchema", () => {
      const valid = {
        type: "bug",
        title: "Printer cuts off thermal receipt",
        bodyMd: "When printing long receipts, the last line is truncated unexpectedly.",
        appVersion: "1.4.2",
        windowsVersion: "Windows 11",
        severity: "wrong_output",
        contactPrivate: "test@example.com",
        turnstileToken: "token-abc",
      };

      const parsed = FeedbackSubmitSchema.safeParse(valid);
      expect(parsed.success).toBe(true);

      // Title too short (< 8 chars)
      expect(
        FeedbackSubmitSchema.safeParse({
          ...valid,
          title: "Short",
        }).success,
      ).toBe(false);

      // Body too short (< 20 chars)
      expect(
        FeedbackSubmitSchema.safeParse({
          ...valid,
          bodyMd: "Too short",
        }).success,
      ).toBe(false);

      // Invalid severity
      expect(
        FeedbackSubmitSchema.safeParse({
          ...valid,
          severity: "not-a-severity",
        }).success,
      ).toBe(false);
    });

    it("validates FeedbackQuerySchema with defaults", () => {
      const parsed = FeedbackQuerySchema.safeParse({});
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.sort).toBe("votes");
        expect(parsed.data.page).toBe(1);
        expect(parsed.data.pageSize).toBe(20);
      }

      const custom = FeedbackQuerySchema.safeParse({
        type: "bug",
        status: "open",
        sort: "newest",
        page: "2",
        pageSize: "15",
      });
      expect(custom.success).toBe(true);
      if (custom.success) {
        expect(custom.data.type).toBe("bug");
        expect(custom.data.status).toBe("open");
        expect(custom.data.sort).toBe("newest");
        expect(custom.data.page).toBe(2);
        expect(custom.data.pageSize).toBe(15);
      }
    });

    it("validates FeedbackVoteSchema", () => {
      expect(FeedbackVoteSchema.safeParse({ turnstileToken: "abc" }).success).toBe(true);
      expect(FeedbackVoteSchema.safeParse({}).success).toBe(true);
      expect(FeedbackVoteSchema.safeParse({ turnstileToken: 123 as unknown as string }).success).toBe(false);
    });

    it("validates FeedbackAdminUpdateSchema", () => {
      const valid = {
        status: "planned",
        severity: "blocks_billing",
        adminResponseMd: "We have prioritized this for v1.5.0.",
        resolvedInReleaseId: "rel-123",
        approveScreenshot: true,
      };
      expect(FeedbackAdminUpdateSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe("Donation Schemas", () => {
    it("validates DonationCreateSchema", () => {
      const valid = {
        amountCents: 10000,
        displayName: "Saman Kumara",
        isAnonymous: false,
        publicMessage: "Keep up the great work!",
        showAmountPublicly: true,
        contactPrivate: "saman@example.com",
        linkMerchantPhone: "077 123 4567",
        turnstileToken: "tok_123",
      };
      const res = DonationCreateSchema.safeParse(valid);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.linkMerchantPhone).toBe("+94771234567");
      }

      // Rejects below Rs. 100 (10000 cents)
      expect(DonationCreateSchema.safeParse({ ...valid, amountCents: 9999 }).success).toBe(false);

      // Rejects missing turnstile token
      expect(DonationCreateSchema.safeParse({ ...valid, turnstileToken: "" }).success).toBe(false);

      // Rejects message > 140 chars
      expect(DonationCreateSchema.safeParse({ ...valid, publicMessage: "a".repeat(141) }).success).toBe(false);
    });

    it("validates DonationSubmitSchema", () => {
      expect(DonationSubmitSchema.safeParse({ slipKey: "donations/slip-1.png", txnReference: "TXN12345" }).success).toBe(true);
      expect(DonationSubmitSchema.safeParse({ slipKey: "" }).success).toBe(false);
    });

    it("validates DonationPaymentOptionsSchema", () => {
      const validOptions = [
        {
          id: "bank-1",
          accountName: "CeyByte Foundation",
          accountNumber: "100012345678",
          bankName: "Commercial Bank",
          branchName: "Kollupitiya",
          qrImageKey: "qr/combank.png",
          isEnabled: true,
          notes: "Primary account",
        },
      ];
      expect(DonationPaymentOptionsSchema.safeParse(validOptions).success).toBe(true);
      expect(DonationPaymentOptionsSchema.safeParse([{ id: "bank-1" }]).success).toBe(false);
    });
  });
});
