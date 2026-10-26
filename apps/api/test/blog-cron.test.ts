import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { makeDb } from "../src/lib/db";
import { checkScheduledPosts } from "../src/scheduled";

describe("Scheduled Blog Posts Cron", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM blog_posts").run();
  });

  it("scheduled posts due for publication are marked published and trigger rebuild", async () => {
    const db = makeDb(env.DB);
    const past = Date.now() - 3600 * 1000;
    await env.DB.prepare(
      "INSERT INTO blog_posts (id, translation_key, locale, slug, title, excerpt, body_md, status, published_at, created_at, updated_at) VALUES ('b1', 'tk1', 'en', 'sched', 'Sched', 'Ex', 'Body', 'scheduled', ?, ?, ?)",
    )
      .bind(past, past, past)
      .run();

    const future = Date.now() + 3600 * 1000;
    await env.DB.prepare(
      "INSERT INTO blog_posts (id, translation_key, locale, slug, title, excerpt, body_md, status, published_at, created_at, updated_at) VALUES ('b2', 'tk2', 'en', 'future', 'Future', 'Ex', 'Body', 'scheduled', ?, ?, ?)",
    )
      .bind(future, Date.now(), Date.now())
      .run();

    const res = await checkScheduledPosts(env, db);
    expect(res.publishedCount).toBe(1);

    const post1 = await env.DB.prepare("SELECT status FROM blog_posts WHERE id = 'b1'").first<{
      status: string;
    }>();
    expect(post1?.status).toBe("published");

    const post2 = await env.DB.prepare("SELECT status FROM blog_posts WHERE id = 'b2'").first<{
      status: string;
    }>();
    expect(post2?.status).toBe("scheduled");
  });
});
