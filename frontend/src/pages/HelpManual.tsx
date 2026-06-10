import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, MessageCircle, Send, Bot, Book } from 'lucide-react';

const manualSections = [
  { title: "Dashboard", content: "O Dashboard mostra os principais indicadores do sistema.\n\n- **Admin/Financeiro**: Veem KPIs financeiros (receita, OPEX, EBITDA, FCF), graficos mensais de receita vs despesas, OPEX por categoria, e resumo de pagamentos.\n- **Operacional**: Veem KPIs operacionais (propriedades, clientes, check-outs proximos, ocupacao, contratos, manutencao).\n\nTodos os usuarios veem o grafico de tendencia de ocupacao e alertas recentes." },
  { title: "Financeiro (Entradas/Saidas)", content: "Gerencie todas as transacoes financeiras.\n\n- **Entradas**: Receitas por banco, aluguel e deposito. Vincule a propriedade, cliente e competencia.\n- **Saidas**: Despesas por categoria. Categorias especiais: 'Pro-Labore' e 'CAPEX' sao tratadas separadamente nos calculos.\n- **P&L**: Demonstrativo de Resultados por Caixa ou Competencia.\n\n*Apenas Admin e Financeiro podem ver P&L e Ranking.*" },
  { title: "Propriedades", content: "Cadastre e gerencie seus imoveis.\n\n- Cada propriedade tem: nome, endereco, tipo, proprietario, aluguel mensal, datas de contrato.\n- **Quartos e Camas**: Dentro de cada propriedade, crie quartos e camas para controlar a disponibilidade.\n- **Perfil da Propriedade**: Clique numa propriedade para ver receita, despesas, resultado, clientes e documentos.\n- **Ranking**: Classificacao das propriedades por rentabilidade (A/B/C/D)." },
  { title: "Clientes", content: "Gerencie todos os seus clientes/hospedes.\n\n- Cadastro com dados pessoais, documento, nacionalidade.\n- Vincule a propriedade, quarto e cama.\n- Defina check-in, check-out e valor mensal.\n- **Perfil do Cliente**: Timeline completa com historico de pagamentos, contratos, documentos e observacoes." },
  { title: "Contratos", content: "Gerencie contratos de aluguel, hospedagem e parceria.\n\n- Crie contratos vinculados a clientes e propriedades.\n- **Gerar PDF**: Clique no icone de download para gerar o contrato em PDF.\n- **Enviar por Email**: Clique no icone de email para enviar o contrato diretamente ao cliente.\n- Status: Pendente, Vigente, Expirado, Cancelado." },
  { title: "Disponibilidade", content: "Visualize a ocupacao de todas as propriedades.\n\n- **Mapa**: Veja quartos e camas com status de ocupado/disponivel.\n- **Calendario**: Visualizacao mensal mostrando clientes por dia.\n- Crie quartos e camas diretamente desta pagina." },
  { title: "Manutencao", content: "Registre e acompanhe solicitacoes de manutencao.\n\n- Crie solicitacoes com titulo, descricao, prioridade (Baixa/Media/Alta/Urgente).\n- Acompanhe o status: Aberto > Em Andamento > Concluido.\n- Registre custos de cada manutencao.\n- Filtre por propriedade e status." },
  { title: "Relatorios", content: "Gere relatorios e exporte dados.\n\n- **Relatorio Financeiro (PDF)**: Receita, despesas, EBITDA por categoria e propriedade.\n- **Relatorio de Ocupacao (PDF)**: Status de ocupacao de todas as propriedades.\n- **Exportar CSV**: Exporta entradas e saidas para abrir no Excel.\n- **Notificacoes**: Envie lembretes automaticos de check-out, contratos e pagamentos." },
  { title: "Alertas", content: "O sistema gera alertas automaticos:\n\n- Contratos vencendo em 30 dias\n- Check-outs proximos (7 dias)\n- Propriedades vazias\n- Pagamentos atrasados\n- Alugueis fixos pendentes\n- Documentos pendentes" },
  { title: "Configuracoes", content: "Apenas Admin tem acesso.\n\n- **Categorias**: Gerencie categorias de entrada, saida e metodos de pagamento.\n- **Usuarios**: Crie, edite, ative/desative usuarios.\n- **Roles**: Admin (acesso total), Financeiro (dados financeiros), Operacional (operacao sem resultados financeiros), Visualizador (somente leitura)." },
  { title: "Niveis de Acesso", content: "O sistema tem 4 niveis de usuario:\n\n- **Admin**: Acesso completo. Dashboard financeiro, P&L, relatorios, ranking, configuracoes.\n- **Financeiro**: Acesso a dados financeiros (dashboard, P&L, relatorios, ranking) mas sem configuracoes.\n- **Operacional (OPS)**: Pode adicionar clientes, transacoes, contratos, manutencao. NAO ve dashboard financeiro, P&L, ranking ou relatorios financeiros.\n- **Visualizador**: Somente leitura em tudo que tem acesso." },
];

