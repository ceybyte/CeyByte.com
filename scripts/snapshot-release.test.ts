import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve, join } from "node:path";
import { snapshotRelease } from "./snapshot-release";

describe("Worker Release Snapshot", () => {
  it("snapshots the latest release into fallback-release.ts", async () => {
    const testOutPath = resolve(__dirname, "../apps/api/src/lib/test-fallback-release.ts");

    const release = await snapshotRelease({ outputPath: testOutPath });
    expect(release.version).toBeDefined();
    expect(release.download_url).toBeDefined();
    expect(release.sha256).toBeDefined();

    expect(existsSync(testOutPath)).toBe(true);
    const content = readFileSync(testOutPath, "utf-8");
    expect(content).toContain("export const FALLBACK_RELEASE");
    expect(content).toContain(release.version);

    // Clean up test file
    unlinkSync(testOutPath);
  });
});
