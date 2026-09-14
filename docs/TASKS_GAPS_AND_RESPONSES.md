# DPO-FAST — Tasks, Gaps & Accepted Responses

> Documentação completa de todas as tasks, gaps de compliance e respostas aceitas pelo sistema DPO-FAST.

---

## 1. Tasks Globais (sempre geradas)

Estas tasks são geradas para **todas** as empresas, independentemente das respostas do questionário.

### Task 1: Publicar Aviso de Privacidade nos canais de atendimento

| Campo | Valor |
|-------|-------|
| **ID** | `task-global-privacy-notice` |
| **Prioridade** | Alta |
| **Prazo** | 7 dias |
| **Documento alvo** | Política Interna de Privacidade |
| **Gap detectado** | Missing Privacy Notice — empresa coleta dados mas não possui aviso de privacidade público |
| **Critério de validação** | Palavras-chave obrigatórias (acentos ignorados): `finalidade`, `dados`, `direitos`, `contato`, `titular`, `compartilhamento` |

### Task 2: Formalizar a Política Interna com colaboradores

| Campo | Valor |
|-------|-------|
| **ID** | `task-internal-policy` |
| **Prioridade** | Média |
| **Prazo** | 15 dias |
| **Documento alvo** | Política Interna de Privacidade |
| **Gap detectado** | Missing Internal Policy — não existe política formal de tratamento de dados para colaboradores |
| **Critério de validação** | Palavras-chave obrigatórias: `finalidade`, `dados`, `direitos`, `contato`, `titular`, `compartilhamento` |

---

## 2. Tasks por Processo (geradas com base nas respostas do questionário)

Estas tasks são geradas **por cada processo** completado, conforme as lacunas detectadas nas respostas.

### Task 3: Validar Relatório de Impacto (RIPD)

| Campo | Valor |
|-------|-------|
| **ID** | `task-ripd-{processId}` |
| **Prioridade** | Alta |
| **Prazo** | 7 dias |
| **Documento alvo** | Registro de Atividades de Tratamento (RAT) |
| **Condição de geração** | `answers.hasSensitiveData === true` |
| **Gap detectado** | Sensitive Data without RIPD — processo lida com dados pessoais sensíveis sem Relatório de Impacto à Proteção de Dados (Art. 38) |
| **Tipos de dados sensíveis** | `Sindicato`, `Saude`, `Biometria`, `GeneroOrientacao`, `EtniaRaca` |
| **Critério de validação** | Palavras-chave obrigatórias: `base legal`, `finalidade`, `fluxo`, `armazenamento`, `seguranca` |

### Task 4: Ativar Verificação em Duas Etapas (MFA)

| Campo | Valor |
|-------|-------|
| **ID** | `task-mfa-{processId}` |
| **Prioridade** | Alta |
| **Prazo** | 7 dias |
| **Documento alvo** | Política Interna de Privacidade |
| **Condição de geração** | `answers.hasMFA === false` |
| **Gap detectado** | No MFA / Two-Factor Auth — acesso ao sistema depende de autenticação de fator único (senha apenas) |
| **Critério de validação** | Evidência deve mencionar: `codigo SMS` OU `autenticador` |

### Task 5a: Anexar Termo de Consentimento/Contrato (sem documento)

| Campo | Valor |
|-------|-------|
| **ID** | `task-missing-shared-doc-{processId}` |
| **Prioridade** | Alta |
| **Prazo** | 7 dias |
| **Documento alvo** | Registro de Atividades de Tratamento (RAT) |
| **Condição de geração** | `answers.isSharedExternal === true` E `answers.sharedExternalDocumentUrl` é falsy |
| **Gap detectado** | Third-Party Sharing without Contract — dados são compartilhados externamente mas nenhum termo de consentimento/contrato foi anexado |
| **Critério de validação** | Palavras-chave: `contrato assinado`, `responsabilidade solidaria`, `aviso de vazamento` |

### Task 5b: Auditar cláusulas de LGPD do parceiro

| Campo | Valor |
|-------|-------|
| **ID** | `task-contract-review-{processId}` |
| **Prioridade** | Média |
| **Prazo** | 15 dias |
| **Documento alvo** | Política Interna de Privacidade |
| **Condição de geração** | `answers.isSharedExternal === true` E `answers.sharedExternalDocumentUrl` existe |
| **Gap detectado** | Third-Party Contract Review Needed — contrato externo existe mas pode precisar de auditoria de cláusulas LGPD |
| **Critério de validação** | Palavras-chave: `contrato assinado`, `responsabilidade solidaria`, `aviso de vazamento` |

