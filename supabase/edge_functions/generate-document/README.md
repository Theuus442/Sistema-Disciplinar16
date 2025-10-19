# Generate Document Edge Function

This Supabase Edge Function generates HTML disciplinary documents (advertência, suspensão, justa causa) based on process data stored in the database.

## Overview

The function fetches process and employee information from Supabase and generates a formatted HTML document that can be:
- Displayed in a browser preview
- Printed to PDF
- Sent via email through the `/api/send-document` endpoint

## Supported Document Types

- **advertencia**: Disciplinary warning
- **suspensao**: Suspension disciplinary action
- **justa_causa**: Dismissal for just cause

## Request

### Method
`POST`

### Body
```json
{
  "process_id": "uuid-of-process",
  "document_type": "advertencia" | "suspensao" | "justa_causa"
}
```

## Response

Returns HTML content as `text/html` on success, or JSON error on failure.

### Success (200)
```
<!DOCTYPE html>
<html>
  ...generated document HTML...
</html>
```

### Error (400, 404, 500)
```json
{
  "error": "Error message",
  "details": "Additional details if applicable"
}
```

## Database Schema Dependencies

The function requires the following Supabase tables and columns:

### processes
- `id` (uuid)
- `occurrence_date_start` (date)
- `occurrence_date_end` (date)
- `suspension_days` (integer)
- `descricao` or `description` (text)
- `classificacao` (text)
- `resolucao` or `resolution` (text)
- `tipo_desvio` (text)
- `clt_alinea` (text)
- `signature_name` (text)

### employees
- `id` (uuid)
- `nome_completo` (text)
- `cargo` (text)
- `setor` (text)

### misconduct_types
- `id` (uuid)
- `name` (text)

## Template Variables

The following variables are available in all document templates:

- `{{nome_colaborador}}` - Employee full name
- `{{cargo_colaborador}}` - Employee position
- `{{setor_colaborador}}` - Employee sector
- `{{tipo_desvio_nome}}` - Type of misconduct
- `{{classificacao_desvio}}` - Misconduct classification
- `{{periodo_ocorrencia}}` - Period of occurrence
- `{{data_da_ocorrencia}}` - Date of occurrence
- `{{descricao_desvio}}` - Description of misconduct
- `{{resolucao_final}}` - Final resolution
- `{{data_atual}}` - Current date
- `{{clt_alinea}}` - CLT article reference
- `{{nome_assinatura}}` - Signature name
- `{{dias_suspensao_numero}}` - Number of suspension days
- `{{dias_suspensao_extenso}}` - Suspension days in words (suspension documents only)
- `{{data_retorno_suspensao}}` - Return date after suspension (suspension documents only)

## Integration with Document Sending

This function is typically used with the `/api/send-document` endpoint to:
1. Generate the HTML document
2. Send it via email to configured recipients

See `client/pages/juridico/RevisaoProcessoJuridico.tsx` for frontend integration example.

## Environment Variables

Required (Supabase automatically provides):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `VITE_SUPABASE_URL` (fallback if SUPABASE_URL not set)

## Notes

- All dates are formatted in Brazilian Portuguese locale (pt-BR)
- Timezone is set to America/Sao_Paulo
- Number-to-words conversion supports up to 999 days
- HTML includes basic styling for printing and preview purposes
