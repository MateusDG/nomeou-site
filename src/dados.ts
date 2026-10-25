// O conteúdo do app que a página usa (gerado em src/gerado/ por scripts/dados-do-app.mjs) e as perguntas que as
// etapas fazem a ele: a matéria, as 6 da área, a próxima questão da folha e a Questão do selo.
import { CONTEUDO } from './gerado/conteudo';
import { QUESTOES } from './gerado/questoes';
import type { AreaId, Item, Materia, MateriaId } from './tipos';

export const conteudo = CONTEUDO;
export const questoes = QUESTOES;

export function materia(id: MateriaId): Materia {
  const m = CONTEUDO.materias[id];
  if (!m) throw new Error(`Matéria desconhecida: ${id}`);
  return m;
}

/** As 6 matérias da roleta da área, na ordem do disco. */
export function roleta(area: AreaId): Materia[] {
  return CONTEUDO.roletas[area].map(materia);
}

export function item(id: string): Item {
  const q = QUESTOES.itens[id];
  if (!q) throw new Error(`Questão desconhecida: ${id}`);
  return q;
}

/** As questões de múltipla escolha da folha, de uma matéria, na ordem em que entram. */
export function daFolha(d: MateriaId): Item[] {
  return (QUESTOES.porMateria[d] ?? []).map(item).filter((q) => q.tipo === 'multipla');
}

/** A Questão do selo (o Certo ou Errado) de uma matéria. */
export function doSelo(d: MateriaId): Item | undefined {
  return (QUESTOES.porMateria[d] ?? []).map(item).find((q) => q.tipo === 'ce');
}

/** Quantas folhas a página tem para a área (2 por matéria). */
export function totalDaFolha(area: AreaId): number {
  return CONTEUDO.roletas[area].reduce((n, d) => n + daFolha(d).length, 0);
}

/** A próxima questão não vista de uma matéria. */
export function proximaDaMateria(d: MateriaId, vistas: string[]): Item | undefined {
  return daFolha(d).find((q) => !vistas.includes(q.id));
}
