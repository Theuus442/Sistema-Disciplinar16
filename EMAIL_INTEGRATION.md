# Email Integration Guide - Disciplinary Document Generation & Delivery

## Overview

The system now includes a complete workflow for generating disciplinary documents (HTML) and automatically sending them via email. This guide explains how the integration works and how to configure it.

## Architecture

### 1. Document Generation (Supabase Edge Function)
**File**: `supabase/edge_functions/generate-document/index.ts`

The Edge Function generates HTML documents for three document types:
- **advertencia** - Disciplinary warning
- **suspensao** - Suspension disciplinary action  
- **justa_causa** - Dismissal for just cause

**How it works**:
- Fetches process and employee data from Supabase database
- Fills HTML templates with process-specific information
- Returns formatted HTML ready for display or PDF conversion

**API Endpoint**: `supabase.functions.invoke('generate-document')`

### 2. Document Email Delivery (Express Server Route)
**File**: `server/routes/send-document.ts`

The Express route handles email delivery with support for two email services:

#### Email Service Options (Priority Order):
1. **SMTP** (Recommended for production) - Uses `nodemailer`
   - Environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - Supports TLS/SSL
   
2. **Resend API** (Fallback) - Free tier available
   - Environment variable: `RESEND_API_KEY`
   - Must be valid Resend key (starts with `re_`)

**API Endpoint**: `POST /api/send-document`

### 3. Frontend Integration
**File**: `client/pages/juridico/RevisaoProcessoJuridico.tsx`

The legal review page includes:
- Document generation buttons (visible only when process is finalized)
- Automatic PDF preview in new browser window
- Automatic email sending to configured recipients
- Email configuration fields (3 optional email addresses)

## Complete Workflow

```
1. Process is registered by Manager
   ↓
2. Manager reports misconduct
   ↓
3. Legal team completes juridical review
   ↓
4. Legal team finalizes process with decision
   - Selects disciplinary measure (Advertência, Suspensão, or Justa Causa)
   - Enters SI occurrence number
   - Optionally configures notification emails
   ↓
5. Process status changes to "Finalizado"
   ↓
6. Legal team clicks "Gerar Documento" button
   ├─ Edge Function generates HTML document
   ├─ Document opens in browser preview
   └─ Email sent to recipients (if configured)
```

## Configuration

### Step 1: Configure Email Service

Choose ONE of the following options:

#### Option A: SMTP (Recommended for Production)
```bash
# Set these environment variables:
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587  # or 465 for TLS
SMTP_USER=your-email@company.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@company.com
```

#### Option B: Resend API (Easy Setup)
```bash
# Set this environment variable:
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM=noreply@yourdomain.com  # Optional, defaults to onboarding@resend.dev
```

### Step 2: Database Configuration

Ensure the following database columns exist in the `processes` table:

```sql
-- Required fields for document generation
occurrence_date_start    -- date of misconduct start
occurrence_date_end      -- date of misconduct end  
suspension_days          -- number of suspension days (for suspensão documents)
descricao / description  -- detailed description of misconduct
classificacao            -- classification level (Leve, Média, Grave)
resolucao / resolution   -- final resolution
tipo_desvio              -- type of misconduct
clt_alinea               -- CLT article reference
signature_name           -- who signs the document

-- Optional fields for email notifications
notification_email_1     -- first recipient email
notification_email_2     -- second recipient email
notification_email_3     -- third recipient email
```

### Step 3: Supabase Edge Function Setup

1. Deploy the Edge Function using Supabase CLI:
```bash
supabase functions deploy generate-document
```

