export type TipoVisto =
  | 'TURISTA'
  | 'NEGOCIO'
  | 'TRABALHO'
  | 'ESTUDANTE'
  | 'TRANSITO'
  | 'FAMILIAR'
  | 'DIPLOMATICO'
  | 'CORTESIA';

export type EstadoVisto =
  | 'RASCUNHO'
  | 'SUBMETIDO'
  | 'EM_ANALISE'
  | 'DOCUMENTOS_PENDENTES'
  | 'APROVADO'
  | 'REJEITADO'
  | 'EMITIDO'
  | 'CANCELADO';

export interface Visto {
  id: string;
  cidadaoId: string;
  cidadaoNome: string;
  tipo: TipoVisto;
  numeroVisto: string | null;
  estado: EstadoVisto;
  nacionalidadePassaporte: string | null;
  motivoViagem: string | null;
  dataEntrada: string | null;
  dataSaida: string | null;
  localAlojamento: string | null;
  entidadeConvite: string | null;
  responsavel: string | null;
  valorTaxa: number | null;
  taxaPaga: boolean;
  dataSubmissao: string | null;
  dataDecisao: string | null;
  motivoRejeicao: string | null;
  observacoes: string | null;
  documentoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VistoCreate {
  cidadaoId: string;
  tipo: TipoVisto;
  nacionalidadePassaporte?: string;
  motivoViagem?: string;
  dataEntrada?: string;
  dataSaida?: string;
  localAlojamento?: string;
  entidadeConvite?: string;
  observacoes?: string;
}

export interface VistoUpdate {
  motivoViagem?: string;
  dataEntrada?: string;
  dataSaida?: string;
  localAlojamento?: string;
  entidadeConvite?: string;
  responsavel?: string;
  observacoes?: string;
}

export interface VistoHistorico {
  id: string;
  visaId: string;
  estadoAnterior: EstadoVisto | null;
  estadoNovo: EstadoVisto;
  comentario: string | null;
  alteradoPor: string;
  createdAt: string;
}

export interface VistoFee {
  tipo: TipoVisto;
  valor: number;
  moeda: string;
  isento: boolean;
}

export interface VistoChecklist {
  tipo: TipoVisto;
  documentosRequeridos: string[];
}

export const TIPO_VISTO_VALUES: TipoVisto[] = [
  'TURISTA', 'NEGOCIO', 'TRABALHO', 'ESTUDANTE',
  'TRANSITO', 'FAMILIAR', 'DIPLOMATICO', 'CORTESIA',
];

export const ESTADO_VISTO_VALUES: EstadoVisto[] = [
  'RASCUNHO', 'SUBMETIDO', 'EM_ANALISE', 'DOCUMENTOS_PENDENTES',
  'APROVADO', 'REJEITADO', 'EMITIDO', 'CANCELADO',
];

export const ALLOWED_TRANSITIONS: Record<EstadoVisto, EstadoVisto[]> = {
  RASCUNHO: ['SUBMETIDO', 'CANCELADO'],
  SUBMETIDO: ['EM_ANALISE', 'CANCELADO'],
  EM_ANALISE: ['APROVADO', 'REJEITADO', 'DOCUMENTOS_PENDENTES', 'CANCELADO'],
  DOCUMENTOS_PENDENTES: ['EM_ANALISE', 'CANCELADO'],
  APROVADO: ['EMITIDO', 'CANCELADO'],
  REJEITADO: [],
  EMITIDO: [],
  CANCELADO: [],
};
