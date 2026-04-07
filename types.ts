
export interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  cnpj: string;
  address: string;
  onboardingCompleted: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  isAdmin?: boolean;
  status?: 'active' | 'suspended';
  isOnline?: boolean;
  createdAt: string;
  lastLogin?: string;
  achievements?: string[];
}

export interface AccessLog {
  id?: string;
  userId: string;
  userName: string;
  timestamp: string;
  userAgent: string;
  type: 'login' | 'logout' | 'activity';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
}

export interface DataProcess {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  lastStep: number;
  answers?: SectorAnswers;
}

export interface SectorMapping {
  id: string;
  name: string;
  isCustom: boolean;
  processes: DataProcess[];
  status?: 'pending' | 'in_progress' | 'completed';
  lastStep?: number;
  isLocked?: boolean;
}

export interface SectorAnswers {
  processName: string;
  responsibleRole: string;
  purpose: string;
  collectedData: string[];
  hasSensitiveData: boolean;
  dataSubjects: string[];
  estimatedVolume: string;
  legalBasis: string;
  consentMechanism?: string;
  hasConsentProof?: boolean;
  storageType: 'Digital' | 'Físico' | 'Híbrido';
  collectionChannels: string[];
  cloudProvider?: string;
  systemsUsed?: string;
  hasBackups: boolean;
  hasEncryption: boolean;
  isSharedInternal: boolean;
  isSharedExternal: boolean;
  externalThirdParties?: string;
  sharedExternalDocumentUrl?: string;
  sharedExternalDocumentName?: string;
  isInternationalTransfer: boolean;
  accessControl: string;
  hasMFA: boolean;
  hasIncidentPlan: boolean;
  hasStaffTraining: boolean;
  retentionPeriod: string;
  deletionMethod: string;
  hasSecondaryUse: boolean;
  secondaryUsePurpose?: string;
}

export interface QuestionnaireData {
  companySize: 'MEI' | 'Microempresa' | 'Pequena Empresa';
  industry: string;
  sectors: SectorMapping[];
  lastUpdated: string;
}

export interface ValidationResult {
  isValid: boolean;
  feedback: string;
  missingElements: string[];
}

export interface ValidationHistoryEntry {
  date: string;
  evidence: string;
  result: ValidationResult;
  observations?: string;
}

export interface ComplianceTask {
  id: string;
  title: string;
  description: string;
  explanation: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  status: 'Pendente' | 'Automatizada' | 'Concluída' | 'Revisar';
  targetDocument: string;
  processId?: string;
  sectorId?: string;
  dueDate?: string;
  evidence?: string;
  validationResult?: ValidationResult;
  history?: ValidationHistoryEntry[];
  observations?: string;
  evidenceUrl?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  internalNotes?: string;
  attachment?: string;
}

export interface AuditLog {
  id?: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId: string;
  details: string;
  timestamp: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
}
