import { z } from 'genkit';
import { ai, db } from '../config';
import * as fs from 'fs';
import * as path from 'path';

// Schema de entrada
export const DocumentGeneratorInputSchema = z.object({
  userId: z.string(),
  sectorId: z.string(),
  templateName: z.enum(['LIA', 'RIPD', 'Politica de Privacidade', 'Termos de Uso', 'Termo de Consentimento']),
});

// Mapa para os nomes reais dos arquivos de templates no diretório .genkit/templates
const TEMPLATE_MAP: Record<string, string> = {
  'LIA': '05_33_AVALIAÇÃO LEGÍTIMO INTERESSE.md',
  'RIPD': '04_28_ Modelo de Relatório de Impacto às atividades.md',
  'Politica de Privacidade': '02_02_POLÍTICA DE PRIVACIDADE SITE.md',
  'Termos de Uso': '02_03_TERMOS DE USO.md',
  'Termo de Consentimento': '06_44_Termo_Consentimento_Candidato_ATS.md'
};

export const documentGeneratorFlow = ai.defineFlow(
  {
    name: 'documentGeneratorFlow',
    inputSchema: DocumentGeneratorInputSchema,
    outputSchema: z.object({
      documentContent: z.string(),
      title: z.string(),
      createdAt: z.string(),
    }),
  },
  async (input) => {
    const { userId, sectorId, templateName } = input;

    // 1. Obter respostas do questionário/mapeamento do setor
    const questionnaireDoc = await db.collection('questionnaires').doc(userId).get();
    if (!questionnaireDoc.exists) {
      throw new Error('Mapeamento (questionário) do usuário não encontrado.');
    }

    const qData = questionnaireDoc.data();
    const sectors = qData?.sectors || [];
    const targetSector = sectors.find((s: any) => s.id === sectorId);

    if (!targetSector) {
      throw new Error(`Setor com ID ${sectorId} não encontrado nos mapeamentos.`);
    }

    // Estruturar dados das respostas do setor para passar no prompt
    const sectorInfo = {
      name: targetSector.name,
      status: targetSector.status,
      processes: (targetSector.processes || []).map((p: any) => ({
        name: p.name,
        description: p.description,
        status: p.status,
        answers: p.answers || null,
      })),
    };

    // 2. Carregar o template Markdown correspondente do diretório local
    const fileName = TEMPLATE_MAP[templateName];
    if (!fileName) {
      throw new Error(`Template ${templateName} não está mapeado.`);
    }

    // Resoluções de caminho seguras tanto para desenvolvimento (src/) quanto para produção (lib/)
    const possiblePaths = [
      path.resolve(__dirname, '../templates', fileName), // compiled js: lib/agents/ -> lib/templates
      path.resolve(__dirname, '../../templates', fileName),
      path.resolve(__dirname, '../../.genkit/templates', fileName),
      path.resolve(__dirname, '../../../.genkit/templates', fileName),
      path.resolve(process.cwd(), '.genkit/templates', fileName),
      path.resolve(process.cwd(), 'functions/.genkit/templates', fileName),
    ];

    let templateContent = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        templateContent = fs.readFileSync(p, 'utf-8');
        break;
      }
    }

    if (!templateContent) {
      throw new Error(`Arquivo do template ${fileName} não foi encontrado.`);
    }

    // 3. Chamar a IA (Gemini) via Genkit para injetar as respostas no template
    const response = await ai.generate({
      system: `Você é o DPO virtual do DPO Fast, especialista em LGPD. 
Sua tarefa é redigir um documento de adequação personalizado com base em um template padrão e nas respostas de mapeamento de dados de um setor específico de uma empresa.
Mantenha a estrutura, cláusulas e rigor técnico do template fornecido, mas preencha todas as variáveis, colchetes, campos em branco e informações relevantes com os dados reais do setor.
Caso falte alguma informação específica nas respostas, infira algo coerente com as melhores práticas da LGPD ou indique claramente entre colchetes a necessidade de preenchimento posterior.`,
      prompt: `Aqui está o template do documento (${templateName}):
---
${templateContent}
---

Aqui estão os dados reais do mapeamento do setor "${sectorInfo.name}":
${JSON.stringify(sectorInfo, null, 2)}

Gere o documento final completo em formato Markdown, pronto para uso.`,
    });

    if (!response || !response.text) {
      throw new Error('Falha ao gerar o documento pela IA.');
    }

    // 4. Salvar o documento gerado no Firestore do usuário
    const documentRef = db.collection('users').doc(userId).collection('documents').doc();
    const docData = {
      id: documentRef.id,
      title: `${templateName} - Setor ${sectorInfo.name}`,
      content: response.text,
      templateName,
      sectorId,
      sectorName: sectorInfo.name,
      createdAt: new Date().toISOString(),
    };

    await documentRef.set(docData);

    return {
      documentContent: response.text,
      title: docData.title,
      createdAt: docData.createdAt,
    };
  }
);
