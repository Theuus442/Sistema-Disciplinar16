import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

function sanitizeEnv(v?: string | null) {
  if (!v) return undefined as any;
  const t = v.trim().replace(/^['"]|['"]$/g, "");
  if (!t || t.toLowerCase() === "undefined" || t.toLowerCase() === "null") return undefined as any;
  return t;
}

function createFetchWithTimeout(defaultMs = 8000) {
  return async (input: any, init?: any) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), init?.timeout ?? defaultMs);
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      return res as any;
    } finally {
      clearTimeout(id);
    }
  };
}

export const sendProcessReport: RequestHandler = async (req, res) => {
  try {
    if ((req.method || '').toUpperCase() !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido.' });
    }

    const body = (req.body || {}) as any;
    const process_id = String(body.process_id || body.id || '').trim();
    const recipients = Array.isArray(body.recipients) ? body.recipients as string[] : [];
    if (!process_id) return res.status(400).json({ error: 'process_id obrigatório' });

    const smtpHost = sanitizeEnv(process.env.SMTP_HOST);
    const smtpPort = Number(sanitizeEnv((process.env as any).SMTP_PORT) || 587);
    const smtpUser = sanitizeEnv(process.env.SMTP_USER);
    const smtpPass = sanitizeEnv(process.env.SMTP_PASS);
    const smtpFrom = sanitizeEnv(process.env.SMTP_FROM);

    const resendApiKey = sanitizeEnv(process.env.RESEND_API_KEY);

    const supabaseUrl = sanitizeEnv(process.env.SUPABASE_URL || (process.env as any).VITE_SUPABASE_URL);
    const serviceKey = sanitizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes no servidor' });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false }, global: { fetch: createFetchWithTimeout(8000) } as any });

    const { data: processData, error: processError } = await admin
      .from('processes')
      .select(`
        *,
        employees ( nome_completo )
      `)
      .eq('id', process_id)
      .single();

    if (processError) return res.status(500).json({ error: processError.message });

    const recFromBody = (recipients || []).filter(Boolean).map((r) => r.trim()).filter((r) => r.length > 0);
    const recFromRow = [
      (processData as any)?.notification_email_1,
      (processData as any)?.notification_email_2,
      (processData as any)?.notification_email_3,
    ].filter(Boolean).map((e: string) => e.trim()).filter((e: string) => e.length > 0);

    const to = recFromBody.length > 0 ? recFromBody : recFromRow;
    if (to.length === 0) return res.status(200).json({ message: 'Processo finalizado, mas nenhum e-mail de notificação foi fornecido.' });

    // Allow caller to provide overrides (useful when sending immediately without saving the process)
    const overrides = (body && typeof body === 'object' ? body.overrides || {} : {}) as any;
    const tipoDesvio = overrides.tipo_desvio ?? (processData as any)?.tipo_desvio ?? '';
    const classificacao = overrides.classificacao ?? (processData as any)?.classificacao ?? 'Leve';
    const resolucaoFinal = overrides.resolucao ?? (processData as any)?.resolucao ?? '';
    const siOccurrence = overrides.si_occurrence_number ?? (processData as any)?.si_occurrence_number ?? '';
    const parecerJuridico = overrides.parecer_juridico ?? null;

    const subject = `Processo Disciplinar Finalizado: ${(processData as any)?.employees?.nome_completo ?? ''}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Medida Disciplinar</title>
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
              <h2 style="color:#333333;text-align:center;">Relatório de Medida Disciplinar</h2>
              <p style="color:#555555;font-size:16px;line-height:1.5;">Olá,</p>
              <p style="color:#555555;font-size:16px;line-height:1.5;">O processo disciplinar para o funcionário <strong>${(processData as any)?.employees?.nome_completo ?? ''}</strong> foi finalizado. Abaixo seguem as informações registradas:</p>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:10px;margin-bottom:10px;">
                <tr>
                  <td style="padding:8px 0;"><strong>Tipo de Desvio:</strong></td>
                  <td style="padding:8px 0;">${tipoDesvio ?? ''}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;"><strong>Classificação:</strong></td>
                  <td style="padding:8px 0;">${classificacao ?? 'Leve'}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;"><strong>Resolução Final:</strong></td>
                  <td style="padding:8px 0;">${resolucaoFinal ?? ''}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;"><strong>Número da Ocorrência no SI:</strong></td>
                  <td style="padding:8px 0;">${siOccurrence ?? ''}</td>
                </tr>
              </table>

              ${parecerJuridico ? `<div style="margin-top:12px;padding:12px;border-radius:6px;background:#fafafa;border:1px solid #eee;"><h3 style="margin:0 0 8px 0;color:#333333;">Parecer Jurídico</h3><div style="color:#555555;font-size:15px;line-height:1.5;">${parecerJuridico}</div></div>` : ''}

              <p style="color:#555555;font-size:16px;line-height:1.5;margin-top:16px;">Caso precise reenviar o relatório ou obter informações adicionais, entre em contato com o setor responsável.</p>
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

    // Prefer SMTP if configured (works on Vercel)
    // Log attempt
    console.info('sendProcessReport: sending', { to, subject, recipientsCount: Array.isArray(to) ? to.length : 1 });

    if (smtpHost && smtpUser && smtpPass && smtpFrom) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      } as any);

      const info = await transporter.sendMail({
        from: `Sistema Disciplinar <${smtpFrom}>`,
        to,
        subject,
        html,
      } as any);

      console.info('sendProcessReport: smtp send result', { messageId: info?.messageId, accepted: info?.accepted, rejected: info?.rejected });
      return res.status(200).json({ message: 'Relatório enviado com sucesso via SMTP!', info: { messageId: info?.messageId, accepted: info?.accepted, rejected: info?.rejected } });
    }

    // Fallback: Resend API
    if (!resendApiKey) return res.status(500).json({ error: 'RESEND_API_KEY ausente (ou configure SMTP_*)' });
    const resendFrom = sanitizeEnv(process.env.RESEND_FROM) || 'onboarding@resend.dev';

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Sistema Disciplinar <${resendFrom}>`,
        to,
        subject,
        html,
      }),
    });

    const json = await resp.json().catch(() => ({}));
    console.info('sendProcessReport: resend response', { status: resp.status, body: json });
    if (!resp.ok) {
      return res.status(500).json({ error: json?.error || json?.message || 'Falha ao enviar e-mail', details: json });
    }

    return res.status(200).json({ message: 'Relatório enviado com sucesso!', id: json?.id || null, details: json });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
};
