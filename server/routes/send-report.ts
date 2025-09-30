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

    const resendApiKey = sanitizeEnv(process.env.RESEND_API_KEY);
    if (!resendApiKey) return res.status(500).json({ error: 'RESEND_API_KEY ausente (configure no ambiente da Vercel)' });

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

    const subject = `Processo Disciplinar Finalizado: ${(processData as any)?.employees?.nome_completo ?? ''}`;
    const html = `
      <h1>Relatório de Medida Disciplinar</h1>
      <p>O processo disciplinar para o funcionário <strong>${(processData as any)?.employees?.nome_completo ?? ''}</strong> foi finalizado.</p>
      <p><strong>Tipo de Desvio:</strong> ${(processData as any)?.tipo_desvio ?? ''}</p>
      <p><strong>Classificação:</strong> ${(processData as any)?.classificacao ?? ''}</p>
      <p><strong>Resolução Final:</strong> ${(processData as any)?.resolucao ?? ''}</p>
      <p><strong>Número da Ocorrência no SI:</strong> ${(processData as any)?.si_occurrence_number ?? ''}</p>
    `;

    // Send via Resend HTTP API to avoid SDK dependency
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sistema Disciplinar <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return res.status(500).json({ error: json?.error || json?.message || 'Falha ao enviar e-mail' });
    }

    return res.status(200).json({ message: 'Relatório enviado com sucesso!', id: json?.id || null });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
};
