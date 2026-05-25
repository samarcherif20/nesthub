// lib/brevo.ts
import * as brevo from "@getbrevo/brevo";

let apiInstance: brevo.TransactionalEmailsApi | null = null;

export function getBrevoClient() {
  if (!apiInstance) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }
    
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }
  return apiInstance;
}

export async function sendEmailBrevo({
  to,
  subject,
  htmlContent,
  textContent,
  replyTo,
}: {
  to: string | { email: string; name?: string };
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
}) {
  const client = getBrevoClient();
  
  const recipients = typeof to === "string" 
    ? [{ email: to }] 
    : [{ email: to.email, name: to.name }];

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = {
    email: process.env.BREVO_SENDER_EMAIL!,
    name: process.env.BREVO_SENDER_NAME,
  };
  sendSmtpEmail.to = recipients;
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.textContent = textContent || htmlContent.replace(/<[^>]*>/g, "");
  
  if (replyTo) {
    sendSmtpEmail.replyTo = { email: replyTo };
  }

  try {
    const response = await client.sendTransacEmail(sendSmtpEmail);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error("Brevo email error:", error);
    throw error;
  }
}