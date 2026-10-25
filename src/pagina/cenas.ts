// O motor das cenas. Cada bloco da página é uma cena que toca uma vez, em dois tempos: a manchete (a cena entra,
// .is-in) e o objeto (o disco, a folha, o envelope, a grade...: .is-objeto, quando o próprio objeto aparece). Os
// atrasos do objeto contam a partir dele, para tudo acontecer com a pessoa olhando. O que ninguém viu entra
// parado (.is-pronta): rolagem rápida, âncora, recarga no meio, foco pelo teclado, bfcache, aba oculta.
import { $, $$, fontesOuTempo } from '../base/dom';
import * as Movimento from '../base/movimento';

export interface GestosDaCena {
  /** O que a cena desenha quando a manchete entra. */
  cena?: (cena: HTMLElement, animar: boolean) => void;
  /** O que desenha quando o objeto aparece. */
  objeto?: (cena: HTMLElement, animar: boolean) => void;
  /** Tira o que a cena desenhou (antes de redesenhar parado). */
  apagar?: (cena: HTMLElement, fase: 'cena' | 'objeto' | 'tudo') => void;
}

const registro = new Map<string, GestosDaCena>();
const timers = new Map<HTMLElement, number[]>();
const geracoes = new Map<HTMLElement, number>();
const objetosEsperando = new Set<HTMLElement>();
/** O observador das manchetes e o h2 que ele observa em cada cena (o Resultado remonta o dele). */
let observadorDeManchetes: IntersectionObserver | null = null;
const manchetesObservadas = new Map<HTMLElement, Element>();
let cenas: HTMLElement[] = [];
/** A rede de segurança do <head> já tirou a classe .js: a página fica como sem script (só as interações vivem). */
let tarde = false;

const calmo = (): boolean => Movimento.perfil() === 'calmo';
const nomeDe = (cena: HTMLElement): string => cena.dataset['cena'] ?? '';
const gestosDe = (cena: HTMLElement): GestosDaCena | undefined => registro.get(nomeDe(cena));

/** Registra o que uma cena faz além do CSS. */
export function registrar(nome: string, gestos: GestosDaCena): void {
  registro.set(nome, gestos);
}

export function cena(nome: string): HTMLElement | null {
  return $(`[data-cena="${nome}"]`);
}

export function estaTarde(): boolean {
  return tarde;
}

/** Agenda algo da entrada de uma cena; pronta(), o resize e as fontes cancelam o que ainda ia acontecer. */
export function agendar(cena: HTMLElement, ms: number, fn: () => void): void {
  // Sem atraso (o estado parado, reduzir movimento), desenha na hora: nada fica na fila para sair em dobro.
  if (!ms || calmo()) {
    fn();
    return;
  }
  const lista = timers.get(cena) ?? [];
  timers.set(cena, lista);
  const id = window.setTimeout(() => {
    const i = lista.indexOf(id);
    if (i >= 0) lista.splice(i, 1);
    fn();
  }, ms);
  lista.push(id);
}

function cancelar(cena: HTMLElement): void {
  (timers.get(cena) ?? []).forEach(clearTimeout);
  timers.set(cena, []);
}
function novaGeracao(cena: HTMLElement): number {
  const g = (geracoes.get(cena) ?? 0) + 1;
  geracoes.set(cena, g);
  return g;
}

/** Redesenha parado o que já foi desenhado, fase por fase (resize, fontes que chegaram tarde, pronta). */
function desenharParado(cena: HTMLElement): void {
  const gestos = gestosDe(cena);
  if (!gestos) return;
  const pronta = cena.dataset['estado'] === 'pronta';
  if (gestos.cena && (pronta || cena.classList.contains('is-in'))) {
    gestos.apagar?.(cena, 'cena');
    gestos.cena(cena, false);
  }
  if (gestos.objeto && (pronta || cena.classList.contains('is-objeto'))) {
    gestos.apagar?.(cena, 'objeto');
    gestos.objeto(cena, false);
  }
}

export function tocar(cena: HTMLElement): void {
  if (tarde || cena.dataset['estado']) return;
  cena.dataset['estado'] = 'tocando';
  cena.classList.add('is-in');
  const g = novaGeracao(cena);
  const gestos = gestosDe(cena);
  void fontesOuTempo(1500).then(() => {
    if (geracoes.get(cena) !== g) return;
    gestos?.cena?.(cena, !calmo());
  });
  if (objetosEsperando.has(cena)) {
    objetosEsperando.delete(cena);
    const gatilho = $('[data-gatilho]', cena);
    agendar(cena, Number(gatilho?.dataset['depois'] ?? 200), () => tocarObjeto(cena));
  }
}

export function tocarObjeto(cena: HTMLElement): void {
  if (tarde || cena.classList.contains('is-objeto') || cena.dataset['estado'] === 'pronta') return;
  if (cena.dataset['estado'] !== 'tocando') {
    objetosEsperando.add(cena);
    return;
  }
  cena.classList.add('is-objeto');
  const g = geracoes.get(cena);
  const gestos = gestosDe(cena);
  void fontesOuTempo(1500).then(() => {
    if (geracoes.get(cena) !== g) return;
    gestos?.objeto?.(cena, !calmo());
  });
}

/** O estado final, sem transição. */
export function pronta(cena: HTMLElement): void {
  if (tarde || cena.dataset['estado'] === 'pronta') return;
  cena.dataset['estado'] = 'pronta';
  objetosEsperando.delete(cena);
  cancelar(cena);
  const g = novaGeracao(cena);
  cena.classList.add('is-pronta', 'is-in', 'is-objeto');
  gestosDe(cena)?.apagar?.(cena, 'tudo');
  void fontesOuTempo(1500).then(() => {
    if (geracoes.get(cena) === g) desenharParado(cena);
  });
}

