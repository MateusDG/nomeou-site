// Os tipos que o site e o gerador combinam: as matérias, as questões da página, os cargos do edital e o
// conteúdo que scripts/dados-do-app.mjs escreve em src/gerado/ a partir do app.

export type MateriaId = string;
export type AreaId = 'geral' | 'saude' | 'ti';

export interface Materia {
  id: MateriaId;
  sigla: string;
  nome: string;
  curto: string;
  /** A cor chapada da gravura do selo e da coroa do disco. */
  chapa: string;
  /** O nome comemorativo do selo ("Selo do Silogismo"). */
  selo: string;
  /** Quantas questões a matéria tem no app. */
  banco: number;
}

interface ItemBase {
  id: string;
  /** A matéria. */
  d: MateriaId;
  /** "Estilo Vunesp". */
  estilo: string;
  /** "fácil", "média" ou "difícil". */
  nivel: string;
  assunto: string;
  enunciado: string;
  /** A regra que fica, à mão, depois da resposta. */
  margem?: string;
  /** O trecho exato do enunciado onde está a armadilha (o ondulado vermelho). */
  pegadinha?: string;
  explicacao: string;
}
export interface ItemMultipla extends ItemBase {
  tipo: 'multipla';
  alternativas: string[];
  correta: number;
}
export interface ItemCertoErrado extends ItemBase {
  tipo: 'ce';
  /** true: Certo. */
  gabarito: boolean;
}
export type Item = ItemMultipla | ItemCertoErrado;
/** A escolha: o índice da alternativa, ou true/false no Certo ou Errado. */
export type Escolha = number | boolean;

export interface MateriaDoCargo {
  nome: string;
  chapa: string;
  itens: number;
  pct: number;
  /** A matéria ainda não tem questões no Nomeou (a página diz, como o app). */
  semQuestoes: boolean;
}
export interface Cargo {
  sigla: string;
  cargo: string;
  banca: string;
  /** A frase pronta: "120 itens de Certo ou Errado". */
  formato: string;
  /** A nota a lápis: a regra que muda o jogo (o desconto do Cebraspe, a prova de A a D), ou null. */
  nota: string | null;
  materias: MateriaDoCargo[];
}

export interface Conteudo {
  geradoEm: string;
  materias: Record<MateriaId, Materia>;
  roletas: Record<AreaId, MateriaId[]>;
  rotulos: Record<AreaId, string>;
  numeros: { questoes: number; materias: number; concursos: number; cargos: number };
  /** O Diário do dia de cada área: o número da edição e as matérias das 5 questões, na ordem. */
  diarios: Record<AreaId, { numero: number; materias: MateriaId[] }>;
  cargos: Cargo[];
}

export interface Questoes {
  /** A folha antes de qualquer sorteio. */
  primeira: string;
  /** A questão da Errata para quem não errou nada, com a alternativa marcada. */
  exemploErrata: { id: string; marcada: Escolha };
  /** Por matéria, as questões da página na ordem em que entram (2 de múltipla escolha e 1 de Certo ou Errado). */
  porMateria: Record<MateriaId, string[]>;
  itens: Record<string, Item>;
}
