export type TipoRegistoCivil = 'NASCIMENTO' | 'CASAMENTO' | 'OBITO';

export type EstadoRegistoCivil =
  | 'RASCUNHO'
  | 'SUBMETIDO'
  | 'EM_VERIFICACAO'
  | 'VERIFICADO'
  | 'CERTIFICADO_EMITIDO'
  | 'REJEITADO'
  | 'CANCELADO';

export interface RegistoCivil {
  id: string;
  cidadaoId: string;
  cidadaoNome: string;
  tipo: TipoRegistoCivil;
  numeroRegisto: string | null;
  estado: EstadoRegistoCivil;
  dataEvento: string | null;
  localEvento: string | null;
  observacoes: string | null;
  responsavel: string | null;
  motivoRejeicao: string | null;
  dataSubmissao: string | null;
  dataVerificacao: string | null;
  dataCertificado: string | null;
  // Birth-specific
  nomePai: string | null;
  nomeMae: string | null;
  localNascimento: string | null;
  // Marriage-specific
  nomeConjuge1: string | null;
  nomeConjuge2: string | null;
  regimeCasamento: string | null;
  // Death-specific
  causaObito: string | null;
  localObito: string | null;
  dataObito: string | null;
  // Certificate
  certificadoUrl: string | null;
  documentoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegistoCivilCreate {
  cidadaoId: string;
  tipo: TipoRegistoCivil;
  dataEvento?: string;
  localEvento?: string;
  observacoes?: string;
  nomePai?: string;
  nomeMae?: string;
  localNascimento?: string;
  nomeConjuge1?: string;
  nomeConjuge2?: string;
  regimeCasamento?: string;
  causaObito?: string;
  localObito?: string;
  dataObito?: string;
}

export interface RegistoCivilUpdate {
  dataEvento?: string;
  localEvento?: string;
  observacoes?: string;
  responsavel?: string;
  nomePai?: string;
  nomeMae?: string;
  localNascimento?: string;
  nomeConjuge1?: string;
  nomeConjuge2?: string;
  regimeCasamento?: string;
  causaObito?: string;
  localObito?: string;
  dataObito?: string;
}

export interface RegistoCivilHistorico {
  id: string;
  registoCivilId: string;
  estadoAnterior: EstadoRegistoCivil | null;
  estadoNovo: EstadoRegistoCivil;
  comentario: string | null;
  alteradoPor: string;
  createdAt: string;
}

export const TIPO_REGISTO_CIVIL_VALUES: TipoRegistoCivil[] = [
  'NASCIMENTO', 'CASAMENTO', 'OBITO',
];

export const ESTADO_REGISTO_CIVIL_VALUES: EstadoRegistoCivil[] = [
  'RASCUNHO', 'SUBMETIDO', 'EM_VERIFICACAO', 'VERIFICADO',
  'CERTIFICADO_EMITIDO', 'REJEITADO', 'CANCELADO',
];

export const REGISTO_CIVIL_TRANSITIONS: Record<EstadoRegistoCivil, EstadoRegistoCivil[]> = {
  RASCUNHO: ['SUBMETIDO', 'CANCELADO'],
  SUBMETIDO: ['EM_VERIFICACAO', 'CANCELADO'],
  EM_VERIFICACAO: ['VERIFICADO', 'REJEITADO'],
  VERIFICADO: ['CERTIFICADO_EMITIDO', 'CANCELADO'],
  CERTIFICADO_EMITIDO: [],
  REJEITADO: [],
  CANCELADO: [],
};

export const REGISTO_CIVIL_WORKFLOW_STEPS: EstadoRegistoCivil[] = [
  'RASCUNHO', 'SUBMETIDO', 'EM_VERIFICACAO', 'VERIFICADO', 'CERTIFICADO_EMITIDO',
];
