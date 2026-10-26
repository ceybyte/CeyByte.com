import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";
let ipCounter = 300;

const call = (
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    cookie?: string;
    ip?: string;
  } = {},
) => {
  const headers = new Headers(options.headers);
  headers.set("origin", ORIGIN);
  headers.set("cf-connecting-ip", options.ip ?? `203.0.113.${ipCounter++}`);
  if (options.body) headers.set("content-type", "application/json");
  if (options.cookie) headers.set("cookie", options.cookie);

  return exports.default.fetch(`${ORIGIN}/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    redirect: "manual",
  });
};

let cachedAdminCookie: string | null = null;
async function getAdminCookie(): Promise<string> {
  if (cachedAdminCookie) return cachedAdminCookie;
  const email = "blogadmin@example.com";
  await call("/auth/email-otp/send-verification-otp", {
    method: "POST",
    body: JSON.stringify({ email, type: "sign-in" }),
  });

  const row = await env.DB.prepare(
    "SELECT value FROM verifications WHERE identifier LIKE ? ORDER BY created_at DESC",
  )
    .bind(`%${email}`)
    .first<{ value: string }>();
  const otp = row?.value.split(":")[0];

  const res = await call("/auth/sign-in/email-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
  const cookie = res.headers.getSetCookie().find((c) => c.includes("better-auth.session_token"));
  if (!cookie) throw new Error("no session cookie");

  await env.DB.prepare("UPDATE users SET role = 'admin' WHERE email = ?").bind(email).run();
  cachedAdminCookie = cookie.split(";")[0] ?? "";
  return cachedAdminCookie;
}

describe("Admin Blog Management API (/api/admin/blog)", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM blog_posts").run();
  });

  it("enforces 404 for unauthenticated or non-admin requests", async () => {
    const listRes = await call("/admin/blog/posts");
    expect(listRes.status).toBe(404);

    const createRes = await call("/admin/blog/posts", {
      method: "POST",
      body: JSON.stringify({ title: "Unauthorized" }),
    });
    expect(createRes.status).toBe(404);
  });

  it("supports full CRUD for blog posts with validation and reading time calculation", async () => {
    const cookie = await getAdminCookie();

    // 1. Create a draft post
    const createRes = await call("/admin/blog/posts", {
      method: "POST",
      cookie,
      body: JSON.stringify({
        title: "Test Launch Announcement",
        slug: "test-launch-announcement",
        locale: "en",
        translationKey: "test-launch",
        excerpt: "An exciting new release for shopkeepers in Sri Lanka.",
        bodyMd: "# Welcome\n\nHere is a detailed guide on configuring receipts.\n\nPress :kbd[F3] to search.",
        tags: ["releases", "hardware"],
        status: "draft",
      }),
    });
    expect(createRes.status).toBe(201);
    const createJson = (await createRes.json()) as {
      ok: boolean;
      data: { id: string; readingMinutes: number; slug: string };
    };
    expect(createJson.ok).toBe(true);
    expect(createJson.data.id).toBeTruthy();
    expect(createJson.data.readingMinutes).toBeGreaterThanOrEqual(1);
    const postId = createJson.data.id;

    // 2. Prevent duplicate (locale, slug)
    const dupRes = await call("/admin/blog/posts", {
      method: "POST",
      cookie,
      body: JSON.stringify({
        title: "Duplicate Slug",
        slug: "test-launch-announcement",
        locale: "en",
        translationKey: "another-key",
        excerpt: "Duplicate excerpt",
        bodyMd: "Short body",
        tags: ["releases"],
        status: "draft",
      }),
    });
    expect(dupRes.status).toBe(409);

    // 3. Get single post by ID
    const getRes = await call(`/admin/blog/posts/${postId}`, { cookie });
    expect(getRes.status).toBe(200);
    const getJson = (await getRes.json()) as {
      ok: boolean;
      data: { title: string; tags: string[]; bodyHast: unknown };
    };
    expect(getJson.data.title).toBe("Test Launch Announcement");
    expect(getJson.data.tags).toEqual(["releases", "hardware"]);

    // 4. Update post
    const updateRes = await call(`/admin/blog/posts/${postId}`, {
      method: "PUT",
      cookie,
      body: JSON.stringify({
        title: "Updated Launch Title",
        excerpt: "Updated excerpt text",
      }),
    });
    expect(updateRes.status).toBe(200);
    const updateJson = (await updateRes.json()) as { ok: boolean; data: { title: string } };
    expect(updateJson.data.title).toBe("Updated Launch Title");

    // 5. Publish post
    const publishRes = await call(`/admin/blog/posts/${postId}/publish`, {
      method: "POST",
      cookie,
    });
    expect(publishRes.status).toBe(200);
    const publishJson = (await publishRes.json()) as {
      ok: boolean;
      data: { status: string; publishedAt: string };
    };
    expect(publishJson.data.status).toBe("published");
    expect(publishJson.data.publishedAt).toBeTruthy();

    // 6. List posts with filters
    const listRes = await call("/admin/blog/posts?status=published&locale=en", { cookie });
    expect(listRes.status).toBe(200);
    const listJson = (await listRes.json()) as {
      ok: boolean;
      data: { items: Array<{ id: string; title: string }>; total: number };
    };
    expect(listJson.data.items.length).toBe(1);
    expect(listJson.data.items[0]?.title).toBe("Updated Launch Title");

    // 7. Delete post
    const deleteRes = await call(`/admin/blog/posts/${postId}`, {
      method: "DELETE",
      cookie,
    });
    expect(deleteRes.status).toBe(200);
  });

  it("handles media presigning with strict MIME and size checks", async () => {
    const cookie = await getAdminCookie();

    // 1. Valid image upload
    const validImgRes = await call("/admin/media/presign", {
      method: "POST",
      cookie,
      body: JSON.stringify({
        fileName: "cover.png",
        contentType: "image/png",
        size: 1024 * 500, // 500 KB
        postId: "b1",
      }),
    });
    expect(validImgRes.status).toBe(200);
    const validImgJson = (await validImgRes.json()) as {
      ok: boolean;
      data: { uploadUrl: string; key: string };
    };
    expect(validImgJson.data.uploadUrl).toBeTruthy();
    expect(validImgJson.data.key).toContain("media/blog/b1/");

    // 2. Valid video upload
    const validVideoRes = await call("/admin/media/presign", {
      method: "POST",
      cookie,
      body: JSON.stringify({
        fileName: "demo.mp4",
        contentType: "video/mp4",
        size: 1024 * 1024 * 25, // 25 MB
        postId: "b1",
      }),
    });
    expect(validVideoRes.status).toBe(200);

    // 3. Reject oversized image (> 5 MB)
    const bigImgRes = await call("/admin/media/presign", {
      method: "POST",
      cookie,
      body: JSON.stringify({
        fileName: "huge.png",
        contentType: "image/png",
        size: 1024 * 1024 * 6, // 6 MB
        postId: "b1",
      }),
    });
    expect(bigImgRes.status).toBe(400);

    // 4. Reject disallowed MIME type (.exe / application/x-msdownload)
    const badMimeRes = await call("/admin/media/presign", {
      method: "POST",
      cookie,
      body: JSON.stringify({
        fileName: "evil.exe",
        contentType: "application/x-msdownload",
        size: 1024,
        postId: "b1",
      }),
    });
    expect(badMimeRes.status).toBe(400);
  });
});
