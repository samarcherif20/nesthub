// lib/services/email.service.ts
import nodemailer from "nodemailer";

export interface ModerationEmailData {
  userEmail: string;
  userName: string;
  actionType: "SUSPEND" | "BAN" | "WARNING" | "ACTIVATE" | "LOCK" | "UNLOCK" | "ESCALATE";
  reason?: string;
  motif?: string;
  duration?: number;
  suspendedUntil?: Date;
  level?: number;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (process.env.NODE_ENV === "development" && !process.env.BREVO_SMTP_LOGIN) {
      console.log("Mode simulation - Pas de vrai envoi");
      return;
    }
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_SERVER || "smtp-relay.brevo.com",
        port: Number(process.env.BREVO_SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_LOGIN || "a49880001@smtp-brevo.com",
          pass: process.env.BREVO_SMTP_PASSWORD || "8KASm3MBqXRspNEW",
        },
      });
      console.log("Transporteur email initialisé avec Brevo");
    } catch (error) {
      console.error("Erreur initialisation email:", error);
    }
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendModerationNotification(data: ModerationEmailData): Promise<void> {
    const { subject, html } = this.getEmailContent(data);
    if (!this.transporter) {
      console.log("Email non envoyé (mode dev):", { to: data.userEmail, subject, actionType: data.actionType });
      return;
    }
    const fromEmail = process.env.BREVO_FROM_EMAIL || "a49880001@smtp-brevo.com";
    const fromName  = process.env.BREVO_FROM_NAME  || "NESTHUB Modération";
    try {
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to:   data.userEmail,
        subject,
        html,
      });
      console.log(`Email envoyé:`, info.messageId);
    } catch (error) {
      console.error("Erreur envoi:", error);
      throw error;
    }
  }

  private getReasonLabel(reason: string = ""): string {
    const reasons: Record<string, string> = {
      spam:                   "Spam / Publicité",
      tos:                    "Violation des conditions d'utilisation",
      safety:                 "Comportement dangereux",
      other:                  "Autre raison",
      INAPPROPRIATE_BEHAVIOR: "Comportement inapproprié",
      FALSE_INFORMATION:      "Fausses informations",
      PAYMENT_ISSUES:         "Problèmes de paiement",
      MULTIPLE_ACCOUNTS:      "Comptes multiples",
      HARASSMENT:             "Harcèlement",
      FRAUD:                  "Fraude ou tentative de phishing",
      IDENTITY_THEFT:         "Usurpation d'identité",
      MULTIPLE_WARNINGS:      "Avertissements multiples ignorés",
      ILLEGAL_ACTIVITY:       "Activité illégale",
      SECURITY:               "Raisons de sécurité",
    };
    return reasons[reason] || reason || "Non spécifié";
  }

  private getActionTitle(actionType: string): string {
    const titles: Record<string, string> = {
      SUSPEND:  "Suspension de compte",
      BAN:      "Bannissement définitif",
      WARNING:  "Avertissement",
      ACTIVATE: "Réactivation de compte",
      LOCK:     "Blocage de compte",
      UNLOCK:   "Déblocage de compte",
      ESCALATE: "Évolution de sanction",
    };
    return titles[actionType] || "Notification de modération";
  }

  private getActionColor(actionType: string): string {
    const colors: Record<string, string> = {
      SUSPEND:  "#f59e0b",
      BAN:      "#ef4444",
      WARNING:  "#f59e0b",
      ACTIVATE: "#10b981",
      LOCK:     "#f59e0b",
      UNLOCK:   "#10b981",
      ESCALATE: "#8b5cf6",
    };
    return colors[actionType] || "#f59e0b";
  }

  private getActionMessage(actionType: string): string {
    const messages: Record<string, string> = {
      SUSPEND:  "Votre compte a été suspendu temporairement.",
      BAN:      "Votre compte a été banni définitivement.",
      WARNING:  "Vous avez reçu un avertissement.",
      ACTIVATE: "Votre compte a été réactivé.",
      LOCK:     "Votre compte a été bloqué pour des raisons de sécurité.",
      UNLOCK:   "Votre compte a été débloqué.",
      ESCALATE: "La sanction concernant votre compte a évolué.",
    };
    return messages[actionType] || "Une action a été effectuée sur votre compte.";
  }

  private getActionBackground(actionType: string): string {
    const backgrounds: Record<string, string> = {
      SUSPEND:  "#fffbeb",
      BAN:      "#fef2f2",
      WARNING:  "#fffbeb",
      ACTIVATE: "#f0fdf4",
      LOCK:     "#fffbeb",
      UNLOCK:   "#f0fdf4",
      ESCALATE: "#faf5ff",
    };
    return backgrounds[actionType] || "#fffbeb";
  }

  private getActionTextColor(actionType: string): string {
    const colors: Record<string, string> = {
      SUSPEND:  "#b45309",
      BAN:      "#b91c1c",
      WARNING:  "#b45309",
      ACTIVATE: "#047857",
      LOCK:     "#b45309",
      UNLOCK:   "#047857",
      ESCALATE: "#6d28d9",
    };
    return colors[actionType] || "#b45309";
  }

  private getEmailContent(data: ModerationEmailData): { subject: string; html: string } {
    const currentYear  = new Date().getFullYear();
    const actionColor  = this.getActionColor(data.actionType);
    const reasonLabel  = this.getReasonLabel(data.reason);
    const actionMessage = this.getActionMessage(data.actionType);
    const actionTitle  = this.getActionTitle(data.actionType);
    const baseUrl      = this.baseUrl;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${actionTitle} — NESTHUB</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f6f8fa;
      padding: 48px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { max-width: 560px; margin: 0 auto; }

    /* ── Same wordmark as invitation email ── */
    .wordmark { text-align: center; margin-bottom: 32px; }
    .wordmark span {
      font-size: 11px; font-weight: 700; letter-spacing: 4px;
      text-transform: uppercase; color: #6366f1;
    }

    /* ── Same card shell ── */
    .card {
      background: #ffffff; border-radius: 8px;
      border: 1px solid #e4e4e7;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    /* ── Accent bar — color changes per action type ── */
    .accent-bar { height: 3px; }

    /* ── Action header (like sender-header in invitation) ── */
    .action-header {
      padding: 24px 40px 22px;
      border-bottom: 1px solid #f4f4f5;
    }
    .action-label {
      font-size: 11px; font-weight: 600; color: #a1a1aa;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;
    }
    .action-title {
      font-size: 15px; font-weight: 600; color: #18181b;
    }

    /* ── Content ── */
    .body { padding: 36px 40px 32px; }

    h2 {
      font-size: 22px; font-weight: 700; color: #09090b;
      line-height: 1.3; margin-bottom: 14px; letter-spacing: -0.4px;
    }
    .greeting { font-size: 14px; color: #52525b; line-height: 1.7; margin-bottom: 24px; }
    .greeting strong { color: #18181b; font-weight: 600; }

    /* ── Warning box — same structure, color from action ── */
    .warning-box {
      border-left: 3px solid ${actionColor};
      background: ${this.getActionBackground(data.actionType)};
      padding: 16px 18px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 28px;
    }
    .warning-box p {
      color: ${this.getActionTextColor(data.actionType)};
      font-size: 14px; font-weight: 500; margin: 0; line-height: 1.6;
    }

    /* ── Reason section ── */
    .section-label {
      font-size: 11px; font-weight: 600; color: #a1a1aa;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;
    }
    .reason-box {
      background: #fafafa; border: 1px solid #f4f4f5;
      border-radius: 8px; padding: 20px; margin-bottom: 24px;
      font-size: 14px; color: #3f3f46; line-height: 1.7;
    }
    .reason-box p { margin-bottom: 12px; }
    .reason-box p:last-child { margin-bottom: 0; }
    .reason-box strong { color: #18181b; font-weight: 600; }
    .motif-box {
      background: #ffffff; border: 1px solid #e4e4e7;
      border-radius: 6px; padding: 14px; margin: 12px 0;
      font-size: 13px; color: #52525b; line-height: 1.6;
    }
    .suspended-until {
      margin-top: 12px; padding: 10px 14px;
      background: #f4f4f5; border-radius: 6px;
      font-size: 13px; color: #52525b;
    }

    /* ── Next steps ── */
    .next-steps { margin-bottom: 28px; }
    .next-steps h3 { font-size: 14px; font-weight: 600; color: #18181b; margin-bottom: 6px; }
    .next-steps p  { font-size: 13px; color: #71717a; line-height: 1.7; }

    /* ── CTA buttons — centered, smaller (same as invitation) ── */
    .cta-wrap {
      padding-top: 24px; border-top: 1px solid #f4f4f5;
      text-align: center;
    }
    .btn-primary {
      display: inline-block; background: #4f46e5; color: #ffffff !important;
      text-decoration: none; font-size: 13px; font-weight: 600;
      padding: 10px 24px; border-radius: 6px; margin: 0 6px;
    }
    .btn-secondary {
      display: inline-block; background: #ffffff; color: #3f3f46 !important;
      text-decoration: none; font-size: 13px; font-weight: 500;
      padding: 10px 24px; border-radius: 6px; margin: 0 6px;
      border: 1px solid #e4e4e7;
    }

    /* ── Footer — same as invitation ── */
    .footer {
      border-top: 1px solid #f4f4f5; padding: 18px 40px; text-align: center;
    }
    .footer-links { margin-bottom: 8px; }
    .footer-links a {
      font-size: 11px; color: #a1a1aa; text-decoration: none; margin: 0 6px;
    }
    .footer-copy { font-size: 11px; color: #d4d4d8; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrap">

    <!-- Same wordmark as invitation -->
    <div class="wordmark"><span>NESTHUB</span></div>

    <div class="card">

      <!-- Accent bar — color matches action type -->
      <div class="accent-bar" style="background:${actionColor};"></div>

      <!-- Action header — mirrors sender-header from invitation -->
      <div class="action-header">
        <div class="action-label">Notification de modération</div>
        <div class="action-title">${actionTitle}</div>
      </div>

      <div class="body">

        <h2>${actionMessage.replace(".", "")}</h2>
        <p class="greeting">Bonjour <strong>${data.userName}</strong>,</p>

        <!-- Warning box -->
        <div class="warning-box">
          <p>
            ${actionMessage}
            ${data.duration ? ` Pour une durée de <strong>${data.duration} jour${data.duration > 1 ? "s" : ""}</strong>.` : ""}
          </p>
        </div>

        <!-- Reason section -->
        <div class="section-label">Motif de l'action</div>
        <div class="reason-box">
          <p><strong>Raison :</strong> ${reasonLabel}</p>
          ${data.motif ? `<div class="motif-box"><strong>Détails :</strong><div style="margin-top:8px;">${data.motif}</div></div>` : ""}
          <p>Cette décision a été prise pour maintenir un environnement sûr pour la communauté NESTHUB.</p>
          ${data.suspendedUntil ? `<div class="suspended-until"><strong>Fin de suspension :</strong> ${data.suspendedUntil.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</div>` : ""}
        </div>

        <!-- Next steps -->
        <div class="next-steps">
          <h3>Prochaines étapes et recours</h3>
          <p>Durant cette période, certaines fonctionnalités peuvent être restreintes. Si vous estimez que cette décision est une erreur, soumettez une demande de révision auprès de notre support.</p>
        </div>

        <!-- CTA — centered, smaller, same style as invitation -->
        <div class="cta-wrap">
          <a href="${baseUrl}/dashboard" class="btn-primary">Consulter mon compte</a>
          <a href="${baseUrl}/support"   class="btn-secondary">Contacter le support</a>
        </div>

      </div>

      <!-- Footer — identical to invitation email -->
      <div class="footer">
        <div class="footer-links">
          <a href="${baseUrl}/legal">Conditions d'utilisation</a>
          &middot;
          <a href="${baseUrl}/privacy">Confidentialité</a>
          &middot;
          <a href="${baseUrl}/help">Centre d'aide</a>
        </div>
        <div class="footer-copy">
          &copy; ${currentYear} NESTHUB &mdash; Tous droits réservés.<br/>
          Cet email a été envoyé automatiquement suite à une action de modération.
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;

    const subjects: Record<string, string> = {
      SUSPEND:  "[NESTHUB] Compte suspendu temporairement",
      BAN:      "[NESTHUB] Compte banni définitivement",
      WARNING:  "[NESTHUB] Avertissement",
      ACTIVATE: "[NESTHUB] Compte réactivé",
      LOCK:     "[NESTHUB] Compte bloqué",
      UNLOCK:   "[NESTHUB] Compte débloqué",
      ESCALATE: "[NESTHUB] Évolution de sanction",
    };
    const subject = subjects[data.actionType] || "[NESTHUB] Notification concernant votre compte";
    return { subject, html };
  }
}

export const emailService = EmailService.getInstance();