> **Nota:** Tasks 5a e 5b são mutuamente exclusivas — apenas uma é gerada por processo.

### Task 6: Definir prazo de exclusão para dados

| Campo | Valor |
|-------|-------|
| **ID** | `task-retention-{processId}` |
| **Prioridade** | Baixa |
| **Prazo** | 30 dias |
| **Documento alvo** | Registro de Atividades de Tratamento (RAT) |
| **Condição de geração** | `answers.retentionPeriod` está vazio OU contém "sempre" |
| **Gap detectado** | Indefinite Data Retention — período de retenção de dados está ausente ou configurado como "para sempre" |
| **Critério de validação** | Qualquer string não-vazia que NÃO contenha "sempre" |
| **Exemplos de valores aceitos** | `"5 anos após fim do contrato"`, `"2 anos"`, `"Enquanto durar a conta"` |

### Task 7: Estabelecer rotina de Backup

| Campo | Valor |
|-------|-------|
| **ID** | `task-backup-{processId}` |
| **Prioridade** | Alta |
| **Prazo** | 7 dias |
| **Documento alvo** | Política Interna de Privacidade |
| **Condição de geração** | `answers.hasBackups === false` |
| **Gap detectado** | No Backup Routine — não existe rotina de backup regular para os dados do processo |

### Task 8: Elaborar Plano de Resposta a Incidentes

| Campo | Valor |
|-------|-------|
| **ID** | `task-incident-{processId}` |
| **Prioridade** | Alta |
| **Prazo** | 7 dias |
| **Documento alvo** | Política Interna de Privacidade |
| **Condição de geração** | `answers.hasIncidentPlan === false` |
| **Gap detectado** | No Incident Response Plan — não existe plano documentado para lidar com violações de dados |

### Task 9: Realizar Treinamento da Equipe

| Campo | Valor |
|-------|-------|
| **ID** | `task-training-{processId}` |
| **Prioridade** | Média |
| **Prazo** | 15 dias |
| **Documento alvo** | Política Interna de Privacidade |
| **Condição de geração** | `answers.hasStaffTraining === false` |
| **Gap detectado** | No Staff Training — equipe que lida com dados não recebeu treinamento em LGPD |

---

## 3. Resumo dos Gaps Detectáveis

| # | Gap | Condição de Detecção | Tasks Geradas |
|---|-----|----------------------|---------------|
| 1 | **Missing Privacy Notice** | Sempre (global) | `task-global-privacy-notice` |
| 2 | **Missing Internal Policy** | Sempre (global) | `task-internal-policy` |
| 3 | **Sensitive Data without RIPD** | `hasSensitiveData === true` | `task-ripd-{processId}` |
| 4 | **No MFA / Two-Factor Auth** | `hasMFA === false` | `task-mfa-{processId}` |
| 5 | **Third-Party Sharing without Contract** | `isSharedExternal === true` AND `sharedExternalDocumentUrl` vazio | `task-missing-shared-doc-{processId}` |
| 6 | **Third-Party Contract Review Needed** | `isSharedExternal === true` AND `sharedExternalDocumentUrl` existe | `task-contract-review-{processId}` |
| 7 | **Indefinite Data Retention** | `retentionPeriod` vazio OU contém "sempre" | `task-retention-{processId}` |
| 8 | **No Backup Routine** | `hasBackups === false` | `task-backup-{processId}` |
| 9 | **No Incident Response Plan** | `hasIncidentPlan === false` | `task-incident-{processId}` |
| 10 | **No Staff Training** | `hasStaffTraining === false` | `task-training-{processId}` |

---

## 4. Critérios de Validação por Tipo de Documento

### 4.1 Política de Privacidade / Aviso de Privacidade

Palavras-chave obrigatórias (acentos ignorados):

| Palavra-chave | Justificativa LGPD |
|---------------|-------------------|
| `finalidade` | Art. 6, I — finalidades legítimas, específicas, informadas |
| `dados` | Art. 9, II — listar categorias de dados pessoais tratados |
| `direitos` | Art. 18 — informar direitos de acesso, correção, exclusão |
| `contato` | Art. 9, I — identidade e contato do controlador |
| `titular` | Clarificar quem é dono dos dados |
| `compartilhamento` | Art. 9, V — divulgar compartilhamento com terceiros e sua finalidade |

