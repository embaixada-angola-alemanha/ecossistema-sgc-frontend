export type WorkflowModule = 'visas' | 'registosCivis' | 'servicosNotariais' | 'agendamentos';

export interface WorkflowItem {
  id: string;
  module: WorkflowModule;
  cidadaoNome: string;
  numero: string | null;
  tipo: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  allowedTransitions: string[];
}

export interface PipelineStage {
  estado: string;
  count: number;
  items: WorkflowItem[];
}

export interface ModulePipeline {
  module: WorkflowModule;
  label: string;
  icon: string;
  stages: PipelineStage[];
  total: number;
}

export interface BulkAction {
  module: WorkflowModule;
  ids: string[];
  targetEstado: string;
  comentario?: string;
}

export const WORKFLOW_MODULES: { key: WorkflowModule; label: string; icon: string; apiPath: string }[] = [
  { key: 'visas', label: 'workflow.module.visas', icon: 'flight_takeoff', apiPath: 'visas' },
  { key: 'registosCivis', label: 'workflow.module.registosCivis', icon: 'article', apiPath: 'registos-civis' },
  { key: 'servicosNotariais', label: 'workflow.module.servicosNotariais', icon: 'gavel', apiPath: 'servicos-notariais' },
  { key: 'agendamentos', label: 'workflow.module.agendamentos', icon: 'event', apiPath: 'agendamentos' },
];

export const ACTIONABLE_STATES: Record<WorkflowModule, string[]> = {
  visas: ['SUBMETIDO', 'EM_ANALISE', 'DOCUMENTOS_PENDENTES', 'APROVADO'],
  registosCivis: ['SUBMETIDO', 'EM_VERIFICACAO', 'VERIFICADO'],
  servicosNotariais: ['SUBMETIDO', 'EM_PROCESSAMENTO'],
  agendamentos: ['PENDENTE', 'CONFIRMADO', 'REAGENDADO'],
};

export const MODULE_TRANSITIONS: Record<WorkflowModule, Record<string, string[]>> = {
  visas: {
    RASCUNHO: ['SUBMETIDO', 'CANCELADO'],
    SUBMETIDO: ['EM_ANALISE', 'CANCELADO'],
    EM_ANALISE: ['APROVADO', 'REJEITADO', 'DOCUMENTOS_PENDENTES', 'CANCELADO'],
    DOCUMENTOS_PENDENTES: ['EM_ANALISE', 'CANCELADO'],
    APROVADO: ['EMITIDO', 'CANCELADO'],
  },
  registosCivis: {
    RASCUNHO: ['SUBMETIDO', 'CANCELADO'],
    SUBMETIDO: ['EM_VERIFICACAO', 'CANCELADO'],
    EM_VERIFICACAO: ['VERIFICADO', 'REJEITADO'],
    VERIFICADO: ['CERTIFICADO_EMITIDO', 'CANCELADO'],
  },
  servicosNotariais: {
    RASCUNHO: ['SUBMETIDO', 'CANCELADO'],
    SUBMETIDO: ['EM_PROCESSAMENTO', 'CANCELADO'],
    EM_PROCESSAMENTO: ['CONCLUIDO', 'REJEITADO'],
  },
  agendamentos: {
    PENDENTE: ['CONFIRMADO', 'CANCELADO'],
    CONFIRMADO: ['REAGENDADO', 'CANCELADO', 'COMPLETADO', 'NAO_COMPARECEU'],
    REAGENDADO: ['CONFIRMADO', 'CANCELADO'],
  },
};

export const PIPELINE_STATES: Record<WorkflowModule, string[]> = {
  visas: ['RASCUNHO', 'SUBMETIDO', 'EM_ANALISE', 'DOCUMENTOS_PENDENTES', 'APROVADO', 'EMITIDO'],
  registosCivis: ['RASCUNHO', 'SUBMETIDO', 'EM_VERIFICACAO', 'VERIFICADO', 'CERTIFICADO_EMITIDO'],
  servicosNotariais: ['RASCUNHO', 'SUBMETIDO', 'EM_PROCESSAMENTO', 'CONCLUIDO'],
  agendamentos: ['PENDENTE', 'CONFIRMADO', 'REAGENDADO', 'COMPLETADO'],
};
