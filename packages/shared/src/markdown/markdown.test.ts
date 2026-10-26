import { describe, expect, it } from "bun:test";
import { processMarkdown, extractPlainText, calculateReadingTime, TAX_DISCLAIMERS } from "./index";

describe("Markdown Processing Engine", () => {
  it("renders basic markdown elements correctly", async () => {
    const md = `
# Title

This is **bold** and *italic* text.

- Item 1
- Item 2
`;
    const result = await processMarkdown(md);
    expect(result.html).toContain("This is <strong>bold</strong> and <em>italic</em> text.");
    expect(result.html).toContain("<li>Item 1</li>");
    expect(result.html).toContain("<li>Item 2</li>");
  });

  it("transforms container directives into callouts", async () => {
    const md = `
:::note
Remember to close the register at end of day.
:::

:::warning
Do not unplug the thermal printer while printing.
:::
`;
    const result = await processMarkdown(md);
    expect(result.html).toContain('class="callout callout-note"');
    expect(result.html).toContain('class="callout callout-warning"');
    expect(result.html).toContain('role="note"');
    expect(result.html).toContain("Remember to close the register at end of day.");
    expect(result.html).toContain("Do not unplug the thermal printer while printing.");
  });

  it("transforms step directive with title into step card", async () => {
    const md = `
:::step{title="Configure Cash Drawer"}
Connect the RJ12 cable from the cash drawer to the receipt printer DK port.
:::
`;
    const result = await processMarkdown(md);
    expect(result.html).toContain('class="step-card"');
    expect(result.html).toContain("Configure Cash Drawer");
    expect(result.html).toContain("Connect the RJ12 cable");
  });

  it("injects tax disclaimer callout when autoTaxDisclaimer is enabled", async () => {
    const md = `
## Tax Invoices in Sri Lanka

Here is how to configure VAT and SSCL.
`;
    const resultEn = await processMarkdown(md, { autoTaxDisclaimer: true, locale: "en" });
    expect(resultEn.html).toContain('class="callout callout-disclaimer"');
    expect(resultEn.html).toContain(TAX_DISCLAIMERS.en);

    const resultSi = await processMarkdown(md, { autoTaxDisclaimer: true, locale: "si" });
    expect(resultSi.html).toContain(TAX_DISCLAIMERS.si);

    const resultTa = await processMarkdown(md, { autoTaxDisclaimer: true, locale: "ta" });
    expect(resultTa.html).toContain(TAX_DISCLAIMERS.ta);
  });

  it("extracts TOC headings with slug IDs and proper levels", async () => {
    const md = `
# Top Title

## Hardware Requirements
Some text.

### Thermal Printers
Some printer text.

## Network Setup
Some network text.
`;
    const result = await processMarkdown(md);
    expect(result.toc).toEqual([
      { id: "hardware-requirements", text: "Hardware Requirements", level: 2, depth: 2 },
      { id: "thermal-printers", text: "Thermal Printers", level: 3, depth: 3 },
      { id: "network-setup", text: "Network Setup", level: 2, depth: 2 },
    ]);
    expect(result.html).toContain('id="hardware-requirements"');
    expect(result.html).toContain('class="heading-anchor"');
  });

  it("highlights code blocks using Shiki", async () => {
    const md = `
\`\`\`typescript
const rate: number = 0.18;
console.log(rate);
\`\`\`
`;
    const result = await processMarkdown(md);
    expect(result.html).toContain("shiki");
    expect(result.html).toContain("typescript");
    expect(result.html).toContain("console");
  });

  it("sanitizes dangerous XSS payloads", async () => {
    const md = `
<script>alert("xss")</script>
<img src="x" onerror="alert(1)" />
<a href="javascript:alert(1)">Malicious link</a>
`;
    const result = await processMarkdown(md);
    expect(result.html).not.toContain("<script>");
    expect(result.html).not.toContain('alert("xss")');
    expect(result.html).not.toContain("onerror");
    expect(result.html).not.toContain("javascript:alert(1)");
  });

  it("extracts clean plain text and computes reading time", () => {
    const md = `
# Getting Started

:::note
Important setup step.
:::

\`\`\`bash
npm install
\`\`\`

Here is a [link](https://ceybyte.com) and an image ![logo](/logo.png).
`;
    const plain = extractPlainText(md);
    expect(plain).not.toContain("#");
    expect(plain).not.toContain(":::");
    expect(plain).not.toContain("```");
    expect(plain).toContain("Getting Started");
    expect(plain).toContain("Important setup step.");
    expect(plain).toContain("link");
    expect(plain).toContain("logo");

    const readingTime = calculateReadingTime(plain);
    expect(readingTime).toBe(1);
  });

  it("renders video directive with mandatory captions", async () => {
    const md = '::video{src="/media/test.mp4" alt="Demo" captions="/media/test.vtt"}';
    const result = await processMarkdown(md);
    expect(result.html).toContain("<video");
    expect(result.html).toContain('src="/media/test.mp4"');
    expect(result.html).toContain('<track kind="captions" src="/media/test.vtt"');
  });

  it("renders kbd text directive", async () => {
    const md = "Press :kbd[F3] to search";
    const result = await processMarkdown(md);
    expect(result.html).toContain('<kbd class="kbd-key">F3</kbd>');
  });

  it("renders screenshot directive with alt text and figure", async () => {
    const md = '::screenshot{src="/media/screen.png" alt="POS UI" caption="Receipt settings"}';
    const result = await processMarkdown(md);
    expect(result.html).toContain("<figure");
    expect(result.html).toContain('src="/media/screen.png"');
    expect(result.html).toContain('alt="POS UI"');
    expect(result.html).toContain("Receipt settings");
  });
});
