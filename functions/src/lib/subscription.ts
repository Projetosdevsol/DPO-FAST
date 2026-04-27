import { db } from '../config';

export type SubscriptionPlan = 'Basic' | 'Pro' | 'Personalité';

/**
 * Busca o plano de assinatura do usuário no Firestore.
 * Mapeia os níveis de acesso:
 * - Basic: Apenas Agente de Diagnóstico.
 * - Pro: Diagnóstico + Sugestão.
 * - Personalité: Ciclo completo (Diagnóstico, Sugestão e Execução).
 */
export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.warn(`Usuário ${userId} não encontrado, assumindo plano Basic.`);
      return 'Basic';
    }
    
    const data = userDoc.data();
    const plan = data?.subscription?.plan;
    
    // Mapeamento de nomes antigos (se houver) para os novos
    if (plan === 'Bronze') return 'Basic';
    if (plan === 'Prata') return 'Pro';
    if (plan === 'Ouro') return 'Personalité';
    
    return (plan as SubscriptionPlan) || 'Basic';
  } catch (error) {
    console.error('Erro ao buscar plano do usuário:', error);
    return 'Basic';
  }
}

/**
 * Verifica se o usuário tem permissão para a funcionalidade baseada no plano.
 */
export function hasPermission(plan: SubscriptionPlan, feature: 'discovery' | 'suggestion' | 'execution'): boolean {
  if (feature === 'discovery') return true; // Todos têm acesso
  if (feature === 'suggestion') return plan === 'Pro' || plan === 'Personalité';
  if (feature === 'execution') return plan === 'Personalité';
  return false;
}
