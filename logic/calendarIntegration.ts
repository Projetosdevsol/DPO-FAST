
import { ComplianceTask } from '../types';

/**
 * Gera um link para o Google Agenda baseado na tarefa
 * Formato esperado: https://www.google.com/calendar/render?action=TEMPLATE&text=Evento&dates=20231231/20231231&details=Desc&sf=true&output=xml
 */
export const generateGoogleCalendarLink = (task: ComplianceTask, companyName: string): string => {
  const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
  
  // Título do Evento
  const title = encodeURIComponent(`[LGPD] ${task.title}`);
  
  // Formatação de Data: YYYYMMDD
  // Se não houver dueDate, usa a data atual + 7 dias por padrão
  const targetDate = task.dueDate 
    ? new Date(task.dueDate) 
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
  const dateStr = targetDate.toISOString().split('T')[0].replace(/-/g, '');
  const dates = `${dateStr}/${dateStr}`; // Evento de dia inteiro
  
  // Detalhes enriquecidos
  const details = encodeURIComponent(
    `📌 TAREFA DE ADEQUAÇÃO LGPD\n\n` +
    `Empresa: ${companyName}\n` +
    `Descrição: ${task.description}\n` +
    `Documento Alvo: ${task.targetDocument}\n` +
    `Prioridade: ${task.priority}\n\n` +
    `Acesse a evidência em: https://lgpdfacil.app/dashboard/conformidade\n\n` +
    `Gerado via LGPD Fácil.`
  );

  return `${baseUrl}&text=${title}&dates=${dates}&details=${details}&sf=true&output=xml`;
};

/**
 * Converte a lista de tarefas para uma string CSV
 */
export const exportTasksToCSV = (tasks: ComplianceTask[]) => {
  const headers = ['Título', 'Descrição', 'Prioridade', 'Prazo Sugerido', 'Documento Alvo', 'Status'];
  const rows = tasks.map(t => [
    t.title,
    t.description,
    t.priority,
    t.dueDate || 'A definir',
    t.targetDocument,
    t.status
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `plano_adequacao_lgpd_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
