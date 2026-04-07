
import * as mammoth from 'https://esm.sh/mammoth@^1.8.0';

/**
 * Utilitário para extrair texto de diferentes tipos de arquivos no cliente.
 */

export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;

  if (fileType === 'application/pdf') {
    return extractTextFromPDF(file);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDocx(file);
  } else if (fileType === 'text/plain') {
    return file.text();
  }
  
  throw new Error('Formato de arquivo não suportado para extração automática.');
};

async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromPDF(file: File): Promise<string> {
  // Nota: Para um MVP, usamos uma abordagem baseada em FileReader se bibliotecas externas pesadas falharem
  // Em um ambiente real, carregaríamos o pdf.js de um CDN de forma assíncrona
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Simulando extração para o contexto deste ambiente sem injetar scripts globais pesados
    // No mundo real, usaríamos: const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    return "Conteúdo extraído do PDF: " + file.name + "\n(Simulação de extração de texto para fins de demonstração da lógica de validação)";
  } catch (e) {
    throw new Error('Falha ao processar PDF.');
  }
}
