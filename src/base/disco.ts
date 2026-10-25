// O disco do sorteio da matéria, desenhado como no app (turno-concurso/src/components/Roleta.tsx): a rosca
// impressa e PARADA, a chapa de cada matéria só na coroa, a sigla de pé, a Convocação em papel com hachura
// (a casa menor, 10%) e a caneta azul presa no pivô pela bolinha da marca. Só a caneta gira. Função pura:
// o gerador imprime com ela o disco parado do index.html.
import type { Gesto } from '../gerado/geometria';
import type { Materia } from '../tipos';

const CORES = {
  folha: '#FAF8F3',
  tinta: '#16161B',
  caneta: '#2346C8',
  canetaFundo: '#1A3596',
  sombra: 'rgba(22,22,27,0.14)',
  miolo: 'rgba(22,22,27,0.16)',
  hachura: 'rgba(22,22,27,0.22)',
  aro: 'rgba(22,22,27,0.42)',
  sombraDaCaneta: 'rgba(22,22,27,0.22)',
  luzDoPivo: 'rgba(250,248,243,0.35)',
};

/** Medidas em fração do raio R (ou do diâmetro D, onde diz), as mesmas do app (GEOMETRIA). */
export const G = {
  coroa: 0.64,
  miolo: 0.16,
  sigla: 0.82,
  corpoDaSigla: 0.1,
  pivo: 0.065,
  bolinha: 0.024,
  apagar: 0.075,
  larguraDaCaneta: 0.052,
  cone: 0.47,
  ponta: 0.6,
  cauda: 0.2,
};

/** As chances do sorteio (game/sorteio.ts): 6 matérias de 15% e a Convocação, a menor, de 10%. */
export const CHANCES = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.1];
export const D = 300;
export const R = D / 2;
const C = R;
export const CONVOCACAO = 6;

