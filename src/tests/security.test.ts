import { describe, it, expect } from 'vitest';
import { maskDocument, maskPII } from '../utils/mask';

describe('D) Testes de Segurança', () => {
  it('maskDocument deve mascarar corretamente strings com mais de 4 caracteres', () => {
    const masked = maskDocument('123456789');
    expect(masked).toBe('***.***.***-6789');
  });
  
  it('maskDocument deve mascarar de acordo para valores menores ou iguais a 4', () => {
    const masked = maskDocument('123');
    expect(masked).toBe('***');
  });

  it('Garantir que logs de requisição não imprimem dados sensíveis (maskPII)', () => {
    const rawLog = { user: 'Test', cpf: '123.456.789-00', event: 'login' };
    const maskedLog = maskPII(rawLog);
    
    expect(maskedLog.cpf).toBe('[MASKED]');
    expect(maskedLog.user).toBe('Test');
  });
});
