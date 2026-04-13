// lib/services/invitation-email.service.ts
import nodemailer from "nodemailer";

export interface InvitationEmailData {
  toEmail: string;
  invitedByName: string;
  invitedByEmail: string;
  inviteLink: string;
  expiresAt: Date;
  role?: string;
}

class InvitationEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    this.init();
  }

  private init() {
    if (!process.env.BREVO_SMTP_LOGIN) {
      console.log("[InvitationEmail] Mode dev — pas d'envoi réel");
      return;
    }
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_SERVER || "smtp-relay.brevo.com",
        port: Number(process.env.BREVO_SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_LOGIN,
          pass: process.env.BREVO_SMTP_PASSWORD,
        },
      });
    } catch (e) {
      console.error("[InvitationEmail] Erreur init:", e);
    }
  }

  async sendInvitation(data: InvitationEmailData): Promise<void> {
    const { toEmail, invitedByName, invitedByEmail, inviteLink, expiresAt, role } = data;

    const expiresFormatted = expiresAt.toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const html = this.buildHtml({
      toEmail, invitedByName, invitedByEmail,
      inviteLink, expiresAt, expiresFormatted,
      role: role || "Administrateur",
    });

    if (!this.transporter) {
      console.log("[InvitationEmail] Dev simulation:", { to: toEmail, link: inviteLink });
      return;
    }

    await this.transporter.sendMail({
      from:    `"${process.env.BREVO_FROM_NAME || "NESTHUB"}" <${process.env.BREVO_FROM_EMAIL}>`,
      to:      toEmail,
      subject: `Vous avez été invité(e) à rejoindre NESTHUB`,
      html,
    });

    console.log(`[InvitationEmail] Envoyé à ${toEmail}`);
  }

  private buildHtml(data: InvitationEmailData & { expiresFormatted: string; role: string }): string {
    const { invitedByName, invitedByEmail, inviteLink, expiresFormatted, role } = data;
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation NESTHUB</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f6f8fa;
      padding: 48px 16px;
      color: #1a1a2e;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { max-width: 560px; margin: 0 auto; }

    .wordmark { text-align: center; margin-bottom: 32px; }
    .wordmark span {
      font-size: 13px; font-weight: 700; letter-spacing: 3px;
      text-transform: uppercase; color: #6366f1;
    }

    .card {
      background: #ffffff; border-radius: 16px; overflow: hidden;
      border: 1px solid #e8eaf0;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    }

    .accent-bar {
      height: 3px;
      background: linear-gradient(90deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%);
    }

    /* ── SENDER HEADER — text only, no icon ── */
    .sender-header {
      padding: 24px 44px 22px;
      border-bottom: 1px solid #f1f3f7;
    }
    .sender-label {
      font-size: 11px; font-weight: 600; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;
    }
    .sender-name {
      font-size: 15px; font-weight: 600; color: #0f172a;
    }
    .sender-email {
      font-weight: 400; color: #6b7280;
    }

    .body { padding: 36px 44px 40px; }

    .heading {
      font-size: 22px; font-weight: 700; color: #0f172a;
      line-height: 1.3; margin-bottom: 16px; letter-spacing: -0.3px;
    }

    .text {
      font-size: 15px; color: #4b5563; line-height: 1.7; margin-bottom: 28px;
    }
    .text strong { color: #0f172a; font-weight: 600; }

    .role-pill {
      display: inline-block; background: #eef2ff; color: #4f46e5;
      font-size: 12px; font-weight: 600; padding: 3px 12px;
      border-radius: 999px; border: 1px solid #c7d2fe; vertical-align: middle;
    }

    /* ── CTA — centered, smaller ── */
    .cta-wrap { margin: 28px 0; text-align: center; }
    .cta {
      display: inline-block; background: #4f46e5; color: #ffffff !important;
      text-decoration: none; font-size: 13px; font-weight: 600;
      padding: 10px 28px; border-radius: 8px; letter-spacing: 0.1px;
    }

    .info-row {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; border-radius: 10px; margin-bottom: 12px;
    }
    .info-row.blue  { background: #f0f9ff; border: 1px solid #bae6fd; }
    .info-row.amber { background: #fffbeb; border: 1px solid #fde68a; }
    .info-row svg   { flex-shrink: 0; margin-top: 1px; }
    .info-row p     { font-size: 13px; line-height: 1.6; }
    .info-row.blue  p { color: #0369a1; }
    .info-row.amber p { color: #92400e; }
    .info-row strong { font-weight: 600; }

    .divider { height: 1px; background: #f1f3f7; margin: 32px 0; }

    .fallback-label {
      font-size: 11px; color: #94a3b8; text-transform: uppercase;
      letter-spacing: 1px; font-weight: 600; margin-bottom: 6px;
    }
    .fallback-link {
      font-size: 12px; color: #6366f1; word-break: break-all; line-height: 1.5;
    }

    .footer { padding: 24px 44px; border-top: 1px solid #f1f3f7; text-align: center; }
    .footer-links { margin-bottom: 10px; }
    .footer-links a {
      font-size: 12px; color: #9ca3af; text-decoration: none; margin: 0 8px;
    }
    .footer-copy { font-size: 11px; color: #c0c8d5; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrap">

    <div class="wordmark"><span>NESTHUB</span></div>

    <div class="card">
      <div class="accent-bar"></div>

      <!-- Sender header — text only, no avatar/icon -->
      <div class="sender-header">
        <div class="sender-label">Invitation envoyée par</div>
        <div class="sender-name">
          ${invitedByName}
          <span class="sender-email">&nbsp;&middot;&nbsp;${invitedByEmail}</span>
        </div>
      </div>

      <div class="body">

        <h1 class="heading">Vous avez été invité(e) à rejoindre l'équipe admin 🎉</h1>
        <p class="text">
          <strong>${invitedByName}</strong> vous invite à administrer la plateforme
          <strong>NESTHUB</strong> avec le rôle
          <span class="role-pill">${role}</span>.
          Cliquez ci-dessous pour créer votre compte et accepter l'invitation.
        </p>

        <!-- CTA — centered, smaller -->
        <div class="cta-wrap">
          <a href="${inviteLink}" class="cta">Accepter l'invitation &rarr;</a>
        </div>

        <!-- Expiry info -->
        <div class="info-row blue">
          <svg width="16" height="16" fill="none" stroke="#0369a1" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
          </svg>
          <p>Ce lien expire le <strong>${expiresFormatted}</strong>. Acceptez rapidement !</p>
        </div>

        <!-- Security notice -->
        <div class="info-row amber">
          <svg width="16" height="16" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p>
            <strong>Attention :</strong> Ce lien est unique et à usage unique.
            Si vous n'attendiez pas cette invitation, ignorez simplement cet email.
          </p>
        </div>

        <!-- Fallback link -->
        <div class="divider"></div>
        <div class="fallback-label">Ou copiez ce lien dans votre navigateur</div>
        <div class="fallback-link">${inviteLink}</div>

      </div>

      <div class="footer">
        <div class="footer-links">
          <a href="${this.baseUrl}/privacy">Confidentialité</a>
          <a href="${this.baseUrl}/terms">CGU</a>
          <a href="${this.baseUrl}/contact">Support</a>
        </div>
        <div class="footer-copy">
          &copy; ${year} NESTHUB &mdash; Tous droits réservés.<br/>
          Ce message a été envoyé de manière sécurisée.
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
  }
  // Ajouter cette méthode à invitation-email.service.ts

async sendCohostInvitation(data: {
  toEmail: string;
  invitedByName: string;
  invitedByEmail: string;
  inviteLink: string;
  expiresAt: Date;
  listingTitle: string;
  role: string;
  message?: string;
}): Promise<void> {
  const { toEmail, invitedByName, invitedByEmail, inviteLink, expiresAt, listingTitle, role, message } = data;

  const expiresFormatted = expiresAt.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation co-hôte - NESTHUB</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f6f8fa;
      padding: 48px 16px;
      color: #1a1a2e;
    }
    .wrap { max-width: 560px; margin: 0 auto; }
    .wordmark { text-align: center; margin-bottom: 32px; }
    .wordmark span { font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #10b981; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e8eaf0; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .accent-bar { height: 3px; background: linear-gradient(90deg, #10b981 0%, #14b8a6 100%); }
    .sender-header { padding: 24px 44px 22px; border-bottom: 1px solid #f1f3f7; }
    .sender-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .sender-name { font-size: 15px; font-weight: 600; color: #0f172a; }
    .sender-email { font-weight: 400; color: #6b7280; }
    .body { padding: 36px 44px 40px; }
    .heading { font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 16px; }
    .text { font-size: 15px; color: #4b5563; line-height: 1.7; margin-bottom: 20px; }
    .listing-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .listing-title { font-weight: 700; color: #065f46; margin-bottom: 4px; }
    .role-pill { display: inline-block; background: #eef2ff; color: #4f46e5; font-size: 12px; font-weight: 600; padding: 3px 12px; border-radius: 999px; border: 1px solid #c7d2fe; }
    .message-box { background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .message-label { font-size: 11px; font-weight: 600; color: #92400e; margin-bottom: 8px; }
    .message-content { font-size: 14px; color: #78350f; font-style: italic; }
    .cta-wrap { margin: 28px 0; text-align: center; }
    .cta { display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 28px; border-radius: 8px; }
    .info-row { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 10px; margin-bottom: 12px; background: #f0f9ff; border: 1px solid #bae6fd; }
    .info-row p { font-size: 13px; color: #0369a1; }
    .footer { padding: 24px 44px; border-top: 1px solid #f1f3f7; text-align: center; }
    .footer-copy { font-size: 11px; color: #c0c8d5; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="wordmark"><span>NESTHUB</span></div>
    <div class="card">
      <div class="accent-bar"></div>
      <div class="sender-header">
        <div class="sender-label">Invitation envoyée par</div>
        <div class="sender-name">${invitedByName} <span class="sender-email">&nbsp;·&nbsp;${invitedByEmail}</span></div>
      </div>
      <div class="body">
        <h1 class="heading">Vous êtes invité(e) à devenir co-hôte </h1>
        <p class="text"><strong>${invitedByName}</strong> vous invite à gérer son annonce sur <strong>NESTHUB</strong> en tant que <strong>${role}</strong>.</p>
        
        <div class="listing-box">
          <div class="listing-title"> ${listingTitle}</div>
          <p style="font-size: 12px; color: #065f46; margin-top: 4px;">Vous pourrez gérer le calendrier et les réservations</p>
        </div>
        
        ${message ? `
        <div class="message-box">
          <div class="message-label"> Message du propriétaire</div>
          <div class="message-content">${message}</div>
        </div>
        ` : ''}
        
        <div class="cta-wrap">
          <a href="${inviteLink}" class="cta">Accepter l'invitation →</a>
        </div>
        
        <div class="info-row">
          <svg width="16" height="16" fill="none" stroke="#0369a1" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          <p>Ce lien expire le <strong>${expiresFormatted}</strong>.</p>
        </div>
      </div>
      <div class="footer">
        <div class="footer-copy">© ${new Date().getFullYear()} NESTHUB — Gestion de locations</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  if (!this.transporter) {
    console.log("[CohostInvitation] Mode dev:", { to: toEmail, link: inviteLink });
    return;
  }

  await this.transporter.sendMail({
    from: `"${process.env.BREVO_FROM_NAME || "NESTHUB"}" <${process.env.BREVO_FROM_EMAIL}>`,
    to: toEmail,
    subject: `Invitation à gérer "${listingTitle}" sur NESTHUB`,
    html,
  });
}
}

export const invitationEmailService = new InvitationEmailService();
