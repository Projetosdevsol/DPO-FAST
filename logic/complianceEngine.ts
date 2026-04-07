
import { QuestionnaireData, ComplianceTask } from '../types';

export const generateComplianceTasks = (data: QuestionnaireData | null): ComplianceTask[] => {
  if (!data) return [];
  const tasks: ComplianceTask[] = [];
  const now = new Date();
  const isSmallBusiness = data.companySize === 'MEI' || data.companySize === 'Microempresa';

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  };

  const createTask = (base: Omit<ComplianceTask, 'dueDate'>): ComplianceTask => {
    const suggestedDays = base.priority === 'Alta' ? 7 : base.priority === 'Média' ? 15 : 30;
    return {
      ...base,
      dueDate: addDays(now, suggestedDays)
    };
  };

  // --- 1. TAREFAS GLOBAIS DE TRANSPARÊNCIA ---
  const mainSectorId = data.sectors?.[0]?.id;

  tasks.push(createTask({
    id: 'task-global-privacy-notice',
    title: 'Publicar Aviso de Privacidade nos canais de atendimento',
    sectorId: mainSectorId,
    description: `Sua empresa coleta dados de clientes, mas não possui um informativo claro sobre o uso. Isso fere o Princípio da Transparência (Art. 6º, VI) e o dever de informação (Art. 9º). Sem isso, qualquer coleta de dados pode ser considerada irregular pela ANPD.`,
    explanation: `COMO FAZER: 
1. Use o "Aviso de Privacidade" gerado na aba Documentos. 
2. Se tiver site, coloque no rodapé como "Política de Privacidade". 
3. Se usar WhatsApp Business, coloque o link no perfil ou configure uma mensagem automática enviando o aviso no primeiro contato.
Referência: Art. 9º LGPD; Guia ANPD para Agentes de Pequeno Porte.`,
    priority: 'Alta',
    status: 'Pendente',
    targetDocument: 'Política Interna de Privacidade'
  }));

  tasks.push(createTask({
    id: 'task-internal-policy',
    title: 'Formalizar a Política Interna com colaboradores',
    sectorId: mainSectorId,
    description: `Mesmo pequenas equipes precisam de regras sobre como manusear senhas e documentos. A ausência de normas internas aumenta o risco de vazamentos por erro humano, que é a causa de 80% dos incidentes.`,
    explanation: `COMO FAZER: 
1. Baixe a "Política Interna de Proteção de Dados" do sistema. 
2. Compartilhe com todos que trabalham com você (sócios, funcionários ou estagiários). 
3. Peça que leiam e confirmem o recebimento por e-mail ou sistema de RH. 
DICA: Para pequenas empresas, uma reunião de 15 minutos explicando "o que não pode fazer" já conta como treinamento inicial.
Referência: Art. 50 (Boas Práticas e Governança).`,
    priority: 'Média',
    status: 'Pendente',
    targetDocument: 'Política Interna de Privacidade'
  }));

  // --- 2. TAREFAS BASEADAS NO MAPEAMENTO DE PROCESSOS ---

  (data.sectors || []).forEach(sector => {
    (sector.processes || []).forEach(process => {
      if (process.status !== 'completed' || !process.answers) return;
      const { answers } = process;

      // Riscos de Dados Sensíveis
      if (answers.hasSensitiveData) {
        tasks.push(createTask({
          id: `task-ripd-${process.id}`,
          title: `Validar Relatório de Impacto (RIPD) para: ${process.name}`,
          description: `O processo "${process.name}" no setor ${sector.name} lida com dados sensíveis. O Art. 38 exige maior cautela. O risco aqui é a inversão do ônus da prova: em caso de vazamento, você precisará provar que avaliou os riscos previamente.`,
          explanation: `COMO FAZER: 
1. No sistema, abra o relatório de riscos deste processo. 
2. Verifique se a finalidade justifica o uso de dados sensíveis. 
3. Se o risco for alto, descreva quais travas de segurança você usa (ex: pasta trancada ou senha forte). 
Referência: Art. 5º, II; Art. 38.`,
          priority: 'Alta',
          status: 'Pendente',
          targetDocument: 'Registro de Atividades de Tratamento (RAT)',
          processId: process.id,
          sectorId: sector.id
        }));
      }

      // Riscos de Segurança (MFA)
      if (!answers.hasMFA) {
        tasks.push(createTask({
          id: `task-mfa-${process.id}`,
          title: `Ativar Verificação em Duas Etapas (MFA) no sistema de ${process.name}`,
          description: `O acesso ao processo ${process.name} usa apenas senha simples. Isso torna os dados vulneráveis a ataques de força bruta ou phishing. O Art. 46 exige medidas técnicas compatíveis com o estado da técnica.`,
          explanation: `COMO FAZER: 
1. Acesse as configurações de segurança do sistema que você usa (ex: Google Workspace, CRM, ERP ou E-mail). 
2. Ative a "Verificação em Duas Etapas" ou "MFA". 
3. Se o sistema for físico, garanta que apenas pessoas autorizadas tenham a chave do armário.
Referência: Art. 46 (Segurança e Sigilo).`,
          priority: 'Alta',
          status: 'Pendente',
          targetDocument: 'Política Interna de Privacidade',
          processId: process.id,
          sectorId: sector.id
        }));
      }

      // Riscos de Compartilhamento com Terceiros
      if (answers.isSharedExternal) {
        // TAREFA CRÍTICA: Documento Ausente
        if (!answers.sharedExternalDocumentUrl) {
          tasks.push(createTask({
            id: `task-missing-shared-doc-${process.id}`,
            title: `Anexar Termo de Consentimento/Contrato: ${process.name}`,
            description: `Você indicou que compartilha dados com terceiros (${answers.externalThirdParties || 'não especificado'}) no processo "${process.name}", mas não anexou o documento que comprova a ciência ou contrato com esse parceiro. Sem este anexo, sua empresa assume 100% do risco em caso de incidentes causados pelo terceiro.`,
            explanation: `COMO FAZER: 
1. Obtenha a cópia do contrato assinado ou termo de consentimento aceito pelo parceiro que contenha cláusulas de LGPD. 
2. Volte ao Mapeamento de Processos no setor ${sector.name}. 
3. Edite o processo "${process.name}", vá até a etapa 5 (Fluxos) e realize o upload do documento no campo correspondente.
DICA: O upload regularizará automaticamente esta pendência no seu RAT consolidado.`,
            priority: 'Alta',
            status: 'Pendente',
            targetDocument: 'Registro de Atividades de Tratamento (RAT)',
            processId: process.id,
            sectorId: sector.id
          }));
        } else {
          // Se já existe o documento, mantém a tarefa de revisão periódica com prioridade menor
          tasks.push(createTask({
            id: `task-contract-review-${process.id}`,
            title: `Auditar cláusulas de LGPD do parceiro: ${process.name}`,
            description: `O documento para o processo "${process.name}" foi anexado, mas é necessário garantir que as cláusulas cobrem a responsabilidade solidária e o dever de notificação de incidentes pelo parceiro.`,
            explanation: `COMO FAZER: 
1. Revise o documento anexado ("${answers.sharedExternalDocumentName}"). 
2. Confirme se há prazos para o parceiro te avisar caso ele sofra um vazamento. 
3. Caso as cláusulas sejam genéricas, considere enviar um aditivo mais robusto.
Referência: Art. 33 ao 36 (Responsabilidade Civil).`,
            priority: 'Média',
            status: 'Pendente',
            targetDocument: 'Política Interna de Privacidade',
            processId: process.id,
            sectorId: sector.id
          }));
        }
      }

      // Riscos de Retenção
      if (!answers.retentionPeriod || answers.retentionPeriod.toLowerCase().includes('sempre')) {
        tasks.push(createTask({
          id: `task-retention-${process.id}`,
          title: `Definir prazo de exclusão para dados de: ${process.name}`,
          description: `Os dados de "${process.name}" parecem estar sendo guardados indefinidamente. O Art. 15 determina que os dados devem ser excluídos após o término da sua finalidade. Guardar dados desnecessários é um passivo jurídico.`,
          explanation: `COMO FAZER: 
1. Estabeleça um prazo (ex: 5 anos para documentos fiscais, 2 anos para currículos). 
2. Crie um lembrete no calendário para fazer uma "limpeza" anual ou semestral desses arquivos. 
3. Use o método de "${answers.deletionMethod}" que você informou no mapeamento.
Referência: Art. 15 e 16 (Término do Tratamento).`,
          priority: 'Baixa',
          status: 'Pendente',
          targetDocument: 'Registro de Atividades de Tratamento (RAT)',
          processId: process.id,
          sectorId: sector.id
        }));
      }
      
      // Riscos de Backup
      if (!answers.hasBackups) {
         tasks.push(createTask({
          id: `task-backup-${process.id}`,
          title: `Estabelecer rotina de Backup para: ${process.name}`,
          description: `A falta de backup para o processo "${process.name}" coloca a continuidade do seu negócio em risco. A LGPD também protege a disponibilidade dos dados. Perder dados de clientes pode gerar processos por perdas e danos.`,
          explanation: `COMO FAZER: 
1. Se o processo for digital, use serviços em nuvem com sincronização automática (Google Drive, OneDrive, iCloud). 
2. Se for físico, faça cópias digitalizadas dos documentos mais importantes. 
3. Teste se você consegue recuperar um arquivo apagado pelo menos uma vez por mês.
Referência: Art. 46.`,
          priority: 'Alta',
          status: 'Pendente',
          targetDocument: 'Política Interna de Privacidade',
          processId: process.id,
          sectorId: sector.id
        }));
      }
    });
  });

  return tasks;
};
