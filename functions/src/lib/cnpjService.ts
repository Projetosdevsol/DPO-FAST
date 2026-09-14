/**
 * cnpjService.ts
 * Camada de Serviço (Service Layer) para regras de negócio sobre dados de CNPJ,
 * classificação de leads, risco de LGPD e verificação de QSA.
 */

export interface CnaeInfo {
  codigo: number;
  descricao: string;
}

export interface QsaMember {
  identificador_de_socio: number;
  nome_socio: string;
  cnpj_cpf_do_socio: string;
  codigo_qualificacao_socio: number;
  percentual_capital_social?: number;
}

export interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  status: string;
  descricao_situacao_cadastral: string;
  cnae_fiscal_principal: CnaeInfo;
  cnae_fiscal_secundarias?: CnaeInfo[];
  capital_social: number;
  data_abertura: string; // formato AAAA-MM-DD
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  qsa?: QsaMember[];
}

export interface EnrichedCnpjData {
  companyName: string;
  tradeName: string;
  cnae: CnaeInfo;
  capitalSocial: number;
  ageInYears: number;
  leadSegment: 'PME' | 'Enterprise';
  dataRiskScore: 'BAIXO' | 'MEDIO' | 'ALTO';
  address: string;
  siteDomainMatch?: boolean;
}

/**
 * Calcula a idade de uma empresa a partir da data de abertura.
 */
export function calculateCompanyAge(openingDateStr: string): number {
  if (!openingDateStr) return 0;
  const openingDate = new Date(openingDateStr);
  if (isNaN(openingDate.getTime())) return 0;

  const diffMs = Date.now() - openingDate.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Determina o risco de conformidade de dados com base no CNAE.
 * Setores de alto risco: Saúde, Marketing, Finanças, RH, Telecom, Educação.
 */
export function calculateDataRiskScore(cnaeCode: number): 'BAIXO' | 'MEDIO' | 'ALTO' {
  const cnaeStr = String(cnaeCode).padStart(7, '0');
  const division = cnaeStr.substring(0, 2); // primeiros 2 dígitos (Divisão)
  const group = cnaeStr.substring(0, 4);    // primeiros 4 dígitos (Grupo/Classe)

  // Divisões de Risco Alto:
  // 64, 65, 66: Serviços Financeiros, Seguros
  // 86, 87, 88: Atividades de Atenção à Saúde Humana e Serviços Sociais
  // 85: Educação
  // 61: Telecomunicações
  const highRiskDivisions = ['64', '65', '66', '86', '87', '88', '85', '61'];
  if (highRiskDivisions.includes(division)) {
    return 'ALTO';
  }

  // Grupos de Risco Alto:
  // 7311, 7312, 7319: Marketing, Publicidade, Pesquisas de Opinião
  // 7810, 7820, 7830: Recursos Humanos, Recrutamento e Seleção
  const highRiskGroups = ['7311', '7312', '7319', '7810', '7820', '7830'];
  if (highRiskGroups.includes(group)) {
    return 'ALTO';
  }

  // Risco Médio:
  // 62, 63: TI, Desenvolvimento de Software, Portais e Provedores
  // 47 (Comércio Varejista com alto volume de clientes B2C)
  const mediumRiskDivisions = ['62', '63', '47'];
  if (mediumRiskDivisions.includes(division)) {
    return 'MEDIO';
  }

  return 'BAIXO';
}

/**
 * Valida se um determinado nome ou CPF aproximado está presente no Quadro de Sócios (QSA)
 */
export function verifyUserInQsa(qsa: QsaMember[] | undefined, userName: string): boolean {
  if (!qsa || qsa.length === 0 || !userName) return false;

  const normalizedInput = userName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  return qsa.some(member => {
    if (!member.nome_socio) return false;
    const normalizedMember = member.nome_socio.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return normalizedMember.includes(normalizedInput) || normalizedInput.includes(normalizedMember);
  });
}