### 4.2 Termo de Consentimento

| Palavra-chave | Justificativa LGPD |
|---------------|-------------------|
| `concordo` | Art. 5, XII — consentimento livre e inequívoco |
| `finalidade` | Art. 6, I — finalidade específica |
| `revogar` | Art. 8, §5 — titular pode revogar consentimento a qualquer momento |
| `sim` | Opção de consentimento |
| `nao` | Opção de recusa |

### 4.3 Registro de Atividades de Tratamento (RAT)

| Palavra-chave | Justificativa LGPD |
|---------------|-------------------|
| `base legal` | Art. 7 / Art. 11 — todo tratamento deve ter base legal |
| `finalidade` | Art. 6, I — finalidade específica |
| `fluxo` | Descrever ciclo de vida dos dados na organização |
| `armazenamento` | Onde e por quanto tempo os dados são armazenados |
| `seguranca` | Art. 46 — medidas técnicas para prevenir acesso não autorizado |

### 4.4 Auditoria de Contrato com Parceiro

| Palavra-chave | Justificativa LGPD |
|---------------|-------------------|
| `contrato assinado` | Documento assinado como evidência primária |
| `responsabilidade solidaria` | Art. 42 — terceiro é solidariamente responsável |
| `aviso de vazamento` | Art. 48 — parceiro deve notificar violações imediatamente |

### 4.5 Verificação em Duas Etapas (MFA)

| Palavra-chave | Justificativa |
|---------------|---------------|
| `codigo SMS` | Fator de autenticação SMS |
| `autenticador` | Apps como Google Auth gerando tokens temporários |

---

## 5. Validação de Evidência (Geral)

O sistema também valida a qualidade geral da evidência submetida:

| Critério | Descrição |
|----------|-----------|
| `Conteudo detalhado` | Evidência deve ser substancial para provar implementação real |
| `Clareza na descricao` | Descrição deve permitir que um auditor entenda a ação tomada |

---

## 6. Motor de Descoberta (AI Agent)

O **Discovery Agent** (`functions/src/agents/discovery.ts`) pode detectar gaps arbitrários além dos 10 definidos no engine. Seu schema de saída:

```typescript
{
  issue: string,    // Descrição do problema encontrado
  risk: string,     // Descrição do risco associado
  impact: 'Baixo' | 'Medio' | 'Alto'  // Nível de impacto
}
```

---

## 7. Mapeamento de Prazos por Prioridade

| Prioridade | Prazo padrão |
|------------|-------------|
| **Alta** | 7 dias |
| **Média** | 15 dias |
| **Baixa** | 30 dias |

---

## 8. Conquistas (Gamificação)

O sistema de gamificação (`logic/achievementEngine.ts`) emite badges:

| Badge | Condição |
|-------|----------|
| `pioneer` | Primeira ação concluída |
| `first_sector` | Primeiro setor completado |
| `privacy_notice` | Aviso de privacidade publicado |
| `compliance_warrior` | 100% de tasks concluídas |
| `security_master` | Todas as tasks de segurança concluídas |
| `legal_architect` | Todos os documentos legais gerados |
| `platinum_seal` | Certificado de conformidade emitido |

---

## 9. Fontes de Código

| Arquivo | Responsabilidade |
|---------|-----------------|
| `logic/complianceEngine.ts` | Geração de tasks e detecção de gaps |
| `logic/validationEngine.ts` | Validação de evidências e critérios LGPD |
| `logic/achievementEngine.ts` | Sistema de conquistas |
| `logic/templates.ts` | Geração de templates de documentos |
| `types.ts` | Interfaces TypeScript: `ComplianceTask`, `SectorAnswers`, `ValidationResult` |
| `functions/src/agents/discovery.ts` | Agent AI de descoberta de gaps |
| `functions/src/agents/auditor.ts` | Agent AI de auditoria de documentos |
| `functions/src/agents/drafting.ts` | Agent AI de redação de documentos legais |
| `lib/plans.ts` | Limites de plano (free, basico, pro, personalite) |
| `lib/certificateGenerator.ts` | Geração de certificado de conformidade |
