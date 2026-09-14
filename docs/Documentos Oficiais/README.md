# DPO Fast — Conversor de Documentos LGPD → Markdown

## Estrutura de Pastas

```
Documentos Oficiais/
├── documentos_brutos/          ← Coloque os .pdf, .docx, .xlsx aqui
├── templates_md/               ← Saída: arquivos .md convertidos
├── converter_docs.py           ← Script principal de conversão
├── genkit_integration.js       ← Exemplo de integração com Genkit AI
└── requirements.txt            ← Dependências Python
```

## Instalação

```bash
pip install -r requirements.txt
```

## Uso

### 1. Mover documentos para a pasta de origem

Copie todos os arquivos LGPD para `documentos_brutos/`:
- PDFs: `03_13_SUGESTAO DE COMUNICACAO.pdf`
- Word: `02_02_POLITICA DE PRIVACIDADE SITE.docx`
- Excel: `01_01_ROPA - AODIGITAL.xlsx`
- PowerPoint: `03_26_SUGESTAO CANAL COMUNICACAO.pptx`

### 2. Executar a conversão

```bash
python converter_docs.py
```

Ou com pastas customizadas:
```bash
python converter_docs.py --src "C:\caminho\documentos" --dst "C:\caminho\templates"
```

### 3. Resultado

Cada arquivo `.md` será gerado com:

```yaml
---
arquivo_original: "02_02_POLITICA DE PRIVACIDADE SITE.docx"
tipo_documento: politica
setor_alvo: privacidade
categoria: governanca
versao_lgpd: "Lei 13.709/2018"
formato_original: docx
gerado_em: "2026-06-26T12:00:00"
total_tokens_aprox: 3200.0
---

# Política de Privacidade

## 1. Introdução

A [EMPRESA] está comprometida com a proteção dos dados pessoais...
```

## Formatos Suportados

| Formato | Biblioteca | O que extrai |
|---------|-----------|--------------|
| `.pdf`  | pdfplumber | Texto completo, preservando parágrafos |
| `.docx` | python-docx | Headings, listas, tabelas → Markdown |
| `.xlsx` | openpyxl | Abas → tabelas Markdown `\| col1 \| col2 \|` |
| `.pptx` | python-pptx | Texto dos slides |

## Integração com Genkit (Node.js)

O arquivo `genkit_integration.js` mostra como:

1. **Carregar** todos os templates `.md` de uma pasta
2. **Filtrar** por `tipo_documento`, `setor_alvo` ou `categoria`
3. **Montar** um System Prompt dinâmico com os templates como contexto
4. **Chamar** o modelo Qwen via Genkit com o prompt enriquecido

```js
const { indexarTemplates, selecionarTemplates, montarSystemPrompt } = require('./genkit_integration');

// Indexar todos os templates
const templates = indexarTemplates('./templates_md');

// Filtrar apenas políticas de privacidade
const filtrados = selecionarTemplates(templates, {
  tipo_documento: 'politica',
  setor_alvo: 'privacidade'
});

// Montar system prompt para a IA
const systemPrompt = montarSystemPrompt(pergunta, filtrados);
```

## Funcionalidades do Script

- **Inferência automática de metadados** a partir do nome do arquivo (prefixo `02_` = política, `06_` = contrato, etc.)
- **Higienização** de caracteres corrompidos, quebras de página e espaços extras
- **Preservação de hierarquia** de headings para LLMs interpretarem corretamente
- **Tratamento de erros** com log de falhas
- **Proteção contra sobrescrita** com sufixo numérico automático
