import React from "react";

export interface ShortcutItem {
  key: string;
  action: string;
  detail: string;
}

export interface ShortcutGroup {
  category: string;
  items: ShortcutItem[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "Item Search & Quantities",
    items: [
      { key: "F3", action: "Item Search", detail: "Lookup products by name, code, or SKU [B1]" },
      { key: "+ / -", action: "Quantity", detail: "Increase or decrease selected line quantity [B1]" },
      { key: "*", action: "Multiplier", detail: "Type number then * to set exact item quantity [B1]" },
      { key: "Delete", action: "Remove Line", detail: "Delete currently selected product from cart [B1]" },
      { key: "Esc", action: "Cancel / Clear", detail: "Clear active search or dismiss open dialog [B1]" },
    ],
  },
  {
    category: "Payment & Tendering",
    items: [
      { key: "F12", action: "Quick Cash", detail: "Complete transaction immediately with exact cash [B1]" },
      { key: "F5", action: "Cash Tender", detail: "Open tender dialog, enter cash received, show change [B1]" },
      { key: "F10", action: "Split Payment", detail: "Pay across multiple methods (Cash, Card, Credit) [B1]" },
    ],
  },
  {
    category: "Cart Management",
    items: [
      { key: "F6", action: "Hold Bill", detail: "Park current customer cart and start a fresh bill [B1]" },
      { key: "F7", action: "Recall Bill", detail: "Restore previously parked customer carts [B1]" },
    ],
  },
  {
    category: "Customer & Discounts",
    items: [
      { key: "F8", action: "Customer Lookup", detail: "Find customer by mobile number for loyalty [B2]" },
      { key: "F2", action: "Discount / Price", detail: "Edit item price or apply special line discount [B1]" },
    ],
  },
];

export function ShortcutsTable() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:grid-cols-2 print:gap-4">
      {SHORTCUT_GROUPS.map((group) => (
        <div
          key={group.category}
          className="rounded-lg border border-hairline bg-surface p-4 print:border-black print:bg-white print:p-3"
        >
          <h3 className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-azure print:text-black">
            {group.category}
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-hairline text-text-muted print:border-black print:text-black">
                <th className="pb-2 font-mono font-medium">Key</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium text-right">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline print:divide-black">
              {group.items.map((item) => (
                <tr key={item.key} className="text-text-primary print:text-black">
                  <td className="py-2.5 font-mono print:py-1.5">
                    <kbd className="inline-block rounded border border-hairline bg-surface-elevated px-2 py-0.5 font-mono text-[11px] font-semibold text-text-primary shadow-xs print:border-black print:bg-gray-100 print:text-black">
                      {item.key}
                    </kbd>
                  </td>
                  <td className="py-2.5 font-medium print:py-1.5">{item.action}</td>
                  <td className="py-2.5 text-right text-text-muted print:py-1.5 print:text-gray-700">
                    {item.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
