"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { APIError, feedbackAPI } from "@/lib/api/client";
import { Bug, Lightbulb, Send, CheckCircle2 } from "lucide-react";

type FeedbackKind = "bug" | "feature";

export default function FeedbackPage() {
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  const breadcrumbs = useMemo(
    () => [{ label: "Home", href: "/dashboard" }, { label: "Feedback" }],
    [],
  );
  usePageBreadcrumbs(breadcrumbs);

  const isValid = title.trim().length >= 5 && details.trim().length >= 20;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const data = await feedbackAPI.submit({
        kind,
        title,
        details,
        pageUrl: window.location.href,
        submittedAt: new Date().toISOString(),
      });
      setIssueUrl(data.issue.url);
      setSubmitted(true);
    } catch (submissionError) {
      if (submissionError instanceof APIError) {
        setError(submissionError.message);
      } else {
        setError("Failed to submit feedback");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer
      title="Report a Bug or Request a Feature"
      description="Share product issues, improvement ideas, or missing workflow requests."
    >
      <div className="mx-auto grid max-w-3xl gap-6">
        <Card className="p-5">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setKind("bug")}
              className={`flex min-w-[180px] items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                kind === "bug"
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-border hover:bg-card-hover"
              }`}
            >
              <Bug className="h-5 w-5 text-brand-warning" />
              <div>
                <p className="text-sm font-medium text-text-primary">Report a Bug</p>
                <p className="text-xs text-text-tertiary">
                  Something is broken, confusing, or not behaving as expected.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setKind("feature")}
              className={`flex min-w-[180px] items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                kind === "feature"
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-border hover:bg-card-hover"
              }`}
            >
              <Lightbulb className="h-5 w-5 text-brand-primary" />
              <div>
                <p className="text-sm font-medium text-text-primary">Request a Feature</p>
                <p className="text-xs text-text-tertiary">
                  Ask for a new workflow, integration, improvement, or shortcut.
                </p>
              </div>
            </button>
          </div>
        </Card>

        <Card className="p-5">
          {!submitted ? (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="flex items-center gap-2">
                <Badge variant={kind === "bug" ? "warning" : "default"}>
                  {kind === "bug" ? "Bug Report" : "Feature Request"}
                </Badge>
                <p className="text-sm text-text-tertiary">
                  Include where this happened and what outcome you expected.
                </p>
              </div>

              <FormField
                label="Title"
                htmlFor="feedback-title"
                required
                hint="Use a short summary someone can scan quickly."
              >
                <Input
                  id="feedback-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={submitting}
                  placeholder={
                    kind === "bug"
                      ? "Example: Employee list search stops responding"
                      : "Example: Add CSV export to employee directory"
                  }
                />
              </FormField>

              <FormField
                label="Details"
                htmlFor="feedback-details"
                required
                hint="Helpful context: page, role, steps to reproduce, business impact, or desired behavior."
              >
                <Textarea
                  id="feedback-details"
                  rows={8}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  disabled={submitting}
                  placeholder={
                    kind === "bug"
                      ? "Tell us what you clicked, what happened, and what should have happened instead."
                      : "Describe the workflow gap, who needs it, and how it would help."
                  }
                />
              </FormField>

              {error && <p className="text-sm text-brand-error">{error}</p>}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-tertiary">
                  Submissions create GitHub issues for the product backlog.
                </p>
                <Button type="submit" disabled={!isValid || submitting}>
                  <Send className="mr-2 h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <CheckCircle2 className="h-8 w-8 text-brand-success" />
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Thanks for the feedback
                </h2>
                <p className="text-sm text-text-secondary">
                  Your {kind === "bug" ? "bug report" : "feature request"} was created as
                  a GitHub issue.
                </p>
                {issueUrl && (
                  <a
                    href={issueUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-sm text-brand-primary hover:underline"
                  >
                    View issue
                  </a>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setSubmitted(false);
                  setIssueUrl(null);
                  setError(null);
                  setTitle("");
                  setDetails("");
                  setKind("bug");
                }}
              >
                Submit Another
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
