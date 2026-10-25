// O motor de movimento do site (especificação, seção 6): as curvas e as molas do app, o pouso pelo peso do material,
// a batida, a folha que vira, o voo do selo, a rolagem programada, o número rolando, o registro e a composição. Tudo
// por element.animate(), só em transform, opacity e clip-path, uma vez e com causa: nada em laço, nenhum intervalo
// que se repete; requestAnimationFrame só na rolagem programada.
//
// PERFIS (perfil() e a classe no <html>):
//   completo  tudo anima
//   calmo     reduzir movimento (sistema ou rodapé): o estado final, na mesma ordem, por fade
//   fraco     aparelho fraco: o que vier com { secundario: true } entra pronto (só o protagonista anima)
//
// O ATOR (5.4): o pouso anima o .ator__corpo e a .ator__sombra, irmã dele, que em repouso fica em translate(2px, 2px)
// no CSS; quem aparece ganha a opacidade no .ator__pose. Toda primitiva devolve uma Promise que nunca rejeita.
import { MOLAS } from '../gerado/molas';

export type Perfil = 'completo' | 'calmo' | 'fraco';
export type Material = 'papel' | 'carta' | 'plastico' | 'madeira' | 'borracha' | 'cera' | 'impresso';
type Quadro = Keyframe & { easing?: string };

export interface OpcoesDaAnimacao {
  duracao?: number;
  atraso?: number;
  /** O nome de uma curva (assenta, caiQuad, molaToque...) ou o valor. */
  curva?: string;
  fill?: FillMode;
  /** No calmo: 'fade' (o estado final por fade, o padrão) ou 'fim' (salta). */
  calmo?: 'fade' | 'fim';
  fade?: number;
  /** No aparelho fraco, entra pronto. */
  secundario?: boolean;
  semQuadro?: boolean;
}

const raiz = document.documentElement;
const QUADRO = 16; // o will-change entra um quadro antes da animação

// ------------------------------------------------------------------ Curvas e molas (6.1, 6.2)

export const curvas: Record<string, string> = {
  assenta: 'cubic-bezier(.22,1,.36,1)',
  sai: 'cubic-bezier(.55,0,1,.45)',
  cai: 'cubic-bezier(.55,0,.9,.5)',
  caiQuad: 'cubic-bezier(.11,0,.5,0)',
  plana: 'cubic-bezier(.16,1,.3,1)',
  rola: 'cubic-bezier(.3,.7,.4,1)',
  virar: 'cubic-bezier(.65,0,.35,1)',
  fioAnda: 'cubic-bezier(.33,1,.68,1)',
  voo: 'cubic-bezier(.3,.7,.2,1)',
  linear: 'linear',
};

// Sem linear() (Safari antes do 17.2), a reserva, com a mesma duração: o el.animate() recusa a curva que não entende.
const RESERVA = 'cubic-bezier(.34,1.3,.64,1)';
const temLinear = (() => {
  try {
    return CSS.supports('transition-timing-function', 'linear(0, 1)');
  } catch {
    return false;
  }
})();
export const molas = {
  toque: { curva: temLinear ? MOLAS.toque.curva : RESERVA, ms: MOLAS.toque.ms },
  carimbo: { curva: temLinear ? MOLAS.carimbo.curva : RESERVA, ms: MOLAS.carimbo.ms },
};

/** Os tempos de 6.3 que o motor usa (ms). */
export const tempos = {
  papel: 420,
  quedaPlastico: 180,
  quedaMadeira: 110,
  contato: 110,
  folha: 440,
  voo: 560,
  rolagem: 600,
  digito: 420,
  entreDigitos: 60,
  registro: 180,
  palavra: 160,
  entrePalavras: 30,
  fade: 200,
  fadeFolha: 120,
  trava: 600,
};
/** Os tetos de 6.5. O motor só avisa no console; quem monta a cena é a página. */
const tetos = { naChegada: 4, total: 5000 };

/** O nome de uma curva (assenta, cai-quad, molaToque, mola-carimbo…) vira o valor; outro texto passa como está. */
export function curva(nome?: string): string {
  if (!nome) return 'linear';
  const k = nome.replace(/-(\w)/g, (_a, c: string) => c.toUpperCase()).replace(/^mola(\w)/, (_a, c: string) => c.toLowerCase());
  return curvas[k] ?? (k === 'toque' || k === 'carimbo' ? molas[k].curva : nome);
}

// ------------------------------------------------------------------ O perfil (6.9)

const CHAVE = 'nomeou.preferencias.v1';
const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
const conexao = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
let escolha: 'completo' | 'reduzido' | null = null; // sem storage (janela privada), a escolha do rodapé vive aqui
const ouvintes: ((agora: Perfil, antes: Perfil) => void)[] = [];

function prefs(): Record<string, unknown> {
  try {
    const o: unknown = JSON.parse(localStorage.getItem(CHAVE) ?? 'null');
    return o && typeof o === 'object' ? (o as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
/** O que o rodapé marca: 'completo' ou 'reduzido' (o sistema não entra aqui). */
export function preferencia(): 'completo' | 'reduzido' {
  return escolha ?? (prefs()['movimento'] === 'reduzido' ? 'reduzido' : 'completo');
}
function fraco(): boolean {
  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (memoria !== undefined && memoria <= 2) || !!conexao?.saveData;
}
function calcular(): Perfil {
  return reduzir?.matches || preferencia() === 'reduzido' ? 'calmo' : fraco() ? 'fraco' : 'completo';
}
let atual: Perfil = calcular();

function aplicar(): void {
  const antes = atual;
  atual = calcular();
  raiz.classList.toggle('calmo', atual === 'calmo');
  raiz.classList.toggle('fraco', fraco());
  if (antes === atual) return;
  if (atual === 'calmo') terminarTudo(); // quem pediu calma no meio de uma entrada não espera ela acabar
  for (const fn of ouvintes.slice()) {
    try {
      fn(atual, antes);
    } catch (erro) {
      setTimeout(() => {
        throw erro;
      });
    }
  }
}

export function perfil(): Perfil {
  return atual;
}

/** O sistema pede movimento reduzido (aí a escolha do rodapé não vale). */
export const sistemaReduz = (): boolean => !!reduzir?.matches;

/** A escolha do rodapé ("Movimento: Completo · Reduzido"), gravada junto das outras preferências. */
export function definirMovimento(valor: 'completo' | 'reduzido'): Perfil {
  escolha = valor;
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...prefs(), movimento: valor }));
  } catch {
    // Sem storage: fica em memória.
  }
  aplicar();
  return atual;
}