/** Refaz parado o que já está no lugar, quando a largura muda ou as fontes chegam depois dos gestos. */
function redesenhar(porResize: boolean): void {
  for (const c of cenas) {
    if (!c.dataset['estado']) continue;
    if (c.dataset['estado'] === 'tocando') {
      if (porResize) pronta(c);
      else if ((timers.get(c) ?? []).length === 0) desenharParado(c);
      continue;
    }
    desenharParado(c);
  }
}

/** A cena trocou o próprio h2 (um innerHTML por cima): o motor passa a observar o novo, se a cena ainda não entrou. */
export function trocouManchete(cena: HTMLElement): void {
  if (!observadorDeManchetes || cena.dataset['estado']) return;
  const antigo = manchetesObservadas.get(cena);
  if (antigo) observadorDeManchetes.unobserve(antigo);
  const novo = $('h2', cena);
  if (!novo) return;
  observadorDeManchetes.observe(novo);
  manchetesObservadas.set(cena, novo);
}

/**
 * A mudança conta na primeira vez que é vista (o useNaVolta do app): roda `fn` quando o elemento estiver 30% na
 * tela por 150 ms. Se já está, roda agora.
 */
export function quandoVisivel(el: Element, fn: () => void): void {
  const r = el.getBoundingClientRect();
  const visivel = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  if (visivel > Math.min(r.height, window.innerHeight) * 0.3 || !('IntersectionObserver' in window)) {
    fn();
    return;
  }
  let espera = 0;
  const observador = new IntersectionObserver(
    (entradas) => {
      const e = entradas[0];
      clearTimeout(espera);
      if (!e?.isIntersecting) return;
      espera = window.setTimeout(() => {
        observador.disconnect();
        fn();
      }, 150);
    },
    { threshold: 0.3 },
  );
  observador.observe(el);
}

/** Liga tudo: as manchetes, os objetos, a abertura, o resize, as fontes, o teclado, o bfcache e a aba oculta. */
export function iniciar(opcoes: { tarde: boolean }): void {
  tarde = opcoes.tarde;
  cenas = $$('.cena');
  if (tarde) return;
  const abertura = cena('abertura');
  if (calmo() || !('IntersectionObserver' in window)) {
    cenas.forEach(pronta);
  } else {
    const esperas = new Map<Element, number>();
    // A margem de cima é enorme: o que fica acima da tela conta como interseção, e a posição decide. Assim o que
    // passou pelo alto (rolagem rápida, âncora, o trilho do cabeçalho) entra pronto, nunca vazio.
    const aoVer = (entradas: IntersectionObserverEntry[], observador: IntersectionObserver): void => {
      for (const e of entradas) {
        const alvo = e.target as HTMLElement;
        const c = alvo.closest<HTMLElement>('.cena');
        if (!c) continue;
        const ehObjeto = alvo.hasAttribute('data-gatilho');
        clearTimeout(esperas.get(alvo));
        if (c.dataset['estado'] === 'pronta') {
          observador.unobserve(alvo);
          continue;
        }
        if (!e.isIntersecting) continue;
        if (e.boundingClientRect.bottom < 0) {
          observador.unobserve(alvo);
          pronta(c);
          continue;
        }
        // Parar um instante na tela: quem passa rolando não dispara nada.
        esperas.set(
          alvo,
          window.setTimeout(
            () => {
              observador.unobserve(alvo);
              if (alvo.getBoundingClientRect().bottom < 0) pronta(c);
              else if (ehObjeto) tocarObjeto(c);
              else tocar(c);
            },
            ehObjeto ? 150 : 300,
          ),
        );
      }
    };
    const manchetes = new IntersectionObserver(aoVer, { rootMargin: '100000px 0px -25% 0px', threshold: 0 });
    observadorDeManchetes = manchetes;
    const objetos = new IntersectionObserver(aoVer, { rootMargin: '100000px 0px -15% 0px', threshold: 0 });
    for (const c of cenas) {
      if (c === abertura || c.dataset['estado']) continue;
      const titulo = $('h2', c);
      const gatilho = $('[data-gatilho]', c);
      if (titulo) {
        manchetes.observe(titulo);
        manchetesObservadas.set(c, titulo);
      }
      if (gatilho) objetos.observe(gatilho);
    }
    // A abertura toca quando as fontes chegam, ou aos 600 ms; com a página já rolada mais de meia tela, entra pronta.
    if (abertura) {
      void fontesOuTempo(600).then(() => {
        if (window.scrollY > window.innerHeight * 0.5) pronta(abertura);
        else tocar(abertura);
      });
    }
  }

  let larguraAntes = window.innerWidth;
  let esperaDoResize = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === larguraAntes) return;
    larguraAntes = window.innerWidth;
    clearTimeout(esperaDoResize);
    esperaDoResize = window.setTimeout(() => redesenhar(true), 150);
  });
  document.fonts?.addEventListener?.('loadingdone', () => redesenhar(false));

  // Quem chega pelo teclado não espera a entrada: a cena que recebe o foco vai ao estado final.
  document.addEventListener('focusin', (e) => {
    const c = (e.target as Element).closest?.<HTMLElement>('.cena');
    if (c) pronta(c);
  });
  Movimento.aoMudarPerfil((perfil) => {
    if (perfil === 'calmo') cenas.forEach(pronta);
  });
  // De volta do bfcache ou de uma aba oculta, a cena que estava no meio da entrada termina parada.
  const terminarAsQueTocavam = (): void => cenas.filter((c) => c.dataset['estado'] === 'tocando').forEach(pronta);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) terminarAsQueTocavam();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') terminarAsQueTocavam();
  });
}