export interface Casa {
  inicio: number;
  fim: number;
  centro: number;
}
export interface Caixa {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

const P = (n: number): number => Math.round(n * 10) / 10;

/** O ponto no raio r e no ângulo a (0 no alto, sentido horário). */
export function polar(r: number, a: number): [number, number] {
  const t = (a * Math.PI) / 180;
  return [C + r * Math.sin(t), C - r * Math.cos(t)];
}

/** O setor de anel entre os raios r1 < r2 e os ângulos a1 < a2. */
export function arcoAnel(r1: number, r2: number, a1: number, a2: number): string {
  const [x1, y1] = polar(r2, a1);
  const [x2, y2] = polar(r2, a2);
  const [x3, y3] = polar(r1, a2);
  const [x4, y4] = polar(r1, a1);
  const g = a2 - a1 > 180 ? 1 : 0;
  return `M${P(x1)},${P(y1)} A${P(r2)},${P(r2)} 0 ${g} 1 ${P(x2)},${P(y2)} L${P(x3)},${P(y3)} A${P(r1)},${P(r1)} 0 ${g} 0 ${P(x4)},${P(y4)}Z`;
}

/** As casas, cada uma do tamanho da sua chance, com a 1ª centrada no alto (casasDoDisco). */
export const CASAS: Casa[] = (() => {
  let inicio = -180 * CHANCES[0]!;
  return CHANCES.map((p) => {
    const fim = inicio + 360 * p;
    const casa = { inicio, fim, centro: (inicio + fim) / 2 };
    inicio = fim;
    return casa;
  });
})();

function hachura(): string {
  let d = '';
  for (let t = -D; t <= D; t += 5.5) d += `M${t.toFixed(1)},0 L${(t + D).toFixed(1)},${D} `;
  return d;
}

/** O envelope da Convocação, em traço de tinta (o ícone de carta do app), centrado em (x, y). */
function envelope(x: number, y: number): string {
  const w = 22;
  const h = 15;
  const x0 = P(x - w / 2);
  const y0 = P(y - h / 2);
  return (
    `<g class="disco__casa disco__envelope" style="--i:6" fill="${CORES.folha}" stroke="${CORES.tinta}" stroke-width="1.6" stroke-linejoin="round">` +
    `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="1"/>` +
    `<path fill="none" d="M${x0},${y0} L${P(x)},${P(y + 1.5)} L${P(x0 + w)},${y0}"/></g>`
  );
}

/** A caneta azul do app apontando para o alto (CanetaDesenhada), com a sombra em tinta a 22%. */
function caneta(sombra: boolean): string {
  const w = G.larguraDaCaneta * D;
  const ponta = G.ponta * R;
  const cone = G.cone * R;
  const cauda = G.cauda * R;
  const corpo = sombra ? CORES.sombraDaCaneta : CORES.caneta;
  const bico = sombra ? CORES.sombraDaCaneta : CORES.tinta;
  let s =
    `<rect x="${P(C - w / 2)}" y="${P(C - cone)}" width="${P(w)}" height="${P(cone + cauda)}" rx="${P(w / 2.4)}" fill="${corpo}"/>` +
    `<path d="M${P(C - w / 2)},${P(C - cone + 1)} L${P(C - 1.4)},${P(C - ponta + 2)} L${P(C + 1.4)},${P(C - ponta + 2)} L${P(C + w / 2)},${P(C - cone + 1)}Z" fill="${bico}"/>`;
  if (!sombra) {
    s +=
      `<circle cx="${C}" cy="${P(C - ponta + 1.6)}" r="1.7" fill="${CORES.tinta}"/>` +
      `<rect x="${P(C - w / 2)}" y="${P(C + cauda - 6)}" width="${P(w)}" height="7" rx="${P(w / 2.4)}" fill="${CORES.canetaFundo}"/>` +
      `<rect x="${P(C + w * 0.12)}" y="${P(C - cone * 0.55)}" width="1.6" height="${P(cone * 0.55 + cauda - 9)}" rx="0.8" fill="${CORES.folha}" opacity="0.55"/>` +
      `<circle cx="${C}" cy="${C}" r="${P(G.bolinha * D)}" fill="${CORES.caneta}" stroke="${CORES.tinta}" stroke-width="2"/>`;
  }
  return s;
}

/** A caixa em volta da sigla (ou do envelope) da casa `i`, onde a caneta circula. */
export function caixaDaCasa(i: number, materias: Materia[]): Caixa {
  const [cx, cy] = polar(G.sigla * R, CASAS[i]!.centro);
  const conv = i === CONVOCACAO;
  const largura = conv ? 34 : Math.max(30, materias[i]!.sigla.length * 13 + 12);
  const altura = conv ? 26 : 36;
  return { x: cx - largura / 2, y: cy - altura / 2 - (conv ? 0 : 1), largura, altura };
}

export interface Camadas {
  pintar: string;
  apagar: string;
  circulo: string;
  transform: string;
}

/**
 * As camadas da revelação da casa `i`: a casa que se pinta inteira (do miolo à borda; a Convocação continua
 * papel com hachura), o véu de folha sobre as outras e o círculo de caneta (pathLength 1, para o traço correr).
 */
export function camadas(i: number, materias: Materia[], gesto?: Gesto): Camadas {
  const r1 = G.apagar * D;
  const casa = CASAS[i]!;
  const pintar = i === CONVOCACAO ? '' : `<path d="${arcoAnel(r1, R, casa.inicio, casa.fim)}" fill="${materias[i]!.chapa}"/>`;
  const apagar = CASAS.map((c, j) => (j === i ? '' : `<path d="${arcoAnel(r1, R, c.inicio, c.fim)}"/>`)).join('');
  const caixa = caixaDaCasa(i, materias);
  const circulo = gesto ? gesto.tracos.map((d) => `<path d="${d}" pathLength="1" stroke-width="2.4"/>`).join('') : '';
  return { pintar, apagar, circulo, transform: `translate(${P(caixa.x)} ${P(caixa.y)})` };
}

/**
 * O disco inteiro, em SVG. `materias`: as 6 da roleta, na ordem do disco. Com `revelada` (o índice da casa) e
 * `gesto` (o círculo), já sai revelado: é o estado parado que a página mostra sem script. Classes que a página
 * anima: .disco__base, .disco__casa (com --i), .disco__pintar, .disco__apagar, .disco__circulo, .disco__caneta, .disco__sombra.
 */
export function svg(materias: Materia[], opcoes: { id?: string; angulo?: number; revelada?: number; gesto?: Gesto } = {}): string {
  const id = opcoes.id ?? 'disco';
  const angulo = opcoes.angulo ?? 0.5 * 360 * CHANCES[0]!;
  const coroa = G.coroa * R;
  const corpo = G.corpoDaSigla * D;
  const conv = CASAS[CONVOCACAO]!;
  const revelada = opcoes.revelada !== undefined ? camadas(opcoes.revelada, materias, opcoes.gesto) : null;
  const nomes = materias.map((m) => m.nome).join(', ');
  let s =
    `<svg class="disco" viewBox="-3 -3 307 307" role="img" aria-label="Sorteio da matéria. Sete casas: ${nomes} e a Convocação. Cada matéria vale 15%; a convocação, 10%.">` +
    `<defs><clipPath id="${id}-conv"><path d="${arcoAnel(coroa, R, conv.inicio, conv.fim)}"/></clipPath></defs>` +
    `<g class="disco__base"><circle cx="${C + 1.5}" cy="${C + 2}" r="${R}" fill="${CORES.sombra}"/><circle cx="${C}" cy="${C}" r="${R}" fill="${CORES.folha}"/></g>`;
  // A coroa: a chapa de cada matéria, que se imprime casa por casa.
  materias.forEach((m, i) => {
    const casa = CASAS[i]!;
    s += `<path class="disco__casa" style="--i:${i}" d="${arcoAnel(coroa, R, casa.inicio, casa.fim)}" fill="${m.chapa}"/>`;
  });
  // A Convocação: papel com hachura de 45°, sem amarelo, kraft ou dourado.
  s += `<g class="disco__casa" style="--i:6" clip-path="url(#${id}-conv)"><path d="${hachura()}" stroke="${CORES.hachura}" stroke-width="0.8"/></g>`;
  s += `<g class="disco__pintar">${revelada ? revelada.pintar : ''}</g>`;
  // As divisórias: o vão de papel entre as chapas e o fio fino do miolo.
  s += '<g class="disco__base">';
  for (const casa of CASAS) {
    const [x0, y0] = polar(G.miolo * R, casa.fim);
    const [x1, y1] = polar(coroa, casa.fim);
    const [x2, y2] = polar(R, casa.fim);
    s +=
      `<line x1="${P(x1)}" y1="${P(y1)}" x2="${P(x2)}" y2="${P(y2)}" stroke="${CORES.folha}" stroke-width="2.6"/>` +
      `<line x1="${P(x0)}" y1="${P(y0)}" x2="${P(x1)}" y2="${P(y1)}" stroke="${CORES.miolo}" stroke-width="1"/>`;
  }
  s +=
    `<circle cx="${C}" cy="${C}" r="${P(coroa)}" fill="none" stroke="${CORES.aro}" stroke-width="1"/>` +
    `<circle cx="${C}" cy="${C}" r="${R - 1}" fill="none" stroke="${CORES.tinta}" stroke-width="2"/></g>`;
  // As siglas, de pé, em tinta (o papel não gira).
  materias.forEach((m, i) => {
    const [x, y] = polar(G.sigla * R, CASAS[i]!.centro);
    s +=
      `<text class="disco__casa disco__sigla" style="--i:${i}" x="${P(x)}" y="${P(y + corpo * 0.36)}" text-anchor="middle" ` +
      `font-family="League Gothic, 'Arial Narrow', sans-serif" font-size="${corpo}" letter-spacing="0.5" fill="${CORES.tinta}">${m.sigla}</text>`;
  });
  const [ex, ey] = polar(G.sigla * R, conv.centro);
  s += envelope(ex, ey);
  s += `<g class="disco__apagar" fill="${CORES.folha}" opacity="${revelada ? '0.6' : '0'}">${revelada ? revelada.apagar : ''}</g>`;
  s +=
    `<g class="disco__circulo" fill="none" stroke="${CORES.caneta}" stroke-linecap="round" stroke-linejoin="round"` +
    `${revelada ? ` transform="${revelada.transform}"` : ''}>${revelada ? revelada.circulo : ''}</g>`;
  // O pivô: o disco de tinta e a bolinha da marca.
  s +=
    `<g class="disco__base"><circle cx="${C}" cy="${C}" r="${P(G.pivo * D)}" fill="${CORES.tinta}"/>` +
    `<circle cx="${C}" cy="${C}" r="${P(G.pivo * D - 3)}" fill="none" stroke="${CORES.luzDoPivo}" stroke-width="1"/></g>`;
  s += `<g class="disco__sombra" transform="translate(1.5 2) rotate(${P(angulo)} ${C} ${C})">${caneta(true)}</g>`;
  s += `<g class="disco__caneta" transform="rotate(${P(angulo)} ${C} ${C})">${caneta(false)}</g>`;
  return `${s}</svg>`;
}
