// Cópia de turno-concurso/src/game/mesaDeSom.ts, feita por scripts/dados-do-app.mjs sem mudança de comportamento. Não edite à mão.
// (só a importação do teto vira o valor). Não edite à mão.
/**
 * A mesa de som (pura, sem React): decide se um som toca pela categoria dele e pelo que soou antes,
 * quando ele sai e qual variante do arquivo sai. O `tocar()` de `src/services/som.ts` só leva os
 * pedidos à mesa (`passoDaMesa`) e toca o que ela solta; as telas nunca falam com ela.
 *
 * O teto é o de `TETO_DE_SONS` (2 eventos em 1,6 s, `src/game/duelo.ts`), com prioridade:
 * - herói (carimbo, selo, prensa, vitória) e resultado (acerto, erro, risco, toc): sempre tocam e contam;
 * - ato (bolha, rubrica, grampo, picote, pires): toca com menos de 2 eventos na janela, e conta;
 * - textura (a folha que vira): pede também 600 ms sem nenhum som contado, e conta;
 * - toque (o clique do botão cheio): nunca conta; espera 60 ms e cai se soar um som que conta, de
 *   150 ms antes do pedido até a hora dele (o som do mesmo gesto: o da ação, que vem antes, e o toc do
 *   sorteio parado, que vem logo depois);
 * - tique (a caneta do sorteio): não conta e sempre toca (o teto dele é o MAX_TIQUES, em ritmoRoleta.ts).
 * Nada vai para fila: o som que cai, cai. Antes de o áudio ficar pronto, todo som espera; o que sairia
 * mais de 150 ms depois do pedido cai (atrasado, já não é o som do gesto). Só o que soa entra no
 * histórico e gira a variante.
 */
/** O teto de turno-concurso/src/game/duelo.ts, lido pelo gerador. */
const TETO_DE_SONS = {"sons":2,"janela":1600};

export type CategoriaDoSom = 'heroi' | 'resultado' | 'ato' | 'textura' | 'toque' | 'tique';

/** Todo som que as telas podem pedir, com a categoria dele na mesa. */
export const CATEGORIA_DO_SOM = {
  carimbo: 'heroi',
  selo: 'heroi',
  rotativa: 'heroi',
  vitoria: 'heroi',
  acerto: 'resultado',
  erro: 'resultado',
  caneta: 'resultado',
  toc: 'resultado',
  bolha: 'ato',
  rubrica: 'ato',
  grampo: 'ato',
  picote: 'ato',
  pires: 'ato',
  virar: 'textura',
  clique: 'toque',
  tique1: 'tique',
  tique2: 'tique',
  tique3: 'tique',
} as const satisfies Record<string, CategoriaDoSom>;

export type Som = keyof typeof CATEGORIA_DO_SOM;

/**
 * Os sons que o áudio prepara primeiro, depois da abertura: o botão, a bolha, a folha e a caneta do
 * sorteio, que soam antes de todos. Na web, só eles antes do primeiro som (cada player baixa o arquivo).
 */
export const SONS_DA_ABERTURA = ['clique', 'bolha', 'virar', 'tique1', 'tique2', 'tique3', 'toc'] as const satisfies readonly Som[];

/** Depois dos da abertura, o que soa mais cedo no jogo: o resultado, os heróis (o carimbo) e os atos. */
const ORDEM_DAS_CATEGORIAS: readonly CategoriaDoSom[] = ['resultado', 'heroi', 'ato', 'textura', 'toque', 'tique'];

/** Todos os sons, na ordem em que os players nascem (os da abertura, depois por categoria). */
export const ORDEM_DO_PREPARO: readonly Som[] = [
  ...SONS_DA_ABERTURA,
  ...(Object.keys(CATEGORIA_DO_SOM) as Som[])
    .filter((s) => !(SONS_DA_ABERTURA as readonly Som[]).includes(s))
    .sort((a, b) => ORDEM_DAS_CATEGORIAS.indexOf(CATEGORIA_DO_SOM[a]) - ORDEM_DAS_CATEGORIAS.indexOf(CATEGORIA_DO_SOM[b])),
];

