import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/require-role";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_OWNER = process.env.FEEDBACK_GH_OWNER ?? "thebobhuff";
const GITHUB_REPO = process.env.FEEDBACK_GH_REPO ?? "hmnppl";
const GITHUB_TOKEN = process.env.FEEDBACK_GH_TOKEN ?? "";

export const POST = withAuth(async (request, _context, { user }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const kind = body.kind === "feature" ? "feature" : "bug";
    const title = String(body.title ?? "").trim();
    const details = String(body.details ?? "").trim();
    const pageUrl = String(body.pageUrl ?? "").trim();
    const submittedAt = String(body.submittedAt ?? "").trim();

    if (title.length < 5 || details.length < 20) {
      return NextResponse.json(
        { error: "Title or details are too short" },
        { status: 400 },
      );
    }

    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "Feedback integration is not configured" },
        { status: 500 },
      );
    }

    const issueTitle = `${kind === "bug" ? "[Bug]" : "[Feature]"} ${title}`;
    const issueBody = [
      `## Type`,
      kind === "bug" ? "Bug report" : "Feature request",
      "",
      `## Submitted By`,
      `${user.firstName} ${user.lastName} (${user.email})`,
      "",
      `## Role`,
      user.role,
      "",
      `## Company`,
      user.companyId,
      "",
      `## Submitted At`,
      submittedAt || new Date().toISOString(),
      "",
      `## Page URL`,
      pageUrl || "Not provided",
      "",
      `## Details`,
      details,
    ].join("\n");

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "hmnppl-feedback",
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: [kind === "bug" ? "bug" : "enhancement", "feedback"],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[feedback] GitHub issue creation failed:", errorText);
      return NextResponse.json(
        { error: "Failed to create GitHub issue" },
        { status: 502 },
      );
    }

    const issue = (await response.json()) as { number: number; html_url: string };

    return NextResponse.json({
      issue: {
        number: issue.number,
        url: issue.html_url,
      },
    });
  } catch (error) {
    console.error("[feedback] Failed:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
});
