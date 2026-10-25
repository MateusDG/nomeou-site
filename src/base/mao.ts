// A mão do app no site: os gestos da margem (a geometria do app, com semente) e o carimbo da repartição.
//
// GESTOS (os tempos da mão, iguais aos do app):
//   circular escolha/total  caneta      280 ms, linear
//   riscar   erro           vermelho    2 traços de 90 ms
//   ondular  pegadinha      vermelho    200 ms
//   visto    conferido      caneta      160 ms
//   seta     liga nota e fato caneta    200 + 80 ms
//   grifar   o que é seu    amarelo     220 ms por linha, por máscara
//   nota     a regra        lápis       30 caracteres por segundo, no máximo 700 ms
//   carimbo  o oficial      verde/tinta 1,25 → 0,97 em 110 ms (o contato) e a mola do carimbo
import * as Rabisco from '../gerado/geometria';
import type { Gesto, Limites, Ponto } from '../gerado/geometria';
import { doc, esc, proximoQuadro } from './dom';
import * as Movimento from './movimento';

export const COR = {
  tinta: '#16161B',
  folha: '#FAF8F3',
  caneta: '#2346C8',
  vermelho: '#BF2A1D',
  amarelo: '#FFD21A',
  reticula: '#E3B200',
  verde: '#1C7745',
  lapis: '#4F4B45',
} as const;

const SVG = 'http://www.w3.org/2000/svg';
const calmo = (): boolean => Movimento.perfil() === 'calmo';

// ------------------------------------------------------------------ O carimbo (Carimbo.tsx)

let medidor: CanvasRenderingContext2D | null = null;
function medir(texto: string, fonte: string): number {
  medidor ??= doc.createElement('canvas').getContext('2d');
  if (!medidor) return texto.length * 11;
  medidor.font = fonte;
  return medidor.measureText(texto).width;
}

let contador = 0;
export interface OpcoesDoCarimbo {
  cor?: string;
  semente?: number;
  giro?: number;
}

/** O carimbo: League Gothic, borda dupla de cantos vivos e a tinta falhada (máscara). Devolve o SVG em texto. */
export function carimbo(texto: string, opcoes: OpcoesDoCarimbo = {}): string {
  const cor = opcoes.cor ?? COR.tinta;
  const corpo = 25;
  const letras = texto.toLocaleUpperCase('pt-BR');
  const ls = corpo * 0.06;
  const larguraDoTexto = medir(letras, `${corpo}px "League Gothic"`) + ls * letras.length;
  const BORDA = 1.2 + 2 + 2.5;
  const W = Math.ceil(larguraDoTexto + 2 * (BORDA + 10));
  const H = Math.ceil(corpo * 1.08 + 2 * (BORDA + 3));
  const base = BORDA + 3 + 0.9075 * corpo;
  const falhas = Rabisco.falhasDaTinta(W, H, opcoes.semente ?? Rabisco.sementeDoTexto(letras), 1.2);
  const meio = BORDA - 2.5 / 2;
  const id = `carimbo-${++contador}`;
  return (
    `<svg class="carimbo" viewBox="0 0 ${W} ${H}" aria-hidden="true" style="--giro:${opcoes.giro ?? -3}deg">` +
    `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="#fff"/>` +
    `<path d="${falhas.buracos}" fill="#000"/><path d="${falhas.meios}" fill="#000" fill-opacity="0.55"/>` +
    `<path d="${falhas.riscos}" stroke="#000" stroke-width="0.7" stroke-opacity="0.8" fill="none"/></mask></defs>` +
    `<g mask="url(#${id})" opacity="0.94">` +
    `<rect x="0.6" y="0.6" width="${W - 1.2}" height="${H - 1.2}" fill="none" stroke="${cor}" stroke-width="1.2"/>` +
    `<rect x="${meio}" y="${meio}" width="${W - 2 * meio}" height="${H - 2 * meio}" fill="none" stroke="${cor}" stroke-width="2.5"/>` +
    `<text x="${W / 2 + ls / 2}" y="${base}" text-anchor="middle" fill="${cor}" font-family="League Gothic, 'Arial Narrow', sans-serif" font-size="${corpo}" letter-spacing="${ls}">${esc(letras)}</text>` +
    '</g></svg>'
  );
}

/** Bate o carimbo num lugar: o que havia sai, o novo cai e encosta aos 110 ms (`aoContato`: o som). */
export function bater(
  lugar: HTMLElement,
  texto: string,
  cor: string,
  opcoes: OpcoesDoCarimbo & { animar?: boolean; atraso?: number; aoContato?: () => void } = {},
): Promise<void> {
  lugar.innerHTML = carimbo(texto, { cor, ...opcoes });
  lugar.style.opacity = '1';
  const svg = lugar.firstElementChild as SVGElement;
  if (opcoes.animar === false) return Promise.resolve();
  return Movimento.bater(svg, { atraso: opcoes.atraso ?? 0, ...(opcoes.aoContato ? { aoContato: opcoes.aoContato } : {}) });
}

// ------------------------------------------------------------------ O traço (strokeDashoffset)

