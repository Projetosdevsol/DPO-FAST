
import { QuestionnaireData, User } from '../types';

export interface DocumentContent {
  title: string;
  content: string;
}

export const generateDocument = (type: string, data: QuestionnaireData, user: User): DocumentContent => {
  const date = new Date().toLocaleDateString('pt-BR');
  
  const baseInfo = `
    **EMPRESA:** ${user.companyName}
    **CNPJ:** ${user.cnpj}
    **DATA DE EMISSÃO:** ${date}
  `;

  switch (type) {
    case 'Registro de Atividades de Tratamento (RAT)':
      let processDetails = '';
      (data.sectors || []).forEach(s => {
        const completedProcesses = (s.processes || []).filter(p => p.status === 'completed' && p.answers);
        if (completedProcesses.length > 0) {
          processDetails += `\n### SETOR: ${s.name.toUpperCase()}\n`;
          completedProcesses.forEach(p => {
            const ans = p.answers!;
            processDetails += `
#### Processo: ${p.name}
- **Finalidade:** ${ans.purpose}
- **Dados:** ${ans.collectedData.join(', ')}
- **Base Legal:** ${ans.legalBasis}
- **Titulares:** ${ans.dataSubjects.join(', ')}
- **Retenção:** ${ans.retentionPeriod}
- **Compartilhamento:** ${ans.isSharedExternal ? 'Sim (Terceiros)' : 'Não'}
            `;
          });
        }
      });

      return {
        title: 'Registro de Atividades de Tratamento (RAT)',
        content: `
# REGISTRO DE ATIVIDADES DE TRATAMENTO DE DADOS (RAT)
Em conformidade com o Art. 37 da Lei 13.709/2018 (LGPD).

## 1. CONTROLADOR
${user.companyName} | CNPJ: ${user.cnpj}
Endereço: ${user.address}

## 2. INVENTÁRIO DE PROCESSOS
${processDetails || 'Nenhum processo mapeado até o momento.'}

## 3. MEDIDAS DE SEGURANÇA GERAIS
- Acesso controlado e autenticação.
- Backup e recuperação de desastres.
- Treinamento de conscientização em privacidade.

${baseInfo}
        `
      };

    case 'Política Interna de Privacidade':
      return {
        title: 'Política Interna de Privacidade',
        content: `
# POLÍTICA INTERNA DE PROTEÇÃO DE DADOS
Esta política estabelece as normas para todos os departamentos e processos da **${user.companyName}**.

## 1. PRINCÍPIOS
Todos os colaboradores devem observar a Finalidade, Necessidade e Transparência em todos os processos mapeados.

## 2. SEGURANÇA DA INFORMAÇÃO
- Uso de MFA (Autenticação em duas etapas) onde disponível.
- Criptografia de dados sensíveis.
- Descarte seguro conforme Tabela de Temporalidade.

${baseInfo}
        `
      };

    default:
      return { 
        title: 'Documento de Conformidade', 
        content: `# DOCUMENTO LGPD\n\nEste documento auxilia na adequação da ${user.companyName}.\n\n${baseInfo}` 
      };
  }
};
