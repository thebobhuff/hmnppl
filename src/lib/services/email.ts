/**
 * Mailgun API Integration
 * Used for sending transactional emails (invites, notifications, etc.)
 */

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = `Acme HR Platform <noreply@${process.env.MAILGUN_DOMAIN}>`,
}: SendEmailOptions) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Mailgun config missing. Skipping email send:", { to, subject });
      return { success: true, simulated: true };
    }
    throw new Error("Mailgun API key or domain is missing from environment variables.");
  }

  const toArray = Array.isArray(to) ? to : [to];

  // Build multipart form data for the Mailgun API
  const formData = new URLSearchParams();
  formData.append("from", from);
  toArray.forEach((email) => formData.append("to", email));
  formData.append("subject", subject);
  formData.append("html", html);
  if (text) formData.append("text", text);

  // Mailgun API URL (Use "api.eu.mailgun.net" if your domain is in the EU region)
  const endpoint = `https://api.mailgun.net/v3/${domain}/messages`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch {
      // ignore
    }
    console.error(`[email] Mailgun error (${response.status}):`, errorText);
    throw new Error(`Failed to send email to ${to}`);
  }

  const data = await response.json();
  return { success: true, id: data.id };
}

// ---------------------------------------------------------------------------
// Pre-built Email Templates
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Incident notification emails
// ---------------------------------------------------------------------------

export async function sendIncidentReportedEmail(params: {
  to: string[];
  companyName: string;
  incidentRef: string;
  employeeName: string;
  severity: string;
  summary: string;
  dashboardUrl: string;
}) {
  const { to, companyName, incidentRef, employeeName, severity, summary, dashboardUrl } = params;
  const severityColor = severity === "critical" ? "#dc2626" : severity === "high" ? "#ea580c" : "#2563eb";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: ${severityColor};">New Incident Reported</h2>
      <p>A new incident has been reported and requires your attention.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; width: 140px;">Reference</td>
          <td style="padding: 8px 0;">${incidentRef}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Employee</td>
          <td style="padding: 8px 0;">${employeeName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Severity</td>
          <td style="padding: 8px 0;"><span style="color: ${severityColor}; font-weight: 700; text-transform: uppercase;">${severity}</span></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Summary</td>
          <td style="padding: 8px 0;">${summary}</td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Review Incident
        </a>
      </div>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        AI HR Platform — ${companyName}
      </p>
    </div>
  `;

  return sendEmail({ to, subject: `[${incidentRef}] New Incident Reported — ${employeeName}`, html });
}

export async function sendAIEvaluationCompleteEmail(params: {
  to: string[];
  companyName: string;
  incidentRef: string;
  employeeName: string;
  confidence: number;
  recommendedAction: string;
  dashboardUrl: string;
}) {
  const { to, companyName, incidentRef, employeeName, confidence, recommendedAction, dashboardUrl } = params;
  const confidencePct = Math.round(confidence * 100);
  const isHigh = confidencePct >= 85;
  const confidenceColor = isHigh ? "#16a34a" : confidencePct >= 60 ? "#ea580c" : "#dc2626";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">AI Evaluation Complete</h2>
      <p>The AI has finished evaluating incident <strong>${incidentRef}</strong> for <strong>${employeeName}</strong>.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; width: 140px;">Confidence</td>
          <td style="padding: 8px 0; color: ${confidenceColor}; font-weight: 700;">${confidencePct}%</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Recommended Action</td>
          <td style="padding: 8px 0;">${recommendedAction}</td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Review Evaluation
        </a>
      </div>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        AI HR Platform — ${companyName}
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `[${incidentRef}] AI Evaluation Ready — ${confidencePct}% confidence`,
    html,
  });
}

export async function sendDocumentAwaitingSignatureEmail(params: {
  to: string;
  companyName: string;
  employeeName: string;
  incidentRef: string;
  documentTitle: string;
  signUrl: string;
  deadlineHours: number;
}) {
  const { to, companyName, employeeName, incidentRef, documentTitle, signUrl, deadlineHours } = params;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #ea580c;">Document Requires Your Signature</h2>
      <p>Hello ${employeeName},</p>
      <p>A disciplinary document has been generated for incident <strong>${incidentRef}</strong> and requires your acknowledgment and signature.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; width: 140px;">Document</td>
          <td style="padding: 8px 0;">${documentTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Deadline</td>
          <td style="padding: 8px 0; color: #dc2626;">Within ${deadlineHours} hours</td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${signUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Review & Sign Document
        </a>
      </div>
      <p style="font-size: 14px; color: #666;">If you believe this document is in error, you may dispute it after signing.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        AI HR Platform — ${companyName}
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Action Required: Sign Document for Incident ${incidentRef}`,
    html,
  });
}

