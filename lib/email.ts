import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || "Fabhouse <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email via Resend. If RESEND_API_KEY isn't set (e.g. local dev
 * before you've created an account), this logs the email to the console
 * instead of failing — so the rest of the app keeps working during setup.
 *
 * Setup (~5 min): create a free account at resend.com, verify a sending
 * domain (or use their shared onboarding@resend.dev for testing), and put
 * the API key in .env.local as RESEND_API_KEY.
 */
export async function sendEmail({ to, subject, html }: SendEmailArgs) {
  if (!resend) {
    console.log("\n--- EMAIL NOT SENT (RESEND_API_KEY not set) ---");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", html.replace(/<[^>]+>/g, " ").trim());
    console.log("--- Add RESEND_API_KEY to .env.local to send for real ---\n");
    return { skipped: true };
  }

  try {
    await resend.emails.send({ from, to, subject, html });
    return { skipped: false };
  } catch (err) {
    console.error("Failed to send email:", err);
    return { skipped: true, error: err };
  }
}

export function listingApprovedEmail(listingTitle: string) {
  const safeTitle = escapeHtml(listingTitle);
  return {
    subject: "Your Fabhouse listing is live",
    html: `
      <p>Good news — your listing <strong>${safeTitle}</strong> has been approved and is now visible to buyers on Fabhouse.</p>
      <p>You'll get an email whenever someone inquires about it.</p>
    `,
  };
}

export function listingRejectedEmail(listingTitle: string, reason?: string) {
  const safeTitle = escapeHtml(listingTitle);
  const safeReason = reason ? escapeHtml(reason) : "";
  return {
    subject: "Your Fabhouse listing needs a small fix",
    html: `
      <p>Your listing <strong>${safeTitle}</strong> wasn't approved yet.</p>
      ${safeReason ? `<p>Reason: ${safeReason}</p>` : ""}
      <p>You can edit and resubmit it from your dashboard.</p>
    `,
  };
}

export function newInquiryEmail(
  listingTitle: string,
  buyerName: string,
  buyerContact: string,
  message: string,
  stayDetails?: { checkIn: string; checkOut: string; guests: number }
) {
  const safeTitle = escapeHtml(listingTitle);
  const safeName = escapeHtml(buyerName);
  const safeContact = escapeHtml(buyerContact);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
  return {
    subject: `New inquiry: ${listingTitle.replace(/[\r\n]/g, " ").slice(0, 140)}`,
    html: `
      <p>You have a new inquiry on <strong>${safeTitle}</strong>.</p>
      <p><strong>From:</strong> ${safeName}<br/>
      <strong>Contact:</strong> ${safeContact}</p>
      ${stayDetails ? `<p><strong>Requested stay:</strong> ${escapeHtml(stayDetails.checkIn)} to ${escapeHtml(stayDetails.checkOut)} · ${stayDetails.guests} guest(s)</p>` : ""}
      <p><strong>Message:</strong><br/>${safeMessage}</p>
    `,
  };
}

export function welcomeEmail(name: string) {
  return {
    subject: "Welcome to Fabhouse",
    html: `
      <p>Hi ${name},</p>
      <p>Welcome to Fabhouse — discover property across our growing African markets and beyond.</p>
      <p>Everything is free to use during launch. If you're an agent or developer, head to your dashboard to post your first listing.</p>
    `,
  };
}
