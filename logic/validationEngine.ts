
import { ComplianceTask, ValidationResult } from '../types';

/**
 * Motor de Validação LGPD (Rule-based)
 * Verifica a presença de requisitos obrigatórios em textos ou ações declaradas.
 */

const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const checkKeywords = (text: string, keywords: string[]): string[] => {
  const normalizedText = normalize(text);
  return keywords.filter(kw => !normalizedText.includes(normalize(kw)));
};

export const LGPD_CRITERIA_EXPLANATIONS: Record<string, string> = {
  'finalidade': 'O Art. 6º, I exige que o tratamento tenha propósitos legítimos, específicos e informados ao titular.',
  'dados': 'É obrigatório listar quais categorias de dados pessoais estão sendo tratadas (Art. 9º, II).',
  'direitos': 'O titular deve ser informado sobre seus direitos de acesso, correção e exclusão (Art. 18).',
  'contato': 'A identidade e as informações de contato do controlador devem ser claras (Art. 9º, I).',
  'titular': 'O texto deve deixar claro quem é o dono dos dados e como ele é protegido.',
  'compartilhamento': 'Deve-se informar se os dados são compartilhados com terceiros e para qual fim (Art. 9º, V).',
  'concordo': 'O consentimento deve ser uma manifestação livre e inequívoca (Art. 5º, XII).',
  'revogar': 'O titular tem o direito de revogar o consentimento a qualquer momento (Art. 8º, § 5º).',
  'sim': 'A opção de aceite deve ser clara e não induzida.',
  'nao': 'Deve haver uma opção clara para recusar o tratamento sem prejuízo indevido.',
  'base legal': 'Todo tratamento deve estar fundamentado em uma das bases do Art. 7º ou Art. 11.',
  'fluxo': 'O registro deve descrever o ciclo de vida do dado na organização.',
  'armazenamento': 'Informar onde e por quanto tempo os dados ficam guardados.',
  'segurança': 'Descrever medidas técnicas para prevenir acessos não autorizados (Art. 46).',
  'contrato assinado': 'A existência de um documento formal assinado é a evidência primária de que o parceiro aceitou as regras da LGPD.',
  'responsabilidade solidaria': 'Cláusula vital que define que o terceiro também responde juridicamente por danos causados aos dados que você enviou (Art. 42).',
  'aviso de vazamento': 'O parceiro deve se comprometer contratualmente a avisar sua empresa imediatamente em caso de incidentes de segurança (Art. 48).',
  'codigo SMS': 'Uso de código enviado por celular como segundo fator de autenticação para validar a identidade do usuário.',
  'autenticador': 'Uso de aplicativos (como Google Auth ou Microsoft Authenticator) que geram tokens temporários, sendo o método de MFA mais seguro.',
  'Conteúdo detalhado': 'A evidência precisa ser substancial para comprovar a implementação real da medida técnica ou administrativa.',
  'Clareza na descrição': 'A descrição deve permitir que um auditor entenda exatamente qual ação foi tomada pela empresa.'
};

