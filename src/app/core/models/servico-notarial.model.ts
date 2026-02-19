export type TipoServicoNotarial = 'PROCURACAO' | 'LEGALIZACAO' | 'APOSTILA' | 'COPIA_CERTIFICADA';

export type EstadoServicoNotarial =
  | 'RASCUNHO'
  | 'SUBMETIDO'
  | 'EM_PROCESSAMENTO'
  | 'CONCLUIDO'
  | 'REJEITADO'
  | 'CANCELADO';

export interface ServicoNotarial {
  id: string;
  cidadaoId: string;
  cidadaoNome: string;
  tipo: TipoServicoNotarial;
  numeroServico: string | null;
  estado: EstadoServicoNotarial;
  descricao: string | null;
  observacoes: string | null;
  responsavel: string | null;
  motivoRejeicao: string | null;
  valorTaxa: number;
  taxaPaga: boolean;
  dataSubmissao: string | null;
  dataConclusao: string | null;
  // Power of attorney
  outorgante: string | null;
  outorgado: string | null;
  finalidadeProcuracao: string | null;
  // Legalization
  documentoOrigem: string | null;
  paisOrigem: string | null;
  entidadeEmissora: string | null;
  // Apostille
  documentoApostilado: string | null;
  paisDestino: string | null;
  // Certified copy
  documentoOriginalRef: string | null;
  numeroCopias: number | null;
  // Certificate
  certificadoUrl: string | null;
  agendamentoId: string | null;
  documentoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServicoNotarialCreate {
  cidadaoId: string;
  tipo: TipoServicoNotarial;
  descricao?: string;
  observacoes?: string;
  agendamentoId?: string;
  outorgante?: string;
  outorgado?: string;
  finalidadeProcuracao?: string;
  documentoOrigem?: string;
  paisOrigem?: string;
  entidadeEmissora?: string;
  documentoApostilado?: string;
  paisDestino?: string;
  documentoOriginalRef?: string;
  numeroCopias?: number;
}

export interface ServicoNotarialUpdate {
  descricao?: string;
  observacoes?: string;
  responsavel?: string;
  outorgante?: string;
  outorgado?: string;
  finalidadeProcuracao?: string;
  documentoOrigem?: string;
  paisOrigem?: string;
  entidadeEmissora?: string;
  documentoApostilado?: string;
  paisDestino?: string;
  documentoOriginalRef?: string;
  numeroCopias?: number;
}

export interface ServicoNotarialHistorico {
  id: string;
  servicoNotarialId: string;
  estadoAnterior: EstadoServicoNotarial | null;
  estadoNovo: EstadoServicoNotarial;
  comentario: string | null;
  alteradoPor: string;
  createdAt: string;
}

export interface NotarialFee {
  tipo: TipoServicoNotarial;
  valor: number;
  moeda: string;
  isento: boolean;
}

export const TIPO_SERVICO_NOTARIAL_VALUES: TipoServicoNotarial[] = [
  'PROCURACAO', 'LEGALIZACAO', 'APOSTILA', 'COPIA_CERTIFICADA',
];

export const ESTADO_SERVICO_NOTARIAL_VALUES: EstadoServicoNotarial[] = [
  'RASCUNHO', 'SUBMETIDO', 'EM_PROCESSAMENTO', 'CONCLUIDO', 'REJEITADO', 'CANCELADO',
];

export const SERVICO_NOTARIAL_TRANSITIONS: Record<EstadoServicoNotarial, EstadoServicoNotarial[]> = {
  RASCUNHO: ['SUBMETIDO', 'CANCELADO'],
  SUBMETIDO: ['EM_PROCESSAMENTO', 'CANCELADO'],
  EM_PROCESSAMENTO: ['CONCLUIDO', 'REJEITADO'],
  CONCLUIDO: [],
  REJEITADO: [],
  CANCELADO: [],
};

export const SERVICO_NOTARIAL_WORKFLOW_STEPS: EstadoServicoNotarial[] = [
  'RASCUNHO', 'SUBMETIDO', 'EM_PROCESSAMENTO', 'CONCLUIDO',
];
