
export const STRIPE_LINKS = {
  basico: 'https://buy.stripe.com/test_9B600lagGgxhffe6Sj3AY00',
  pro: 'https://buy.stripe.com/test_28E8wRagGftd0kkekL3AY01',
  personalite: 'https://api.whatsapp.com/send?phone=YOUR_NUMBER&text=Olá! Gostaria de saber mais sobre o plano Personalité.'
};

export const isPaidPlan = (plan: string): boolean => {
  return ['basico', 'pro', 'personalite'].includes(plan);
};
