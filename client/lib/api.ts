import { supabase } from "./supabase";

export interface FuncionarioAPI {
  id: string;
  matricula?: string | null;
  nome_completo?: string | null;
  cargo?: string | null;
  setor?: string | null;
  gestor_id?: string | null;
}

export interface ProcessoAPI {
  id: string;
  employee_id: string;
  criado_por_user_id?: string;
  tipo_desvio?: string | null;
  classificacao?: string | null;
  descricao?: string | null;
  status?: string | null;
  juridico_responsavel_user_id?: string | null;
  resolucao?: string | null;
  si_occurrence_number?: string | null;
  created_at?: string | null;
}

function normalizeClassificacao(raw?: string | null): "Leve" | "Média" | "Grave" | "Gravíssima" {
  const v = (raw ?? "Leve").toString().replace(/_/g, " ").trim();
  const base = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (base.includes("gravissima")) return "Gravíssima";
  if (base.includes("grave")) return "Grave";
  if (base.includes("media")) return "Média";
  return "Leve";
}

export async function fetchEmployees() {
  const { data: employees, error: empErr } = await supabase.from("employees").select("*");
  if (empErr) throw empErr;

  const { data: processes } = await supabase
    .from("processes")
    .select(`
      id, employee_id, classificacao, resolucao, status, created_at, periodo_ocorrencia_inicio,
      misconduct_types ( name )
    `);
  const { data: profiles } = await supabase.from("profiles").select("*");

  const profilesMap = new Map<string, any>();
  profiles?.forEach((p) => profilesMap.set(p.id, p));

  const employeesMapped = (employees || []).map((e) => ({
    id: e.matricula ?? e.id,
    nomeCompleto: e.nome_completo ?? "",
    cargo: e.cargo ?? "",
    setor: e.setor ?? "",
    gestorDireto: profilesMap.get(e.gestor_id)?.nome ?? "",
    historico:
      (processes || [])
        .filter((pr) => {
          const empId = e.id; // UUID do employee
          const empMat = (e as any).matricula; // matrícula do employee (se existir)
          const prEmp = (pr as any).employee_id ?? (pr as any).employee_matricula ?? (pr as any).employee;
          return prEmp === empId || (!!empMat && prEmp === empMat);
        })
        .map((pr) => ({
          id: pr.id,
          dataOcorrencia: (() => { const d = pr.created_at ?? (pr as any).periodo_ocorrencia_inicio ?? (pr as any).data_da_ocorrencia ?? pr.createdAt ?? (pr as any).dataOcorrencia; return d ? new Date(d).toLocaleDateString() : ""; })(),
          tipoDesvio: (pr as any)?.misconduct_types?.name ?? "",
          classificacao: normalizeClassificacao(pr.classificacao),
          medidaAplicada: pr.resolucao ?? pr.descricao ?? "",
          status: normalizeStatus(pr.status) as any,
        })),
  }));

  return employeesMapped;
}

export async function fetchEmployeeById(matriculaOrId: string) {
  // Try by matricula first (most stable for human-entered IDs), then fallback to UUID id
  let rawEmp: any | undefined;
  try {
    const { data: byMatricula } = await supabase
      .from("employees")
      .select("*")
      .eq("matricula", matriculaOrId)
      .limit(1);
    rawEmp = byMatricula?.[0];
  } catch {}

  if (!rawEmp) {
    try {
      const { data: byId } = await supabase
        .from("employees")
        .select("*")
        .eq("id", matriculaOrId)
        .limit(1);
      rawEmp = byId?.[0];
    } catch {}
  }

  if (!rawEmp) return undefined;

  // Start with the mapped base to keep UI fields consistent
  const employeesMapped = await fetchEmployees();
  const base = employeesMapped.find((e) => e.id === (rawEmp.matricula ?? rawEmp.id));
  if (!base) return undefined;

  // Load processes specifically for this employee UUID to ensure history is populated
  const { data: proc } = await supabase
    .from("processes")
    .select(`
      id, status, classificacao, resolucao, created_at, periodo_ocorrencia_inicio,
      misconduct_types ( name )
    `)
    .eq("employee_id", rawEmp.id);

  const historico = (proc || []).map((pr: any) => ({
    id: pr.id,
    dataOcorrencia: (() => {
      const d = pr.created_at ?? pr.periodo_ocorrencia_inicio ?? pr.data_da_ocorrencia ?? pr.createdAt ?? pr.dataOcorrencia;
      return d ? new Date(d).toLocaleDateString() : "";
    })(),
    tipoDesvio: pr?.misconduct_types?.name ?? "",
    classificacao: normalizeClassificacao(pr.classificacao),
    medidaAplicada: pr.resolucao ?? pr.descricao ?? "",
    status: normalizeStatus(pr.status) as any,
  }));

  return { ...base, historico } as any;
}

