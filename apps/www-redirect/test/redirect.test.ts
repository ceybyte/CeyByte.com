import { exports } from "cloudflare:workers";
import { expect, it } from "vitest";

it("redirects www to the apex, keeping path and query", async () => {
  const res = await exports.default.fetch("https://www.ceybyte.com/si/docs/?q=printer", {
    redirect: "manual",
  });
  expect(res.status).toBe(301);
  expect(res.headers.get("location")).toBe("https://ceybyte.com/si/docs/?q=printer");
});
