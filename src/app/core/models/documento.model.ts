export type TipoDocumento =
  | 'PASSAPORTE'
  | 'BILHETE_IDENTIDADE'
  | 'CERTIDAO_NASCIMENTO'
  | 'CERTIDAO_CASAMENTO'
  | 'PROCURACAO'
  | 'DECLARACAO'
  | 'OUTRO';

export type EstadoDocumento =
  | 'PENDENTE'
  | 'VERIFICADO'
  | 'REJEITADO'
  | 'EXPIRADO';

export interface Documento {
  id: string;
  cidadaoId: string;
  cidadaoNome: string;
  tipo: TipoDocumento;
  numero: string | null;
  dataEmissao: string | null;
  dataValidade: string | null;
  ficheiroUrl: string | null;
  ficheiroNome: string | null;
  ficheiroTamanho: number | null;
  ficheiroTipo: string | null;
  estado: EstadoDocumento;
  versao: number | null;
  documentoOriginalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentoCreate {
  tipo: TipoDocumento;
  numero?: string;
  dataEmissao?: string;
  dataValidade?: string;
  ficheiroUrl?: string;
  ficheiroNome?: string;
  ficheiroTamanho?: number;
  ficheiroTipo?: string;
}

export interface DocumentoUpdate {
  tipo?: TipoDocumento;
  numero?: string;
  dataEmissao?: string;
  dataValidade?: string;
}

export interface DocumentoVersion {
  id: string;
  versao: number;
  ficheiroNome: string;
  ficheiroTamanho: number;
  ficheiroTipo: string;
  estado: EstadoDocumento;
  createdBy: string;
  createdAt: string;
}

export interface DocumentoUpload {
  ficheiroUrl: string;
  ficheiroNome: string;
  ficheiroTamanho: number;
  ficheiroTipo: string;
  versao: number;
}

export const TIPO_DOCUMENTO_VALUES: TipoDocumento[] = [
  'PASSAPORTE', 'BILHETE_IDENTIDADE', 'CERTIDAO_NASCIMENTO',
  'CERTIDAO_CASAMENTO', 'PROCURACAO', 'DECLARACAO', 'OUTRO',
];

export const ESTADO_DOCUMENTO_VALUES: EstadoDocumento[] = [
  'PENDENTE', 'VERIFICADO', 'REJEITADO', 'EXPIRADO',
];
