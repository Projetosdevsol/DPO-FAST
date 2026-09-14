# Relatório de Scan de Segurança

## Objetivo
Verificar a presença de credenciais vazadas e garantir a segurança do ambiente do Guardião, conforme as diretrizes de Segurança Ofensiva.

## Escopo da Varredura
Arquivos analisados em todo o repositório, incluindo `functions/src/`, `components/`, e arquivos de configuração. Padrões buscados:
- Firebase API Keys (`AIzaSy...`)
- Stripe Keys (`sk_live_`, `sk_test_`, etc.)
- Gemini API Keys
- Padrões JWT

## Resultados

1. **Firebase API Key**
   - **Encontrado em**: `lib/firebase.ts` (uma chave hardcoded `AIzaSyA8dfNTAO5QqxQfU0n3X4_3JvudizatNPg`).
   - **Ação Tomada**: A chave foi substituída pela variável de ambiente `import.meta.env.VITE_FIREBASE_API_KEY`. O valor real foi transferido para o arquivo `.env.local`.

2. **Gemini API Key**
   - **Encontrado em**: `vite.config.ts` injetando `GEMINI_API_KEY` para o frontend.
   - **Ação Tomada**: Bloco de `define` que injetava a chave do Gemini no código frontend foi removido. A chave do Gemini será acessada exclusivamente no backend via `process.env.GOOGLE_GENAI_API_KEY` (configurado em `functions/src/config.ts`).

3. **Stripe Keys**
   - **Encontrado em**: Nenhuma ocorrência hardcoded encontrada no repositório.

4. **Verificação de `.gitignore`**
   - **Status**: Confirmado. A extensão `*.local` está devidamente listada no `.gitignore`, prevenindo o vazamento do arquivo `.env.local` em futuros commits.

## Implementação de Máscaras (Masking Utility)
- **Frontend**: Criado utilitário `src/utils/mask.ts` com a função `maskDocument`. A função já foi aplicada no `AdminPanel.tsx` para mascarar o CNPJ dos usuários nas listagens.
- **Backend**: Criado utilitário `functions/src/utils/mask.ts` com a função `maskPII` para uso futuro na sanitização de dados sensíveis antes do log.

## Conclusão
- **Status**: Seguro. Todas as credenciais hardcoded foram mitigadas e o acesso indevido à API de IA no frontend foi bloqueado.
