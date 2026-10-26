import fs from "node:fs";
import path from "node:path";
import { AdminBlogEditClient } from "./edit-client";

export function generateStaticParams(): Array<{ id: string }> {
  const params: Array<{ id: string }> = [{ id: "new" }];
  try {
    const blogFile = path.resolve(process.cwd(), ".content/blog.json");
    if (fs.existsSync(blogFile)) {
      const items = JSON.parse(fs.readFileSync(blogFile, "utf-8"));
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item?.id) {
            params.push({ id: String(item.id) });
          }
        }
      }
    }
  } catch {
    params.push({ id: "edit" });
  }
  return params;
}

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminBlogEditClient id={id} />;
}
