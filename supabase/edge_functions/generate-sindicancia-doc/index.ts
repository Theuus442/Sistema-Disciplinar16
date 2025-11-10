import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const templateSindicancia = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sindicância - INSTAURAÇÃO</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ddd;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
            font-size: 11pt;
        }
        p {
            margin-bottom: 1.2em;
        }
        hr {
            margin: 40px 0;
            border: 0;
            border-top: 2px solid #ccc;
        }
        .placeholder {
            color: #d9534f;
            font-weight: bold;
            background-color: #f9f9f9;
            padding: 2px 4px;
            border-radius: 3px;
        }
        .header {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 30px;
        }
        .signature-block {
            margin-top: 50px;
            text-align: center;
        }
        .signature-line {
            width: 300px;
            border-bottom: 1px solid #000;
            margin: 0 auto;
        }
        .commission-member {
            display: block;
            margin: 5px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <p>SINDICÂNCIA INTERNA – {{numero_sindicancia}}</p>
    </div>

    <p>{{cidade_data_atual}}. Portaria XX/2021.</p>
    
    <p style="text-align: center; font-weight: bold;">NOMEAÇÃO DA COMISSÃO</p>
    
    <p>A empresa xxxxxx através do(a) O(a) cargo, Sr.(a) {{nome_instituidor}}, CPF n.º {{cpf_instituidor}}, no uso de suas atribuições legais, institui por este instrumento, COMISSÃO DE SINDICÂNCIA INTERNA para apurar a suposta irregularidade trabalhista, pelo senhor(a) {{nome_colaborador}}.</p>
    
    <p>Fica estabelecida a seguinte formação de comissão:</p>
    <span class="commission-member">{{nome_presidente}} ({{cargo_presidente}}) – PRESIDENTE</span>
    <span class="commission-member">{{nome_secretario1}} ({{cargo_secretario1}}) - SECRETÁRIO I</span>
    <span class="commission-member">{{nome_secretario2}} ({{cargo_secretario2}}) SECRETÁRIO II – Advogado(a) OAB: PI Nº {{oab_secretario2}}</span>

    <div class="signature-block">
        <div class="signature-line"></div>
        <p>{{nome_presidente}} ({{cargo_presidente}})<br>PRESIDENTE</p>
    </div>

    <hr>

    <p style="text-align: center; font-weight: bold;">TERMO DE JUNTADA DE DOCUMENTOS</p>
    
    <p>No dia {{data_ata}} eu presidente da Sindicância Interna, que tem por objetivo apurar a suposta irregularidade trabalhista ocorrida, pelo Sr(a). {{nome_colaborador}}, CPF: {{cpf_colaborador}}, faço a juntada do seguinte documentos:</p>
    <ol>
        <li>Ofício 71/2017 – informando o ocorrido na escola.</li>
        <li>Imagens das câmeras</li>
        <li>Prints de conversas</li>
        <li>Termo de oitiva de testemunha</li>
        <li>Termo de oitiva do próprio funcionário</li>
    </ol>
    <p>O documento que ora se junta será parte integrante do presente processo de Sindicância Interna auxiliará na formação do juízo de valor apresentado na conclusão deste trabalho.</p>

    <div class="signature-block">
        <div class="signature-line"></div>
        <p>{{nome_presidente}} ({{cargo_presidente}})<br>PRESIDENTE</p>
    </div>
    
    <hr>

    <p style="text-align: center; font-weight: bold;">ATA DE INSTALAÇÃO E INÍCIO DOS TRABALHOS (OITIVA DE TESTEMUNHA)</p>
    
    <p>No dia {{data_ata}} às {{hora_ata}}, reuniram-se os membros desta Comissão de Sindicância Interna: {{nome_presidente}} ({{cargo_presidente}}) – PRESIDENTE, {{nome_secretario1}} ({{cargo_secretario1}})-SECRETÁRIO I, {{nome_secretario2}} ({{cargo_secretario2}}) SECRETÁRIO II – Advogado(a) OAB: PI Nº {{oab_secretario2}} membros da COMISSÃO DE SINCÂNCIA INTERNA Nº. {{numero_sindicancia}} com o objetivo de apurar suposta irregularidade trabalhista cometida pelo EMPREGADO {{nome_colaborador}} CPF Nº {{cpf_colaborador}}. Instalada a Comissão e iniciados os trabalhos na sala de Reuniões da empresa XXX, foi ouvido a testemunha Sr.(a) {{nome_testemunha}}, CPF Nº {{cpf_testemunha}} que neste ato, deu o seguinte depoimento: que ...; que não tem mais nada a declarar.</p>
    
    <div class="signature-block">
        <div class="signature-line"></div>
        <p>{{nome_presidente}} ({{cargo_presidente}}) (assinatura) – PRESIDENTE</p>
    </div>
    <div class="signature-block">
        <div class="signature-line"></div>
        <p>{{nome_secretario1}} ({{cargo_secretario1}}) (assinatura)- SECRETÁRIO I</p>
    </div>
    <div class="signature-block">
        <div class="signature-line"></div>
        <p>{{nome_secretario2}} ({{cargo_secretario2}}) (assinatura) SECRETÁRIO II – Advogado(a) OAB: PI Nº {{oab_secretario2}}</p>
    </div>

    <hr>
    
    <p style="text-align: center; font-weight: bold;">ATA DE INSTALAÇÃO E INÍCIO DOS TRABALHOS (OITIVA DO SINDICADO)</p>
    
    <p>No dia {{data_ata}} às {{hora_ata}}, reuniram-se os membros desta Comissão de Sindicância Interna: {{nome_presidente}} ({{cargo_presidente}}) – PRESIDENTE, {{nome_secretario1}} ({{cargo_secretario1}})-SECRETÁRIO I, {{nome_secretario2}} ({{cargo_secretario2}}) SECRETÁRIO II – Advogado(a) OAB: PI Nº {{oab_secretario2}} membros da COMISSÃO DE SINCÂNCIA INTERNA Nº. {{numero_sindicancia}} com o objetivo de apurar suposta irregularidade trabalhista cometida pelo EMPREGADO {{nome_colaborador}} CPF Nº {{cpf_colaborador}}. Instalada a Comissão e iniciados os trabalhos na sala de Reuniões da empresa XXX, foi ouvido o sindicado e neste ato, deu o seguinte depoimento: que ...; que não tem mais nada a declarar.</p>

    <div class="signature-block">
        <div class="signature-line"></div>
        <p>{{nome_presidente}} ({{cargo_presidente}}) (assinatura) – PRESIDENTE</p>
    </div>
    <div class="signature-block">
        <div class="signature-line"></div>
        <p>{{nome_secretario1}} ({{cargo_secretario1}}) (assinatura)- SECRETÁRIO(A) I</p>
    </div>
    <div class="signature-block">
        <div class="signature-line"></div>
        <p>{{nome_secretario2}} ({{cargo_secretario2}}) (assinatura) SECRETÁRIO(A) II – Advogado(a) OAB: PI Nº {{oab_secretario2}}</p>
    </div>
    
</body>
</html>`

const templates = {
  sindicancia: templateSindicancia
}

function fillTemplate(template: string, data: Record<string, string>): string {
  let filledTemplate = template
  for (const key in data) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    const value = data[key] === null || data[key] === undefined ? '' : String(data[key])
    filledTemplate = filledTemplate.replace(regex, value)
  }
  filledTemplate = filledTemplate.replace(/{{\s*[^}]+\s*}}/g, '[PENDENTE]')
  return filledTemplate
}

function formatDateTime(date: Date, fusoHorario: string) {
  if (!date || isNaN(date.getTime())) {
    return {
      data: 'N/A',
      hora: 'N/A',
      cidadeEData: 'Teresina/Piauí, [data]'
    }
  }

  const dataFormatador = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const horaFormatador = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    hour: '2-digit',
    minute: '2-digit'
  })

  const cidadeFormatador = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return {
    data: dataFormatador.format(date),
    hora: horaFormatador.format(date),
    cidadeEData: `Teresina/Piauí, ${cidadeFormatador.format(date)}`
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { process_id } = await req.json()

    if (!process_id) {
      throw new Error('ID do processo (process_id) é obrigatório.')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    // 1. Buscar o processo e o funcionário
    const { data: processData, error: processError } = await supabaseAdmin
      .from('processes')
      .select('*, employees ( nome_completo, cargo, setor )')
      .eq('id', process_id)
      .single()

    if (processError || !processData) {
      throw processError || new Error('Processo não encontrado.')
    }

    // 2. Buscar a sindicância e seus membros/testemunhas
    const { data: sindicanciaData, error: sindicanciaError } = await supabaseAdmin
      .from('sindicancias')
      .select('*, comissao_membros(*), sindicancia_testemunhas(*)')
      .eq('process_id', process_id)
      .single()

    if (sindicanciaError || !sindicanciaData) {
      throw sindicanciaError || new Error('Sindicância não encontrada para este processo.')
    }

    // 3. Preparar os dados do template
    const fusoHorario = 'America/Sao_Paulo'
    // Use created_at from sindicancia table (not data_instauracao which doesn't exist)
    let dataInstauracao: Date
    try {
      dataInstauracao = sindicanciaData.created_at ? new Date(sindicanciaData.created_at) : new Date()
      // Validate the date
      if (isNaN(dataInstauracao.getTime())) {
        dataInstauracao = new Date()
      }
    } catch {
      dataInstauracao = new Date()
    }
    const { data, hora, cidadeEData } = formatDateTime(dataInstauracao, fusoHorario)

    // Encontrar membros da comissão
    const presidente = (sindicanciaData.comissao_membros as any[]).find(
      (m) => m.funcao_comissao === 'Presidente'
    )
    const secretario1 = (sindicanciaData.comissao_membros as any[]).find(
      (m) => m.funcao_comissao === 'Secretário I'
    )
    const secretario2 = (sindicanciaData.comissao_membros as any[]).find(
      (m) => m.funcao_comissao === 'Secretário II'
    )

    // Pegar a primeira testemunha
    const testemunha = (sindicanciaData.sindicancia_testemunhas as any[]).length > 0
      ? (sindicanciaData.sindicancia_testemunhas as any[])[0]
      : null

    const templateData = {
      numero_sindicancia: sindicanciaData.numero_sindicancia || '',
      cidade_data_atual: cidadeEData || 'Teresina/Piauí, [data]',
      nome_instituidor: sindicanciaData.nome_instituidor || '',
      cpf_instituidor: sindicanciaData.cpf_instituidor || '',
      nome_colaborador: (processData as any).employees?.nome_completo || '',
      cpf_colaborador: (processData as any).cpf || (processData as any).employees?.cpf || '',
      nome_presidente: presidente?.nome || 'Sr(a). [Nome do Presidente]',
      cargo_presidente: presidente?.cargo || '[Cargo]',
      nome_secretario1: secretario1?.nome || 'Sr(a). [Nome - Secretário I]',
      cargo_secretario1: secretario1?.cargo || '[Cargo]',
      nome_secretario2: secretario2?.nome || 'Sr(a). [Nome - Secretário II]',
      cargo_secretario2: secretario2?.cargo || '[Cargo]',
      oab_secretario2: secretario2?.oab || '',
      data_ata: data,
      hora_ata: hora,
      nome_testemunha: testemunha?.nome || 'Sr(a). [Nome da Testemunha]',
      cpf_testemunha: testemunha?.cpf || ''
    }

    // 4. Preencher o template
    const filledHtml = fillTemplate(templates.sindicancia, templateData)

    // 5. Retornar o HTML
    return new Response(filledHtml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      status: 200
    })
  } catch (error: any) {
    console.error('generate-sindicancia-doc error:', error)
    const errorHtml = `<html><body><h1>Error</h1><p>${error?.message || String(error)}</p></body></html>`
    return new Response(errorHtml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      status: 200
    })
  }
})