/** fn(perfilNovo, perfilAntigo) a cada troca. Devolve a função que desliga. */
export function aoMudarPerfil(fn: (agora: Perfil, antes: Perfil) => void): () => void {
  ouvintes.push(fn);
  return () => {
    const i = ouvintes.indexOf(fn);
    if (i >= 0) ouvintes.splice(i, 1);
  };
}

// ------------------------------------------------------------------ O embrulho do el.animate()

interface Criada {
  anim: Animation;
  atraso: number;
  fim: Promise<Animation>;
}

const ativas = new Set<Animation>(); // em curso (terminarTudo)
const doEl = new WeakMap<Element, Set<Animation>>(); // el -> as animações do motor que ainda valem nele (parar)
const vontades = new WeakMap<HTMLElement | SVGElement, { n: number; antes: string; props: Record<string, 1> }>(); // will-change
const esperas = new Set<{ soltar: () => void }>(); // atrasos por setTimeout (terminarTudo os solta)
const atores = new Map<Element, number>(); // objetos se mexendo agora (o teto de 6.5)
let saltarAte = 0; // logo depois de terminarTudo, o que nascer da cascata entra pronto
const avisos: Record<string, number> = {};
const PROPS: Record<string, string> = { transform: 'transform', opacity: 'opacity', clipPath: 'clip-path', translate: 'translate', rotate: 'rotate', scale: 'scale' };

const agora = (): number => performance.now();

function uma(fn?: () => void): () => void {
  let feito = false;
  return () => {
    if (feito || typeof fn !== 'function') return;
    feito = true;
    fn();
  };
}
function avisar(chave: string, texto: string): void {
  if (agora() - (avisos[chave] ?? -1e9) < 1000) return;
  avisos[chave] = agora();
  console.warn(`Movimento: ${texto}`);
}

/** setTimeout em Promise, que terminarTudo solta na hora. */
export function esperar(ms?: number): Promise<void> {
  return new Promise((ok) => {
    if (!(ms && ms > 0)) {
      ok();
      return;
    }
    const e = {
      soltar: (): void => {
        clearTimeout(id);
        esperas.delete(e);
        ok();
      },
    };
    const id = setTimeout(e.soltar, ms);
    esperas.add(e);
  });
}

function ligarVontade(el: HTMLElement | SVGElement, quadros: Quadro[]): void {
  const v = vontades.get(el) ?? { n: 0, antes: el.style.willChange, props: {} };
  vontades.set(el, v);
  v.n++;
  for (const q of quadros) for (const k in q) if (PROPS[k]) v.props[PROPS[k]!] = 1;
  el.style.willChange = Object.keys(v.props).join(', ');
}
function desligarVontade(el: HTMLElement | SVGElement): void {
  const v = vontades.get(el);
  if (!v || --v.n > 0) return;
  el.style.willChange = v.antes;
  if (el.getAttribute('style') === '') el.removeAttribute('style');
  vontades.delete(el);
}
function emCena(el: Element, d: number): void {
  const n = (atores.get(el) ?? 0) + d;
  if (n > 0) atores.set(el, n);
  else atores.delete(el);
  if (d > 0 && atores.size > tetos.naChegada) avisar('teto', `${atores.size} objetos se mexendo juntos (o teto é 3; 4 só na chegada da abertura).`);
}

/** 'anima', 'fade' (calmo: o estado final por fade) ou 'fim' (salta: calmo 'fim', fraco com secundario, terminarTudo). */
function modoDe(o: OpcoesDaAnimacao): 'anima' | 'fade' | 'fim' {
  if (agora() < saltarAte) return 'fim';
  if (atual === 'calmo') return o.calmo === 'fim' ? 'fim' : 'fade';
  return atual === 'fraco' && o.secundario ? 'fim' : 'anima';
}

/** Cria a animação com o will-change e o registro, ou null. */
function criar(el: HTMLElement | SVGElement | null, quadros: Quadro[], o: OpcoesDaAnimacao): Criada | null {
  if (!el || !el.animate) return null;
  let atraso = Math.max(0, o.atraso ?? 0);
  const duracao = o.duracao ?? 400;
  if (atraso + duracao > tetos.total) avisar('total', `uma animação passa de 5 s (${Math.round(atraso + duracao)} ms).`);
  if (!vontades.has(el) && atraso < QUADRO && !o.semQuadro) atraso = QUADRO;
  const valores = quadros.map((q) => (q.easing ? { ...q, easing: curva(q.easing) } : q));
  ligarVontade(el, quadros);
  let anim: Animation;
  try {
    anim = el.animate(valores, { duration: duracao, delay: atraso, easing: curva(o.curva), fill: o.fill ?? 'backwards' });
  } catch (erro) {
    desligarVontade(el);
    avisar('animate', `el.animate recusou os quadros (${(erro as Error).message}).`);
    return null;
  }
  const deste = doEl.get(el) ?? new Set<Animation>();
  doEl.set(el, deste);
  deste.add(anim);
  ativas.add(anim);
  const esquecer = (): void => {
    deste.delete(anim);
  };
  const acabar = (): Animation => {
    ativas.delete(anim);
    desligarVontade(el);
    // Quem mantém o último quadro segue valendo no elemento: parar() ainda precisa achá-la.
    if (/forwards|both/.test(o.fill ?? '') && anim.playState === 'finished') {
      anim.addEventListener('cancel', esquecer);
      anim.addEventListener('remove', esquecer);
    } else esquecer();
    return anim;
  };
  return { anim, atraso, fim: anim.finished.then(acabar, acabar) };
}
function promessa(c: Criada | null): Promise<unknown> {
  return c ? c.fim : Promise.resolve(null);
}
function fade(el: HTMLElement | SVGElement | null, atraso?: number, ms?: number, sai?: boolean): Promise<unknown> {
  const q = sai ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }];
  return promessa(criar(el, q, { duracao: ms || tempos.fade, atraso: atraso ?? 0, fill: sai ? 'forwards' : 'backwards' }));
}
function finalDe(quadros: Quadro[]): Quadro {
  const fim: Quadro = {};
  for (const q of quadros) for (const k in q) if (!/^(offset|easing|composite)$/.test(k)) (fim as Record<string, unknown>)[k] = (q as Record<string, unknown>)[k];
  return fim;
}

