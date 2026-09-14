/**
 * Modelos de dados para o Inventário de Dados Pessoais do Guardião.
 */

export type DataSensitivityLevel = 'pessoal' | 'sensivel' | 'altamente_sensivel';

export interface InventoryFieldItem {
  value: string;
  sensibilidade: DataSensitivityLevel;
}

export interface ExpandedInventoryData {
  tituloEleitor?: InventoryFieldItem | string;
  carteiraTrabalho?: InventoryFieldItem | string;
  certidaoNascimento?: InventoryFieldItem | string;
  certidaoCasamento?: InventoryFieldItem | string;
  comprovanteMatricula?: InventoryFieldItem | string;
}

export type DataSubjectCategory = 
  | 'Clientes' 
  | 'Funcionários' 
  | 'Fornecedores' 
  | 'Parceiros' 
  | 'Filhos' 
  | 'Parentes'
  | string;
