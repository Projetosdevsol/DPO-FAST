# Especificações Técnicas com TDD para Migração e Expansão de Dados

## 1. Objetivo Geral
Efetuar duas alterações estruturais no projeto **DPO Fast** (doravante denominado **Guardião**):
1. **Renomear** todo o sistema, código, documentação e artefatos de "DPO Fast" para "Guardião", garantindo consistência em todos os arquivos do repositório.
2. **Ampliar o inventário de dados** (modelo de dados pessoais) incluindo novos campos com seus respectivos níveis de sensibilidade, bem como a adição de novas categorias de titulares.

As alterações devem ser realizadas seguindo a metodologia **TDD** (Test-Driven Development), com ciclos iterativos registrados (loop) e salvamento de progresso a cada etapa concluída.

---

## 2. Escopo e Abordagem

### 2.1 Escopo de Arquivos Afetados
- **Frontend (React/TS)**: Componentes, páginas, textos de UI, mensagens, títulos, placeholders.
- **Backend (Firebase Functions)**: Nomes de funções, variáveis de ambiente, logs, respostas de API.
- **Configurações**: `firebase.json`, `package.json`, `.env`, arquivos de build.
- **Documentação**: `README.md`, este arquivo, manuais, templates de e-mail.
- **Modelos de Dados (Firestore)**: Estrutura de coleções, subcoleções, campos.
- **Templates de Documentos (Markdown)**: Arquivos `.md` usados para geração de relatórios e termos.

### 2.2 Estratégia de Implementação com TDD e Agentes
Adotaremos um **loop de agentes** para automatizar e rastrear o progresso:
- **Agente 1 – Mapeador**: Varre o repositório e lista todos os arquivos e locais onde ocorre "DPO Fast".
- **Agente 2 – Testador**: Escreve testes automatizados (unitários e de integração) **antes** das alterações, para garantir que o sistema se comporte como esperado após as mudanças.
- **Agente 3 – Implementador**: Executa as alterações reais no código (renomeação e inclusão de campos).
- **Agente 4 – Validador**: Roda os testes, verifica logs e interface, e confirma se todos os critérios são atendidos.
- **Salvamento de progresso**: A cada etapa (descoberta, escrita de testes, implementação, validação) um commit é feito com uma tag de checkpoint (ex: `checkpoint-rename-step1`).

Todos os agentes operam em um ambiente controlado (branch temporária) e os resultados são registrados em um arquivo `PROGRESS.md` para rastreabilidade.

---

## 3. Tarefa 1 – Renomeação de "DPO Fast" para "Guardião"

### 3.1 Critérios de Aceitação
- **CA1.1** – O nome "Guardião" aparece em todos os títulos, cabeçalhos e rodapés da interface web.
- **CA1.2** – O termo "DPO Fast" não existe em nenhum arquivo de código, configuração ou documentação (exceto em notas históricas, se permitido).
- **CA1.3** – As URLs, endpoints e nomes de funções que continham "dpo" ou "fast" são renomeados para refletir "guardião" (ex: `generateDpoDocument` → `generateGuardiaoDocument`).
- **CA1.4** – Os testes existentes (que possam depender do nome antigo) são atualizados e continuam passando.
- **CA1.5** – O sistema compila e executa sem erros após a renomeação.

### 3.2 Testes TDD (a serem escritos antes da implementação)

#### Testes Unitários (Jest/Vitest)
- **TU-REN-01**: Verificar que o componente `Header` renderiza "Guardião" no título, e não "DPO Fast".
- **TU-REN-02**: Verificar que a função `getAppName()` retorna "Guardião".
- **TU-REN-03**: Verificar que as rotas de API (Cloud Functions) com prefixo `dpo` foram renomeadas para `guardiao` (checagem de nomenclatura em `functions/src/index.ts`).

#### Testes de Integração
- **TI-REN-01**: Acessar a página inicial e verificar que o título da aba é "Guardião – LGPD Simplificada".
- **TI-REN-02**: Executar o fluxo de geração de documento e verificar que os logs mencionam "Guardião" em vez de "DPO Fast".
- **TI-REN-03**: Verificar que o arquivo de configuração `firebase.json` não contém "dpo" ou "fast" nos nomes de funções ou hosting.