function normalizeStatus(raw?: string | null): string {
  const v = (raw ?? "Em_Analise").toString().replace(/_/g, " ").trim();
  const base = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (base.includes("analise")) return "Sindicância";
  if (base.includes("sindic")) return "Sindicância";
  if (base.includes("assinatura")) return "Aguardando Assinatura";
  if (base.includes("final")) return "Finalizado";
  return v;
}

export async function fetchProcesses() {
  // Read directly from Supabase to avoid serverless 500s
  const { data: processes } = await supabase
    .from("processes")
    .select(`
      id, status, classificacao, resolucao, created_at, periodo_ocorrencia_inicio, periodo_ocorrencia_fim,
      employees ( nome_completo ),
      misconduct_types ( name )
    `);
  return (processes || []).map((p: any) => ({
    id: p.id,
    funcionario: p.employees?.nome_completo ?? "",
    tipoDesvio: p.misconduct_types?.name ?? "",
    classificacao: normalizeClassificacao(p.classificacao),
    dataAbertura: (() => { const d = p.created_at ?? p.periodo_ocorrencia_inicio ?? p.createdAt; return d ? new Date(d).toLocaleDateString() : ""; })(),
    createdAt: (p.created_at ?? p.periodo_ocorrencia_inicio ?? p.createdAt) ?? null,
    status: normalizeStatus(p.status) as any,
    resolucao: p.resolucao ?? "",
  }));
}

export async function fetchSuspensionsByDateRange(startISO?: string, endISO?: string) {
  let query = supabase
    .from("processes")
    .select(`
      id, status, classificacao, resolucao, created_at,
      employees ( nome_completo ),
      misconduct_types ( name )
    `)
    .ilike("resolucao", "%Suspens%");
  if (startISO) {
    const s = new Date(startISO).toISOString();
    query = query.gte("created_at", s);
  }
  if (endISO) {
    const e = new Date(endISO).toISOString();
    query = query.lte("created_at", e);
  }
  const { data } = await query;
  return (data || []).map((p: any) => ({
    id: p.id,
    funcionario: p.employees?.nome_completo ?? "",
    tipoDesvio: p.misconduct_types?.name ?? "",
    classificacao: p.classificacao ? (p.classificacao === "Media" ? "Média" : p.classificacao) : ("Leve" as any),
    dataAbertura: (() => { const d = p.created_at ?? p.createdAt; return d ? new Date(d).toLocaleDateString() : ""; })(),
    createdAt: (p.created_at ?? p.createdAt) ?? null,
    status: normalizeStatus(p.status) as any,
    resolucao: p.resolucao ?? "",
  }));
}

export async function fetchProcessById(id: string) {
  const { data: processes } = await supabase
    .from("processes")
    .select(`
      id, status, classificacao, resolucao, created_at, periodo_ocorrencia_inicio, periodo_ocorrencia_fim,
      notification_email_1, notification_email_2, notification_email_3,
      employees ( nome_completo ),
      misconduct_types ( name )
    `)
    .eq("id", id);
  if (!processes || processes.length === 0) return undefined;
  const p: any = processes[0];

  const resolucao = p.resolucao ?? "";
  const legalOpinionSaved = resolucao.includes("Parecer:")
    ? resolucao.split("Parecer:")[1]?.trim() || ""
    : "";

  return {
    id: p.id,
    funcionario: p.employees?.nome_completo ?? "",
    tipoDesvio: p.misconduct_types?.name ?? "",
    classificacao: normalizeClassificacao(p.classificacao),
    dataAbertura: (() => { const d = p.created_at ?? p.periodo_ocorrencia_inicio ?? p.createdAt; return d ? new Date(d).toLocaleDateString() : ""; })(),
    createdAt: (p.created_at ?? p.periodo_ocorrencia_inicio ?? p.createdAt) ?? null,
    status: normalizeStatus(p.status) as any,
    resolucao,
    legalOpinionSaved,
    notification_email_1: p.notification_email_1 ?? "",
    notification_email_2: p.notification_email_2 ?? "",
    notification_email_3: p.notification_email_3 ?? "",
  };
}