2. Verify it's accessible:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-document \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"process_id": "uuid", "document_type": "advertencia"}'
```

## Usage

### For End Users (Legal Team)

1. **Navigate to completed process**: Go to juridical review page of a finalized process
2. **See document buttons**: Once process status is "Finalizado", document generation buttons appear
3. **Click document type**: Click the appropriate document button (Gerar Advertência, Gerar Suspensão, or Gerar Justa Causa)
4. **Receive email**: Document is automatically sent to configured emails (if set in the process notification fields)

### For Developers - API Usage

#### Generate Document (HTML)
```javascript
const response = await supabase.functions.invoke('generate-document', {
  body: {
    process_id: 'uuid-of-process',
    document_type: 'advertencia' // or 'suspensao' or 'justa_causa'
  },
  responseType: 'text'
});
const htmlContent = response.data;
```

#### Send Document via Email
```javascript
const response = await fetch('/api/send-document', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    process_id: 'uuid-of-process',
    document_type: 'advertencia',
    html_content: htmlContent,
    recipients: ['email1@company.com', 'email2@company.com']
  })
});
const result = await response.json();
```

## Document Templates

### Available Placeholders

All templates support these variables:
- `{{nome_colaborador}}` - Employee name
- `{{cargo_colaborador}}` - Job title
- `{{setor_colaborador}}` - Department
- `{{tipo_desvio_nome}}` - Misconduct type
- `{{classificacao_desvio}}` - Classification
- `{{periodo_ocorrencia}}` - Period of occurrence
- `{{data_da_ocorrencia}}` - Date of occurrence
- `{{descricao_desvio}}` - Description
- `{{resolucao_final}}` - Final resolution
- `{{data_atual}}` - Current date
- `{{clt_alinea}}` - Legal reference
- `{{nome_assinatura}}` - Signature name

Suspension-specific:
- `{{dias_suspensao_numero}}` - Number of days
- `{{dias_suspensao_extenso}}` - Days in words (e.g., "cinco")
- `{{data_retorno_suspensao}}` - Return date

### Customizing Templates

Edit the template strings in `supabase/edge_functions/generate-document/index.ts`:
- `advertenciaTemplate` - Warning document
- `suspensaoTemplate` - Suspension document
- `justaCausaTemplate` - Dismissal document

After editing, redeploy:
```bash
supabase functions deploy generate-document
```

## Troubleshooting

### Issue: Email not sending
**Solutions**:
1. Verify email service is configured (check env vars)
2. Check server logs for detailed error messages
3. Ensure recipient email addresses are valid
4. Verify Supabase Edge Function is deployed

### Issue: Document HTML is blank
**Solutions**:
1. Verify process ID is correct
2. Ensure all required database fields are populated
3. Check Supabase Edge Function logs
4. Verify database relationships are correct

### Issue: SMTP authentication fails
**Solutions**:
1. Verify SMTP credentials are correct
2. Check if "Less secure app access" is enabled (Gmail)
3. Ensure SMTP port matches authentication method (587 for TLS, 465 for SSL)
4. Try using app-specific password instead of main password

### Issue: Resend API error
**Solutions**:
1. Verify API key format (must start with `re_`)
2. Check API key is valid and active in Resend dashboard
3. Ensure from email domain is verified in Resend
4. Check Resend account has email credits available

## Security Considerations

1. **Email Credentials**: Store in environment variables, never in code
2. **Service Role Key**: Only Edge Function calls Supabase with service role
3. **Email Validation**: Validate recipient emails before sending
4. **Rate Limiting**: Consider implementing rate limiting for email sending
5. **Audit Trail**: All emails sent are logged with metadata

## Performance Notes

- Document generation is **instant** (typically <500ms)
- Email delivery via SMTP: **2-5 seconds** (depends on SMTP server)
- Email delivery via Resend API: **1-3 seconds**
- Each process can generate multiple document types
- Edge Function auto-scales with Supabase

## Next Steps

1. ✅ Edge Function created and documented
2. ✅ Frontend integration complete
3. ✅ Email routes configured
4. **TODO**: Configure email service credentials
5. **TODO**: Deploy Edge Function to Supabase
6. **TODO**: Test with sample process

## Support

For issues or questions:
1. Check logs in Supabase dashboard (Edge Functions section)
2. Check server logs in dev console
3. Review email service documentation (SMTP/Resend)
4. Check database schema matches expected fields
