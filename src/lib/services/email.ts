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

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
