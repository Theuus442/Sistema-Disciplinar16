import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/autenticacao/Login";
import ResponsiveWrapper from "@/components/ResponsiveWrapper";
import NaoEncontrado from "./pages/erros/NaoEncontrado";
import GestorDashboard from "./pages/gestor/GestorDashboard";
import AdministradorDashboard from "./pages/administrador/AdministradorDashboard";
import UsuariosAdminPage from "./pages/administrador/Usuarios";
import ConfiguracoesSistemaAdminPage from "./pages/administrador/ConfiguracoesSistema";
import ImportarFuncionariosPage from "./pages/administrador/ImportarFuncionarios";
import JuridicoDashboard from "./pages/juridico/JuridicoDashboard";
import RevisaoProcessoJuridico from "./pages/juridico/RevisaoProcessoJuridico";
import ProcessosAguardandoAnalise from "./pages/juridico/ProcessosAguardandoAnalise";
import TodosProcessos from "./pages/juridico/TodosProcessos";
import Relatorios from "./pages/juridico/Relatorios";
import GestorRegistrarDesvio from "./pages/gestor/GestorRegistrarDesvio";
import RequireRole from "@/components/RequireRole";
import ProcessosPage from "./pages/gestor/Processos";
import ProcessoAcompanhamento from "./pages/gestor/ProcessoAcompanhamento";
import FuncionarioPage from "./pages/gestor/Funcionario";
import FuncionariosListaPage from "./pages/gestor/Funcionarios";
import EsqueciSenha from "./pages/autenticacao/EsqueciSenha";
import RedefinirSenha from "./pages/autenticacao/RedefinirSenha";

// Mitigate ResizeObserver loop warnings by deferring callbacks to next frame
if (typeof window !== "undefined" && (window as any).ResizeObserver) {
  const OriginalRO = (window as any).ResizeObserver;
  (window as any).ResizeObserver = class extends OriginalRO {
    constructor(callback: ResizeObserverCallback) {
      super((entries: ResizeObserverEntry[], observer: ResizeObserver) => {
        requestAnimationFrame(() => callback(entries, observer));
      });
    }
  };
  // Guard against Chrome's noisy error event for RO loop limit
  window.addEventListener("error", (e: ErrorEvent) => {
    const msg = e?.message || "";
    if (msg.includes("ResizeObserver loop limit exceeded") || msg.includes("ResizeObserver loop completed with undelivered notifications")) {
      e.stopImmediatePropagation();
    }
  }, true);
}

const queryClient = new QueryClient();

import ErrorBoundary from "@/components/ErrorBoundary";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/gestor" element={<ResponsiveWrapper><GestorDashboard /></ResponsiveWrapper>} />
            <Route path="/administrador" element={<ResponsiveWrapper><AdministradorDashboard /></ResponsiveWrapper>} />
            <Route path="/administrador/usuarios" element={<ResponsiveWrapper><UsuariosAdminPage /></ResponsiveWrapper>} />
            <Route path="/administrador/importar-funcionarios" element={<RequireRole allowed={["administrador"]}><ResponsiveWrapper><ImportarFuncionariosPage /></ResponsiveWrapper></RequireRole>} />
            <Route path="/administrador/configuracoes" element={<RequireRole allowed={["administrador"]}><ResponsiveWrapper><ConfiguracoesSistemaAdminPage /></ResponsiveWrapper></RequireRole>} />
            <Route path="/juridico" element={<ResponsiveWrapper><JuridicoDashboard /></ResponsiveWrapper>} />
            <Route path="/juridico/processos/aguardando" element={<ResponsiveWrapper><ProcessosAguardandoAnalise /></ResponsiveWrapper>} />
            <Route path="/juridico/processos/todos" element={<ResponsiveWrapper><TodosProcessos /></ResponsiveWrapper>} />
            <Route path="/juridico/relatorios" element={<ResponsiveWrapper><Relatorios /></ResponsiveWrapper>} />
            <Route path="/juridico/processos/:id" element={<ResponsiveWrapper><RevisaoProcessoJuridico /></ResponsiveWrapper>} />
            <Route path="/gestor/registrar" element={<ResponsiveWrapper><GestorRegistrarDesvio /></ResponsiveWrapper>} />
            <Route path="/gestor/processos" element={<ResponsiveWrapper><ProcessosPage /></ResponsiveWrapper>} />
            <Route path="/gestor/processos/:id" element={<ResponsiveWrapper><ProcessoAcompanhamento /></ResponsiveWrapper>} />
            <Route path="/gestor/funcionarios" element={<ResponsiveWrapper><FuncionariosListaPage /></ResponsiveWrapper>} />
            <Route path="/gestor/funcionarios/:id" element={<ResponsiveWrapper><FuncionarioPage /></ResponsiveWrapper>} />
            <Route path="/autenticacao/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/autenticacao/redefinir-senha" element={<RedefinirSenha />} />
            {/* ADICIONE TODAS AS ROTAS PERSONALIZADAS ACIMA DA ROTA CATCH-ALL "*" */}
            <Route path="*" element={<NaoEncontrado />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
