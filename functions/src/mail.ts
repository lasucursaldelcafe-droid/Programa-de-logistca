import nodemailer from "nodemailer";

export interface MailCredentials {
  user: string;
  pass: string;
  fromName?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export function mailConfigured(creds: MailCredentials): boolean {
  return Boolean(creds.user?.trim() && creds.pass?.trim());
}

export async function sendMail(creds: MailCredentials, input: SendMailInput): Promise<void> {
  if (!mailConfigured(creds)) {
    throw new Error("Correo no configurado: faltan GMAIL_USER o GMAIL_APP_PASSWORD");
  }

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: creds.user.trim(),
      pass: creds.pass.trim(),
    },
  });

  await transport.sendMail({
    from: `"${creds.fromName ?? "SPE Negocio"}" <${creds.user.trim()}>`,
    to: input.to.trim(),
    subject: input.subject,
    text: input.text,
    html: input.html ?? undefined,
  });
}