/** animar(el, quadros, opções) → Promise. Curvas por nome (também no easing dos quadros); fill 'both' mantém o último quadro. */
export function animar(el: HTMLElement | SVGElement | null, quadros: Quadro[], o: OpcoesDaAnimacao = {}): Promise<unknown> {
  if (!el || !el.animate || !quadros.length) return Promise.resolve(null);
  const modo = modoDe(o);
  if (modo === 'anima') return promessa(criar(el, quadros, o));
  const fim = finalDe(quadros);
  const manter = /forwards|both/.test(o.fill ?? '');
  if (modo === 'fim') return manter ? promessa(criar(el, [fim, fim], { duracao: 0, fill: 'forwards', semQuadro: true })) : Promise.resolve(null);
  return promessa(criar(el, [{ ...fim, opacity: 0 }, fim], { duracao: o.fade ?? tempos.fade, atraso: o.atraso ?? 0, fill: manter ? 'both' : 'backwards' }));
}

/** Cancela as animações do motor no elemento (o estilo volta ao do CSS). */
export function parar(el: Element | null | undefined): void {
  const deste = el ? doEl.get(el) : undefined;
  if (deste) for (const a of [...deste]) a.cancel();
}

/** Leva ao estado final tudo o que o motor anima (a aba que volta, o perfil que vira calmo). */
export function terminarTudo(): void {
  saltarAte = agora() + 50;
  rolagem?.terminar();
  for (const e of [...esperas]) e.soltar();
  for (const a of [...ativas]) {
    try {
      a.finish();
    } catch {
      a.cancel();
    }
  }
}

/** fn no quadro em que a animação de c passa de ms (o contato): uma animação vazia com o mesmo início. */
function aoTempo(c: Criada, ms: number, fn: () => void): () => void {
  let marca: Animation | null = null;
  let id = 0;
  let desmarcado = false;
  try {
    marca = new Animation(new KeyframeEffect(null, [], { duration: ms }), document.timeline);
  } catch {
    marca = null; // sem KeyframeEffect: um setTimeout pelo currentTime
  }
  c.anim.ready.then(
    () => {
      if (desmarcado) return;
      if (!marca) id = window.setTimeout(fn, Math.max(0, ms - Number(c.anim.currentTime ?? 0)));
      else if (c.anim.startTime != null) {
        marca.startTime = c.anim.startTime;
        marca.finished.then(fn, () => undefined);
      }
    },
    () => undefined,
  );
  return () => {
    desmarcado = true;
    clearTimeout(id);
    marca?.cancel();
  };
}

/** O objeto em cena: o contato, o teto e o fim (aoContato sai uma vez, mesmo com a animação cortada). */
function encenar(el: Element, c: Criada | null, contato: number, aoContato: () => void, outras: Promise<unknown>[] = [], depois?: () => void): Promise<void> {
  if (!c) {
    aoContato();
    return Promise.resolve();
  }
  emCena(el, 1);
  const desmarcar = aoTempo(c, c.atraso + contato, aoContato);
  return Promise.all([c.fim, ...outras]).then(() => {
    desmarcar();
    depois?.();
    aoContato();
    emCena(el, -1);
  });
}

/** A transformação parada do elemento (o giro do carimbo), para a animação compor sobre ela. */
function baseDe(el: Element): string {
  const t = getComputedStyle(el).transform;
  return t && t !== 'none' ? `${t} ` : '';
}

// ------------------------------------------------------------------ A batida (6.3) e o pouso (6.4)

export interface OpcoesDaBatida extends OpcoesDaAnimacao {
  de?: number;
  aoContato?: () => void;
  aparecer?: boolean;
}

/** De `de` a 0,97 em 110 ms (cai-quad), o contato, e a mola do carimbo até 1. Compõe com a transformação do CSS. */
export function bater(el: HTMLElement | SVGElement | null, o: OpcoesDaBatida = {}): Promise<void> {
  const aoContato = uma(o.aoContato);
  const modo = el ? modoDe(o) : 'fim';
  parar(el);
  if (!el || modo === 'fim') {
    aoContato();
    return Promise.resolve();
  }
  if (modo === 'fade') return fade(el, o.atraso).then(aoContato);
  const base = baseDe(el);
  const total = tempos.contato + molas.carimbo.ms;
  const q: Quadro[] = [{ offset: 0, transform: `${base}scale(${o.de ?? 1.25})`, easing: 'caiQuad' }];
  if (o.aparecer !== false) q.push({ offset: 0, opacity: 0 }, { offset: 80 / total, opacity: 1 });
  q.push({ offset: tempos.contato / total, transform: `${base}scale(0.97)`, easing: 'molaCarimbo' }, { offset: 1, transform: `${base}scale(1)` });
  return encenar(el, criar(el, q, { duracao: total, atraso: o.atraso ?? 0 }), tempos.contato, aoContato);
}

