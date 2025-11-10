import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { errorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface ComissaoMembro {
  nome: string;
  cargo: string;
  funcao_comissao: "Presidente" | "Secretário I" | "Secretário II" | "Membro" | "Advogado";
  oab?: string;
}

interface Testemunha {
  nome: string;
  cpf: string;
}

interface FormInstauracaoSindicanciaProps {
  processId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormInstauracaoSindicancia({
  processId,
  onClose,
  onSuccess,
}: FormInstauracaoSindicanciaProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sindicanciaSalva, setSindicanciaSalva] = useState(false);
  const [gerandoDoc, setGerandoDoc] = useState(false);

  // Dados principais
  const [numeroSindicancia, setNumeroSindicancia] = useState("");
  const [nomeInstituidor, setNomeInstituidor] = useState("");
  const [cpfInstituidor, setCpfInstituidor] = useState("");

  // Membros da comissão (3 membros obrigatórios)
  const [membros, setMembros] = useState<ComissaoMembro[]>([
    { nome: "", cargo: "", funcao_comissao: "Presidente", oab: "" },
    { nome: "", cargo: "", funcao_comissao: "Secretário I", oab: "" },
    { nome: "", cargo: "", funcao_comissao: "Secretário II", oab: "" },
  ]);

  // Testemunhas
  const [testemunhas, setTestemunhas] = useState<Testemunha[]>([
    { nome: "", cpf: "" },
  ]);

  const adicionarMembro = () => {
    setMembros([
      ...membros,
      { nome: "", cargo: "", funcao_comissao: "Membro", oab: "" },
    ]);
  };

  const removerMembro = (index: number) => {
    // Não permite remover os 3 membros obrigatórios (Presidente, Secretário I, Secretário II)
    if (membros.length <= 3) {
      toast({
        title: "Aviso",
        description: "Você deve manter os 3 membros obrigatórios da comissão.",
      });
      return;
    }
    setMembros(membros.filter((_, i) => i !== index));
  };

  const atualizarMembro = (
    index: number,
    field: keyof ComissaoMembro,
    value: string
  ) => {
    const novosMembros = [...membros];
    novosMembros[index] = { ...novosMembros[index], [field]: value };
    setMembros(novosMembros);
  };

  const adicionarTestemunha = () => {
    setTestemunhas([...testemunhas, { nome: "", cpf: "" }]);
  };

  const removerTestemunha = (index: number) => {
    setTestemunhas(testemunhas.filter((_, i) => i !== index));
  };

  const atualizarTestemunha = (
    index: number,
    field: keyof Testemunha,
    value: string
  ) => {
    const novasTestemunhas = [...testemunhas];
    novasTestemunhas[index] = { ...novasTestemunhas[index], [field]: value };
    setTestemunhas(novasTestemunhas);
  };

  const validar = (): boolean => {
    if (!numeroSindicancia.trim()) {
      toast({
        title: "Erro",
        description: "Número da sindicância é obrigatório.",
      });
      return false;
    }
    if (!nomeInstituidor.trim()) {
      toast({
        title: "Erro",
        description: "Nome do instituidor é obrigatório.",
      });
      return false;
    }
    if (!cpfInstituidor.trim()) {
      toast({
        title: "Erro",
        description: "CPF do instituidor é obrigatório.",
      });
      return false;
    }

    // Validar os 3 membros obrigatórios (Presidente, Secretário I, Secretário II)
    const funcoesobrigatorias = ["Presidente", "Secretário I", "Secretário II"];
    for (const funcao of funcoesobrigatorias) {
      const membro = membros.find((m) => m.funcao_comissao === funcao);
      if (!membro || !membro.nome.trim() || !membro.cargo.trim()) {
        toast({
          title: "Erro",
          description: `Preencha nome e cargo para: ${funcao}`,
        });
        return false;
      }
    }

    // Filtrar testemunhas vazias e validar apenas as preenchidas
    const testemunhasPreenchidas = testemunhas.filter((t) => t.nome.trim() || t.cpf.trim());
    const testemunhasValidas = testemunhasPreenchidas.every(
      (t) => t.nome.trim() && t.cpf.trim()
    );
    if (testemunhasPreenchidas.length > 0 && !testemunhasValidas) {
      toast({
        title: "Erro",
        description: "Todas as testemunhas preenchidas devem ter nome E CPF.",
      });
      return false;
    }

    return true;
  };

  const handleSalvar = async () => {
    if (!validar()) return;

    setLoading(true);
    try {
      // 1. Salvar dados da sindicância
      const { data: sindicancia, error: sindError } = await supabase
        .from("sindicancias")
        .insert({
          process_id: processId,
          numero_sindicancia: numeroSindicancia.trim(),
          nome_instituidor: nomeInstituidor.trim(),
          cpf_instituidor: cpfInstituidor.trim(),
        })
        .select()
        .single();

      if (sindError) throw sindError;

      // 2. Salvar membros da comissão (apenas os preenchidos)
      const membrosPreenchidos = membros.filter((m) => m.nome.trim() && m.cargo.trim());
      if (membrosPreenchidos.length > 0) {
        const membrosParaSalvar = membrosPreenchidos.map((m) => ({
          sindicancia_id: sindicancia.id,
          nome: m.nome.trim(),
          cargo: m.cargo.trim(),
          funcao_comissao: m.funcao_comissao,
          oab: m.oab?.trim() || null,
        }));

        const { error: membrosError } = await supabase
          .from("comissao_membros")
          .insert(membrosParaSalvar);

        if (membrosError) throw membrosError;
      }

      // 3. Salvar testemunhas (apenas as preenchidas)
      const testemunhasPreenchidas = testemunhas.filter((t) => t.nome.trim() && t.cpf.trim());
      if (testemunhasPreenchidas.length > 0) {
        const testemunhasParaSalvar = testemunhasPreenchidas.map((t) => ({
          sindicancia_id: sindicancia.id,
          nome: t.nome.trim(),
          cpf: t.cpf.trim(),
        }));

        const { error: testemunhasError } = await supabase
          .from("sindicancia_testemunhas")
          .insert(testemunhasParaSalvar);

        if (testemunhasError) throw testemunhasError;
      }

      toast({
        title: "Sucesso",
        description: "Sindicância registrada com sucesso! Agora gere o termo.",
      });

      setSindicanciaSalva(true);
      onSuccess();
    } catch (err: any) {
      console.error("Erro ao salvar sindicância:", err);
      const fullMessage = errorMessage(err);
      const detailedMessage = err?.message || err?.error?.message || JSON.stringify(err) || "Erro desconhecido";
      console.error("Detalhes completos:", detailedMessage);
      toast({
        title: "Erro ao salvar",
        description: fullMessage || detailedMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGerarDocumento = async () => {
    setGerandoDoc(true);
    try {
      const { data: htmlContent, error: funcError } = await supabase.functions.invoke(
        "generate-sindicancia-doc",
        {
          body: { process_id: processId },
          responseType: "text",
        }
      );

      if (funcError) {
        console.error("Erro ao gerar documento:", funcError);
        throw funcError;
      }

      if (!htmlContent || typeof htmlContent !== "string") {
        throw new Error("A resposta da função não foi um HTML válido.");
      }

      // Check if response contains an error message
      if (htmlContent.includes("<h1>Error</h1>") || htmlContent.includes("<h1>error</h1>")) {
        const errorMatch = htmlContent.match(/<p>(.*?)<\/p>/);
        const errorMsg = errorMatch ? errorMatch[1] : "Erro ao gerar o documento";
        throw new Error(errorMsg);
      }

      // Abrir o HTML em nova aba para o usuário imprimir/salvar como PDF
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }

      toast({
        title: "Sucesso",
        description: "Termo de Sindicância gerado! Verifique a nova aba.",
      });

      onClose();
    } catch (err: any) {
      console.error("Erro ao gerar documento:", err);
      toast({
        title: "Erro ao gerar documento",
        description: errorMessage(err),
      });
    } finally {
      setGerandoDoc(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto py-4">
      {/* Seção: Dados Principais */}
      <Card className="border-sis-border">
        <CardHeader>
          <CardTitle className="text-lg">Dados da Sindicância</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numero">Número da Sindicância</Label>
            <Input
              id="numero"
              placeholder="Ex: SI 01/2024"
              value={numeroSindicancia}
              onChange={(e) => setNumeroSindicancia(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instituidor">Nome do Instituidor</Label>
            <Input
              id="instituidor"
              placeholder="Nome completo"
              value={nomeInstituidor}
              onChange={(e) => setNomeInstituidor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF do Instituidor</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={cpfInstituidor}
              onChange={(e) => setCpfInstituidor(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seção: Membros da Comissão */}
      <Card className="border-sis-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Membros da Comissão</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={adicionarMembro}
            >
              + Adicionar Membro
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {membros.map((membro, index) => (
            <div
              key={index}
              className="space-y-3 p-4 bg-gray-50 rounded-lg border border-sis-border"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-sm">Membro {index + 1}</h4>
                {membros.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerMembro(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor={`membro-nome-${index}`}>Nome</Label>
                  <Input
                    id={`membro-nome-${index}`}
                    placeholder="Nome completo"
                    value={membro.nome}
                    onChange={(e) =>
                      atualizarMembro(index, "nome", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`membro-cargo-${index}`}>Cargo</Label>
                  <Input
                    id={`membro-cargo-${index}`}
                    placeholder="Ex: Gerente, Supervisor"
                    value={membro.cargo}
                    onChange={(e) =>
                      atualizarMembro(index, "cargo", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`membro-funcao-${index}`}>Função</Label>
                  <Select
                    value={membro.funcao_comissao}
                    onValueChange={(value) =>
                      atualizarMembro(
                        index,
                        "funcao_comissao",
                        value as ComissaoMembro["funcao_comissao"]
                      )
                    }
                  >
                    <SelectTrigger id={`membro-funcao-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Presidente">Presidente</SelectItem>
                      <SelectItem value="Secretário I">Secretário I</SelectItem>
                      <SelectItem value="Secretário II">Secretário II</SelectItem>
                      <SelectItem value="Membro">Membro</SelectItem>
                      <SelectItem value="Advogado">Advogado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {membro.funcao_comissao === "Advogado" && (
                  <div className="space-y-2">
                    <Label htmlFor={`membro-oab-${index}`}>OAB</Label>
                    <Input
                      id={`membro-oab-${index}`}
                      placeholder="Ex: 123456/SP"
                      value={membro.oab || ""}
                      onChange={(e) =>
                        atualizarMembro(index, "oab", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Seção: Testemunhas */}
      <Card className="border-sis-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Testemunhas</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={adicionarTestemunha}
            >
              + Adicionar Testemunha
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {testemunhas.map((testemunha, index) => (
            <div
              key={index}
              className="space-y-3 p-4 bg-gray-50 rounded-lg border border-sis-border"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Testemunha {index + 1}</h4>
                {testemunhas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerTestemunha(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`testemunha-nome-${index}`}>Nome</Label>
                <Input
                  id={`testemunha-nome-${index}`}
                  placeholder="Nome completo"
                  value={testemunha.nome}
                  onChange={(e) =>
                    atualizarTestemunha(index, "nome", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`testemunha-cpf-${index}`}>CPF</Label>
                <Input
                  id={`testemunha-cpf-${index}`}
                  placeholder="000.000.000-00"
                  value={testemunha.cpf}
                  onChange={(e) =>
                    atualizarTestemunha(index, "cpf", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading || gerandoDoc}
        >
          Cancelar
        </Button>
        {!sindicanciaSalva ? (
          <Button
            type="button"
            onClick={handleSalvar}
            disabled={loading}
            className="bg-sis-blue text-white hover:bg-blue-700"
          >
            {loading ? "Salvando..." : "Salvar Dados da Sindicância"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleGerarDocumento}
            disabled={gerandoDoc}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {gerandoDoc ? "Gerando..." : "Gerar Termo de Sindicância"}
          </Button>
        )}
      </div>
    </div>
  );
}
