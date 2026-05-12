import { db } from '../config';

export type SubscriptionPlan = 'free' | 'basico' | 'pro' | 'personalite' | 'enterprise';

/**
 * Busca o plano de assinatura do usuário no Firestore.
 * Mapeia os níveis de acesso:
 * - free/basico: Apenas Agente de Diagnóstico.
 * - pro: Diagnóstico + Sugestão.
 * - personalite/enterprise: Ciclo completo (Diagnóstico, Sugestão e Execução).
 */
export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.warn(`Usuário ${userId} não encontrado, assumindo plano basico.`);
      return 'basico';
    }
    
    const data = userDoc.data();
    // Tenta pegar de user.plan primeiro, depois de subscription.plan
    const plan = (data?.plan || data?.subscription?.plan || 'basico').toLowerCase();
    
    // Mapeamento de nomes antigos ou variações
    if (plan === 'bronze' || plan === 'basic') return 'basico';
    if (plan === 'prata') return 'pro';
    if (plan === 'ouro' || plan === 'personalité') return 'personalite';
    
    return plan as SubscriptionPlan;
  } catch (error) {
    console.error('Erro ao buscar plano do usuário:', error);
    return 'basico';
  }
}

/**
 * Verifica se o usuário tem permissão para a funcionalidade baseada no plano.
 */
export function hasPermission(plan: SubscriptionPlan, feature: 'discovery' | 'suggestion' | 'execution'): boolean {
  if (feature === 'discovery') return true; // Todos têm acesso
  if (feature === 'suggestion') return ['pro', 'personalite', 'enterprise'].includes(plan);
  if (feature === 'execution') return ['basico', 'pro', 'personalite', 'enterprise'].includes(plan);
  return false;
}