interface PesoDoMaterial {
  queda: number;
  aparece: number;
  curva: string;
  mola?: 'toque' | 'carimbo';
  de: string;
  toca?: string;
  achata?: string;
  ate: string;
}
// A queda e o contato numa animação só (dois quadros no mesmo instante: o achatamento começa no contato).
const MATERIAIS: Record<string, PesoDoMaterial> = {
  papel: { queda: 420, aparece: 100, curva: 'plana', de: 'translateY(-16px) rotate(6deg) scale(1.04)', ate: 'translateY(0px) rotate(0deg) scale(1)' },
  // O envelope pousa com peso de carta: cai de mais alto e mais torto (7.10).
  carta: { queda: 440, aparece: 100, curva: 'plana', de: 'translateY(-40px) rotate(-6deg)', ate: 'translateY(0px) rotate(0deg)' },
  plastico: {
    queda: 180,
    mola: 'toque',
    aparece: 80,
    curva: 'cai',
    de: 'translateY(-20px) rotate(5deg) scaleY(1)',
    toca: 'translateY(0px) rotate(5deg) scaleY(1)',
    achata: 'translateY(0px) rotate(5deg) scaleY(0.96)',
    ate: 'translateY(0px) rotate(0deg) scaleY(1)',
  },
  madeira: {
    queda: 110,
    mola: 'carimbo',
    aparece: 80,
    curva: 'cai',
    de: 'translateY(-24px) scale(1, 1)',
    toca: 'translateY(0px) scale(1, 1)',
    achata: 'translateY(0px) scale(1.04, 0.92)',
    ate: 'translateY(0px) scale(1, 1)',
  },
};
MATERIAIS['borracha'] = MATERIAIS['madeira']!;

export interface OpcoesDoPouso extends OpcoesDaAnimacao {
  material?: Material;
  sombra?: HTMLElement | SVGElement | false;
  aparecer?: boolean;
  aoContato?: () => void;
}

/** A queda e o contato de 6.4, com a sombra irmã que se aproxima e a opacidade no .ator__pose. */
export function pousar(corpo: HTMLElement | null, o: OpcoesDoPouso = {}): Promise<void> {
  const material = o.material ?? 'papel';
  if (material === 'cera' || material === 'impresso') {
    return bater(corpo, { de: material === 'cera' ? 1.15 : 1.25, atraso: o.atraso ?? 0, ...(o.aoContato ? { aoContato: o.aoContato } : {}), ...(o.aparecer !== undefined ? { aparecer: o.aparecer } : {}) });
  }
  const aoContato = uma(o.aoContato);
  const m = MATERIAIS[material];
  if (!corpo || !m) {
    if (corpo) avisar('material', `material desconhecido: ${material}.`);
    aoContato();
    return Promise.resolve();
  }
  const pai = corpo.parentElement;
  const sombra = o.sombra === false ? null : o.sombra ?? pai?.querySelector<SVGElement>(':scope > .ator__sombra') ?? null;
  const pose = pai?.classList.contains('ator__pose') ? pai : null;
  const portador = o.aparecer === false ? null : pose ?? corpo;
  [corpo, sombra, pose].forEach(parar);
  const modo = modoDe(o);
  if (modo === 'fim') {
    aoContato();
    return Promise.resolve();
  }
  if (modo === 'fade') {
    if (!portador) return esperar(o.atraso).then(aoContato);
    return Promise.all([portador, portador === corpo ? sombra : null].map((el) => el && fade(el, o.atraso))).then(aoContato);
  }
  const b = baseDe(corpo);
  const total = m.queda + (m.mola ? molas[m.mola].ms : 0);
  const toca = m.queda / total;
  const q: Quadro[] = m.mola
    ? [
        { offset: 0, transform: b + m.de, easing: m.curva },
        { offset: toca, transform: b + m.toca },
        { offset: toca, transform: b + m.achata, easing: `mola-${m.mola}` },
        { offset: 1, transform: b + m.ate },
      ]
    : [
        { transform: b + m.de, easing: m.curva },
        { transform: b + m.ate },
      ];
  const origem = corpo.style.transformOrigin;
  if (m.mola) corpo.style.transformOrigin = '50% 100%'; // achata e endireita sobre o pé
  const c = criar(corpo, q, { duracao: total, atraso: o.atraso ?? 0 });
  const junto: OpcoesDaAnimacao = { atraso: c ? c.atraso : 0, semQuadro: true };
  const outras: Promise<unknown>[] = [];
  if (c && sombra) {
    // Sem a pose, a sombra também nasce do zero (a opacidade do corpo não a alcança).
    const longe: Quadro = { transform: 'translate(8px, 8px)', opacity: portador && !pose ? 0 : 0.45, easing: m.curva };
    outras.push(promessa(criar(sombra, [longe, { transform: 'translate(2px, 2px)', opacity: 1 }], { ...junto, duracao: m.queda })));
  }
  if (c && portador) outras.push(promessa(criar(portador, [{ opacity: 0 }, { opacity: 1 }], { ...junto, duracao: m.aparece })));
  return encenar(corpo, c, m.queda, aoContato, outras, () => {
    corpo.style.transformOrigin = origem;
  });
}

// ------------------------------------------------------------------ Os gestos de mesa (os brinquedos e os picos)

/** O datador bate de novo: antecipa (sobe 6 px em 160 ms), cai em 110 ms, achata e volta na mola do carimbo. */
export function carimbar(corpo: HTMLElement, o: { aoContato?: () => void } = {}): Promise<void> {
  const aoContato = uma(o.aoContato);
  const modo = modoDe({});
  if (modo !== 'anima') {
    aoContato();
    return Promise.resolve();
  }
  const total = 160 + 110 + molas.carimbo.ms;
  corpo.style.transformOrigin = '50% 100%';
  const c = criar(
    corpo,
    [
      { offset: 0, transform: 'translateY(0px) scale(1, 1)', easing: 'assenta' },
      { offset: 160 / total, transform: 'translateY(-6px) scale(1, 1)', easing: 'cai' },
      { offset: 270 / total, transform: 'translateY(0px) scale(1, 1)' },
      { offset: 270 / total, transform: 'translateY(0px) scale(1.04, 0.92)', easing: 'molaCarimbo' },
      { offset: 1, transform: 'translateY(0px) scale(1, 1)' },
    ],
    { duracao: total },
  );
  return encenar(corpo, c, 270, aoContato);
}

