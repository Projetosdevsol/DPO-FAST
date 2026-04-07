# DPO Fast -SaaS para Adequação à LGPD

## 📖 Descrição
O **DPO Fast** é um Micro-SaaS (Software as a Service) projetado para ajudar empresas a avaliarem e melhorarem sua conformidade com a Lei Geral de Proteção de Dados (LGPD) no Brasil. Ele oferece uma plataforma intuitiva para assinantes realizarem avaliações através de questionários iterativos, gerarem relatórios personalizados por setor da empresa, gerenciarem to-do lists de ações corretivas e enviarem documentos para validação por uma equipe de Data Protection Officers (DPOs). O sistema promove a adequação à LGPD de forma eficiente, com foco em segurança, escalabilidade e usabilidade.

O nome "DPO Fast" reflete o foco em agilizar o processo de designação e gestão de um Data Protection Officer (DPO), facilitando a conformidade regulatória para pequenas e médias empresas.

 ⚙️ Funcionalidades Principais
### 👤 Para Assinantes (Usuários)
- **Cadastro e Login**: Sistema de autenticação seguro com suporte a e-mail/senha e provedores como Google.
- **Gerenciamento de Setores**: Os usuários podem cadastrar setores da empresa (ex.: RH, TI, Vendas) para avaliações personalizadas.
- **Questionário Iterativo**: Um formulário dinâmico adaptado por setor, com perguntas sobre conformidade à LGPD. Permite anexar documentos e calcular o nível de adequação.
- **Geração de Relatórios**: Relatórios em PDF gerados por setor, usando IA (Qwen AI) para analisar respostas, destacar conformidades, não conformidades e to-do lists. Inclui resumo, percentual de adequação e recomendações.
- **To-Do Lists**: Funciona como tarefas do Microsoft Teams. Cada item da lista (gerado a partir de não conformidades) permite anexar documentos, adicionar comentários e enviar para validação. Após envio, o status é atualizado (pendente, em revisão, aprovado ou revogado), com possibilidade de reenvio em caso de rejeição.
- **Gerenciamento de Documentos**: Seção para visualizar, baixar e gerenciar documentos anexados e relatórios gerados.
- **Assinaturas**: Integração com Stripe para planos mensais/anuais, controlando acesso baseado no status de pagamento.
- **Notificações**: Alertas por e-mail para confirmações, aprovações/rejeições e atualizações de status.

### 👨‍💼 Para Admins (Equipe de DPOs)
- **Painel Administrativo**: Acesso restrito para revisar documentos e tarefas enviadas pelos assinantes.
- **Lista de Assinantes e Métricas**: Visão geral de assinantes ativos, documentos pendentes e métricas avançadas (ex.: gráficos de níveis de adequação).
- **Revisão de Documentos e Tarefas**: Aprovar ou revogar (rejeitar com motivo) documentos e tarefas, atualizando status e notificando assinantes.
- **Visualização de Relatórios**: Acesso a relatórios por setor para validação consolidada.
- **Auditoria**: Registro automático de ações para rastreabilidade.

## 🔄 Fluxo Geral de Funcionamento
1. O assinante se cadastra, configura setores e responde ao questionário por setor.
2. O assinante completa tarefas na to-do list, anexa documentos e envia para validação.
3. Admins revisam no painel, aprovam/revogam e notificam.
4. Após aprovações, o progresso é atualizado, e relatórios finais são gerados para comprovação de adequação.

## 🛠️ Tecnologias Utilizadas
- **Frontend**: React, HTML, CSS, JavaScript, TypeScript para interfaces responsivas e intuitivas.
- **Backend e Banco de Dados**: Supabase (PostgreSQL para dados relacionais, Auth para autenticação, Storage para arquivos). Migrado de Replit Database para maior escalabilidade e funcionalidades relacionais.
- **Integrações Externas**:
  - Stripe para gerenciamento de assinaturas e pagamentos.
- **Hospedagem**: CWP control para controle e gerenciamento do servidor e hospedagem da Solution com integração NodeJS Apps para hospedar a API do backend principal.


## Licença
MIT License - Sinta-se livre para usar e modificar, com atribuição.

Para mais detalhes, contate a equipe de desenvolvimento em [projetossolutiondev@gmail.com].
****