function svgNo(x: number, y: number, limites: Limites, classe = 'rabisco'): SVGSVGElement {
  const s = doc.createElementNS(SVG, 'svg');
  s.setAttribute('class', classe);
  s.setAttribute('viewBox', `${limites.x} ${limites.y} ${limites.largura} ${limites.altura}`);
  s.setAttribute('width', String(limites.largura));
  s.setAttribute('height', String(limites.altura));
  s.setAttribute('aria-hidden', 'true');
  s.style.left = `${x + limites.x}px`;
  s.style.top = `${y + limites.y}px`;
  return s;
}

/** Desenha os traços de um gesto na velocidade de uma mão, um depois do outro, a partir de `inicio` ms. */
function tracar(svg: SVGSVGElement, gesto: Gesto, cor: string, espessura: number, duracao: number, animar: boolean, comEco: boolean, inicio = 0): void {
  const porTraco = duracao / gesto.tracos.length;
  gesto.tracos.forEach((d, i) => {
    for (const eco of comEco ? [true, false] : [false]) {
      const p = doc.createElementNS(SVG, 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', cor);
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      p.setAttribute('stroke-width', String(eco ? espessura * Rabisco.ECO.espessura : espessura));
      if (eco) {
        p.setAttribute('opacity', String(Rabisco.ECO.opacidade));
        p.setAttribute('transform', `translate(${Rabisco.ECO.dx} ${Rabisco.ECO.dy})`);
      }
      const L = gesto.comprimentos[i]!;
      if (animar) {
        p.style.strokeDasharray = `${L} ${L}`;
        p.style.strokeDashoffset = String(L);
        p.style.transition = `stroke-dashoffset ${Math.round(porTraco)}ms linear ${Math.round(inicio + i * porTraco)}ms`;
      }
      svg.appendChild(p);
      if (animar) proximoQuadro(() => (p.style.strokeDashoffset = '0'));
    }
  });
}

interface Retangulo {
  left: number;
  top: number;
  right: number;
  width: number;
  height: number;
}

/** A caixa de um elemento sem o deslocamento da entrada (a palavra pode estar subindo da máscara). */
export function semDeslocamento(el: Element): Retangulo {
  const r = el.getBoundingClientRect();
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none' || typeof DOMMatrixReadOnly === 'undefined') return r;
  const m = new DOMMatrixReadOnly(t);
  return { left: r.left - m.m41, top: r.top - m.m42, right: r.right - m.m41, width: r.width, height: r.height };
}

/** As linhas de um texto, em caixas relativas ao contêiner (o grifo e o risco vão linha por linha). */
function linhasDe(el: Element, conteiner: Element): Retangulo[] {
  const palavras = Array.from(el.querySelectorAll('.m > span'));
  const faixa = doc.createRange();
  faixa.selectNodeContents(el);
  const retangulos: Retangulo[] = palavras.length ? palavras.map(semDeslocamento) : Array.from(faixa.getClientRects());
  const base = conteiner.getBoundingClientRect();
  const caixas: Retangulo[] = [];
  for (const r of retangulos) {
    if (r.width < 2) continue;
    const ultima = caixas[caixas.length - 1];
    if (ultima && Math.abs(ultima.top - (r.top - base.top)) < r.height * 0.5) {
      ultima.right = Math.max(ultima.right, r.right - base.left);
      ultima.left = Math.min(ultima.left, r.left - base.left);
      ultima.width = ultima.right - ultima.left;
      continue;
    }
    caixas.push({ left: r.left - base.left, top: r.top - base.top, right: r.right - base.left, width: r.width, height: r.height });
  }
  return caixas;
}

// ------------------------------------------------------------------ Os gestos

interface OpcoesDoGesto {
  conteiner?: Element;
  animar?: boolean;
  atraso?: number;
}

/** O grifo amarelo atrás do texto, correndo da esquerda para a direita (RoloDeTinta). */
export function grifar(alvo: HTMLElement, opcoes: OpcoesDoGesto = {}): SVGSVGElement[] {
  const conteiner = opcoes.conteiner ?? alvo;
  const atraso = opcoes.atraso ?? 0;
  const corpo = parseFloat(getComputedStyle(alvo).fontSize);
  const duracao = calmo() ? 120 : 220;
  return linhasDe(alvo, conteiner).map((c, n) => {
    const base = c.top + c.height * 0.5 + corpo * 0.33;
    const mancha = Rabisco.grifar(c.width + corpo * 0.12, corpo * 0.8, Rabisco.sementeDoTexto(alvo.textContent ?? '') + n);
    const s = svgNo(c.left - corpo * 0.06, base - corpo * 0.74, mancha.limites, 'grifo');
    s.innerHTML = `<path d="${mancha.d}" fill="${COR.amarelo}"/><path d="${mancha.reforco}" fill="${COR.reticula}" opacity="0.4"/>`;
    if (opcoes.animar !== false) {
      s.style.clipPath = 'inset(0 100% 0 0)';
      s.style.transition = `clip-path ${duracao}ms linear ${atraso + n * duracao}ms`;
      proximoQuadro(() => (s.style.clipPath = 'inset(0 0 0 0)'));
    }
    conteiner.appendChild(s);
    return s;
  });
}

/** O risco vermelho: 2 traços de 90 ms por linha, medido no contêiner (o texto pode quebrar). */
export function riscar(alvo: HTMLElement, opcoes: OpcoesDoGesto & { cor?: string } = {}): void {
  const conteiner = opcoes.conteiner ?? alvo.parentElement!;
  const animar = opcoes.animar !== false && !calmo();
  linhasDe(alvo, conteiner).forEach((c, n) => {
    const gesto = Rabisco.riscar(c.width + 8, Rabisco.sementeDoTexto(alvo.textContent ?? '') + n);
    const s = svgNo(c.left - 4, c.top + c.height * 0.56, gesto.limites);
    conteiner.appendChild(s);
    tracar(s, gesto, opcoes.cor ?? COR.vermelho, Rabisco.ESPESSURAS.riscar * 1.4, 180, animar, false, (opcoes.atraso ?? 0) + n * 180);
  });
}

/** O ondulado vermelho sob o trecho da pegadinha (200 ms). */
export function ondular(alvo: HTMLElement, opcoes: OpcoesDoGesto = {}): void {
  const conteiner = opcoes.conteiner ?? alvo.parentElement!;
  const animar = opcoes.animar !== false && !calmo();
  linhasDe(alvo, conteiner).forEach((c, n) => {
    const gesto = Rabisco.ondular(c.width, Rabisco.sementeDoTexto(alvo.textContent ?? '') + n);
    const s = svgNo(c.left, c.top + c.height * 0.94, gesto.limites);
    conteiner.appendChild(s);
    tracar(s, gesto, COR.vermelho, Rabisco.ESPESSURAS.ondular, 200, animar, false, (opcoes.atraso ?? 0) + n * 200);
  });
}

/** O círculo de caneta em volta de um alvo (o total do Diário, o selo escolhido), por trás do texto. */
export function circular(alvo: Element, conteiner: Element, opcoes: OpcoesDoGesto & { cor?: string; espessura?: number; semente?: string } = {}): SVGSVGElement {
  const animar = opcoes.animar !== false && !calmo();
  const r = semDeslocamento(alvo);
  const b = conteiner.getBoundingClientRect();
  const espessura = opcoes.espessura ?? 3.2;
  const gesto = Rabisco.circular(r.width, r.height, Rabisco.sementeDoTexto(opcoes.semente ?? alvo.textContent ?? 'o'), espessura);
  const s = svgNo(r.left - b.left, r.top - b.top, gesto.limites, 'rabisco rabisco--atras');
  conteiner.appendChild(s);
  tracar(s, gesto, opcoes.cor ?? COR.caneta, espessura, 280, animar, true, opcoes.atraso ?? 0);
  return s;
}

/** O visto à caneta numa caixinha ou num botão (160 ms). */
export function visto(caixa: HTMLElement, opcoes: OpcoesDoGesto & { tamanho?: number; semente?: string; cor?: string } = {}): SVGSVGElement {
  const animar = opcoes.animar !== false && !calmo();
  const tamanho = opcoes.tamanho ?? caixa.getBoundingClientRect().width * 1.05;
  const gesto = Rabisco.visto(tamanho, Rabisco.sementeDoTexto(opcoes.semente ?? 'visto'));
  const s = svgNo(tamanho * -0.05, tamanho * -0.25, gesto.limites);
  caixa.appendChild(s);
  tracar(s, gesto, opcoes.cor ?? COR.caneta, Rabisco.ESPESSURAS.visto, 160, animar, true, opcoes.atraso ?? 0);
  return s;
}

/** A seta à mão de um ponto a outro (200 + 80 ms), em coordenadas do contêiner. */
export function seta(conteiner: Element, de: Ponto, para: Ponto, opcoes: OpcoesDoGesto & { cor?: string } = {}): SVGSVGElement {
  const animar = opcoes.animar !== false && !calmo();
  const gesto = Rabisco.seta(de, para, Rabisco.sementeDoTexto('seta'));
  const s = svgNo(0, 0, gesto.limites);
  conteiner.appendChild(s);
  tracar(s, gesto, opcoes.cor ?? COR.caneta, Rabisco.ESPESSURAS.seta, 280, animar, true, opcoes.atraso ?? 0);
  return s;
}

/** A nota a lápis escreve a 30 caracteres por segundo, em até 700 ms (NotaAMao), depois de `atraso`. */
export function escrever(nota: HTMLElement, atraso = 0): void {
  const duracao = Math.min(700, Math.round(((nota.textContent ?? '').length / 30) * 1000));
  nota.style.setProperty('--escrita', `${duracao}ms`);
  nota.classList.remove('is-escrita');
  const escrever = (): void => nota.classList.add('is-escrita');
  if (calmo() || !atraso) proximoQuadro(escrever);
  else setTimeout(escrever, atraso);
}

/** Tira os gestos desenhados num contêiner. */
export function apagar(conteiner: ParentNode, seletor = '.rabisco, .grifo'): void {
  conteiner.querySelectorAll(seletor).forEach((s) => s.remove());
}
