import { log } from "./log";

export type RebuildTriggerResult = {
  triggered: boolean;
  mode: "github_actions" | "mock";
  message: string;
  ref?: string;
};

export async function triggerRebuild(env: Env, reason = "admin_manual"): Promise<RebuildTriggerResult> {
  const token = env.GITHUB_DISPATCH_TOKEN || env.GITHUB_API_TOKEN;
  const repo = env.SITE_REPO || "ceybyte/CeyByte.com";

  if (!token) {
    log.warn("rebuild_skipped", { reason, why: "GITHUB_DISPATCH_TOKEN not set" });
    return {
      triggered: false,
      mode: "mock",
      message: "GITHUB_DISPATCH_TOKEN is not configured; simulated trigger in dev/test",
    };
  }

  const url = `https://api.github.com/repos/${repo}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "CeyByte-Admin-Worker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "content-published",
      client_payload: {
        reason,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API dispatch failed (${res.status}): ${errorText}`);
  }

  return {
    triggered: true,
    mode: "github_actions",
    message: "repository_dispatch (content-published) triggered successfully",
  };
}

export type RebuildStatusResult = {
  status: string;
  conclusion: string | null;
  mode: "github_actions" | "mock";
  html_url?: string;
  created_at?: string;
  updated_at?: string;
};

export async function getRebuildStatus(env: Env): Promise<RebuildStatusResult> {
  const token = env.GITHUB_DISPATCH_TOKEN || env.GITHUB_API_TOKEN;
  const repo = env.SITE_REPO || "ceybyte/CeyByte.com";

  if (!token) {
    return {
      status: "completed",
      conclusion: "success",
      mode: "mock",
    };
  }

  const url = `https://api.github.com/repos/${repo}/actions/workflows/deploy.yml/runs?per_page=1`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "CeyByte-Admin-Worker",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API runs query failed (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as {
    workflow_runs?: Array<{
      status: string;
      conclusion: string | null;
      html_url?: string;
      created_at?: string;
      updated_at?: string;
    }>;
  };
  const latestRun = data.workflow_runs?.[0];

  if (!latestRun) {
    return {
      status: "idle",
      conclusion: null,
      mode: "github_actions",
    };
  }

  return {
    status: latestRun.status,
    conclusion: latestRun.conclusion,
    mode: "github_actions",
    html_url: latestRun.html_url,
    created_at: latestRun.created_at,
    updated_at: latestRun.updated_at,
  };
}