### 3.3 Plano de Implementação
1. **Descoberta** (Agente 1): Gerar lista de arquivos com ocorrências de "DPO Fast" (case insensitive).
2. **Testes** (Agente 2): Escrever os testes acima e garantir que falhem (red).
3. **Substituição** (Agente 3):
   - Substituir ocorrências em arquivos de texto usando ferramentas como `sed` ou scripts Node.js.
   - Renomear arquivos e pastas que contenham "dpo" ou "fast" (ex: `dpo-assistant` → `guardiao-assistant`).
   - Atualizar imports e referências internas.
4. **Validação** (Agente 4): Executar testes, corrigir falhas, e verificar manualmente a UI.
5. **Commit** com mensagem "Rename project to Guardião".

---

## 4. Tarefa 2 – Ampliação do Inventário de Dados

### 4.1 Descrição da Funcionalidade
O inventário de dados é um formulário onde o usuário mapeia quais dados pessoais sua empresa coleta, armazena ou processa. Atualmente, inclui campos como nome, CPF, e-mail, etc. Devemos adicionar:

- **Título de Eleitor**
- **Carteira de Trabalho (CTPS)**
- **Certidão de Nascimento**
- **Certidão de Casamento**
- **Comprovante de Matrícula Escolar**

Cada campo deve ser classificado com seu **nível de sensibilidade** conforme a LGPD (art. 5º, incisos I e II):
- **Dado pessoal** – identificável, mas não sensível (ex: nome, data de nascimento).
- **Dado pessoal sensível** – origem racial/étnica, convicção religiosa, opinião política, filiação a sindicato, saúde, vida sexual, dados genéticos ou biométricos. Os novos campos se encaixam em **dado pessoal** (geral) ou **sensível**? De acordo com a LGPD, alguns podem ser considerados sensíveis se revelarem características como orientação política ou religiosa (não é o caso), mas dados como certidão de nascimento/casamento podem revelar estado civil e filiação, sendo considerados pessoais. A classificação deve ser:
  - Título de Eleitor: **dado pessoal** (número de identificação, mas não sensível).
  - Carteira de Trabalho: **dado pessoal** (número de registro, mas pode conter informações de emprego, ainda considerado pessoal).
  - Certidão de Nascimento: **dado pessoal** (contém dados de filiação, mas não é classificado como sensível).
  - Certidão de Casamento: **dado pessoal** (estado civil, não sensível).
  - Comprovante de Matrícula Escolar: **dado pessoal** (instituição, período, pode ser sensível se revelar convicção religiosa da escola, mas em geral é pessoal).
  - Para efeitos didáticos, adotaremos **"Pessoal"** para todos, mas deixaremos a opção configurável para o usuário selecionar o nível (prevendo futura customização).

Também deve ser adicionada, na seção **"Quem são os titulares?"**, a possibilidade de selecionar:
- **Filhos**
- **Parentes** (genérico, abrangendo pais, irmãos, etc.)

### 4.2 Critérios de Aceitação
- **CA2.1** – O formulário de inventário exibe os cinco novos campos, com rótulos claros e campos de entrada adequados.
- **CA2.2** – Cada novo campo possui um seletor de nível de sensibilidade (pré-preenchido com "Pessoal").
- **CA2.3** – A opção "Filhos" e "Parentes" aparecem no grupo de titulares (checkbox ou multi-select), junto com as opções existentes (ex: clientes, funcionários, fornecedores).
- **CA2.4** – Os dados são salvos corretamente no Firestore na subcoleção `inventario` do documento da empresa.
- **CA2.5** – Os relatórios gerados (ex: plano de ação, termo de privacidade) refletem esses novos campos quando relevantes.

### 4.3 Testes TDD (a serem escritos antes da implementação)

#### Testes Unitários (Frontend)
- **TU-INV-01**: Verificar se o componente `InventarioForm` renderiza campos para "Título de Eleitor", "CTPS", etc.
- **TU-INV-02**: Verificar se o estado inicial dos novos campos está vazio e com sensibilidade default "Pessoal".
- **TU-INV-03**: Verificar se a função `submitInventory` envia um objeto contendo os novos campos.

