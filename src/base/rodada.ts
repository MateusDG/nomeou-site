// O estado da rodada de amostra: o que passa de uma etapa para a outra (o sorteio, as respostas, a convocação,
// os selos, a Errata) e os eventos que as etapas escutam. Cada visita é uma rodada nova; recarregar na mesma aba
// continua (sessionStorage). O nome do visitante só vive em memória: nunca vai para storage, URL ou rede.
import type { AreaId, Escolha, Item, MateriaId } from '../tipos';
import type { OrigemDaConvocacao } from './pecas';

const CHAVE_RODADA = 'nomeou.rodada.v1';
const CHAVE_PREFERENCIAS = 'nomeou.preferencias.v1';

export interface Resposta {
  id: string;
  d: MateriaId;
  certa: boolean;
  escolha: Escolha;
  origem: 'folha' | 'selo' | 'errata';
}
export interface SeloDaRodada {
  d: MateriaId;
  data: string;
}
export interface Sorteio {
  /** O índice da casa no disco (6 é a Convocação). */
  i: number;
  /** A matéria, ou null na Convocação. */
  d: MateriaId | null;
}

export interface EstadoDaRodada {
  sorteio: Sorteio | null;
  /** A questão na folha da 2ª etapa e quantas folhas já foram mostradas. */
  folha: { id: string | null; n: number; respondida: boolean };
  respostas: Resposta[];
  /** Ids já mostrados na folha. */
  vistas: string[];
  /** Acertos na folha desde a última convocação aberta (0 a 3; o erro não zera). */
  escalada: number;
  convocacao: { origem: OrigemDaConvocacao };
  /** Matérias cuja Questão do selo foi errada nesta visita. */
  falhas: MateriaId[];
  /** No máximo 3. */
  selos: SeloDaRodada[];
  /** Ids errados na folha: a fila da Errata. */
  erros: string[];
  sanadas: string[];
  area: AreaId;
  /** Só em memória. */
  nome: string;
}

export interface Preferencias {
  som?: boolean;
  movimento?: 'completo' | 'reduzido';
  area?: AreaId;
}

export type Evento = 'area' | 'sorteio' | 'folha' | 'resposta' | 'convocacao' | 'selo' | 'errata' | 'nome';
type Ouvinte = (dados: unknown, estado: EstadoDaRodada) => void;

function ler<T>(armazem: 'localStorage' | 'sessionStorage', chave: string): T | null {
  try {
    const bruto = window[armazem].getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}
function gravar(armazem: 'localStorage' | 'sessionStorage', chave: string, valor: unknown): void {
  try {
    window[armazem].setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem storage, segue em memória.
  }
}

function novo(area: AreaId): EstadoDaRodada {
  return {
    sorteio: null,
    folha: { id: null, n: 0, respondida: false },
    respostas: [],
    vistas: [],
    escalada: 0,
    convocacao: { origem: 'amostra' },
    falhas: [],
    selos: [],
    erros: [],
    sanadas: [],
    area,
    nome: '',
  };
}

const preferencias: Preferencias = ler<Preferencias>('localStorage', CHAVE_PREFERENCIAS) ?? {};
const salvo = ler<Partial<EstadoDaRodada>>('sessionStorage', CHAVE_RODADA);
export const estado: EstadoDaRodada = { ...novo(preferencias.area ?? 'geral'), ...(salvo?.folha ? salvo : {}), area: preferencias.area ?? 'geral', nome: '' };

const ouvintes: Partial<Record<Evento, Ouvinte[]>> = {};

/** Escuta um evento da rodada. */
export function on<T = unknown>(evento: Evento, fn: (dados: T, estado: EstadoDaRodada) => void): void {
  (ouvintes[evento] ??= []).push(fn as Ouvinte);
}

export function emitir(evento: Evento, dados?: unknown): void {
  salvar();
  for (const fn of ouvintes[evento] ?? []) {
    try {
      fn(dados, estado);
    } catch (erro) {
      console.error(erro);
    }
  }
}

export function salvar(): void {
  const { nome: _nome, area: _area, ...resto } = estado;
  gravar('sessionStorage', CHAVE_RODADA, resto);
}

export function preferencia<K extends keyof Preferencias>(chave: K): Preferencias[K];
export function preferencia<K extends keyof Preferencias>(chave: K, valor: Preferencias[K]): void;
export function preferencia<K extends keyof Preferencias>(chave: K, valor?: Preferencias[K]): Preferencias[K] | void {
  if (arguments.length < 2) return preferencias[chave];
  preferencias[chave] = valor;
  // O Som e o Movimento gravam a mesma chave por conta própria: relê e troca só esta, sem regravar uma cópia velha.
  gravar('localStorage', CHAVE_PREFERENCIAS, { ...(ler<Preferencias>('localStorage', CHAVE_PREFERENCIAS) ?? {}), [chave]: valor });
}

/** A data de hoje no aparelho, AAAA-MM-DD. */
export function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function temSelo(d: MateriaId): boolean {
  return estado.selos.some((s) => s.d === d);
}

export function registrarResposta(item: Item, escolha: Escolha, certa: boolean, origem: Resposta['origem']): void {
  estado.respostas.push({ id: item.id, d: item.d, certa, escolha, origem });
  if (origem === 'folha') {
    estado.folha.respondida = true;
    if (certa) estado.escalada = Math.min(3, estado.escalada + 1);
    else if (!estado.erros.includes(item.id)) estado.erros.push(item.id);
    if (estado.escalada >= 3) estado.convocacao.origem = 'treino';
  }
  if (origem === 'errata' && certa) {
    estado.erros = estado.erros.filter((id) => id !== item.id);
    if (!estado.sanadas.includes(item.id)) estado.sanadas.push(item.id);
  }
  emitir('resposta', { item, certa, origem });
}

export function ganharSelo(d: MateriaId): boolean {
  if (temSelo(d) || estado.selos.length >= 3) return false;
  estado.selos.push({ d, data: hoje() });
  emitir('selo', { d, total: estado.selos.length });
  return true;
}

export function falharSelo(d: MateriaId): void {
  if (!estado.falhas.includes(d)) estado.falhas.push(d);
  salvar();
}