/**
 * O envelope abre (7.10): as metades do lacre se afastam (240 ms), a aba vira em escala chapada (300 ms, aos 60), o
 * ofício sobe de dentro (420 ms, aos 360) e o envelope desce e esmaece (240 ms, aos 600).
 */
export function abrirEnvelope(envelope: HTMLElement, oficio: HTMLElement): Promise<void> {
  const aba = envelope.querySelector<HTMLElement>('[data-aba]');
  const esquerda = envelope.querySelector<SVGElement>('.lacre--e');
  const direita = envelope.querySelector<SVGElement>('.lacre--d');
  oficio.hidden = false;
  if (modoDe({}) !== 'anima') {
    envelope.classList.add('is-virada');
    return fade(oficio).then(() => undefined);
  }
  const partes: Promise<unknown>[] = [
    animar(esquerda, [{ transform: 'none' }, { transform: 'translate(-1%, 0.9%) rotate(-14deg)' }], { duracao: 240, curva: 'fioAnda', fill: 'both' }),
    animar(direita, [{ transform: 'none' }, { transform: 'translate(1%, 1.2%) rotate(11deg)' }], { duracao: 240, curva: 'fioAnda', fill: 'both' }),
  ];
  if (aba) {
    partes.push(
      animar(aba, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duracao: 150, atraso: 60, curva: 'virar' }).then(() => {
        envelope.classList.add('is-virada');
        return animar(aba, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(-1)' }], { duracao: 150, curva: 'virar' });
      }),
    );
  }
  partes.push(
    animar(oficio, [{ transform: 'translateY(60%) rotate(2deg)', clipPath: 'inset(0 0 100% 0)' }, { transform: 'none', clipPath: 'inset(0 0 0 0)' }], { duracao: 420, atraso: 360, curva: 'assenta' }),
    animar(envelope, [{ translate: '0 0', opacity: 1 }, { translate: '0 24px', opacity: 0.3 }], { duracao: 240, atraso: 600, curva: 'assenta' }),
  );
  return Promise.all(partes).then(() => undefined);
}

/** O selo entra no ofício como carta dada: sobe 14 px e gira de ±8° até o repouso, na mola do toque. */
export function darCarta(el: HTMLElement): Promise<unknown> {
  const giro = Math.random() < 0.5 ? -8 : 8;
  return animar(el, [{ transform: `translateY(14px) rotate(${giro}deg)`, opacity: 0 }, { transform: 'none', opacity: 1, offset: 1 }], { duracao: molas.toque.ms, curva: 'molaToque' });
}

/** O selo se destaca da folha para voar: sobe 6 px, com a sombra a +3 (120 ms). */
export function destacar(el: HTMLElement): Promise<unknown> {
  return animar(el, [{ transform: 'none' }, { transform: 'translateY(-6px)' }], { duracao: 120, curva: 'assenta', fill: 'both', secundario: true });
}

/** A folhinha arranca pela costura: encolhe para cima, sobe 6 px e some (220 ms). */
export function arrancar(pagina: HTMLElement): Promise<unknown> {
  return animar(pagina, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-6px) scaleY(0)', opacity: 0 }], { duracao: 220, curva: 'sai', fill: 'forwards', calmo: 'fim' });
}

/** A xícara tilinta: gira 4° e volta na mola do toque. */
export function tilintar(corpo: HTMLElement): Promise<unknown> {
  return animar(corpo, [{ transform: 'rotate(4deg)' }, { transform: 'rotate(0deg)' }], { duracao: molas.toque.ms, curva: 'molaToque', secundario: true });
}

/**
 * A Bic entra rolando sobre as faces (7.2): 6 passos de 60°, cada vez mais lentos; o prisma gira trocando as faixas e o
 * corpo anda para a esquerda; o último passo passa um pouco e volta na mola do toque.
 */
export function rolarBic(ator: HTMLElement, o: { atraso?: number } = {}): Promise<unknown> {
  const corpo = ator.querySelector<HTMLElement>('.ator__corpo');
  const sombra = ator.querySelector<SVGElement>('.ator__sombra');
  if (!corpo) return Promise.resolve();
  const passos = [70, 80, 95, 115, 140, 180];
  const total = passos.reduce((a, b) => a + b, 0);
  const q: Quadro[] = [{ offset: 0, transform: 'translateX(60px)', opacity: 0, easing: 'rola' }];
  let t = 0;
  passos.forEach((ms, i) => {
    t += ms;
    const x = 60 - (i + 1) * 10;
    q.push({ offset: t / total, transform: `translateX(${i === passos.length - 1 ? -3.3 : x}px)`, opacity: 1, easing: 'rola' });
  });
  q[q.length - 1]!.easing = 'molaToque';
  q.push({ offset: 1, transform: 'translateX(0px)', opacity: 1 });
  // O prisma: o grupo das faces sobe uma faixa por passo (o desenho repete a cada 3, então ninguém vê a volta).
  const faces = ator.querySelector<SVGElement>('.bic__faces');
  if (faces) animar(faces, passos.map((_ms, i) => ({ transform: `translateY(${-((i + 1) % 3) * 6}px)` })), { duracao: total, atraso: o.atraso ?? 0, curva: 'linear' });
  if (sombra) animar(sombra, [{ opacity: 0 }, { opacity: 1 }], { duracao: 120, atraso: o.atraso ?? 0 });
  return animar(corpo, q, { duracao: total + 220, atraso: o.atraso ?? 0, calmo: 'fim' });
}

