export type TipoAgendamento =
  | 'PASSAPORTE'
  | 'VISTO'
  | 'LEGALIZACAO'
  | 'REGISTO_CONSULAR'
  | 'CERTIDAO'
  | 'NOTARIADO'
  | 'CONSULTA_GERAL';

export type EstadoAgendamento =
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'REAGENDADO'
  | 'CANCELADO'
  | 'COMPLETADO'
  | 'NAO_COMPARECEU';

export interface Agendamento {
  id: string;
  cidadaoId: string;
  cidadaoNome: string;
  cidadaoEmail: string;
  tipo: TipoAgendamento;
  numeroAgendamento: string;
  estado: EstadoAgendamento;
  dataHora: string;
  duracaoMinutos: number;
  local: string | null;
  notas: string | null;
  motivoCancelamento: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgendamentoCreate {
  cidadaoId: string;
  tipo: TipoAgendamento;
  dataHora: string;
  notas?: string;
}

export interface AgendamentoUpdate {
  dataHora: string;
  notas?: string;
}

export interface AgendamentoHistorico {
  id: string;
  agendamentoId: string;
  estadoAnterior: EstadoAgendamento | null;
  estadoNovo: EstadoAgendamento;
  comentario: string | null;
  alteradoPor: string;
  createdAt: string;
}

export interface SlotDisponivel {
  dataHora: string;
  duracaoMinutos: number;
  tipo: TipoAgendamento;
}

export const TIPO_AGENDAMENTO_VALUES: TipoAgendamento[] = [
  'PASSAPORTE', 'VISTO', 'LEGALIZACAO', 'REGISTO_CONSULAR',
  'CERTIDAO', 'NOTARIADO', 'CONSULTA_GERAL',
];

export const ESTADO_AGENDAMENTO_VALUES: EstadoAgendamento[] = [
  'PENDENTE', 'CONFIRMADO', 'REAGENDADO',
  'CANCELADO', 'COMPLETADO', 'NAO_COMPARECEU',
];

export const AGENDAMENTO_TRANSITIONS: Record<EstadoAgendamento, EstadoAgendamento[]> = {
  PENDENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['REAGENDADO', 'CANCELADO', 'COMPLETADO', 'NAO_COMPARECEU'],
  REAGENDADO: ['CONFIRMADO', 'CANCELADO'],
  CANCELADO: [],
  COMPLETADO: [],
  NAO_COMPARECEU: [],
};
