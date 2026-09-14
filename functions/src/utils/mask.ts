/**
 * Masking utility for PII and sensitive documents (Backend)
 */

export function maskPII(logData: any): any {
  if (!logData) return logData;
  
  if (typeof logData === 'string') {
    return logData
      .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[MASKED CPF]')
      .replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, '[MASKED EMAIL]');
  }
  
  if (typeof logData === 'object') {
    const maskedObj = { ...logData };
    const sensitiveKeys = ['cpf', 'rg', 'documento', 'email', 'telefone', 'password', 'senha', 'titulo', 'ctps'];
    
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
