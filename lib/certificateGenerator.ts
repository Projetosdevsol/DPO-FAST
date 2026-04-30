
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { User, DataProcess, ComplianceTask, ComplianceCertificate, SectorAnswers } from '../types';
import { ACHIEVEMENTS } from '../logic/achievementEngine';

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

  // Constants
  const marginLeft = 20;
  const textWidth = 170;
  let cursorY = 20;

  const addText = (text: string | string[], x: number, y: number, options?: any) => {
    if (y > 270) {
      doc.addPage();
      cursorY = 20;
      y = cursorY;
    }
    if (typeof text === 'string') {
      const split = doc.splitTextToSize(text, textWidth);
      doc.text(split, x, y, options);
      cursorY = y + (split.length * 5);
    } else {
      doc.text(text, x, y, options);
      cursorY = y + (text.length * 5);
    }
  };

  const drawSectionTitle = (title: string) => {
    if (cursorY > 260) {
      doc.addPage();
      cursorY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(title, marginLeft, cursorY);
    cursorY += 8;
  };

  const drawNormalText = (text: string, boldPrefix?: string) => {
    if (cursorY > 270) {
      doc.addPage();
      cursorY = 20;
    }
    doc.setFontSize(10);
    if (boldPrefix) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(boldPrefix, marginLeft, cursorY);
      const prefixWidth = doc.getTextWidth(boldPrefix);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      
      const remainingText = text.substring(boldPrefix.length);
      const split = doc.splitTextToSize(remainingText, textWidth - prefixWidth);
      doc.text(split, marginLeft + prefixWidth, cursorY);
      cursorY += (split.length * 5);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      addText(text, marginLeft, cursorY);
    }
    cursorY += 2;
  };

  // --- CABEÇALHO ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE ADEQUAÇÃO À LGPD', 105, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(Lei nº 13.709/2018 – Lei Geral de Proteção de Dados)', 105, 25, { align: 'center' });

  cursorY = 45;

  // --- 1. Identificação da Organização ---
  drawSectionTitle('1. Identificação da Organização');
  drawNormalText(`Nome da empresa: ${user.companyName}`, 'Nome da empresa: ');
  drawNormalText(`CNPJ: ${user.cnpj}`, 'CNPJ: ');
  drawNormalText(`Endereço: ${user.address || 'Não informado'}`, 'Endereço: ');
  drawNormalText(`Encarregado/DPO: ${user.name}`, 'Encarregado/DPO: ');
  drawNormalText(`Contato: ${user.email}`, 'Contato: ');
  cursorY += 5;

  // --- 2. Objetivo do Relatório ---
  drawSectionTitle('2. Objetivo do Relatório');
  drawNormalText('Este relatório tem como objetivo apresentar o diagnóstico, as ações implementadas e o plano de ação para adequação da organização à LGPD, garantindo a proteção de dados pessoais e a conformidade legal.');
  cursorY += 5;

  // --- 3. Escopo da Avaliação ---
  drawSectionTitle('3. Escopo da Avaliação');
  drawNormalText(`Áreas analisadas: Processo '${process.name}'`, 'Áreas analisadas: ');
  drawNormalText(`Tipos de dados pessoais tratados: ${(answers.collectedData || []).join(', ') || 'Nenhum'}`, 'Tipos de dados pessoais tratados: ');
  drawNormalText(`Sistemas e ferramentas utilizados: ${answers.storageType || 'Não especificado'}`, 'Sistemas e ferramentas utilizados: ');
  cursorY += 5;

  // --- 4. Diagnóstico Inicial ---
  drawSectionTitle('4. Diagnóstico Inicial');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4.1 Mapeamento de Dados', marginLeft, cursorY);
  cursorY += 6;
  drawNormalText(`Origem dos dados: Coleta direta ou indireta conforme mapeamento`, 'Origem dos dados: ');
  drawNormalText(`Finalidade do tratamento: ${answers.purpose || 'Não definida'}`, 'Finalidade do tratamento: ');
  drawNormalText(`Compartilhamento: Informação mapeada no sistema`, 'Compartilhamento: ');
  drawNormalText(`Armazenamento e descarte: ${answers.storageType}`, 'Armazenamento e descarte: ');
  cursorY += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4.2 Riscos e Vulnerabilidades Identificados', marginLeft, cursorY);
  cursorY += 6;
  const highRisks = processTasks.filter(t => t.priority === 'Alta');
  if (highRisks.length > 0) {
    highRisks.forEach(r => drawNormalText(`- ${r.title}`));
  } else {
    drawNormalText('Nenhum risco de severidade ALTA identificado neste processo.');
  }
  cursorY += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4.3 Conformidade com Princípios da LGPD', marginLeft, cursorY);
  cursorY += 6;
  drawNormalText(`Bases legais validadas para este processo: ${answers.legalBasis || 'Não estabelecida'}`);
  cursorY += 5;

  // --- 5. Medidas Implementadas ---
  drawSectionTitle('5. Medidas Implementadas');
  const medidas = [];
  if (answers.hasStaffTraining) medidas.push('Treinamentos de conscientização');
  if (answers.hasIncidentPlan) medidas.push('Procedimento para resposta a incidentes');
  if (answers.accessControl) medidas.push(`Controle de acesso: ${answers.accessControl}`);
  medidas.push('Procedimentos para atendimento de direitos dos titulares');
  
  medidas.forEach(m => drawNormalText(`- ${m}`));
  cursorY += 5;

  // --- 6. Plano de Ação e Melhorias Contínuas ---
  drawSectionTitle('6. Plano de Ação e Melhorias Contínuas');
  
  const tableData = processTasks.map(t => [
    t.title,
    user.name,
    'Contínuo',
    t.status === 'Concluída' ? 'Concluído' : 'Pendente'
  ]);

  if (tableData.length === 0) {
    drawNormalText('Nenhuma tarefa pendente ou ação corretiva necessária.');
    cursorY += 5;
  } else {
    autoTable(doc, {
      startY: cursorY,
      head: [['Ação', 'Responsável', 'Prazo', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: [37, 99, 235] },
      styles: { fontSize: 9 }
    });
    cursorY = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- 7. Conclusão ---
  drawSectionTitle('7. Conclusão');
  const compliancePercentage = processTasks.length > 0 
    ? Math.round((processTasks.filter(t => t.status === 'Concluída').length / processTasks.length) * 100) 
    : 100;
  drawNormalText(`Resumo do nível atual de conformidade e próximos passos: O processo analisado atinge ${compliancePercentage}% de aderência aos controles estabelecidos. Como próximos passos, recomenda-se a manutenção contínua das diretrizes impostas e a revisão periódica dos fluxos.`);
  cursorY += 5;

  // --- 8. Selos Conquistados ---
  const userAchievements = user.achievements || [];
  if (userAchievements.length > 0) {
    drawSectionTitle('8. Selos Conquistados');
    drawNormalText('Durante o processo de adequação, a organização demonstrou comprometimento e conquistou os seguintes reconhecimentos:');
    
    userAchievements.forEach(id => {
      const a = ACHIEVEMENTS.find(ach => ach.id === id);
      if (a) {
        drawNormalText(`🏆 ${a.title} - ${a.description}`, `🏆 ${a.title}`);
      }
    });
    cursorY += 5;
  }

  // --- 9. Anexos ---
  const tasksWithEvidence = processTasks.filter(t => t.evidenceUrl || t.evidence);
  if (tasksWithEvidence.length > 0) {
    drawSectionTitle(userAchievements.length > 0 ? '9. Anexos' : '8. Anexos');
    drawNormalText('Documentos e registros comprobatórios de resolução dos GAPs:');
    cursorY += 2;
    
    tasksWithEvidence.forEach(t => {
      if (cursorY > 260) {
        doc.addPage();
        cursorY = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`- ${t.title}:`, marginLeft, cursorY);
      cursorY += 5;
      
      if (t.evidence) {
        drawNormalText(`Justificativa: ${t.evidence}`);
      }
      
      if (t.evidenceUrl) {
        const isStorage = t.evidenceUrl.includes('firebasestorage') || t.evidenceUrl.includes('firebase');
        const linkText = isStorage 
            ? 'Documento Comprobatório: Anexo Seguro (Clique para acessar)' 
            : `Link de Referência: ${t.evidenceUrl.substring(0, 50)}${t.evidenceUrl.length > 50 ? '...' : ''}`;
        
        doc.setFontSize(9);
        doc.setTextColor(37, 99, 235);
        doc.text(linkText, marginLeft + 5, cursorY);
        
        const lw = doc.getTextWidth(linkText);
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.3);
        doc.line(marginLeft + 5, cursorY + 1, marginLeft + 5 + lw, cursorY + 1);
        doc.link(marginLeft + 5, cursorY - 4, lw, 6, { url: t.evidenceUrl });
        
        cursorY += 7;
      }
      cursorY += 2;
    });
  }

  // --- RODAPÉ E QR CODE ---
  if (cursorY + 45 > 280) {
    doc.addPage();
  }
  
  const qrCodeDataUrl = await QRCode.toDataURL(`https://lgpd-facil-b7246.web.app/verify/${certificateId}`);
  doc.addImage(qrCodeDataUrl, 'PNG', 165, doc.internal.pageSize.getHeight() - 40, 30, 30);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text([
    `Certificado ID: ${certificateId} - Gerado em ${issueDate}`,
    'Este documento certifica que o processo acima foi mapeado e adequado conforme os padrões da LGPD na plataforma DPO Fast.',
    'A validade deste certificado depende da manutenção das práticas aqui descritas.',
    'Valide a autenticidade apontando a câmera para o QR Code ao lado.'
  ], 20, doc.internal.pageSize.getHeight() - 30);

  // Download PDF
  doc.save(`Relatorio_Adequacao_LGPD_${process.name.replace(/\s+/g, '_')}.pdf`);

  return {
    id: certificateId,
    processId: process.id,
    issueDate: issueDateTime,
    status: 'active',
    version: 1
  };
};
