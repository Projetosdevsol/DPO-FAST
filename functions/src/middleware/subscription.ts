import { db } from '../config';

export type UserPlan = 'Bronze' | 'Prata' | 'Ouro';

export async function validateSubscription(userId: string): Promise<UserPlan> {
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('Usuário não encontrado.');
  }

  const userData = userDoc.data();
  const plan = userData?.subscription?.plan as UserPlan;

  if (!plan || !['Bronze', 'Prata', 'Ouro'].includes(plan)) {
    throw new Error('Assinatura ativa não encontrada ou plano inválido.');
  }

  return plan;
}
