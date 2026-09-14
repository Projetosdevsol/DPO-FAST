/**
 * Masking utility for PII and sensitive documents
 */

export function maskDocument(value: string | undefined | null): string {
  if (!value) return '';
  
  // Remove non-alphanumeric characters for consistent processing
  const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
  
  if (cleanValue.length <= 4) {
    return '***';
  }
  
  // Show only the last 4 characters
  const last4 = cleanValue.slice(-4);
  return `***.***.***-${last4}`;
}

export function maskPII(logData: any): any {
  if (!logData) return logData;
  
  if (typeof logData === 'string') {
    // Basic regex for CPF/CNPJ or email-like strings to mask in logs
    return logData
      .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[MASKED CPF]')
      .replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, '[MASKED EMAIL]');
  }
  
  if (typeof logData === 'object') {
    const maskedObj = { ...logData };
    const sensitiveKeys = ['cpf', 'rg', 'documento', 'email', 'telefone', 'password', 'senha'];
    
    for (const key in maskedObj) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        maskedObj[key] = '[MASKED]';
      } else if (typeof maskedObj[key] === 'object') {
        maskedObj[key] = maskPII(maskedObj[key]);
      }
    }
    return maskedObj;
  }
  
  return logData;
}
