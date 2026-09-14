/**
 * cnpjValidator.ts
 * Algoritmo completo de validação matemática de CNPJ (dígitos verificadores).
 * Executa no backend (Cloud Function) e pode ser importado no frontend também.
 * Não faz chamada de rede — puro cálculo.
 */

export interface CnpjValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Valida o formato e os dígitos verificadores de um CNPJ.
 * Remove formatação antes de processar.
 */
export function validateCnpjAlgorithm(rawCnpj: string): CnpjValidationResult {
  // Remove qualquer caractere não-numérico
  const cnpj = rawCnpj.replace(/\D/g, '');

  if (cnpj.length !== 14) {
    return { valid: false, reason: 'O CNPJ deve conter exatamente 14 dígitos.' };
  }

  // Rejeita sequências trivialmente inválidas (ex: 00000000000000)
  if (/^(\d)\1+$/.test(cnpj)) {
    return { valid: false, reason: 'CNPJ inválido. Verifique os números digitados.' };
  }

  // Cálculo do primeiro dígito verificador
  const calcDigit = (digits: string, weights: number[]): number => {
    const sum = digits
      .split('')
      .reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digit1 = calcDigit(cnpj.substring(0, 12), weights1);
  if (digit1 !== parseInt(cnpj[12])) {
    return { valid: false, reason: 'CNPJ inválido. Verifique os números digitados.' };
  }

  const digit2 = calcDigit(cnpj.substring(0, 13), weights2);
  if (digit2 !== parseInt(cnpj[13])) {
    return { valid: false, reason: 'CNPJ inválido. Verifique os números digitados.' };
  }

  return { valid: true };
}
