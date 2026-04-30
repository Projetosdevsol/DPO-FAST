
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { User, DataProcess, ComplianceTask, ComplianceCertificate, SectorAnswers } from '../types';

export const checkCertificationEligibility = (
  processId: string,
  tasks: ComplianceTask[],
  process: DataProcess
) => {
  // 1. Data Mapping concluded
  if (process.status !== 'completed') return { eligible: false, reason: 'Mapeamento incompleto' };

  // 2. GAPs resolved
  // Include both process-specific tasks AND global tasks (like Privacy Notice/Internal Policy)
  const relevantTasks = tasks.filter(t => t.processId === processId || !t.processId);
  const pendingTasks = relevantTasks.filter(t => t.status !== 'Concluída');
  
  if (pendingTasks.length > 0) {
    const globalPending = pendingTasks.filter(t => !t.processId);
    if (globalPending.length > 0) {
      return { eligible: false, reason: 'Existem pendências GLOBAIS não resolvidas (ex: Aviso de Privacidade ou Política Interna)' };
    }
    return { eligible: false, reason: 'Existem pendências (GAPs) vinculadas a este processo não resolvidas' };
  }

  // 3. Governance policies linked
  const answers = process.answers;
  if (!answers) return { eligible: false, reason: 'Respostas do mapeamento não encontradas' };

  if (!answers.legalBasis) return { eligible: false, reason: 'Base Legal não definida (Etapa 3)' };
  
  // Requirement: Governance measures (Step 6)
  // Agora validado via tarefas (task-incident e task-training) criadas em complianceEngine.ts

  return { eligible: true };
};

export const generateComplianceCertificatePDF = async (
  user: User,
  process: DataProcess,
  tasks: ComplianceTask[]
): Promise<ComplianceCertificate> => {
  const certificateId = `CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const issueDate = new Date().toLocaleDateString('pt-BR');
  const issueDateTime = new Date().toISOString();
  
  const doc = new jsPDF();
  const answers = process.answers as SectorAnswers;
  const processTasks = tasks.filter(t => t.processId === process.id);

  // --- CABEÇALHO ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO DE CONFORMIDADE LGPD', 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID Único: ${certificateId} | Emissão: ${issueDate}`, 105, 35, { align: 'center' });

  // --- DADOS DA EMPRESA ---
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA ORGANIZAÇÃO', 20, 65);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text([
    `Razão Social: ${user.companyName}`,
    `CNPJ: ${user.cnpj}`,
    `Processo Auditado: ${process.name}`,
    `Status Atual: PROTEGIDO / ADEQUADO`
  ], 20, 75);

  // --- SEÇÃO 1: DIAGNÓSTICO (MAPEAMENTO) ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DIAGNÓSTICO E MAPEAMENTO', 20, 110);
  
  autoTable(doc, {
    startY: 115,
    head: [['Campo', 'Informação']],
    body: [
      ['Finalidade', answers.purpose || 'Não informada'],
      ['Base Legal', answers.legalBasis],
      ['Dados Coletados', (answers.collectedData || []).join(', ')],
      ['Titulares', (answers.dataSubjects || []).join(', ')],
      ['Armazenamento', answers.storageType],
      ['Volume Estimado', answers.estimatedVolume]
    ],
    theme: 'striped',
    headStyles: { fillStyle: [37, 99, 235] } // blue-600
  });

  // --- SEÇÃO 2: PLANO DE REMEDIAÇÃO (GAPs) ---
  const lastY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. PLANO DE REMEDIAÇÃO (GAPs RESOLVIDOS)', 20, lastY + 20);

  const gapRows = processTasks.map(t => [
    t.title,
    t.priority,
    'RESOLVIDO'
  ]);

  autoTable(doc, {
    startY: lastY + 25,
    head: [['Risco Identificado', 'Prioridade', 'Status da Ação']],
    body: gapRows.length > 0 ? gapRows : [['Nenhum risco crítico identificado ou todos pré-mitigados', '-', 'OK']],
    theme: 'grid',
    headStyles: { fillStyle: [22, 163, 74] } // green-600
  });

  // --- SEÇÃO 3: GOVERNANÇA E ACOMPANHAMENTO ---
  const gapY = (doc as any).lastAutoTable.finalY || 200;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. GOVERNANÇA E MONITORAMENTO', 20, gapY + 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const govText = [
    `- Treinamento de Equipe: ${answers.hasStaffTraining ? 'REALIZADO' : 'PENDENTE'}`,
    `- Plano de Resposta a Incidentes: ${answers.hasIncidentPlan ? 'ESTABELECIDO' : 'PENDENTE'}`,
    `- Controle de Acesso: ${answers.accessControl}`,
    `- Encarregado de Dados (DPO): ${user.name} (Responsável Interno)`,
    `- Backup e Recuperação: ${answers.hasBackups ? 'ATIVO' : 'NÃO POSSUI'}`
  ];
  doc.text(govText, 20, gapY + 30);

  // --- RODAPÉ E QR CODE ---
  const qrCodeDataUrl = await QRCode.toDataURL(`https://lgpd-facil-b7246.web.app/verify/${certificateId}`);
  doc.addImage(qrCodeDataUrl, 'PNG', 165, 255, 30, 30);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text([
    'Este documento certifica que o processo acima foi mapeado e adequado conforme os padrões da LGPD na plataforma DPO Fast.',
    'A validade deste certificado depende da manutenção das práticas aqui descritas.',
    'Valide a autenticidade apontando a câmera para o QR Code ao lado.'
  ], 20, 265);

  // Download PDF
  doc.save(`Certificado_LGPD_${process.name.replace(/\s+/g, '_')}.pdf`);

  return {
    id: certificateId,
    processId: process.id,
    issueDate: issueDateTime,
    status: 'active',
    version: 1
  };
};
