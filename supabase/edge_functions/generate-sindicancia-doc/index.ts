import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const sindicanciaTermo = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termo de Instauração de Sindicância</title>
  <style>
    body { 
      font-family: 'Arial', sans-serif; 
      line-height: 1.5; 
      color: #333; 
      margin: 40px; 
      max-width: 900px;
    }
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    .header h1 { 
      margin: 0 0 10px 0; 
      font-size: 20px;
      text-transform: uppercase;
    }
    .header p { 
      margin: 5px 0; 
      font-size: 11px;
    }
    .section { 
      margin-bottom: 25px; 
    }
    .section-title { 
      font-weight: bold; 
      text-decoration: underline; 
      margin: 20px 0 10px 0; 
      font-size: 12px;
      text-transform: uppercase;
    }
    .section-content {
      margin-left: 20px;
      font-size: 11px;
    }
    p { margin: 8px 0; }
    .text-justify { text-align: justify; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 11px;
    }
    table td, table th {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .signature-section { 
      margin-top: 60px; 
      display: flex;
      justify-content: space-around;
    }
    .signature-block {
      text-align: center;
      font-size: 11px;
    }
    .signature-line { 
      border-top: 1px solid #000; 
      width: 250px; 
      margin-top: 40px;
      margin-bottom: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 10px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TERMO DE INSTAURAÇÃO DE SINDICÂNCIA</h1>
    <p>Número: {{numero_sindicancia}}</p>
    <p>Data: {{data_atual}}</p>
  </div>

  <div class="section">
    <div class="section-title">1. DADOS DA SINDICÂNCIA</div>
    <div class="section-content">
      <p><strong>Número da Sindicância:</strong> {{numero_sindicancia}}</p>
      <p><strong>Instituidor:</strong> {{nome_instituidor}}</p>
      <p><strong>CPF Instituidor:</strong> {{cpf_instituidor}}</p>
      <p><strong>Data de Instauração:</strong> {{data_atual}}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. MEMBROS DA COMISSÃO DE SINDICÂNCIA</div>
    <div class="section-content">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cargo</th>
            <th>Função na Comissão</th>
            <th>OAB (se aplicável)</th>
          </tr>
        </thead>
        <tbody>
          {{membros_table}}
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. TESTEMUNHAS</div>
    <div class="section-content">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
          </tr>
        </thead>
        <tbody>
          {{testemunhas_table}}
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. OBJETO DA SINDICÂNCIA</div>
    <div class="section-content">
      <p class="text-justify">
        Por este termo, fica instaurada sindicância para apuração dos fatos relacionados ao processo disciplinar, 
        conforme procedimentos estabelecidos pela empresa. A comissão de sindicância, designada acima, 
        deverá proceder à investigação, coleta de provas e depoimentos, a fim de formar parecer circunstanciado 
        sobre os fatos apurados.
      </p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">5. PROCEDIMENTO</div>
    <div class="section-content">
      <p class="text-justify">
        A comissão de sindicância deverá seguir as normas internas de procedimento disciplinar, 
        garantindo direito de defesa a todas as partes envolvidas, e deverá concluir seus trabalhos 
        no prazo estabelecido pela legislação aplicável e pelas políticas da empresa.
      </p>
    </div>
  </div>

  <div class="signature-section">
    <div class="signature-block">
      <div>Instituidor da Sindicância:</div>
      <div class="signature-line"></div>
      <div>{{nome_instituidor}}</div>
    </div>
    <div class="signature-block">
      <div>Presidente da Comissão:</div>
      <div class="signature-line"></div>
      <div>{{presidente_nome}}</div>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado automaticamente pelo Sistema de Recursos Humanos</p>
    <p>Data de Geração: {{data_atual}}</p>
  </div>
</body>
</html>`

function fillTemplate(template: string, data: Record<string, string>): string {
  let filled = template
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    filled = filled.replace(new RegExp(placeholder, 'g'), value || '')
  })
  return filled
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { process_id } = await req.json()

    if (!process_id) {
      return new Response(JSON.stringify({ error: 'process_id é obrigatório' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    // Fetch sindicância data
    const { data: sindicancias, error: sindError } = await supabaseAdmin
      .from('sindicancias')
      .select(`
        *,
        comissao_membros (*),
        sindicancia_testemunhas (*)
      `)
      .eq('process_id', process_id)
      .single()

    if (sindError || !sindicancias) {
      return new Response(JSON.stringify({ error: 'Sindicância não encontrada para este processo', details: sindError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Format date
    const dataAtual = new Date()
    const fusoHorario = 'America/Sao_Paulo'
    const formatadorData = new Intl.DateTimeFormat('pt-BR', { timeZone: fusoHorario })

    // Build members table
    const membrosTable = (sindicancias.comissao_membros || [])
      .map((m: any) => {
        return `<tr>
          <td>${m.nome || ''}</td>
          <td>${m.cargo || ''}</td>
          <td>${m.funcao_comissao || ''}</td>
          <td>${m.oab || '—'}</td>
        </tr>`
      })
      .join('')

    // Build witnesses table
    const testemunhasTable = (sindicancias.sindicancia_testemunhas || [])
      .map((t: any) => {
        return `<tr>
          <td>${t.nome || ''}</td>
          <td>${t.cpf || ''}</td>
        </tr>`
      })
      .join('')

    // Get president name (first member with "Presidente" function or first member)
    const presidente = (sindicancias.comissao_membros || []).find((m: any) => m.funcao_comissao === 'Presidente')
    const presidenteNome = presidente?.nome || (sindicancias.comissao_membros && sindicancias.comissao_membros[0]?.nome) || 'N/A'

    const templateData = {
      numero_sindicancia: sindicancias.numero_sindicancia || '',
      nome_instituidor: sindicancias.nome_instituidor || '',
      cpf_instituidor: sindicancias.cpf_instituidor || '',
      presidente_nome: presidenteNome,
      data_atual: formatadorData.format(dataAtual),
      membros_table: membrosTable,
      testemunhas_table: testemunhasTable,
    }

    const filledHtml = fillTemplate(sindicanciaTermo, templateData)

    return new Response(filledHtml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      status: 200,
    })
  } catch (error: any) {
    console.error('generate-sindicancia-doc error:', error)
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
