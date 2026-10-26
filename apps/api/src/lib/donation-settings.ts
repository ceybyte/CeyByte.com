import type { DonationPaymentOptions } from "@cbpos/shared";

export function getDefaultDonationPaymentOptions(env: Record<string, unknown> | Env): DonationPaymentOptions {
  const e = env as Record<string, unknown>;
  return [
    {
      id: "default",
      accountName: (e.DONATION_ACCOUNT_NAME as string) || "CeyByte Foundation",
      accountNumber: (e.DONATION_ACCOUNT_NUMBER as string) || "100012345678",
      bankName: (e.DONATION_BANK_NAME as string) || "Commercial Bank of Ceylon",
      branchName: (e.DONATION_BANK_BRANCH as string) || "Kollupitiya",
      qrImageKey: null,
      isEnabled: true,
      notes: null,
    },
  ];
}

export async function getDonationPaymentOptions(
  kv: KVNamespace,
  env: Record<string, unknown> | Env,
): Promise<DonationPaymentOptions> {
  const cached = await kv.get<DonationPaymentOptions>("settings:donation_payment_options", "json");
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  return getDefaultDonationPaymentOptions(env);
}