/**
 * Os sons que nascem de novo, aos poucos, quando o som é religado (src/services/som.ts): os da abertura
 * e os que sempre soam na hora (o resultado e o herói: o acerto, o erro e a caneta dele, o carimbo, o
 * selo, a vitória e a rotativa), que não podem esperar o player nascer no primeiro toque. Na ordem do
 * preparo. O resto, no primeiro toque.
 */
export const SONS_DA_RELIGADA: readonly Som[] = ORDEM_DO_PREPARO.filter(
  (s) => (SONS_DA_ABERTURA as readonly Som[]).includes(s) || CATEGORIA_DO_SOM[s] === 'resultado' || CATEGORIA_DO_SOM[s] === 'heroi',
);

/**
 * Os sons frequentes alternam 3 arquivos (tom, duração e brilho um pouco diferentes, no mesmo pico):
 * iguais, soariam como máquina. Quem chama usa sempre o nome do som (`tocar('bolha')`).
 */
export const VARIANTES = {
  bolha: ['bolha', 'bolha2', 'bolha3'],
  virar: ['virar', 'virar2', 'virar3'],
  caneta: ['caneta', 'caneta2', 'caneta3'],
  clique: ['clique1', 'clique2', 'clique3'],
} as const satisfies Partial<Record<Som, readonly string[]>>;

type ComVariante = keyof typeof VARIANTES;

/** Cada WAV de `assets/sons/` (o nome do som, ou uma das variantes dele). */
export type ArquivoDeSom = Exclude<Som, ComVariante> | (typeof VARIANTES)[ComVariante][number];

/** A folha que vira só soa depois deste silêncio (ms): o toc do sorteio seguido vem 560 ms antes. */
export const SILENCIO_DA_TEXTURA = 600;

/** O clique cede ao som que conta e soou até isto (ms) antes do pedido dele. */
export const FOLGA_DO_CLIQUE = 150;

/**
 * O clique espera isto (ms) antes de sair: o som do mesmo gesto que chega nesse tempo (o toc do sorteio
 * parado, a folha) fica com o toque. Curto, para o clique ainda ser o do dedo.
 */
export const JANELA_DO_CLIQUE = 60;

/** O som que sairia mais disto (ms) depois do pedido cai: o 1º, à espera do áudio, e o clique atrasado. */
export const ESPERA_MAXIMA = 150;

/** Um som que contou no teto, com a hora (ms, relógio da sessão) do pedido dele. */
export interface SomContado {
  readonly som: Som;
  readonly em: number;
}

/** O que a mesa lembra: os sons contados ainda dentro da janela do teto. */
export type HistoricoDaMesa = readonly SomContado[];

/** Herói, resultado, ato e textura contam no teto; o clique e o tique, não. */
export function contaNoTeto(som: Som): boolean {
  const categoria = CATEGORIA_DO_SOM[som];
  return categoria !== 'toque' && categoria !== 'tique';
}

/** O som tocou há menos de `janela` ms? (Um relógio que andou para trás tira o som da conta.) */
const dentro = (s: SomContado, agora: number, janela: number) => agora - s.em >= 0 && agora - s.em < janela;

/** O clique pedido em `pedido` cede? (Soou um som que conta de 150 ms antes do pedido até `agora`.) */
function cedeOClique(historico: HistoricoDaMesa, pedido: number, agora: number): boolean {
  return historico.some((s) => s.em > pedido - FOLGA_DO_CLIQUE && s.em <= agora);
}

/** O som pode tocar agora? (O clique, pela folga; a espera dele é do `passoDaMesa`.) */
export function podeTocar(historico: HistoricoDaMesa, som: Som, agora: number): boolean {
  const categoria = CATEGORIA_DO_SOM[som];
  if (categoria === 'heroi' || categoria === 'resultado' || categoria === 'tique') return true;
  if (categoria === 'toque') return !cedeOClique(historico, agora, agora);
  if (historico.filter((s) => dentro(s, agora, TETO_DE_SONS.janela)).length >= TETO_DE_SONS.sons) return false;
  if (categoria === 'textura') return !historico.some((s) => dentro(s, agora, SILENCIO_DA_TEXTURA));
  return true;
}

/** Um pedido à espera: do áudio, ou (o clique) da janela dele. */
export interface PedidoDeSom {
  readonly som: Som;
  readonly em: number;
}

