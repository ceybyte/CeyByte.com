import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface ClaimViolation {
  rule: string;
  matched: string;
  message: string;
  file?: string;
  key?: string;
}

interface BannedRule {
  rule: string;
  regex: RegExp;
  message: string;
}

export const BANNED_RULES: BannedRule[] = [
  // Banned product claims (CLAUDE.md §8.1)
  {
    rule: "100% offline",
    regex: /100%\s+offline/i,
    message: "CB POS checks GitHub for updates on launch [A7], so claiming 100% offline is inaccurate.",
  },
  {
    rule: "Cloud sync",
    regex: /\bcloud\s+sync\b/i,
    message: "CB POS does not support cloud sync [H].",
  },
  {
    rule: "Cloud backup",
    regex: /\bcloud\s+backup\b/i,
    message: "CB POS does not provide automated cloud backups [G1].",
  },
  {
    rule: "IRD compliant / certified",
    regex: /\bIRD\s+(compliant|certified|approved|mandate|guarantee)\b/i,
    message: "CB POS is not certified or endorsed by the IRD [C5].",
  },
  {
    rule: "2026 mandate",
    regex: /\b2026\s+mandate\b/i,
    message: "CB POS cannot claim 2026 tax mandate compliance [C5].",
  },
  {
    rule: "Email receipts",
    regex: /\bemail\s+receipts?\b/i,
    message: "Email receipts are not a supported feature [A8].",
  },
  {
    rule: "Batch/expiry tracking",
    regex: /\b(expiry|batch|serial)\s+tracking\b/i,
    message: "Expiry, batch, and serial tracking are not supported [D4].",
  },
  {
    rule: "Live scale connection",
    regex: /\blive\s+scale\s+connection\b/i,
    message: "Live scale hardware connections are not supported [E3].",
  },
  {
    rule: "Customer display",
    regex: /\bcustomer\s+display\b/i,
    message: "Customer secondary displays are not supported [E4].",
  },
  {
    rule: "SMS/WhatsApp receipts",
    regex: /\b(SMS|WhatsApp)\s+receipts?\b/i,
    message: "Direct receipt dispatch via SMS or WhatsApp is not supported [F3].",
  },
  {
    rule: "Portable zip build",
    regex: /\bportable\s+\.zip\s+build\b/i,
    message: "No portable zip distribution is officially provided [A3].",
  },
  {
    rule: "64-bit installer",
    regex: /\b64-bit\s+installer\b/i,
    message: "CB POS is a 32-bit Windows application [A2].",
  },

  // Banned filler buzzwords (CLAUDE.md §8.1)
  {
    rule: "buzzword-seamless",
    regex: /\bseamless(ly)?\b/i,
    message: "Filler buzzword prohibited by anti-slop copy guidelines.",
  },
  {
    rule: "buzzword-revolutionize",
    regex: /\brevolutioniz(e|ing)\b/i,
    message: "Filler buzzword prohibited by anti-slop copy guidelines.",
  },
  {
    rule: "buzzword-unlock",
    regex: /\bunlock(ing)?\b/i,
    message: "Filler buzzword prohibited by anti-slop copy guidelines.",
  },
  {
    rule: "buzzword-elevate",
    regex: /\belevat(e|ing)\b/i,
    message: "Filler buzzword prohibited by anti-slop copy guidelines.",
  },
  {
    rule: "buzzword-empower",
    regex: /\bempower(ing|s)?\b/i,
    message: "Filler buzzword prohibited by anti-slop copy guidelines.",
  },
  {
    rule: "buzzword-cutting-edge",
    regex: /\bcutting-edge\b/i,
    message: "Filler buzzword prohibited by anti-slop copy guidelines.",
  },
  {
    rule: "buzzword-game-changer",
    regex: /\bgame-changer\b/i,
    message: "Filler buzzword prohibited by anti-slop copy guidelines.",
  },
  {
    rule: "buzzword-effortless",
    regex: /\beffortless(ly)?\b/i,
    message: "Filler buzzword prohibited by anti-slop copy guidelines.",
  },

  // Brand rules
  {
    rule: "brand-spelling-CB-POS",
    regex: /\bCB-POS\b/,
    message: "Brand must be written 'CB POS' or 'CB\u00A0POS', never 'CB-POS'.",
  },
  {
    rule: "brand-spelling-CBPOS",
    regex: /(?<![\w/.-])CBPOS(?!Setup)(?![_\w.-])/i,
    message: "Brand must be written 'CB POS' or 'CB\u00A0POS', never 'CBPOS'.",
  },
];

export function scanTextForBannedClaims(text: string, file?: string, key?: string): ClaimViolation[] {
  const violations: ClaimViolation[] = [];

  for (const rule of BANNED_RULES) {
    const match = rule.regex.exec(text);
    if (match) {
      violations.push({
        rule: rule.rule,
        matched: match[0],
        message: rule.message,
        file,
        key,
      });
    }
  }

  return violations;
}

function scanObject(
  obj: unknown,
  file: string,
  prefix = "",
): ClaimViolation[] {
  let violations: ClaimViolation[] = [];

  if (typeof obj === "string") {
    violations = violations.concat(scanTextForBannedClaims(obj, file, prefix));
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      violations = violations.concat(scanObject(item, file, `${prefix}[${index}]`));
    });
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const keyPath = prefix ? `${prefix}.${k}` : k;
      violations = violations.concat(scanObject(v, file, keyPath));
    }
  }

  return violations;
}

export function runBannedClaimsCheck(): ClaimViolation[] {
  const violations: ClaimViolation[] = [];
  const root = process.cwd();

  // 1. Scan messages/{en,si,ta}.json
  const messagesDir = join(root, "messages");
  try {
    const messageFiles = readdirSync(messagesDir).filter((f) => f.endsWith(".json"));
    for (const file of messageFiles) {
      const filePath = join(messagesDir, file);
      const content = JSON.parse(readFileSync(filePath, "utf-8"));
      violations.push(...scanObject(content, `messages/${file}`));
    }
  } catch {
    // ignore missing dir
  }

  // 2. Scan apps/web/.content fixtures
  const fixturesPath = join(root, "apps/web/.content/fixtures.json");
  try {
    if (statSync(fixturesPath).isFile()) {
      const content = JSON.parse(readFileSync(fixturesPath, "utf-8"));
      violations.push(...scanObject(content, "apps/web/.content/fixtures.json"));
    }
  } catch {
    // ignore missing file
  }

  return violations;
}

const isDirectRun = Boolean(
  (import.meta as unknown as { main?: boolean }).main ||
  process.argv[1]?.endsWith("banned-claims-check.ts")
);

if (isDirectRun) {
  const violations = runBannedClaimsCheck();
  if (violations.length > 0) {
    console.error(`\n❌ Found ${violations.length} banned claim/copy violation(s):`);
    for (const v of violations) {
      console.error(`  • [${v.rule}] in ${v.file || "text"} (${v.key || "unknown key"}):`);
      console.error(`    Found: "${v.matched}"`);
      console.error(`    Why:   ${v.message}\n`);
    }
    process.exit(1);
  } else {
    console.warn("✓ Banned claims check passed: 0 prohibited marketing claims or buzzwords found.");
    process.exit(0);
  }
}
