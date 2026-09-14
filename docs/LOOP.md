/loop

"ATUE COMO UM ENGENHEIRO DE CONTEXTO E MEMÓRIA PERSISTENTE. 

Ao final deste Sprint, seu objetivo é garantir que o projeto NUNCA perca o histórico, nunca alucine fora do contexto inicial e que a próxima sessão de desenvolvimento continue exatamente de onde paramos.

Siga rigorosamente estas instruções:

1. **CRIAR/ATUALIZAR O ARQUIVO DE ESTADO:** 
   Crie ou atualize o arquivo `docs/SPRINT_LOG.md`.
   - Adicione uma nova seção com a data de hoje e o nome do Sprint (ex: `## Sprint 1 - 31/08/2026 - Fundação do Backend`).
   - Liste exatamente o que foi implementado, testado e o que foi aprovado nos Critérios de Aceite (CAs).

2. **REGISTRAR DECISÕES DE ARQUITETURA (ADR):**
   - Registre quaisquer decisões técnicas tomadas (ex: "Decidimos usar Cloud Functions em TypeScript para o cálculo de créditos, pois [CA-ZT-02] exige Zero-Trust no Frontend").
   - Anote quaisquer limitações do Firebase Spark que impactaram o código.

3. **CRIAR O ARQUIVO DE PROGRESSO (CHECKLIST):**
   - Crie ou atualize `docs/PROGRESSO.md`.
   - Liste os requisitos do `PRD.md` e marque `[x]` para concluídos, `[ ]` para pendentes.
   - Liste as pendências técnicas (ex: "Falta configurar o GitHub Actions para rodar o `gitleaks` [CA-DEP-04]").

4. **CRIAR O BLOCO DE CONTEXTO PARA A PRÓXIMA SESSÃO (NUNCA ALUCINAR):**
   - Escreva um resumo de no máximo 5 linhas no topo do `docs/SPRINT_LOG.md` chamado `CONTEXTO ATUAL`.
   - Este resumo deve conter: qual é a arquitetura base (Firebase/Firestore), qual é a política de segurança ativa (Zero-Trust), e qual é a próxima tarefa exata a ser executada.

5. **VALIDAR FIM DE SPRINT:**
   - Verifique se todos os arquivos `.md` do projeto foram atualizados.
   - Se o agente perceber que o código ou as configurações atuais violam alguma regra de segurança descrita em `docs/Specs de Segurança para Deploys e Mitig...`, ele DEVE listar essa violação como 'BLOQUEIO CRÍTICO' antes de finalizar.

**REGRAS INVERSAS (ANTI-ALUCINAÇÃO):**
- Proibido inventar funcionalidades que não estão no `PRD.md`.
- Proibido sugerir mudanças de arquitetura que violem o `Zero-Trust`.
- Se o código não estiver 100% funcional ou se faltar um Critério de Aceite, o agente deve parar e registrar exatamente o que falta, sem assumir que foi concluído.

**EXECUTE a criação/atualização desses arquivos agora.**