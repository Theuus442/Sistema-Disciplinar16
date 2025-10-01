import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import SidebarJuridico from "@/components/SidebarJuridico";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { fetchProcessById } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

export default function RevisaoProcessoJuridico() {
  const navegar = useNavigate();
  const parametros = useParams<{ id: string }>();
  const { toast } = useToast();

  const idProcesso = parametros.id as string;
  const [processoJuridico, setProcessoJuridico] = useState<any | null>(null);
  const somenteVisualizacao = processoJuridico?.status === "Finalizado";

  const [parecerJuridico, setParecerJuridico] = useState<string>("");
  const [decisao, setDecisao] = useState<string>("");
  const [medidaRecomendada, setMedidaRecomendada] = useState<string>("");
  const [numeroOcorrenciaSI, setNumeroOcorrenciaSI] = useState<string>("");
  const [notifyEmail1, setNotifyEmail1] = useState<string>("");
  const [notifyEmail2, setNotifyEmail2] = useState<string>("");
  const [notifyEmail3, setNotifyEmail3] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    if (!idProcesso) return;
    fetchProcessById(idProcesso)
      .then((p) => { if (mounted) setProcessoJuridico(p as any); })
      .catch(() => setProcessoJuridico(null));
    return () => { mounted = false; };
  }, [idProcesso]);

  const aoFinalizar = async () => {
    if (!decisao) {
      toast({ title: "Selecione o Resultado da Sindicância", description: "Campo obrigatório." });
      return;
    }
    if (decisao === "Aplicar Medida Disciplinar" && !medidaRecomendada) {
      toast({ title: "Selecione a Medida Recomendada", description: "Campo obrigatório quando aplicar medida disciplinar." });
      return;
    }

    const resolucao =
      decisao === "Arquivar Processo"
        ? "Arquivado"
        : decisao === "Aplicar Medida Disciplinar"
        ? `Medida disciplinar: ${medidaRecomendada}`
        : "Recomendação: Justa Causa Direta";

    try {
      if (!numeroOcorrenciaSI || numeroOcorrenciaSI.trim() === "") {
        toast({ title: "Número da Ocorrência no SI é obrigatório", description: "Informe o número da ocorrência para finalizar o processo." });
        return;
      }
      const patch = {
        status: "Finalizado" as any,
        resolucao: `${resolucao}${parecerJuridico ? ` — Parecer: ${parecerJuridico}` : ""}`,
        si_occurrence_number: numeroOcorrenciaSI.trim(),
        notification_email_1: notifyEmail1?.trim() || null,
        notification_email_2: notifyEmail2?.trim() || null,
        notification_email_3: notifyEmail3?.trim() || null,
      } as any;
      const { updateProcess } = await import("@/lib/api");
      await updateProcess(idProcesso, patch as any);

      // Após salvar a finalização, chamar API do servidor (Vercel) para enviar relatório
      try {
        const resp = await fetch('/api/send-process-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ process_id: idProcesso }),
        });
        if (!resp.ok) throw new Error((await resp.json().catch(() => ({})))?.error || `HTTP ${resp.status}`);
      } catch (fx) {
        // Notificar, mas não bloquear o fluxo do usuário
        toast({ title: "Relatório não enviado automaticamente", description: `Você pode reenviar depois. ${errorMessage(fx)}` });
      }

      toast({ title: "Sindicância finalizada", description: "Decisão salva com sucesso." });
      navegar("/juridico");
    } catch (e: any) {
      toast({ title: "Erro ao salvar decisão", description: errorMessage(e) });
    }
  };

  const aoSair = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-sis-bg-light">
      <SidebarJuridico onSair={aoSair} />
      <div className="flex flex-1 flex-col">
                <div className="flex-1 overflow-auto p-4 md:p-6 max-[360px]:p-3">
          <div className="mx-auto max-w-5xl space-y-6">
            {!processoJuridico ? (
              <Card className="border-sis-border bg-white">
                <CardContent className="p-6 space-y-4 max-[360px]:p-4">
                  <h1 className="font-open-sans text-2xl font-bold text-sis-dark-text">Processo não encontrado</h1>
                  <Button variant="outline" onClick={() => navegar(-1)}>Voltar</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div>
                  <h1 className="mb-2 font-open-sans text-3xl font-bold text-sis-dark-text">Sindicância Jurídica do Processo</h1>
                  <p className="font-roboto text-sis-secondary-text">Registre a sindicância, parecer e decisão final.</p>
                </div>

                {/* 1. Informações do Gestor */}
                <Card className="border-sis-border bg-white">
                  <CardHeader>
                    <CardTitle>Informações do Gestor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-xs text-sis-secondary-text">Funcionário</Label>
                        <p className="font-medium text-sis-dark-text">{processoJuridico?.funcionario}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-sis-secondary-text">Data de Abertura</Label>
                        <p className="font-medium text-sis-dark-text">{processoJuridico?.dataAbertura}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-sis-secondary-text">Tipo de Desvio</Label>
                        <p className="font-medium text-sis-dark-text">{processoJuridico?.tipoDesvio}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-sis-secondary-text">Classificação</Label>
                        <p className="font-medium text-sis-dark-text">{processoJuridico?.classificacao}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-sis-secondary-text">Data de Abertura</Label>
                        <p className="font-medium text-sis-dark-text">{processoJuridico?.dataAbertura}</p>
                      </div>
                    </div>
                                      </CardContent>
                </Card>

                {/* 2. Análise Jurídica / Sindicância */}
                <Card className="border-sis-border bg-white">
                  <CardHeader>
                    <CardTitle>Sindicância Jurídica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="mb-2 block text-xs text-sis-secondary-text">Parecer Jurídico</Label>
                      {somenteVisualizacao ? (
                        <div
                          className="min-h-[120px] rounded-md border border-sis-border bg-gray-50 p-3 text-sm"
                          dangerouslySetInnerHTML={{ __html: processoJuridico?.legalOpinionSaved || "<em>Sem parecer registrado.</em>" }}
                        />
                      ) : (
                        <RichTextEditor
                          value={parecerJuridico}
                          onChange={setParecerJuridico}
                          placeholder="Escreva aqui o parecer jurídico..."
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Decisão */}
                <Card className="border-sis-border bg-white">
                  <CardHeader>
                    <CardTitle>Decisão</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {somenteVisualizacao ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Label className="text-xs text-sis-secondary-text">Resultado da Sindicância</Label>
                            <p className="font-medium text-sis-dark-text">{processoJuridico?.status || "—"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-sis-secondary-text">Medida Recomendada/Aplicada</Label>
                            <p className="font-medium text-sis-dark-text">{processoJuridico?.resolucao || "—"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-sis-secondary-text">Data da Decisão</Label>
                            <p className="font-medium text-sis-dark-text">{processoJuridico?.dataAbertura || "—"}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" onClick={() => navegar(-1)}>Voltar</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Label className="mb-2 block text-xs text-sis-secondary-text">Resultado da Sindicância</Label>
                            <Select onValueChange={setDecisao} value={decisao}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o resultado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Arquivar Processo">Arquivar Processo</SelectItem>
                                <SelectItem value="Aplicar Medida Disciplinar">Aplicar Medida Disciplinar (Advertência ou Suspensão)</SelectItem>
                                <SelectItem value="Recomendar Justa Causa Direta">Recomendar Justa Causa Direta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {decisao === "Aplicar Medida Disciplinar" && (
                            <div>
                              <Label className="mb-2 block text-xs text-sis-secondary-text">Medida Recomendada</Label>
                              <Select onValueChange={setMedidaRecomendada} value={medidaRecomendada}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a medida" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Advertência Escrita">Advertência Escrita</SelectItem>
                                  <SelectItem value="Suspensão de 1 dia">Suspensão de 1 dia</SelectItem>
                                  <SelectItem value="Suspensão de 3 dias">Suspensão de 3 dias</SelectItem>
                                  <SelectItem value="Suspensão de 5 dias">Suspensão de 5 dias</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <Label className="mb-2 block text-xs text-sis-secondary-text">Número da Ocorrência no SI</Label>
                            <Input
                              placeholder="Ex.: SI-2025-000123"
                              value={numeroOcorrenciaSI}
                              onChange={(e) => setNumeroOcorrenciaSI(e.target.value)}
                            />
                            <p className="mt-1 text-xs text-sis-secondary-text">Obrigatório para finalizar o processo.</p>
                          </div>

                          <div className="md:col-span-2">
                            <Label className="mb-2 block text-xs text-sis-secondary-text">E-mails para notificação (opcionais)</Label>
                            <Input placeholder="E-mail 1" value={notifyEmail1} onChange={(e) => setNotifyEmail1(e.target.value)} className="mb-2" />
                            <Input placeholder="E-mail 2" value={notifyEmail2} onChange={(e) => setNotifyEmail2(e.target.value)} className="mb-2" />
                            <Input placeholder="E-mail 3" value={notifyEmail3} onChange={(e) => setNotifyEmail3(e.target.value)} />
                            <p className="mt-1 text-xs text-sis-secondary-text">Serão enviados relatorios para estes e‑mails quando o processo for finalizado.</p>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" onClick={() => navegar(-1)}>Voltar</Button>
                          <Button onClick={aoFinalizar} className="bg-sis-blue hover:bg-blue-700 text-white">
                            Finalizar Sindicância e Salvar Decisão
                          </Button>
                          <Button variant="outline" onClick={async () => {
                            const recipients = [notifyEmail1, notifyEmail2, notifyEmail3]
                              .filter(Boolean)
                              .map((r) => r!.trim())
                              .filter((r) => r.length > 0);

                            if (recipients.length === 0) {
                              toast({ title: 'Nenhum e-mail informado', description: 'Informe ao menos um e-mail para enviar o relatório.' });
                              return;
                            }

                            // Build a best-effort resolucao from the current form state so the email contains the parecer
                            const currentResolucao =
                              decisao === "Arquivar Processo"
                                ? "Arquivado"
                                : decisao === "Aplicar Medida Disciplinar"
                                ? `Medida disciplinar: ${medidaRecomendada}`
                                : "Recomendação: Justa Causa Direta";

                            const payload: any = {
                              process_id: idProcesso,
                              recipients,
                              overrides: {
                                resolucao: `${currentResolucao}${parecerJuridico ? ` — Parecer: ${parecerJuridico}` : ""}`,
                                si_occurrence_number: numeroOcorrenciaSI?.trim() || "",
                                tipo_desvio: processoJuridico?.tipoDesvio || "",
                                classificacao: processoJuridico?.classificacao || "",
                                parecer_juridico: parecerJuridico || null,
                              },
                            };

                            try {
                              const resp = await fetch('/api/send-process-report', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                              });
                              const j = await resp.json().catch(() => ({}));
                              if (!resp.ok) {
                                toast({ title: 'Erro ao enviar', description: j?.error || `HTTP ${resp.status}` });
                              } else {
                                toast({ title: 'Relatório enviado', description: 'E-mails enviados com sucesso.' });
                              }
                            } catch (err: any) {
                              toast({ title: 'Erro ao enviar', description: errorMessage(err) });
                            }
                          }}>Enviar Relatório Agora</Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
