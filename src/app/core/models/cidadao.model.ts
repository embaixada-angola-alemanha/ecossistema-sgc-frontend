export type EstadoCidadao = 'ACTIVO' | 'INACTIVO' | 'SUSPENSO';
export type Sexo = 'MASCULINO' | 'FEMININO';
export type EstadoCivil = 'SOLTEIRO' | 'CASADO' | 'DIVORCIADO' | 'VIUVO' | 'UNIAO_FACTO';

export interface Cidadao {
  id: string;
  numeroPassaporte: string;
  nomeCompleto: string;
  dataNascimento: string | null;
  sexo: Sexo | null;
  nacionalidade: string | null;
  estadoCivil: EstadoCivil | null;
  email: string | null;
  telefone: string | null;
  enderecoAngola: string | null;
  enderecoAlemanha: string | null;
  estado: EstadoCidadao;
  documentoCount: number;
  processoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CidadaoCreate {
  numeroPassaporte: string;
  nomeCompleto: string;
  dataNascimento?: string;
  sexo?: Sexo;
  nacionalidade?: string;
  estadoCivil?: EstadoCivil;
  email?: string;
  telefone?: string;
  enderecoAngola?: string;
  enderecoAlemanha?: string;
}

export interface CidadaoUpdate {
  nomeCompleto?: string;
  dataNascimento?: string;
  sexo?: Sexo;
  nacionalidade?: string;
  estadoCivil?: EstadoCivil;
  email?: string;
  telefone?: string;
  enderecoAngola?: string;
  enderecoAlemanha?: string;
}
