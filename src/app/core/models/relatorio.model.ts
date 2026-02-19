export interface ModuloResumo {
  total: number;
  porEstado: Record<string, number>;
  porTipo: Record<string, number>;
}

export interface DashboardResumo {
  visas: ModuloResumo;
  processos: ModuloResumo;
  registosCivis: ModuloResumo;
  servicosNotariais: ModuloResumo;
  agendamentos: ModuloResumo;
  totalGeral: number;
}

export interface Estatisticas {
  modulo: string;
  total: number;
  porEstado: Record<string, number>;
  porTipo: Record<string, number>;
  periodo: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  username: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  /** Portuguese aliases used by some templates */
  acao: string;
  modulo: string;
  entidade: string;
  dataHora: string;
}

export interface RelatorioFilter {
  dataInicio?: string;
  dataFim?: string;
  modulo?: string;
  tipo?: string;
  estado?: string;
}