export async function sendDocumentSignedEmail(params: {
  to: string[];
  companyName: string;
  employeeName: string;
  incidentRef: string;
  documentTitle: string;
  dashboardUrl: string;
}) {
  const { to, companyName, employeeName, incidentRef, documentTitle, dashboardUrl } = params;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #16a34a;">Document Signed</h2>
      <p><strong>${employeeName}</strong> has signed the document for incident <strong>${incidentRef}</strong>.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; width: 140px;">Document</td>
          <td style="padding: 8px 0;">${documentTitle}</td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View in Dashboard
        </a>
      </div>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        AI HR Platform — ${companyName}
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `[${incidentRef}] Document Signed by ${employeeName}`,
    html,
  });
}

export async function sendMeetingScheduledEmail(params: {
  to: string[];
  companyName: string;
  employeeName: string;
  managerName: string;
  incidentRef: string;
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  dashboardUrl: string;
}) {
  const { to, companyName, employeeName, managerName, incidentRef, meetingDate, meetingTime, meetingLocation, dashboardUrl } = params;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">Disciplinary Meeting Scheduled</h2>
      <p>A disciplinary meeting has been scheduled regarding incident <strong>${incidentRef}</strong>.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; width: 140px;">Employee</td>
          <td style="padding: 8px 0;">${employeeName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Manager</td>
          <td style="padding: 8px 0;">${managerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Date</td>
          <td style="padding: 8px 0;">${meetingDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Time</td>
          <td style="padding: 8px 0;">${meetingTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600;">Location</td>
          <td style="padding: 8px 0;">${meetingLocation}</td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          View Meeting Details
        </a>
      </div>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        AI HR Platform — ${companyName}
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Meeting Scheduled: ${employeeName} — ${meetingDate} at ${meetingTime}`,
    html,
  });
}

export async function sendDisputeSubmittedEmail(params: {
  to: string[];
  companyName: string;
  employeeName: string;
  incidentRef: string;
  dashboardUrl: string;
}) {
  const { to, companyName, employeeName, incidentRef, dashboardUrl } = params;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #dc2626;">Document Disputed</h2>
      <p><strong>${employeeName}</strong> has disputed the disciplinary document for incident <strong>${incidentRef}</strong>.</p>
      <p>HR review is now required to assess the dispute.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Review Dispute
        </a>
      </div>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        AI HR Platform — ${companyName}
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `[${incidentRef}] Document Disputed by ${employeeName}`,
    html,
  });
}

export async function sendTeamInviteEmail(
  email: string,
  inviteLink: string,
  companyName: string,
) {
  const subject = `You're invited to join ${companyName} on the HR Platform`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">Welcome to your new HR Platform!</h2>
      <p>Hello,</p>
      <p>You have been invited to join <strong>${companyName}</strong>'s workspace.</p>
      <p>Click the button below to accept your invitation, set up your password, and access your dashboard.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      <p style="font-size: 14px; color: #666;">If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="font-size: 14px; color: #666; word-break: break-all;">
        <a href="${inviteLink}">${inviteLink}</a>
      </p>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        This email was sent by the AI HR Platform on behalf of ${companyName}.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}