const botKnowledge: Record<string, string> = {
  "dashboard": "O Dashboard mostra KPIs. Admin/Financeiro veem dados financeiros (receita, EBITDA, etc). OPS veem dados operacionais (ocupacao, check-outs, manutencao).",
  "financeiro": "A area Financeira tem Entradas (receitas), Saidas (despesas), Pagamentos, e P&L (Caixa e Competencia). Apenas Admin e Financeiro tem acesso ao P&L.",
  "propriedade": "Propriedades tem quartos e camas. Cada propriedade mostra receita, despesas e resultado. O Ranking classifica por rentabilidade.",
  "cliente": "Clientes sao vinculados a propriedade/quarto/cama. O perfil mostra timeline, pagamentos, contratos e documentos.",
  "contrato": "Contratos podem ser de aluguel, hospedagem ou parceria. Voce pode gerar PDF e enviar por email direto do sistema.",
  "manutencao": "Crie solicitacoes de manutencao, acompanhe status (Aberto > Em Andamento > Concluido) e custos.",
  "relatorio": "Gere relatorios financeiros (PDF), de ocupacao (PDF) e exporte dados (CSV). Envie notificacoes automaticas por email.",
  "alerta": "Alertas sao gerados automaticamente: contratos vencendo, check-outs proximos, pagamentos atrasados, propriedades vazias.",
  "usuario": "4 niveis: Admin (tudo), Financeiro (dados financeiros), Operacional (operacao), Visualizador (leitura).",
  "configuracao": "Apenas Admin: categorias de entrada/saida, metodos de pagamento, gestao de usuarios.",
  "email": "Configure SMTP nas variaveis de ambiente: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS. Para Gmail, use Senha de App.",
  "pdf": "PDFs de contratos sao gerados com reportlab. Clique no icone de download na lista de contratos.",
  "ocupacao": "A pagina Disponibilidade mostra mapa e calendario de ocupacao. O dashboard mostra tendencia de 12 meses.",
  "pagamento": "Pagamentos compara valor esperado vs recebido por cliente. Mostra status: pago, parcial, pendente, atrasado.",
  "ops": "Usuario OPS pode fazer toda a operacao (clientes, transacoes, contratos, manutencao) mas NAO ve resultados financeiros.",
  "admin": "Admin tem acesso total: financeiro, operacional, configuracoes, usuarios, relatorios.",
};

export default function HelpManual() {
  const [openSections, setOpenSections] = useState<number[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{role: string; text: string}>>([
    { role: 'bot', text: 'Ola! Sou o assistente do Ferri Sistem. Pergunte qualquer coisa sobre o sistema!' }
  ]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'manual' | 'bot'>('manual');

  const toggleSection = (i: number) => {
    setOpenSections(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    const lower = userMsg.toLowerCase();
    let response = 'Desculpe, nao encontrei informacoes sobre isso. Tente perguntar sobre: dashboard, financeiro, propriedades, clientes, contratos, manutencao, relatorios, alertas, usuarios, configuracoes, email, pdf, ocupacao, pagamentos.';

    for (const [key, value] of Object.entries(botKnowledge)) {
      if (lower.includes(key)) {
        response = value;
        break;
      }
    }

    // Additional pattern matching
    if (lower.includes('como') && lower.includes('gerar') && lower.includes('pdf')) response = 'Para gerar um PDF de contrato: va em Contratos, encontre o contrato desejado, e clique no icone de download (seta para baixo). O PDF sera gerado e baixado automaticamente.';
    if (lower.includes('como') && lower.includes('enviar') && lower.includes('email')) response = 'Para enviar contrato por email: va em Contratos, clique no icone de email ao lado do contrato. Preencha o email do destinatario e clique Enviar. Necessario configurar SMTP.';
    if (lower.includes('como') && lower.includes('criar') && lower.includes('usuario')) response = 'Apenas Admin pode criar usuarios. Va em Configuracoes > aba Usuarios > botao "+ Novo Usuario". Defina nome, email, senha e role.';
    if (lower.includes('como') && lower.includes('configurar') && lower.includes('smtp')) response = 'Para configurar email SMTP: antes de iniciar o backend, exporte as variaveis: SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USER=seu@email.com, SMTP_PASS=sua_senha_de_app. Para Gmail, crie uma Senha de App em myaccount.google.com.';

    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'bot', text: response }]);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><HelpCircle size={24} /> Central de Ajuda</h1>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Book size={16} className="inline mr-2" />Manual do Sistema
        </button>
        <button onClick={() => setActiveTab('bot')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'bot' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Bot size={16} className="inline mr-2" />Assistente AI
        </button>
      </div>

      {activeTab === 'manual' && (
        <div className="space-y-2">
          {manualSections.map((section, i) => (
            <div key={i} className="card">
              <button onClick={() => toggleSection(i)} className="w-full flex items-center justify-between text-left">
                <h3 className="font-semibold text-gray-700">{section.title}</h3>
                {openSections.includes(i) ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
              </button>
              {openSections.includes(i) && (
                <div className="mt-3 pt-3 border-t text-sm text-gray-600 whitespace-pre-line">{section.content}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'bot' && (
        <div className="card flex flex-col" style={{ height: '500px' }}>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  {msg.role === 'bot' && <Bot size={14} className="inline mr-1 mb-0.5" />}
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t pt-3">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Pergunte sobre o sistema..." className="input-field flex-1" />
            <button onClick={sendMessage} className="btn-primary px-3"><Send size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
