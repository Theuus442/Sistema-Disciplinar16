import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

function sanitizeEnv(v?: string | null) {
  if (!v) return undefined as any;
  const t = v.trim().replace(/^['"]|['"]$/g, "");
  if (!t || t.toLowerCase() === "undefined" || t.toLowerCase() === "null") return undefined as any;
  return t;
}

const documentTypeNames: Record<string, string> = {
  advertencia: "Advertência Disciplinar",
  suspensao: "Suspensão Disciplinar",
  justa_causa: "Aviso de Dispensa por Justa Causa",
};

export const sendDocument: RequestHandler = async (req, res) => {
  try {
    if ((req.method || "").toUpperCase() !== "POST") {
      return res.status(405).json({ error: "Método não permitido." });
    }

    const body = (req.body || {}) as any;
    const process_id = String(body.process_id || "").trim();
    const document_type = String(body.document_type || "").trim();
    const html_content = String(body.html_content || "").trim();
    const recipients = Array.isArray(body.recipients) ? (body.recipients as string[]) : [];

    if (!process_id || !document_type || !html_content) {
      return res.status(400).json({ error: "process_id, document_type e html_content são obrigatórios" });
    }

    if (recipients.length === 0) {
      return res.status(200).json({ message: "Documento gerado, mas nenhum destinatário foi fornecido." });
    }

    const smtpHost = sanitizeEnv(process.env.SMTP_HOST);
    const smtpPort = Number(sanitizeEnv((process.env as any).SMTP_PORT) || 587);
    const smtpUser = sanitizeEnv(process.env.SMTP_USER);
    const smtpPass = sanitizeEnv(process.env.SMTP_PASS);
    const smtpFrom = sanitizeEnv(process.env.SMTP_FROM);
    const resendApiKey = sanitizeEnv(process.env.RESEND_API_KEY);

    const supabaseUrl = sanitizeEnv(process.env.SUPABASE_URL || (process.env as any).VITE_SUPABASE_URL);
    const serviceKey = sanitizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes no servidor" });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } } as any);

    // Buscar dados do processo para personalizar o email
    const { data: processData, error: processError } = await admin
      .from("processes")
      .select(`
        *,
        employees ( nome_completo )
      `)
      .eq("id", process_id)
      .single();

    if (processError) {
      return res.status(500).json({ error: "Erro ao buscar dados do processo", details: processError.message });
    }

    const documentTypeName = documentTypeNames[document_type] || "Documento Disciplinar";
    const employeeName = (processData as any)?.employees?.nome_completo || "Funcionário";

    const subject = `${documentTypeName} - ${employeeName}`;

    // HTML do email com o documento anexado
    const emailHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTypeName}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#f2f4f6;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f4f6;padding:20px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:1px solid #e8e5ef;box-shadow:0 4px 8px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding:20px 0;">
              <h1 style="color:#333333;margin:0;">Sistema Disciplinar</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;">
              <h2 style="color:#333333;text-align:center;">${documentTypeName}</h2>
              <p style="color:#555555;font-size:16px;line-height:1.5;">Olá,</p>
              <p style="color:#555555;font-size:16px;line-height:1.5;">Segue em anexo o documento disciplinar para <strong>${employeeName}</strong>. Este é um documento oficial que deve ser tratado com confidencialidade.</p>
              <p style="color:#555555;font-size:16px;line-height:1.5; margin-top:16px;">O documento foi gerado automaticamente pelo Sistema Disciplinar.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 40px;border-top:1px solid #e8e5ef;font-size:12px;color:#999999;">
              <p style="margin:0;">Este é um e-mail automático. Por favor, não responda.</p>
              <p style="margin:4px 0 0 0;">&copy; 2025 Sistema Disciplinar. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    console.info("sendDocument: sending", { to: recipients, subject, documentType: document_type });

    // Prefer SMTP if configured
    if (smtpHost && smtpUser && smtpPass && smtpFrom) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      } as any);

      const info = await transporter.sendMail({
        from: `Sistema Disciplinar <${smtpFrom}>`,
        to: recipients,
        subject,
        html: emailHtml,
        attachments: [
          {
            filename: `${documentTypeName.replace(/\s+/g, "_")}.html`,
            content: html_content,
            contentType: "text/html",
          },
        ],
      } as any);

      console.info("sendDocument: smtp send result", {
        messageId: info?.messageId,
        accepted: info?.accepted,
        rejected: info?.rejected,
      });
      return res.status(200).json({
        message: "Documento enviado com sucesso via SMTP!",
        info: { messageId: info?.messageId, accepted: info?.accepted, rejected: info?.rejected },
      });
    }

    // Fallback: Resend API
    if (!resendApiKey) {
      return res.status(500).json({ error: "RESEND_API_KEY ausente (ou configure SMTP_*)" });
    }

    const resendFrom = sanitizeEnv(process.env.RESEND_FROM) || "onboarding@resend.dev";

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Sistema Disciplinar <${resendFrom}>`,
        to: recipients,
        subject,
        html: emailHtml,
        attachments: [
          {
            filename: `${documentTypeName.replace(/\s+/g, "_")}.html`,
            content: Buffer.from(html_content).toString("base64"),
            content_type: "text/html",
          },
        ],
      }),
    });

    const json = await resp.json().catch(() => ({}));
    console.info("sendDocument: resend response", { status: resp.status, body: json });

    if (!resp.ok) {
      return res.status(500).json({
        error: json?.error || json?.message || "Falha ao enviar documento por email",
        details: json,
      });
    }

    return res.status(200).json({ message: "Documento enviado com sucesso!", id: json?.id || null, details: json });
  } catch (e: any) {
    console.error("sendDocument error:", e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
};