// ------------------------------------------------------------------ A folha que vira (7.11)

/** A folha em branco por cima do conteúdo novo encolhe presa à esquerda (440 ms, virar), com o fio de tinta na borda. */
export function virarFolha(folha: HTMLElement | null, o: OpcoesDaAnimacao = {}): Promise<void> {
  if (!folha) return Promise.resolve();
  const atraso = o.atraso ?? 0;
  const modo = modoDe(o);
  if (modo === 'fim') return Promise.resolve();
  const posicao = folha.style.position;
  if (getComputedStyle(folha).position === 'static') folha.style.position = 'relative';
  const cheio = 'position:absolute;left:0;top:0;height:100%;';
  const capa = document.createElement('div');
  capa.className = 'folha-virando';
  capa.setAttribute('aria-hidden', 'true');
  capa.style.cssText = `${cheio}width:100%;z-index:10;pointer-events:none;`;
  capa.innerHTML =
    `<div style="${cheio}width:100%;background:var(--folha,#FAF8F3);transform-origin:0 50%"></div>` +
    (modo === 'anima' ? `<div style="${cheio}width:1px;background:var(--tinta,#16161B)"></div>` : '');
  folha.appendChild(capa);
  const branco = capa.children[0] as HTMLElement;
  const fio = capa.children[1] as HTMLElement | undefined;
  const w = folha.clientWidth;
  const anim =
    modo === 'anima'
      ? [
          promessa(criar(branco, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duracao: tempos.folha, atraso, curva: 'virar', fill: 'both' })),
          promessa(criar(fio ?? null, [{ transform: `translateX(${w - 1}px)` }, { transform: 'translateX(-1px)' }], { duracao: tempos.folha, atraso, curva: 'virar', fill: 'both' })),
        ]
      : [fade(branco, atraso, tempos.fadeFolha, true)];
  let removida = false;
  const remover = (): void => {
    if (removida) return;
    removida = true;
    clearTimeout(seguranca);
    capa.remove();
    folha.style.position = posicao;
    emCena(folha, -1);
  };
  // Como no app: se os quadros atrasarem, o branco não fica por cima da questão.
  const seguranca = window.setTimeout(remover, atraso + (modo === 'anima' ? tempos.folha : tempos.fadeFolha) + 100 + QUADRO);
  emCena(folha, 1);
  return Promise.all(anim).then(remover);
}

// ------------------------------------------------------------------ O voo do selo (7.6)

/** O clone fixo pela Bézier quadrática (ápice 40 px acima da reta, 7 quadros, −6° a 0°, até a largura da casa, 560 ms). */
export function voar(origem: HTMLElement, destino: HTMLElement, o: { aoChegar?: () => void; aoContato?: () => void; atraso?: number } = {}): Promise<unknown> {
  const aoChegar = uma(o.aoChegar);
  const aoContato = uma(o.aoContato);
  return esperar(o.atraso).then(() => {
    const modo = modoDe({});
    const r0 = origem.getBoundingClientRect();
    const r1 = destino.getBoundingClientRect();
    if (modo !== 'anima' || !r0.width || !r1.width) {
      aoChegar();
      origem.style.opacity = '0';
      return fade(destino).then(aoContato);
    }
    const cs = getComputedStyle(origem);
    const clone = origem.cloneNode(true) as HTMLElement;
    // Sem ids repetidos: as referências do clone caem nos elementos da origem, que seguem na página.
    [clone, ...Array.from(clone.querySelectorAll('[id]'))].forEach((n) => n.removeAttribute('id'));
    clone.style.cssText += ';position:relative;left:0;top:0;margin:0;width:100%;height:100%;transform:none;opacity:1;';
    const caixa = document.createElement('div');
    caixa.className = 'voo-do-selo';
    caixa.setAttribute('aria-hidden', 'true');
    caixa.inert = true;
    caixa.style.cssText =
      `position:fixed;margin:0;padding:0;z-index:60;pointer-events:none;left:${r0.left}px;top:${r0.top}px;width:${r0.width}px;height:${r0.height}px;` +
      `color:${cs.color};font-family:${cs.fontFamily};`;
    caixa.appendChild(clone);
    document.body.appendChild(caixa);
    origem.style.opacity = '0';
    const x0 = r0.left + r0.width / 2;
    const y0 = r0.top + r0.height / 2;
    const x1 = r1.left + r1.width / 2;
    const y1 = r1.top + r1.height / 2;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2 - 80;
    const escala = r1.width / r0.width;
    const q: Quadro[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const u = 1 - t;
      q.push({
        offset: t,
        transform:
          `translate(${(u * u * x0 + 2 * u * t * cx + t * t * x1 - x0).toFixed(2)}px, ${(u * u * y0 + 2 * u * t * cy + t * t * y1 - y0).toFixed(2)}px) ` +
          `rotate(${(-6 + 6 * t).toFixed(2)}deg) scale(${(1 + (escala - 1) * t).toFixed(4)})`,
      });
    }
    emCena(caixa, 1);
    return promessa(criar(caixa, q, { duracao: tempos.voo, curva: 'voo', fill: 'both' })).then(() => {
      caixa.remove();
      emCena(caixa, -1);
      aoChegar();
      return bater(destino, { de: 1.15, aparecer: false, aoContato });
    });
  });
}

// ------------------------------------------------------------------ A rolagem programada (6.7)

let rolagem: { cancelar: () => void; terminar: () => void } | null = null;

function saltarPara(y: number): void {
  try {
    window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior });
  } catch {
    window.scrollTo(0, y);
  }
}
/** A inOut cúbica do app (o --virar é a aproximação dela em cubic-bezier). */
const virarJs = (p: number): number => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(2 - 2 * p, 3) / 2);

/**
 * 600 ms na inOut cúbica, por rAF; roda, toque, tecla ou outra rolagem cancelam (false). Já na tela, não rola; calmo
 * ou tela baixa, salta. Ao chegar, foco na manchete (tabindex="-1") e depois().
 */