/** A mesa num instante. */
export interface Mesa {
  /** Os sons que soaram e contam, dentro da janela do teto. */
  readonly historico: HistoricoDaMesa;
  /** Quantas vezes cada som soou (gira as variantes). */
  readonly vezes: Readonly<Partial<Record<Som, number>>>;
  /** Os pedidos à espera, na ordem em que chegaram. */
  readonly espera: readonly PedidoDeSom[];
  /** O áudio está pronto (carregado e com o modo configurado)? Antes, todo som espera. */
  readonly pronto: boolean;
}

/** A mesa do boot: nada soou, e o áudio ainda não está pronto. */
export const MESA_NOVA: Mesa = { historico: [], vezes: {}, espera: [], pronto: false };

/** O que chega à mesa: um pedido, o áudio pronto, ou a hora que ela pediu (`acordarEm`). */
export type EventoDaMesa =
  | { readonly tipo: 'pedido'; readonly som: Som; readonly em: number }
  | { readonly tipo: 'pronto' | 'hora'; readonly em: number };

/** Um som que sai agora, já com a variante do arquivo. */
export interface SomQueSai {
  readonly som: Som;
  readonly arquivo: ArquivoDeSom;
}

/**
 * Um passo da mesa no tempo: o evento entra, e sai a mesa depois, o que soa agora (na ordem) e a hora
 * em que ela quer o próximo passo (o fim da janela de um clique), se quer. O relógio é o da sessão (ms).
 */
export function passoDaMesa(mesa: Mesa, evento: EventoDaMesa): { mesa: Mesa; saem: readonly SomQueSai[]; acordarEm?: number } {
  const agora = evento.em;
  const espera = evento.tipo === 'pedido' ? [...mesa.espera, { som: evento.som, em: agora }] : mesa.espera;
  const pronto = mesa.pronto || evento.tipo === 'pronto';
  if (!pronto) return { mesa: { ...mesa, espera }, saem: [] };

  let historico = mesa.historico;
  const vezes: Partial<Record<Som, number>> = { ...mesa.vezes };
  const saem: SomQueSai[] = [];
  const soar = (som: Som) => {
    const vez = vezes[som] ?? 0;
    vezes[som] = vez + 1;
    saem.push({ som, arquivo: arquivoDoSom(som, vez) });
  };
  // Os sons que não são o clique, na ordem do pedido: o atrasado cai; o resto passa pelo teto.
  for (const p of espera) {
    if (CATEGORIA_DO_SOM[p.som] === 'toque' || agora - p.em > ESPERA_MAXIMA || !podeTocar(historico, p.som, p.em)) continue;
    if (contaNoTeto(p.som)) historico = [...historico, p];
    soar(p.som);
  }
  // Os cliques, depois (o som do mesmo gesto já soou): cada um cede, cai atrasado, sai ou espera.
  const restam: PedidoDeSom[] = [];
  for (const c of espera) {
    if (CATEGORIA_DO_SOM[c.som] !== 'toque' || cedeOClique(historico, c.em, agora) || agora - c.em > ESPERA_MAXIMA) continue;
    if (agora - c.em >= JANELA_DO_CLIQUE) soar(c.som);
    else restam.push(c);
  }
  return {
    mesa: { historico: historico.filter((s) => dentro(s, agora, TETO_DE_SONS.janela)), vezes, espera: restam, pronto },
    saem,
    ...(restam.length ? { acordarEm: Math.min(...restam.map((c) => c.em + JANELA_DO_CLIQUE)) } : {}),
  };
}

/** Os arquivos de um som, na ordem em que se alternam. */
export function arquivosDoSom(som: Som): readonly ArquivoDeSom[] {
  return som in VARIANTES ? VARIANTES[som as ComVariante] : [som as Exclude<Som, ComVariante>];
}

/** O arquivo da `vez`-ésima vez que o som toca (0, 1, 2…): as variantes giram, nunca a mesma duas vezes seguidas. */
export function arquivoDoSom(som: Som, vez: number): ArquivoDeSom {
  const arquivos = arquivosDoSom(som);
  return arquivos[((vez % arquivos.length) + arquivos.length) % arquivos.length];
}