#### Testes Unitários (Backend – Cloud Functions)
- **TU-INV-04**: Testar a validação de schema para o inventário, garantindo que os novos campos sejam aceitos e que a sensibilidade seja um valor válido ("Pessoal", "Sensível", "Altamente Sensível", etc.).
- **TU-INV-05**: Testar a função de geração de relatório para verificar se ela inclui esses campos no texto gerado (mock do Genkit).

#### Testes de Integração
- **TI-INV-01**: Preencher o formulário com os novos campos, salvar, e verificar no Firestore (emulador) se os dados foram persistidos.
- **TI-INV-02**: Gerar um relatório e verificar se o termo de privacidade menciona "título de eleitor" e "certidão de nascimento" quando aplicável.
- **TI-INV-03**: Verificar que a seção "titulares" inclui "Filhos" e "Parentes" e que é possível selecionar múltiplas opções.

### 4.4 Plano de Implementação
1. **Descoberta** (Agente 1): Identificar arquivos que definem o modelo de inventário (provavelmente `src/types/inventory.ts`, formulários React, templates de documento).
2. **Testes** (Agente 2): Escrever os testes descritos (red).
3. **Modificação** (Agente 3):
   - Atualizar a interface de usuário: adicionar campos no formulário, com validação.
   - Atualizar o schema de dados (Firestore) e as funções de escrita/leitura.
   - Modificar os templates markdown para incluir os novos campos quando fornecidos.
4. **Validação** (Agente 4): Rodar testes, verificar no emulador e manualmente a UI.
5. **Commit** com mensagem "Add new data fields to inventory and expand titular options".

---

## 5. Fluxo de Trabalho / Loop de Agentes com Salvamento de Progresso

Para garantir rastreabilidade e controle, adotaremos o seguinte procedimento em uma branch `feature/migration-guardiao`:

| Passo | Agente | Ação | Critério de Saída | Checkpoint |
|-------|--------|------|-------------------|------------|
| 1 | **Mapeador** | Escaneia o repositório e gera `file-list.txt` com todas as ocorrências de "DPO Fast". | Arquivo gerado com caminhos e linhas. | `checkpoint-map` |
| 2 | **Testador (TDD)** | Escreve os testes para a renomeação (TU-REN-* e TI-REN-*) e para a expansão (TU-INV-* e TI-INV-*). | Testes criados, mas falhando (red). | `checkpoint-tests-written` |
| 3 | **Implementador (Renomeação)** | Executa script de substituição e renomeação de arquivos. | Nenhuma ocorrência de "DPO Fast" nos arquivos de código/conf/doc. | `checkpoint-rename-done` |
| 4 | **Implementador (Expansão)** | Adiciona novos campos e opções no frontend, backend e templates. | Interface exibe novos campos; schema atualizado. | `checkpoint-inventory-done` |
| 5 | **Validador** | Executa testes (unitários e de integração), corrige falhas, valida manualmente. | Todos os testes passando (green) e critérios de aceitação atendidos. | `checkpoint-validation-passed` |
| 6 | **Revisão Final** | Revisa diff, atualiza documentação (`README.md`, `PROGRESS.md`) e faz merge. | PR aprovado e merge para `main`. | `final-merge` |

O progresso é salvo em `PROGRESS.md` com o status de cada checkpoint e eventuais observações.

---

## 6. Observações Finais

- **Segurança**: Durante a renomeação, tomar cuidado com credenciais ou chaves de API que possam conter o nome antigo (ex: variáveis de ambiente). Atualizar o Firebase Hosting e as variáveis no console.
- **Compatibilidade**: Garantir que a migração não quebre dados existentes. Os novos campos podem ser opcionais (nullable) no Firestore para não impactar registros antigos.
- **Testes Manuais**: Além dos testes automatizados, é recomendado testar o fluxo completo de um usuário (desde o cadastro até a geração de documentos) para garantir que a experiência não seja prejudicada.
- **Documentação**: Atualizar o arquivo `README.md` (este que você leu) para refletir o novo nome e as novas funcionalidades.

---

**Próximos Passos**: Iniciar o loop com o Agente 1 (Mapeador) e registrar o progresso.