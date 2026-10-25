/* eslint-disable no-restricted-syntax */

export interface PopupData {
  id: string;
  shopName: string;
  category: string;
  district: string;
  city: string;
  isSupporter: boolean;
  since: string;
  lat: number;
  lng: number;
}

export interface PopupLabels {
  since: string | ((monthYear: string) => string);
  supporter: string;
  directions: string;
  report: string;
}

/**
 * Generates semantic, styled HTML for MapLibre map popups (DESIGN §8.9, S03).
 * Rendered natively inside MapLibre GL JS Popup container.
 */
export function formatPopupHtml(data: PopupData, labels: PopupLabels): string {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`;
  const reportUrl = `https://wa.me/94770000000?text=${encodeURIComponent(
    `Report listing: ${data.shopName} (${data.id}) in ${data.city}`,
  )}`;

  const supporterBadge = data.isSupporter
    ? `<div style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:9999px;background-color:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.3);color:#FFD700;font-size:11px;font-weight:600;margin-top:6px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        ${escapeHtml(labels.supporter)}
       </div>`
    : "";

  const sinceText =
    typeof labels.since === "function"
      ? labels.since(data.since)
      : typeof labels.since === "string"
        ? labels.since.replace("{monthYear}", data.since)
        : data.since;

  return `
    <div style="background-color:#18181B;border:1px solid #2E2E32;border-radius:6px;padding:14px;width:240px;color:#FAFAFA;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">
      <div style="font-size:14px;font-weight:600;color:#FFFFFF;line-height:1.2;margin-bottom:4px;word-break:break-word;">
        ${escapeHtml(data.shopName)}
      </div>
      <div style="font-size:12px;color:#A1A1AA;margin-bottom:6px;">
        ${escapeHtml(data.category)} &middot; ${escapeHtml(data.city)}
      </div>
      <div style="font-size:11px;font-family:monospace;color:#71717A;margin-bottom:6px;">
        ${escapeHtml(sinceText)}
      </div>
      ${supporterBadge}
      <div style="border-top:1px solid #27272A;margin-top:10px;padding-top:10px;display:flex;flex-direction:column;gap:6px;">
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="color:#0393DD;font-size:12px;font-weight:500;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
          ${escapeHtml(labels.directions)} &rarr;
        </a>
        <a href="${reportUrl}" target="_blank" rel="noopener noreferrer" style="color:#71717A;font-size:11px;text-decoration:none;">
          ${escapeHtml(labels.report)}
        </a>
      </div>
    </div>
  `.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
