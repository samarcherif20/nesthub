// lib/contact-email.service.ts
import nodemailer from "nodemailer";

class ContactEmailService {
  private static instance: ContactEmailService;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {
    this.initTransporter();
  }

  static getInstance() {
    if (!ContactEmailService.instance) {
      ContactEmailService.instance = new ContactEmailService();
    }
    return ContactEmailService.instance;
  }

  private initTransporter() {
    if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_PASSWORD) {
      console.log("Mode simulation - Pas d'envoi réel");
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_SERVER || "smtp-relay.brevo.com",
      port: Number(process.env.BREVO_SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_PASSWORD,
      },
    });
  }

  async sendReply(toEmail: string, toName: string, replyMessage: string, originalMessage: string): Promise<void> {
    if (!this.transporter) {
      console.log("Email non envoyé (simulation):", { toEmail, toName });
      return;
    }

    const fromEmail = process.env.BREVO_FROM_EMAIL || "noreply@nesthub.com";
    const fromName = process.env.BREVO_FROM_NAME || "NESTHUB Support";
    const currentYear = new Date().getFullYear();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réponse de NESTHUB</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            padding: 32px 40px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.3px;
          }
          .header p {
            color: #c7d2fe;
            font-size: 14px;
            margin-top: 8px;
          }
          .content {
            padding: 40px;
          }
          .greeting {
            margin-bottom: 24px;
          }
          .greeting p {
            font-size: 15px;
            color: #334155;
            margin-bottom: 8px;
          }
          .greeting strong {
            color: #1e293b;
            font-weight: 600;
          }
          .message-card {
            background-color: #f8fafc;
            border-left: 4px solid #4f46e5;
            padding: 20px 24px;
            margin: 24px 0;
            border-radius: 8px;
          }
          .message-card p {
            font-size: 15px;
            color: #334155;
            line-height: 1.7;
          }
          .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 28px 0;
          }
          .original-message {
            background-color: #f1f5f9;
            padding: 20px 24px;
            border-radius: 8px;
            margin-top: 24px;
          }
          .original-message h4 {
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
          }
          .original-message p {
            font-size: 14px;
            color: #475569;
            font-style: italic;
            line-height: 1.6;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 8px;
          }
          .footer a {
            color: #4f46e5;
            text-decoration: none;
            font-size: 12px;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            padding: 10px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            margin-top: 16px;
          }
          .btn:hover {
            background-color: #4338ca;
          }
          @media (max-width: 600px) {
            .content { padding: 24px; }
            .header { padding: 24px; }
            .footer { padding: 20px 24px; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 32px 16px; background-color: #f8fafc;">
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>NESTHUB</h1>
            <p>Plateforme de confiance</p>
          </div>
          
          <!-- Content -->
          <div class="content">
            <div class="greeting">
              <p>Bonjour <strong>${toName}</strong>,</p>
              <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
            </div>
            
            <p style="font-size: 14px; color: #475569; margin-bottom: 8px;">Voici notre réponse :</p>
            
            <div class="message-card">
              <p>${replyMessage.replace(/\n/g, "<br/>")}</p>
            </div>
            
            <div class="divider"></div>
            
            <div class="original-message">
              <h4>Rappel de votre message initial</h4>
              <p>"${originalMessage.substring(0, 300)}${originalMessage.length > 300 ? "..." : ""}"</p>
            </div>
            
            <p style="font-size: 13px; color: #475569; margin-top: 24px;">
              Si vous avez d'autres questions, n'hésitez pas à répondre directement à cet email.
            </p>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>© ${currentYear} NESTHUB - Tous droits réservés</p>
            <p>
              <a href="#">Conditions d'utilisation</a>
              &nbsp;•&nbsp;
              <a href="#">Confidentialité</a>
              &nbsp;•&nbsp;
              <a href="#">Centre d'aide</a>
            </p>
            <p style="font-size: 11px; margin-top: 12px;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: `NESTHUB : Réponse à votre demande`,
      html,
    });
  }
}

export const contactEmailService = ContactEmailService.getInstance();