export const validateTaskCompliance = (task: ComplianceTask, evidence: string): ValidationResult => {
  const text = evidence.trim();
  
  if (text.length < 20) {
    return {
      isValid: false,
      feedback: "A descrição enviada está muito curta. Para garantir a segurança jurídica, forneça mais detalhes sobre como a medida foi aplicada.",
      missingElements: ["Conteúdo detalhado"]
    };
  }

  const normalizedTitle = normalize(task.title);

  // 1. Validação Específica: Contrato com Terceiros / Parceiros
  if (normalizedTitle.includes('contrato') || normalizedTitle.includes('terceiro') || normalizedTitle.includes('parceiro')) {
    const mandatory = ['contrato assinado', 'responsabilidade solidaria', 'aviso de vazamento'];
    const missing = checkKeywords(text, mandatory);

    if (missing.length === 0) {
      return {
        isValid: true,
        feedback: "Excelente! Sua evidência descreve as garantias contratuais necessárias para o compartilhamento seguro e a responsabilidade civil do parceiro.",
        missingElements: []
      };
    } else {
      return {
        isValid: false,
        feedback: "Sua descrição de contrato ainda está incompleta. Para plena conformidade, é necessário citar a existência do documento assinado e as cláusulas de proteção.",
        missingElements: missing
      };
    }
  }

  // 2. Validação Específica: MFA (Segurança de Acesso)
  if (normalizedTitle.includes('mfa') || normalizedTitle.includes('duas etapas') || normalizedTitle.includes('verificacao em duas')) {
    const methods = ['codigo SMS', 'autenticador'];
    const missing = checkKeywords(text, methods);

    // No caso de MFA, basta um dos dois métodos estar presente
    if (missing.length === methods.length) {
      return {
        isValid: false,
        feedback: "Para validar a implementação de MFA, especifique qual método técnico foi ativado nos seus sistemas.",
        missingElements: ['codigo SMS', 'autenticador']
      };
    } else {
      return {
        isValid: true,
        feedback: "Configuração de MFA validada. O uso de uma camada extra de proteção é uma das melhores defesas contra acessos não autorizados exigidas pelo Art. 46.",
        missingElements: []
      };
    }
  }

  // 3. Regras para Políticas e Avisos de Privacidade
  if (task.targetDocument.includes('Política') || normalizedTitle.includes('aviso de privacidade')) {
    const mandatory = ['finalidade', 'dados', 'direitos', 'contato', 'titular', 'compartilhamento'];
    const missing = checkKeywords(text, mandatory);
    
    if (missing.length === 0) {
      return {
        isValid: true,
        feedback: "Parabéns! Seu aviso/política contém os elementos essenciais de transparência exigidos pelo Art. 9º da LGPD.",
        missingElements: []
      };
    } else {
      return {
        isValid: false,
        feedback: "Seu informativo de privacidade ainda carece de transparência em alguns pontos obrigatórios.",
        missingElements: missing
      };
    }
  }

  // 4. Validação de Consentimento
  if (task.targetDocument.includes('Consentimento')) {
    const mandatory = ['concordo', 'finalidade', 'revogar', 'sim', 'nao'];
    const missing = checkKeywords(text, mandatory);

    if (missing.length <= 1) { 
      return {
        isValid: true,
        feedback: "O mecanismo de consentimento descrito garante a manifestação livre e oferece escolha clara ao titular.",
        missingElements: []
      };
    } else {
      return {
        isValid: false,
        feedback: "O consentimento deve ser livre e inequívoco. Garanta que o titular saiba como revogar a autorização e tenha opção de recusar.",
        missingElements: missing
      };
    }
  }

  // 5. Validação de RAT (Registro de Atividades)
  if (task.targetDocument.includes('RAT')) {
    const mandatory = ['base legal', 'finalidade', 'fluxo', 'armazenamento', 'seguranca'];
    const missing = checkKeywords(text, mandatory);

    if (missing.length === 0) {
      return {
        isValid: true,
        feedback: "O Registro de Atividades está robusto e cumpre integralmente o dever de manutenção de registros do Art. 37.",
        missingElements: []
      };
    } else {
      return {
        isValid: false,
        feedback: "Faltam elementos técnicos de mapeamento do ciclo de vida do dado no seu registro.",
        missingElements: missing
      };
    }
  }

  // Validação genérica para outras tarefas
  if (text.length > 50) {
    return {
      isValid: true,
      feedback: "Tarefa validada com base na descrição da implementação física ou técnica realizada.",
      missingElements: []
    };
  }

  return {
    isValid: false,
    feedback: "Forneça uma descrição mais clara e técnica de como essa tarefa foi concluída na prática.",
    missingElements: ["Clareza na descrição"]
  };
};
