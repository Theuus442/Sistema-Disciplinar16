import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Templates for different document types
const advertenciaTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Advertência Disciplinar</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { margin: 0; font-size: 24px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; text-decoration: underline; margin-top: 20px; margin-bottom: 10px; }
    .signature-section { margin-top: 60px; }
    .signature-line { border-top: 1px solid #000; width: 300px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ADVERTÊNCIA DISCIPLINAR</h1>
  </div>

  <div class="section">
    <p><strong>Funcionário:</strong> {{nome_colaborador}}</p>
    <p><strong>Cargo:</strong> {{cargo_colaborador}}</p>
    <p><strong>Setor:</strong> {{setor_colaborador}}</p>
    <p><strong>Data:</strong> {{data_atual}}</p>
  </div>

  <div class="section">
    <div class="section-title">DESCRIÇÃO DO COMPORTAMENTO INADEQUADO</div>
    <p><strong>Tipo de Desvio:</strong> {{tipo_desvio_nome}}</p>
    <p><strong>Classificação:</strong> {{classificacao_desvio}}</p>
    <p><strong>Período:</strong> {{periodo_ocorrencia}}</p>
    <p><strong>Data da Ocorrência:</strong> {{data_da_ocorrencia}}</p>
    <p><strong>Descrição:</strong></p>
    <p>{{descricao_desvio}}</p>
  </div>

  <div class="section">
    <div class="section-title">DISPOSIÇÕES CONTRATUAIS VIOLADAS</div>
    <p>{{clt_alinea}}</p>
  </div>

  <div class="section">
    <div class="section-title">MEDIDA DISCIPLINAR</div>
    <p>Por meio desta, comunicamos que foi aplicada uma ADVERTÊNCIA DISCIPLINAR, conforme previsto em nossa política de recursos humanos.</p>
    <p>Esperamos que este funcionário cumpra rigorosamente com as normas e regulamentos da empresa, evitando comportamentos similares no futuro.</p>
  </div>

  <div class="section">
    <div class="section-title">OBSERVAÇÕES</div>
    <p>{{resolucao_final}}</p>
  </div>

  <div class="signature-section">
    <div>Assinado por:</div>
    <div class="signature-line">{{nome_assinatura}}</div>
    <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #999;">
      <p>Documento gerado automaticamente pelo Sistema Disciplinar</p>
    </div>
  </div>
</body>
</html>`

const suspensaoTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suspensão Disciplinar</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { margin: 0; font-size: 24px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; text-decoration: underline; margin-top: 20px; margin-bottom: 10px; }
    .signature-section { margin-top: 60px; }
    .signature-line { border-top: 1px solid #000; width: 300px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SUSPENSÃO DISCIPLINAR</h1>
  </div>

  <div class="section">
    <p><strong>Funcionário:</strong> {{nome_colaborador}}</p>
    <p><strong>Cargo:</strong> {{cargo_colaborador}}</p>
    <p><strong>Setor:</strong> {{setor_colaborador}}</p>
    <p><strong>Data:</strong> {{data_atual}}</p>
  </div>

  <div class="section">
    <div class="section-title">DESCRIÇÃO DO COMPORTAMENTO INADEQUADO</div>
    <p><strong>Tipo de Desvio:</strong> {{tipo_desvio_nome}}</p>
    <p><strong>Classificação:</strong> {{classificacao_desvio}}</p>
    <p><strong>Período:</strong> {{periodo_ocorrencia}}</p>
    <p><strong>Data da Ocorrência:</strong> {{data_da_ocorrencia}}</p>
    <p><strong>Descrição:</strong></p>
    <p>{{descricao_desvio}}</p>
  </div>

  <div class="section">
    <div class="section-title">DISPOSIÇÕES CONTRATUAIS VIOLADAS</div>
    <p>{{clt_alinea}}</p>
  </div>

  <div class="section">
    <div class="section-title">MEDIDA DISCIPLINAR - SUSPENSÃO</div>
    <p>Por meio desta, comunicamos que foi aplicada uma SUSPENSÃO DISCIPLINAR pelo período de <strong>{{dias_suspensao_numero}} ({{dias_suspensao_extenso}})</strong> dias.</p>
    <p><strong>Período de Suspensão:</strong> A partir da presente data até {{data_retorno_suspensao}}</p>
    <p>Durante este período, o funcionário deverá se afastar do local de trabalho e não receberá remuneração pelas horas trabalhadas.</p>
  </div>

  <div class="section">
    <div class="section-title">OBSERVAÇÕES</div>
    <p>{{resolucao_final}}</p>
  </div>

  <div class="signature-section">
    <div>Assinado por:</div>
    <div class="signature-line">{{nome_assinatura}}</div>
    <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #999;">
      <p>Documento gerado automaticamente pelo Sistema Disciplinar</p>
    </div>
  </div>
</body>
</html>`

const justaCausaTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviso de Dispensa por Justa Causa</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { margin: 0; font-size: 24px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; text-decoration: underline; margin-top: 20px; margin-bottom: 10px; }
    .signature-section { margin-top: 60px; }
    .signature-line { border-top: 1px solid #000; width: 300px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AVISO DE DISPENSA POR JUSTA CAUSA</h1>
  </div>

  <div class="section">
    <p><strong>Funcionário:</strong> {{nome_colaborador}}</p>
    <p><strong>Cargo:</strong> {{cargo_colaborador}}</p>
    <p><strong>Setor:</strong> {{setor_colaborador}}</p>
    <p><strong>Data:</strong> {{data_atual}}</p>
  </div>

  <div class="section">
    <div class="section-title">DESCRIÇÃO DO COMPORTAMENTO INADEQUADO</div>
    <p><strong>Tipo de Desvio:</strong> {{tipo_desvio_nome}}</p>
    <p><strong>Classificação:</strong> {{classificacao_desvio}}</p>
    <p><strong>Período:</strong> {{periodo_ocorrencia}}</p>
    <p><strong>Data da Ocorrência:</strong> {{data_da_ocorrencia}}</p>
    <p><strong>Descrição:</strong></p>
    <p>{{descricao_desvio}}</p>
  </div>

  <div class="section">
    <div class="section-title">DISPOSIÇÕES CONTRATUAIS VIOLADAS</div>
    <p>{{clt_alinea}}</p>
  </div>

  <div class="section">
    <div class="section-title">MEDIDA DISCIPLINAR - DISPENSA POR JUSTA CAUSA</div>
    <p>Por meio desta, comunicamos que o contrato de trabalho foi rescindido <strong>POR JUSTA CAUSA</strong>, conforme artigos do Código Civil e direito trabalhista, em razão do comportamento inadequado descrito acima.</p>
    <p>Esta dispensa implica na perda do emprego e na rescisão imediata do contrato de trabalho.</p>
  </div>

  <div class="section">
    <div class="section-title">DIREITOS E OBRIGAÇÕES</div>
    <p>O funcionário terá direito aos valores proporcionais devidos conforme legislação trabalhista vigente. Qualquer dúvida ou contestação deverá ser apresentada conforme procedimentos legais estabelecidos.</p>
  </div>

  <div class="section">
    <div class="section-title">OBSERVAÇÕES</div>
    <p>{{resolucao_final}}</p>
  </div>

  <div class="signature-section">
    <div>Assinado por:</div>
    <div class="signature-line">{{nome_assinatura}}</div>
    <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #999;">
      <p>Documento gerado automaticamente pelo Sistema Disciplinar</p>
    </div>
  </div>
</body>
</html>`

const templates = {
  advertencia: advertenciaTemplate,
  suspensao: suspensaoTemplate,
  justa_causa: justaCausaTemplate,
}

function fillTemplate(template: string, data: Record<string, string>): string {
  let filled = template
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    filled = filled.replace(new RegExp(placeholder, 'g'), value || '')
  })
  return filled
}

function numeroParaExtenso(num: number): string {
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']

  if (num === 0) return 'zero'
  if (num < 10) return unidades[num]
  if (num < 20) return especiais[num - 10]
  if (num < 100) {
    const d = Math.floor(num / 10)
    const u = num % 10
    return u === 0 ? dezenas[d] : `${dezenas[d]} e ${unidades[u]}`
  }
  if (num < 1000) {
    const c = Math.floor(num / 100)
    const resto = num % 100
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']
    return resto === 0 ? centenas[c] : `${centenas[c]} e ${numeroParaExtenso(resto)}`
  }
  return String(num)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { process_id, document_type } = await req.json()

    if (!process_id || !document_type || !templates[document_type as keyof typeof templates]) {
      const errorHtml = '<html><body><h1>Error</h1><p>process_id e document_type válidos são obrigatórios</p></body></html>'
      return new Response(errorHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        status: 200,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceKey) {
      const errorHtml = '<html><body><h1>Error</h1><p>SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes</p></body></html>'
      return new Response(errorHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        status: 200,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const { data: processData, error: processError } = await supabaseAdmin
      .from('processes')
      .select(`
        *,
        employees ( nome_completo, cargo, setor ),
        misconduct_types ( name )
      `)
      .eq('id', process_id)
      .single()

    if (processError) {
      const errorHtml = `<html><body><h1>Error</h1><p>Processo não encontrado: ${processError.message}</p></body></html>`
      return new Response(errorHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        status: 200,
      })
    }

    if (!processData) {
      const errorHtml = '<html><body><h1>Error</h1><p>Dados do processo não encontrados</p></body></html>'
      return new Response(errorHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        status: 200,
      })
    }

    // Format dates
    const dataAtual = new Date()
    const fusoHorario = 'America/Sao_Paulo'
    const formatadorData = new Intl.DateTimeFormat('pt-BR', { timeZone: fusoHorario })

    // Parse occurrence dates
    const inicioOcorrencia = (processData as any).occurrence_date_start ? new Date((processData as any).occurrence_date_start) : null
    const fimOcorrencia = (processData as any).occurrence_date_end ? new Date((processData as any).occurrence_date_end) : null

    const periodoOcorrenciaStr = inicioOcorrencia && fimOcorrencia
      ? `${formatadorData.format(inicioOcorrencia)} a ${formatadorData.format(fimOcorrencia)}`
      : inicioOcorrencia
        ? formatadorData.format(inicioOcorrencia)
        : 'N/A'

    // Calculate suspension return date if applicable
    const diasSuspensao = (processData as any).suspension_days ?? 0
    const dataRetornoSuspensao = diasSuspensao > 0 && inicioOcorrencia
      ? formatadorData.format(addDays(dataAtual, diasSuspensao))
      : 'N/A'

    // Get misconduct type name
    const misconductTypeName = (processData as any)?.misconduct_types?.name || (processData as any)?.tipo_desvio || 'N/A'

    // CLT article reference
    const cltAlinea = (processData as any).clt_alinea || 'Conforme disposições do contrato de trabalho e legislação vigente'

    // Signature name - get from user profile or default
    let nomeAssinatura = (processData as any).signature_name || 'Setor Jurídico'

    const templateData = {
      nome_colaborador: (processData as any).employees?.nome_completo || 'N/A',
      cargo_colaborador: (processData as any).employees?.cargo || 'N/A',
      setor_colaborador: (processData as any).employees?.setor || 'N/A',
      periodo_ocorrencia: periodoOcorrenciaStr,
      data_da_ocorrencia: inicioOcorrencia ? formatadorData.format(inicioOcorrencia) : 'N/A',
      tipo_desvio_nome: misconductTypeName,
      descricao_desvio: (processData as any).descricao || (processData as any).description || '',
      classificacao_desvio: (processData as any).classificacao || 'N/A',
      resolucao_final: (processData as any).resolucao || (processData as any).resolution || '',
      dias_suspensao_numero: String(diasSuspensao),
      dias_suspensao_extenso: numeroParaExtenso(diasSuspensao),
      data_retorno_suspensao: dataRetornoSuspensao,
      clt_alinea: cltAlinea,
      data_atual: formatadorData.format(dataAtual),
      nome_assinatura: nomeAssinatura,
    }

    const filledHtml = fillTemplate(templates[document_type as keyof typeof templates], templateData)

    return new Response(filledHtml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      status: 200,
    })
  } catch (error: any) {
    console.error('generate-document error:', error)
    const errorHtml = `<html><body><h1>Error</h1><p>${error?.message || String(error)}</p></body></html>`
    return new Response(errorHtml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      status: 200,
    })
  }
})