export async function fetchUsers() {
  const { data: profiles } = await supabase.from("profiles").select("*");
  return (profiles || []).map((p) => ({
    id: p.id,
    nome: p.nome ?? "",
    email: p.email ?? ((p.nome ? p.nome.toLowerCase().replace(/\s+/g, ".") : "user") + "@empresa.com"),
    perfil: p.perfil ?? "funcionario",
    ativo: p.ativo ?? true,
    criadoEm: p.created_at ?? new Date().toISOString(),
    ultimoAcesso: null,
  }));
}

export type PerfilUsuario = "administrador" | "gestor" | "juridico" | "funcionario";
export async function updateUser(id: string, patch: { nome?: string; perfil?: PerfilUsuario; ativo?: boolean; email?: string }) {
  await api(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function updateProcess(id: string, patch: Partial<ProcessoAPI>) {
  const normalizedStatus = typeof patch.status === "string" ? patch.status.replace(/_/g, " ") : undefined;
  if (normalizedStatus === "Finalizado") {
    const occ = (patch as any).si_occurrence_number ?? (patch as any).siOccurrenceNumber ?? null;
    if (!occ || String(occ).trim() === "") {
      throw new Error("Para finalizar, preencha o Número da Ocorrência no SI (si_occurrence_number).");
    }
  }
  const payload: any = { ...patch };
  if ((payload as any).siOccurrenceNumber && !payload.si_occurrence_number) {
    payload.si_occurrence_number = (payload as any).siOccurrenceNumber;
    delete payload.siOccurrenceNumber;
  }
  const { error } = await supabase.from("processes").update(payload).eq("id", id);
  if (error) throw error;
}

let tokenWaiter: Promise<string | undefined> | null = null;
async function getAccessToken(): Promise<string | undefined> {
  // Fast path
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return data.session.access_token;
  } catch {}

  if (!tokenWaiter) {
    tokenWaiter = new Promise<string | undefined>((resolve) => {
      const timeout = setTimeout(() => resolve(undefined), 3000);
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (session?.access_token) {
          clearTimeout(timeout);
          sub.subscription.unsubscribe();
          resolve(session.access_token);
        }
      });
      // Best-effort refresh
      supabase.auth.getUser().catch(() => {});
      supabase.auth.refreshSession().catch(() => {});
    }).finally(() => {
      tokenWaiter = null;
    });
  }
  return tokenWaiter;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------- Admin Permissions API ----------------
async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const headers = { "Content-Type": "application/json", ...(await authHeaders()) } as any;
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export type UserOverride = { permission_name: string; action: "grant" | "revoke" };

export async function fetchAvailablePermissions(): Promise<string[]> {
  return api<string[]>("/api/admin/permissions");
}

export async function fetchProfilePermissions(): Promise<Record<string, string[]>> {
  try {
    return await api<Record<string, string[]>>("/api/admin/profile-permissions");
  } catch {
    return {};
  }
}

export async function setProfilePermission(perfil: PerfilUsuario, permission: string, enabled: boolean): Promise<void> {
  if (enabled) {
    await api("/api/admin/profile-permissions", { method: "POST", body: JSON.stringify({ perfil, permission }) });
  } else {
    await api("/api/admin/profile-permissions", { method: "DELETE", body: JSON.stringify({ perfil, permission }) });
  }
}

export async function saveProfilePermissions(perfil: PerfilUsuario, permissions: string[]): Promise<void> {
  await api("/api/admin/profile-permissions", {
    method: "POST",
    body: JSON.stringify({ profile_name: perfil, permissions }),
  });
}

export async function fetchUserPermissions(userId: string): Promise<string[]> {
  return api<string[]>(`/api/admin/user-permissions/${encodeURIComponent(userId)}`);
}

export async function setUserPermission(userId: string, permission: string, enabled: boolean): Promise<void> {
  if (enabled) {
    await api("/api/admin/user-permissions", { method: "POST", body: JSON.stringify({ userId, permission }) });
  } else {
    await api("/api/admin/user-permissions", { method: "DELETE", body: JSON.stringify({ userId, permission }) });
  }
}

export async function fetchUserOverrides(userId: string): Promise<UserOverride[]> {
  if (!userId) return [];
  try {
    return await api<UserOverride[]>(`/api/admin/user-overrides/${encodeURIComponent(userId)}`);
  } catch {
    return [];
  }
}

export async function saveUserOverrides(userId: string, overrides: UserOverride[]): Promise<void> {
  try {
    // Debug log to inspect payload being sent
    // eslint-disable-next-line no-console
    console.log('Array de "overrides" sendo enviado para a API:', overrides);
  } catch {}
  await api(`/api/admin/user-overrides/${encodeURIComponent(userId)}`, {
    method: "POST",
    body: JSON.stringify({ overrides }),
  });
}
