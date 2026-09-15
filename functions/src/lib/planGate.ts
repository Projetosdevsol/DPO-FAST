import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config';
import { getUserPlan, SubscriptionPlan } from './subscription';

export type AllowedPlan = 'free' | 'basico' | 'pro' | 'personalite';

const PLAN_WEIGHTS: Record<AllowedPlan, number> = {
  free: 0,
  basico: 1,
  pro: 2,
  personalite: 3,
};

export type PlanDetail = {
  plan: SubscriptionPlan;
  statusAssinatura: string; // raw lowercased, '' = sem Stripe (legado/manual)
};

/**
 * Lê plano + status na mesma fonte de generateDocumentFromTemplate
 * (functions/src/index.ts:129-130): users/{uid}.plan || .subscription.plan
 * + users/{uid}.status_assinatura. Mantém mapeamentos legado prata/ouro.
 */
export async function getPlanDetail(userId: string): Promise<PlanDetail> {
  const plan = await getUserPlan(userId); // já normaliza bronze/basic/prata/ouro
  let statusAssinatura = '';
  try {
    const snap = await db.collection('users').doc(userId).get();
    statusAssinatura = String(snap.data()?.status_assinatura || '').toLowerCase();
  } catch {
    // getUserPlan já logou; status vazio = trata como legado sem Stripe
  }
  return { plan, statusAssinatura };
}

/**
 * Gate único PRO+. Espelha index.ts:135-149:
 * - free/basico sempre negados
 * - personalite (inclui ouro/personalité) sempre liberado
 * - pro (inclui prata) exige status active/trialing ou ausente (legado)
 */
export async function assertProAccess(userId: string): Promise<PlanDetail> {
  const detail = await getPlanDetail(userId);
  const weight = PLAN_WEIGHTS[detail.plan as AllowedPlan] ?? 0;

  if (weight < PLAN_WEIGHTS.pro) {
    throw new HttpsError(
      'permission-denied',
      'Funcionalidade exclusiva para assinantes do Plano PRO ou superior.'
    );
  }

  // personalite nunca exige Stripe (contrato manual) — igual index.ts:142
  if (detail.plan === 'personalite') return detail;

  const s = detail.statusAssinatura;
  const active = s === 'active' || s === 'trialing' || s === '';
  if (!active) {
    throw new HttpsError(
      'permission-denied',
      'Assinatura inativa. Regularize o pagamento para usar o gerador.'
    );
  }
  return detail;
}

export function hasProAccessWeight(plan: SubscriptionPlan): boolean {
  return (PLAN_WEIGHTS[plan as AllowedPlan] ?? 0) >= PLAN_WEIGHTS.pro;
}