export function rolarAte(alvo: HTMLElement | string | null, o: { depois?: () => void; focar?: boolean | HTMLElement; margem?: number; centro?: boolean } = {}): Promise<boolean> {
  const el = typeof alvo === 'string' ? document.querySelector<HTMLElement>(alvo) : alvo;
  rolagem?.cancelar();
  if (!el) return Promise.resolve(false);
  const margem = o.margem ?? (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
  const destino = (): number => {
    const r = el.getBoundingClientRect();
    const y = scrollY + (o.centro ? r.top + r.height / 2 - innerHeight / 2 : r.top - margem);
    return Math.round(Math.max(0, Math.min((document.scrollingElement ?? raiz).scrollHeight - innerHeight, y)));
  };
  const chegar = (): boolean => {
    if (o.focar) {
      const foco = o.focar instanceof HTMLElement ? o.focar : /^H[1-6]$/.test(el.tagName) ? el : el.querySelector<HTMLElement>('h1, h2, h3') ?? el;
      if (!foco.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(foco.tagName)) foco.setAttribute('tabindex', '-1');
      foco.focus({ preventScroll: true });
    }
    o.depois?.();
    return true;
  };
  // Já na tela: o alto abaixo do cabeçalho e o alvo inteiro à vista (ou, se é alto, o alto no quarto de cima).
  const r = el.getBoundingClientRect();
  const y0 = scrollY;
  if ((r.top >= margem - 2 && (r.bottom <= innerHeight + 2 || (!o.centro && r.top <= innerHeight / 4))) || Math.abs(destino() - y0) < 2) {
    return Promise.resolve(chegar());
  }
  if (atual === 'calmo' || innerHeight < 600) {
    saltarPara(destino());
    return Promise.resolve(chegar());
  }
  return new Promise((ok) => {
    const eventos = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const comportamento = raiz.style.scrollBehavior;
    raiz.style.scrollBehavior = 'auto'; // com scroll-behavior: smooth, cada passo viraria outra rolagem suave
    let t0: number | null = null;
    let ultimo = y0;
    let quadro = 0;
    const limpar = (): void => {
      for (const t of eventos) removeEventListener(t, cancelar, true);
      cancelAnimationFrame(quadro);
      raiz.style.scrollBehavior = comportamento;
      if (rolagem === estado) rolagem = null;
    };
    const cancelar = (): void => {
      limpar();
      ok(false);
    };
    const terminar = (): void => {
      limpar();
      saltarPara(destino());
      ok(chegar());
    };
    const passo = (t: number): void => {
      t0 ??= t;
      if (Math.abs(scrollY - ultimo) > 2) return cancelar(); // alguém rolou por fora (a barra, uma âncora)
      const p = (t - t0) / tempos.rolagem;
      if (p >= 1) return terminar();
      // O destino é relido a cada quadro: uma entrada acima pode ter mudado a página no caminho.
      window.scrollTo(0, y0 + (destino() - y0) * virarJs(p));
      ultimo = scrollY;
      quadro = requestAnimationFrame(passo);
    };
    for (const t of eventos) addEventListener(t, cancelar, { capture: true, passive: true });
    const estado = { cancelar, terminar };
    rolagem = estado;
    quadro = requestAnimationFrame(passo);
  });
}

// ------------------------------------------------------------------ O número rolando (6.3)

const numeros = new WeakMap<Element, string>();
const milhar = (n: number): string => String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const algarismos = (v: unknown): string => String(typeof v === 'number' ? milhar(v) : v ?? '').replace(/\D/g, '');

/** Uma célula por algarismo: a coluna de 0 a 9 corre do anterior ao novo (420 ms, 60 ms entre células). */
export function contar(el: HTMLElement | null, valor: number | string, o: OpcoesDaAnimacao & { de?: number | string; rotulo?: string } = {}): Promise<void> {
  if (!el) return Promise.resolve();
  const texto = typeof valor === 'number' ? milhar(valor) : valor;
  const novos = algarismos(texto);
  let antes = algarismos(o.de ?? numeros.get(el) ?? el.textContent);
  antes = (`${'0'.repeat(novos.length)}${antes}`).slice(-novos.length || novos.length);
  const cs = getComputedStyle(el);
  const h = parseFloat(cs.lineHeight) || Math.round(parseFloat(cs.fontSize) * 1.2);
  const casa = `display:inline-block;vertical-align:top;height:${h}px;line-height:${h}px;`;
  let html = '';
  let k = 0;
  for (const ch of texto) {
    if (/\d/.test(ch)) {
      let linhas = '';
      for (let d = 0; d <= 9; d++) linhas += `<span style="display:block;height:${h}px">${d}</span>`;
      html +=
        `<span style="${casa}overflow:hidden;text-align:center">` +
        `<span class="numero-rolando__coluna" data-de="${antes.charAt(k)}" style="display:block;transform:translateY(${-Number(novos.charAt(k++)) * 10}%)">${linhas}</span></span>`;
    } else html += `<span style="${casa}">${ch === ' ' ? '&nbsp;' : ch.replace(/[<&]/g, '')}</span>`;
  }
  parar(el);
  el.innerHTML =
    '<span style="position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap"></span>' +
    `<span class="numero-rolando" aria-hidden="true" style="white-space:nowrap">${html}</span>`;
  el.firstElementChild!.textContent = o.rotulo ?? texto;
  numeros.set(el, texto);
  const modo = modoDe(o);
  if (modo === 'fim') return Promise.resolve();
  if (modo === 'fade') return fade(el.lastElementChild as HTMLElement, o.atraso).then(() => undefined);
  const colunas = Array.from(el.querySelectorAll<HTMLElement>('.numero-rolando__coluna'));
  return Promise.all(
    colunas.map((coluna, j) => {
      const de = coluna.getAttribute('data-de') ?? '0';
      if (de === novos.charAt(j)) return null;
      return promessa(criar(coluna, [{ transform: `translateY(${-Number(de) * 10}%)` }, { transform: coluna.style.transform }], { duracao: tempos.digito, atraso: (o.atraso ?? 0) + j * tempos.entreDigitos, curva: 'assenta' }));
    }),
  ).then(() => undefined);
}

// ------------------------------------------------------------------ O registro e a composição (os picos)

/** El aparece no atraso e cópias em ciano e magenta, deslocadas, encaixam na tinta em 180 ms (fio-anda). */
export function registro(el: HTMLElement | null, o: OpcoesDaAnimacao & { deslocamento?: number } = {}): Promise<void> {
  if (!el) return Promise.resolve();
  parar(el);
  el.querySelectorAll('.registro__fantasma').forEach((f) => f.remove()); // de uma prensada cortada
  const modo = modoDe(o);
  if (modo === 'fim') return Promise.resolve();
  if (modo === 'fade') return fade(el, o.atraso).then(() => undefined);
  const d = o.deslocamento ?? 3;
  const cs = getComputedStyle(el);
  const antes = el.style.cssText;
  if (cs.position === 'static') el.style.position = 'relative';
  el.style.isolation = 'isolate'; // os fantasmas ficam atrás do texto e na frente do fundo
  const texto = Array.from(el.childNodes);
  const c = criar(el, [{ offset: 0, opacity: 0 }, { offset: 0.001, opacity: 1 }, { offset: 1, opacity: 1 }], { duracao: tempos.registro, atraso: o.atraso ?? 0 });
  const junto: OpcoesDaAnimacao = { duracao: tempos.registro, atraso: c ? c.atraso : 0, semQuadro: true, curva: 'fioAnda', fill: 'both' };
  const tintas: [string, number, number][] = [
    ['var(--ciano, #00A3E0)', -d, d / 3],
    ['var(--magenta, #E4007C)', d, -d / 3],
  ];
  const fins = tintas.map(([cor, dx, dy]) => {
    const s = document.createElement('span');
    s.className = 'registro__fantasma';
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText =
      'position:absolute;left:0;top:0;width:100%;height:100%;box-sizing:border-box;z-index:-1;pointer-events:none;user-select:none;display:block;' +
      `padding:${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft};color:${cor};-webkit-text-fill-color:${cor}`;
    for (const n of texto) {
      const copia = n.cloneNode(true);
      if (copia instanceof Element) [copia, ...Array.from(copia.querySelectorAll('[id]'))].forEach((x) => x.removeAttribute('id'));
      s.appendChild(copia);
    }
    el.appendChild(s);
    return { s, fim: promessa(criar(s, [{ transform: `translate(${dx}px, ${dy}px)`, opacity: 0.9 }, { transform: 'translate(0px, 0px)', opacity: 0 }], junto)) };
  });
  emCena(el, 1);
  return Promise.all([promessa(c), ...fins.map((f) => f.fim)]).then(() => {
    fins.forEach((f) => f.s.remove());
    el.style.cssText = antes;
    if (el.getAttribute('style') === '') el.removeAttribute('style');
    emCena(el, -1);
  });
}

/** Cada palavra sobe 4 px em 160 ms, uma a cada 30 ms, sem mola; no fim, volta a ser texto. */
export function compor(el: HTMLElement | null, o: OpcoesDaAnimacao = {}): Promise<void> {
  if (!el) return Promise.resolve();
  parar(el);
  const modo = modoDe(o);
  if (modo === 'fim') return Promise.resolve();
  if (modo === 'fade') return fade(el, o.atraso).then(() => undefined);
  const palavras: HTMLElement[] = [];
  const trocas: { texto: Text; partes: Node[] }[] = [];
  const andar = (no: Node): void => {
    for (const filho of Array.from(no.childNodes)) {
      if (filho.nodeType === 3 && /\S/.test(filho.nodeValue ?? '')) {
        const partes = (filho.nodeValue ?? '')
          .split(/(\s+)/)
          .filter(Boolean)
          .map((p): Node => {
            if (!/\S/.test(p)) return document.createTextNode(p);
            const s = document.createElement('span');
            s.className = 'palavra-composta';
            s.style.display = 'inline-block';
            s.textContent = p;
            palavras.push(s);
            return s;
          });
        for (const p of partes) no.insertBefore(p, filho);
        no.removeChild(filho);
        trocas.push({ texto: filho as Text, partes });
      } else if (filho instanceof HTMLElement) {
        const e = getComputedStyle(filho);
        if (e.position === 'absolute' || e.display === 'none') continue;
        if (e.display !== 'inline' || /^(INPUT|TEXTAREA|SELECT|BUTTON|IMG|SVG|CANVAS|VIDEO)$/i.test(filho.tagName)) palavras.push(filho);
        else andar(filho);
      }
    }
  };
  andar(el);
  return Promise.all(
    palavras.map((p, i) =>
      promessa(criar(p, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0px)' }], { duracao: tempos.palavra, atraso: (o.atraso ?? 0) + i * tempos.entrePalavras, curva: 'assenta' })),
    ),
  ).then(() => {
    // De volta ao texto corrido; se alguém trocou o texto no meio (o nome digitado), não mexe.
    for (const t of trocas) {
      const pai = t.partes[0]?.parentNode;
      if (!pai || !t.partes.every((p) => p.parentNode === pai)) continue;
      pai.insertBefore(t.texto, t.partes[0]!);
      t.partes.forEach((p) => (p as ChildNode).remove());
    }
  });
}

// ------------------------------------------------------------------ Partida

/** Põe o perfil no <html> e acompanha o sistema, a conexão e a aba que volta. */
export function iniciar(): void {
  aplicar();
  reduzir?.addEventListener?.('change', aplicar);
  conexao?.addEventListener?.('change', aplicar);
  // A aba que volta no meio de uma entrada: o que o motor animava vai ao estado final (6.6).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') terminarTudo();
  });
}
