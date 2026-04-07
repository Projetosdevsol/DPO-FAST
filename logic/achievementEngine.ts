
import { Achievement, QuestionnaireData, ComplianceTask } from '../types';

export interface AchievementWithRequirement extends Achievement {
  howToUnlock: string;
}

export const ACHIEVEMENTS: AchievementWithRequirement[] = [
  { 
    id: 'pioneer', 
    title: 'Pioneiro da LGPD', 
    description: 'Completou o mapeamento da estrutura organizacional.', 
    type: 'bronze', 
    icon: 'Map',
    howToUnlock: 'Inicie o diagnóstico definindo o porte e setor da sua empresa.'
  },
  { 
    id: 'first_sector', 
    title: 'Cartógrafo de Dados', 
    description: 'Mapeou o primeiro setor da empresa.', 
    type: 'bronze', 
    icon: 'Layers',
    howToUnlock: 'Complete 100% das perguntas de qualquer um dos seus setores mapeados.'
  },
  { 
    id: 'privacy_notice', 
    title: 'Transparência Total', 
    description: 'Validou o Aviso de Privacidade Externo.', 
    type: 'silver', 
    icon: 'Eye',
    howToUnlock: 'Conclua a tarefa de "Aviso de Privacidade Externo" na aba de Conformidade.'
  },
  { 
    id: 'compliance_warrior', 
    title: 'Guerreiro do Compliance', 
    description: 'Completou 50% das tarefas de adequação.', 
    type: 'silver', 
    icon: 'Sword',
    howToUnlock: 'Valide pelo menos metade de todas as tarefas geradas no seu Plano de Ação.'
  },
  { 
    id: 'security_master', 
    title: 'Guardião Digital', 
    description: 'Implementou medidas de Backup e Criptografia.', 
    type: 'gold', 
    icon: 'ShieldCheck',
    howToUnlock: 'Valide a tarefa de "Plano de Segurança Digital" enviando as evidências técnicas.'
  },
  { 
    id: 'legal_architect', 
    title: 'Arquiteto Jurídico', 
    description: 'Completou todos os registros de base legal.', 
    type: 'gold', 
    icon: 'Scale',
    howToUnlock: 'Garanta que todos os setores mapeados tenham bases legais válidas e justificadas.'
  },
  { 
    id: 'platinum_seal', 
    title: 'Selo de Adequação 100%', 
    description: 'Empresa totalmente adequada às normas da LGPD.', 
    type: 'platinum', 
    icon: 'Trophy',
    howToUnlock: 'Zere todas as pendências do Plano de Ação e valide todos os documentos obrigatórios.'
  }
];

export const checkNewAchievements = (
  qData: QuestionnaireData | null, 
  tasks: ComplianceTask[], 
  currentAchievements: string[] = []
): Achievement[] => {
  const newUnlocks: Achievement[] = [];

  const unlock = (id: string) => {
    if (!currentAchievements.includes(id)) {
      const a = ACHIEVEMENTS.find(item => item.id === id);
      if (a) newUnlocks.push(a);
    }
  };

  if (qData && (qData.sectors || []).length > 0) unlock('pioneer');
  if (qData && (qData.sectors || []).some(s => (s.processes || []).some(p => p.status === 'completed'))) unlock('first_sector');

  const completedCount = (tasks || []).filter(t => t.status === 'Concluída').length;
  if (tasks && tasks.length > 0 && completedCount >= tasks.length / 2) unlock('compliance_warrior');

  const hasPrivacyTaskCompleted = (tasks || []).some(t => t.id === 'task-global-policy' && t.status === 'Concluída');
  if (hasPrivacyTaskCompleted) unlock('privacy_notice');

  const hasSecurityTaskCompleted = (tasks || []).some(t => t.id === 'task-it-hardening' && t.status === 'Concluída');
  if (hasSecurityTaskCompleted) unlock('security_master');

  if (tasks && tasks.length > 0 && completedCount === tasks.length) unlock('platinum_seal');

  return newUnlocks;
};
