/**
 * cnpjStatusCheck.ts
 * Cron Job executado periodicamente (ex: semanalmente) para realizar
 * auditoria cadastral automática de todos os CNPJs ativos cadastrados.
 */

import { db } from '../config';

/**
 * Executa a verificação periódica de CNPJ.
 * Em produção, essa função é mapeada para um cron schedule.
 */
export async function runCnpjStatusAudit(): Promise<{ checkedCount: number; alertsTriggeredCount: number }> {
  console.log('[runCnpjStatusAudit] Iniciando auditoria periódica de CNPJs...');
  
  let checkedCount = 0;
  let alertsTriggeredCount = 0;

  try {
    // Busca usuários que possuem CNPJ cadastrado
    const snapshot = await db.collection('users')
      .where('cnpj', '!=', '')
      .get();

    if (snapshot.empty) {
      console.log('[runCnpjStatusAudit] Nenhum usuário com CNPJ cadastrado encontrado.');
      return { checkedCount, alertsTriggeredCount };
    }

    const now = new Date().toISOString();

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const rawCnpj = userData.cnpj;
      const cleanCnpj = String(rawCnpj).replace(/\D/g, '');

      if (cleanCnpj.length !== 14) continue;

      checkedCount++;
      
      try {
        // Consultar situação atualizada
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
          console.warn(`[runCnpjStatusAudit] Falha ao consultar BrasilAPI para CNPJ: ${cleanCnpj}. Status: ${response.status}`);
          continue;
        }

        const data = await response.json() as { descricao_situacao_cadastral?: string };
        const status = (data.descricao_situacao_cadastral || '').toUpperCase();

        if (status && status !== 'ATIVA') {
          console.warn(`[runCnpjStatusAudit] Alerta: CNPJ ${cleanCnpj} do usuário ${doc.id} está "${status}".`);
          
          // 1) Atualiza status do CNPJ no registro do usuário
          await doc.ref.update({
            'cnpjStatus.situation': status,
            'cnpjStatus.lastChecked': now,
            'cnpjStatus.isIrregular': true,
          });

          // 2) Dispara alerta na coleção de riscos/notificações da organização
          await db.collection('alerts').add({
            userId: doc.id,
            cnpj: cleanCnpj,
            type: 'CNPJ_IRREGULAR',
            severity: 'CRITICAL',
            title: 'CNPJ Irregular detectado pela Receita Federal',
            message: `O CNPJ ${rawCnpj} cadastrado na conta consta como "${status}" na Receita Federal. Ações de adequação podem estar comprometidas.`,
            createdAt: now,
            status: 'UNREAD',
          });

          alertsTriggeredCount++;
        } else {
          // Atualiza registro apenas confirmando a validação bem sucedida
          await doc.ref.update({
            'cnpjStatus.situation': 'ATIVA',
            'cnpjStatus.lastChecked': now,
            'cnpjStatus.isIrregular': false,
          });
        }

        // Aguarda 1.2 segundos entre consultas para respeitar limites da API
        await new Promise(resolve => setTimeout(resolve, 1200));

      } catch (cnpjErr) {
        console.error(`[runCnpjStatusAudit] Erro ao processar CNPJ ${cleanCnpj} do usuário ${doc.id}:`, cnpjErr);
      }
    }

    console.log(`[runCnpjStatusAudit] Auditoria concluída. Verificados: ${checkedCount}, Alertas disparados: ${alertsTriggeredCount}`);
    return { checkedCount, alertsTriggeredCount };

  } catch (error) {
    console.error('[runCnpjStatusAudit] Erro crítico no cron job:', error);
    throw error;
  }
}
