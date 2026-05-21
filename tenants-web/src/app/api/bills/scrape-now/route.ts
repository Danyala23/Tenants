import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

/** Triggers GitHub Actions workflow_dispatch when GITHUB_TOKEN + GITHUB_REPO are configured. */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    return NextResponse.json(
      {
        error:
          "Scraping runs via GitHub Actions. Set GITHUB_TOKEN and GITHUB_REPO, or run the workflow manually from the repository Actions tab.",
      },
      { status: 501 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/scrape-bills.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { utility_type: type },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text || res.statusText }, { status: 502 });
  }

  return NextResponse.json({ success: true, message: "Scrape workflow triggered" });
}
