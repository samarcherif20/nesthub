// lib/services/password-reset-email.service.ts
import nodemailer from "nodemailer";

export interface PasswordResetEmailData {
  toEmail: string;
  resetLink: string;
  userName?: string;
}

class PasswordResetEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    this.init();
  }

  private init() {
    if (!process.env.BREVO_SMTP_LOGIN) {
      console.log("[PasswordResetEmail] Mode dev — pas d'envoi réel");
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
      console.error("[PasswordResetEmail] Erreur init:", e);
    }
  }

  async sendResetEmail(data: PasswordResetEmailData): Promise<void> {
    const { toEmail, resetLink, userName } = data;

    const html = this.buildHtml({ resetLink, userName, toEmail });

    if (!this.transporter) {
      console.log("[PasswordResetEmail] Dev simulation:", { to: toEmail, link: resetLink });
      return;
    }

    await this.transporter.sendMail({
      from:    `"${process.env.BREVO_FROM_NAME || "NESTHUB"}" <${process.env.BREVO_FROM_EMAIL}>`,
      to:      toEmail,
      subject: `Réinitialisation de votre mot de passe NESTHUB`,
      html,
    });

    console.log(`[PasswordResetEmail] Envoyé à ${toEmail}`);
  }

  private buildHtml(data: { resetLink: string; userName?: string; toEmail: string }): string {
    const { resetLink, userName } = data;
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Réinitialisation mot de passe - NESTHUB</title>
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
    .body { padding: 36px 44px 40px; }
    .heading {
      font-size: 22px; font-weight: 700; color: #0f172a;
      line-height: 1.3; margin-bottom: 16px; letter-spacing: -0.3px;
    }
    .text {
      font-size: 15px; color: #4b5563; line-height: 1.7; margin-bottom: 28px;
    }
    .text strong { color: #0f172a; font-weight: 600; }
    .cta-wrap { margin: 28px 0; text-align: center; }
    .cta {
      display: inline-block; background: #4f46e5; color: #ffffff !important;
      text-decoration: none; font-size: 13px; font-weight: 600;
      padding: 10px 28px; border-radius: 8px; letter-spacing: 0.1px;
    }
    .info-row {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; border-radius: 10px; margin-bottom: 12px;
      background: #fffbeb; border: 1px solid #fde68a;
    }
    .info-row svg { flex-shrink: 0; margin-top: 1px; }
    .info-row p { font-size: 13px; line-height: 1.6; color: #92400e; }
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
      <div class="body">
        <h1 class="heading">Réinitialisation de votre mot de passe 🔐</h1>
        <p class="text">
          Bonjour ${userName ? `<strong>${userName}</strong>` : ''},<br/><br/>
          Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte NESTHUB.
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
        </p>
        <div class="cta-wrap">
          <a href="${resetLink}" class="cta">Réinitialiser mon mot de passe →</a>
        </div>
        <div class="info-row">
          <svg width="16" height="16" fill="none" stroke="#d97706" stroke-width="2" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p>
            <strong>Ce lien expire dans 1 heure.</strong><br/>
            Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
          </p>
        </div>
        <div class="divider"></div>
        <div class="fallback-label">Ou copiez ce lien dans votre navigateur</div>
        <div class="fallback-link">${resetLink}</div>
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
}

export const passwordResetEmailService = new PasswordResetEmailService();