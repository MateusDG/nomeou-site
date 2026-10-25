// O som do site: a chave (desligada por padrão, lembrada em localStorage), o carregamento e a mesa de som do app
// (src/gerado/mesaDeSom.ts), que decide o que toca, quando e qual variante. Do disco (file://) o fetch falha e o som
// vai por <audio>. Nenhuma vibração: a web não vibra.
//
//   ligado()             a chave está ligada?
//   ligar(sim)           liga ou desliga e grava a preferência. Chame DENTRO do toque: é ele que destrava o áudio no
//                        iPhone. Ligar toca a bolha como amostra.
//   tocar(nome, opcoes)  pede um som pelo nome da mesa ('clique', 'bolha', 'toc'…; 'tique' gira tique1..3).
//   aoMudar(fn)          fn(ligado) a cada troca da chave (cabeçalho, rodapé, outra aba); devolve o desligar.
//
// O que a mesa já faz (e o site não repete): o teto de 2 eventos em 1,6 s, as categorias, o clique que espera 60 ms e
// cede ao som do mesmo gesto, o tique que não conta, nada em fila, o atrasado que cai.
import * as MesaDeSom from '../gerado/mesaDeSom';
import type { ArquivoDeSom, Mesa, Som as NomeDoSom } from '../gerado/mesaDeSom';
import { VOLUMES } from '../gerado/volumes';

const PREFERENCIAS = 'nomeou.preferencias.v1';
// A bolha da amostra espera o arquivo descer por até isto (ms): é a resposta ao toque na chave.
const ESPERA_DA_AMOSTRA = 1500;
// O <audio> que ainda toca ganha cópias para o mesmo arquivo se sobrepor (dois carimbos), até este total.
const COPIAS = 3;

// Os sons ficam em assets/sons, ao lado de assets/js: o caminho sai do próprio script (vale do disco e de qualquer pasta).
const BASE = (() => {
  try {
    return new URL('../sons/', (document.currentScript as HTMLScriptElement | null)?.src ?? location.href).href;
  } catch {
    return 'assets/sons/';
  }
})();
const Contexto: typeof AudioContext | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
// Do disco o fetch falha: vai direto por <audio>, sem tentar (e sem erro no console).
let modo: 'audio' | 'webaudio' = location.protocol === 'file:' || !Contexto ? 'audio' : 'webaudio';
const TIQUES = (Object.keys(MesaDeSom.CATEGORIA_DO_SOM) as NomeDoSom[]).filter((s) => MesaDeSom.CATEGORIA_DO_SOM[s] === 'tique' && s in VOLUMES);
const agora = (): number => performance.now();

// ------------------------------------------------------------------ A preferência

function lerPreferencias(): Record<string, unknown> {
  try {
    const p: unknown = JSON.parse(localStorage.getItem(PREFERENCIAS) ?? 'null');
    return p && typeof p === 'object' ? (p as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
/** Grava só o som: o resto do objeto (movimento, área) é de outros módulos. */
function gravar(sim: boolean): void {
  try {
    localStorage.setItem(PREFERENCIAS, JSON.stringify({ ...lerPreferencias(), som: sim }));
  } catch {
    // Sem storage, a chave vale só nesta visita.
  }
}

let ligadoAgora = lerPreferencias()['som'] === true;
const ouvintes: ((ligado: boolean) => void)[] = [];
function avisar(): void {
  for (const fn of ouvintes.slice()) {
    try {
      fn(ligadoAgora);
    } catch {
      // Um ouvinte quebrado não cala os outros.
    }
  }
}

// ------------------------------------------------------------------ O áudio

let ctx: AudioContext | null = null;
const ganhos: Partial<Record<string, GainNode>> = {};
let retomada: Promise<unknown> = Promise.resolve();
let resolverContexto: (c: AudioContext | null) => void = () => undefined;
const temContexto = new Promise<AudioContext | null>((ok) => (resolverContexto = ok));
/** Sobe a cada desligar: o que estava a caminho antes dele não toca. */
let geracao = 0;

/** O iPhone pede que o primeiro som saia dentro do toque; o silencioso cala o site, como no app. */
function destravar(): void {
  try {
    const sessao = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (sessao && sessao.type !== 'ambient') sessao.type = 'ambient';
  } catch {
    // Navegador sem a sessão de áudio: segue o padrão dele.
  }
  if (modo === 'webaudio' && !ctx && Contexto) {
    try {
      ctx = new Contexto();
    } catch {
      modo = 'audio'; // o navegador recusou o contexto: cada arquivo vai por <audio>
    }
    resolverContexto(ctx);
  }
  if (modo === 'audio' || !ctx) {
    carregar();
    escorvarTodos();
    marcarPronto();
    return;
  }
  if (ctx.state === 'running') {
    marcarPronto();
    return;
  }
  try {
    // O buffer mudo destrava o Safari antigo, que só solta o áudio depois de um som tocado no toque.
    const mudo = ctx.createBufferSource();
    mudo.buffer = ctx.createBuffer(1, 1, 22050);
    mudo.connect(ctx.destination);
    mudo.start(0);
  } catch {
    // Sem o buffer mudo, o resume abaixo basta nos navegadores de hoje.
  }
  retomada = ctx.resume().then(marcarPronto, () => undefined);
}

/** O áudio está pronto: a mesa solta o que espera (o que passou de 150 ms cai lá dentro). */
function marcarPronto(): void {
  if (!mesa.pronto) andar({ tipo: 'pronto', em: agora() });
}

function ganho(som: string): GainNode {
  let g = ganhos[som];
  if (!g && ctx) {
    g = ctx.createGain();
    g.gain.value = VOLUMES[som] ?? 0.3;
    g.connect(ctx.destination);
    ganhos[som] = g;
  }
  return g!;
}

// ------------------------------------------------------------------ Os arquivos

interface Arquivo {
  modo: 'audio' | 'webaudio';
  estado: 'baixando' | 'pronto';
  buffer?: AudioBuffer;
  elementos: (HTMLAudioElement & { escorvado?: boolean })[];
  promessa: Promise<unknown>;
}
const arquivos: Record<string, Arquivo> = {};

function decodificar(dados: ArrayBuffer): Promise<AudioBuffer> {
  return temContexto.then(
    (c) =>
      new Promise<AudioBuffer>((ok, falha) => {
        if (!c) return falha(new Error('sem contexto'));
        // O Safari antigo só aceita o retorno por função; os de hoje devolvem a promessa.
        const p = c.decodeAudioData(dados, ok, falha) as Promise<AudioBuffer> | undefined;
        p?.then(ok, falha);
      }),
  );
}

let faltaEscorvar = false;
function porElemento(a: Arquivo, url: string): void {
  a.modo = 'audio';
  const el = new Audio();
  el.preload = 'auto';
  el.src = url;
  a.elementos = [el];
  a.estado = 'pronto';
  faltaEscorvar = true;
}

// O Safari (e o Chrome com a política estrita) só deixa tocar depois o <audio> que já tocou dentro de um toque: no
// toque, cada elemento toca mudo e pausa logo. O som que chegar nesse meio assume o elemento.
function escorvar(el: HTMLAudioElement & { escorvado?: boolean }): void {
  if (el.escorvado) return;
  el.escorvado = true;
  el.muted = true;
  const fim = (): void => {
    if (!el.muted) return; // alguém assumiu o elemento
    el.pause();
    el.muted = false;
    try {
      el.currentTime = 0;
    } catch {
      // Ainda sem dados: o próximo play começa do zero de qualquer jeito.
    }
  };
  el.play().then(fim, () => {
    // Recusado (o toque não valeu): tenta de novo no próximo.
    el.muted = false;
    el.escorvado = false;
    faltaEscorvar = true;
  });
}
function escorvarTodos(): void {
  faltaEscorvar = false;
  for (const a of Object.values(arquivos)) if (a.modo === 'audio') a.elementos.forEach(escorvar);
}

/** Começa a descer um arquivo (uma vez só) e devolve a entrada dele. */
function baixar(arquivo: string): Arquivo {
  const ja = arquivos[arquivo];
  if (ja) return ja;
  const url = `${BASE}${arquivo}.wav`;
  const a: Arquivo = { modo, estado: 'baixando', elementos: [], promessa: Promise.resolve() };
  arquivos[arquivo] = a;
  if (modo === 'audio') porElemento(a, url);
  else {
    a.promessa = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.arrayBuffer();
      })
      .then(decodificar)
      .then(
        (buffer) => {
          a.buffer = buffer;
          a.estado = 'pronto';
        },
        () => porElemento(a, url), // o fetch ou a decodificação falhou: este arquivo vai por <audio>
      );
  }
  return a;
}

function arquivosDe(sons: readonly NomeDoSom[]): ArquivoDeSom[] {
  const lista: ArquivoDeSom[] = [];
  for (const s of sons) if (s in VOLUMES) for (const a of MesaDeSom.arquivosDoSom(s)) if (!lista.includes(a)) lista.push(a);
  return lista;
}

/** Primeiro os da abertura (o clique, a bolha, a folha, os tiques e o toc), depois o resto, na ordem do app. */
function carregar(): void {
  if (!ligadoAgora) return;
  const desta = geracao;
  const abertura = arquivosDe(MesaDeSom.SONS_DA_ABERTURA);
  const resto = arquivosDe(MesaDeSom.ORDEM_DO_PREPARO).filter((a) => !abertura.includes(a));
  // Por <audio>, todos nascem já, dentro do toque (para escorvar); o preload desce na ordem em que nasceram.
  if (modo === 'audio') {
    [...abertura, ...resto].forEach(baixar);
    return;
  }
  void Promise.all(abertura.map((a) => baixar(a).promessa)).then(() => {
    if (desta === geracao && ligadoAgora) resto.forEach(baixar);
  });
}

// ------------------------------------------------------------------ Tocar

function tocarJa(som: string, a: Arquivo): void {
  if (a.modo === 'webaudio') {
    // Contexto suspenso de novo (o sistema tomou o áudio): o som cai, em vez de sair junto com outros depois.
    if (!ctx || ctx.state !== 'running' || !a.buffer) return;
    const fonte = ctx.createBufferSource();
    fonte.buffer = a.buffer;
    fonte.connect(ganho(som));
    fonte.start(0);
    return;
  }
  // Um elemento livre (parado, no fim ou ainda escorvando, mudo); todos ocupados, uma cópia.
  let el = a.elementos.find((e) => e.paused || e.ended || e.muted) ?? null;
  if (!el) {
    el = a.elementos.length < COPIAS ? (a.elementos[0]!.cloneNode() as HTMLAudioElement) : a.elementos[0]!;
    if (el !== a.elementos[0]) a.elementos.push(el);
  }
  el.muted = false;
  el.volume = VOLUMES[som] ?? 0.3;
  try {
    el.currentTime = 0;
  } catch {
    // Ainda sem dados: começa do zero de qualquer jeito.
  }
  // O que escorvava já está tocando: desmutado, segue do começo sem outro play.
  if (el.paused || el.ended) el.play().catch(() => undefined);
}

/** O que a mesa soltou: toca já, ou espera o arquivo (e o contexto) por até 150 ms; mais tarde, cai. */
function soltar(som: string, arquivo: string): void {
  if (!ligadoAgora) return;
  const a = baixar(arquivo);
  if (a.estado === 'pronto' && (a.modo === 'audio' || ctx?.state === 'running')) {
    tocarJa(som, a);
    return;
  }
  const saiu = agora();
  const desta = geracao;
  void Promise.all([a.promessa, retomada]).then(() => {
    if (desta !== geracao || !ligadoAgora) return;
    if (a.estado !== 'pronto' || agora() - saiu > MesaDeSom.ESPERA_MAXIMA) return;
    tocarJa(som, a);
  });
}

// ------------------------------------------------------------------ A mesa

let mesa: Mesa = MesaDeSom.MESA_NOVA;
let relogio: number | null = null;
let atrasos: number[] = [];
// Os tiques do sorteio giram 1, 2, 3 (iguais, soariam como máquina), como o SONS_DO_TIQUE do app.
let vezDoTique = 0;

/** Leva um evento à mesa, toca o que ela solta e marca a hora do próximo passo, se ela pedir (o clique). */
function andar(evento: MesaDeSom.EventoDaMesa): void {
  try {
    const passo = MesaDeSom.passoDaMesa(mesa, evento);
    mesa = passo.mesa;
    for (const s of passo.saem) soltar(s.som, s.arquivo);
    if (relogio !== null) clearTimeout(relogio);
    relogio = null;
    if (passo.acordarEm !== undefined) {
      relogio = window.setTimeout(
        () => {
          relogio = null;
          andar({ tipo: 'hora', em: agora() });
        },
        Math.max(0, passo.acordarEm - agora()),
      );
    }
  } catch {
    // Som é enfeite: nunca pode quebrar a página.
  }
}

function pedir(nome: string): void {
  if (!ligadoAgora) return;
  let som = nome;
  if (som === 'tique' && TIQUES.length) som = TIQUES[vezDoTique++ % TIQUES.length]!;
  if (!(som in VOLUMES) || !(som in MesaDeSom.CATEGORIA_DO_SOM)) return;
  andar({ tipo: 'pedido', som: som as NomeDoSom, em: agora() });
}

/** Pede um som; `atraso` (ms) leva o pedido mais tarde. Devolve uma função que cancela o pedido atrasado. */
export function tocar(nome: string, opcoes: { atraso?: number } = {}): () => void {
  const atraso = opcoes.atraso && opcoes.atraso > 0 ? opcoes.atraso : 0;
  if (!atraso) {
    pedir(nome);
    return () => undefined;
  }
  if (!ligadoAgora) return () => undefined;
  const id = window.setTimeout(() => {
    atrasos = atrasos.filter((x) => x !== id);
    pedir(nome);
  }, atraso);
  atrasos.push(id);
  return () => {
    clearTimeout(id);
    atrasos = atrasos.filter((x) => x !== id);
  };
}

// ------------------------------------------------------------------ A chave

/** Desligado: os pedidos à espera e os atrasados caem, nada mais desce e o contexto solta o áudio. */
function calar(): void {
  geracao++;
  atrasos.forEach(clearTimeout);
  atrasos = [];
  if (relogio !== null) clearTimeout(relogio);
  relogio = null;
  mesa = { historico: mesa.historico, vezes: mesa.vezes, espera: [], pronto: mesa.pronto };
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => undefined);
}

/** A bolha de amostra, quando o arquivo dela descer (ou desistindo, depois de 1,5 s). */
function amostra(): void {
  const a = baixar(MesaDeSom.arquivoDoSom('bolha', mesa.vezes.bolha ?? 0));
  const desta = geracao;
  void Promise.race([Promise.all([a.promessa, retomada]), new Promise((ok) => setTimeout(ok, ESPERA_DA_AMOSTRA))]).then(() => {
    if (desta === geracao) pedir('bolha');
  });
}

export function ligado(): boolean {
  return ligadoAgora;
}

export function ligar(sim: boolean): void {
  const mudou = sim !== ligadoAgora;
  if (mudou) {
    ligadoAgora = sim;
    gravar(sim);
  }
  // Destrava já, dentro do toque, mesmo se a chave já estava ligada (o contexto pode ter sido suspenso).
  if (sim) destravar();
  if (!mudou) return;
  if (sim) {
    carregar();
    amostra();
  } else calar();
  avisar();
}

export function aoMudar(fn: (ligado: boolean) => void): () => void {
  ouvintes.push(fn);
  return () => {
    const i = ouvintes.indexOf(fn);
    if (i >= 0) ouvintes.splice(i, 1);
  };
}

/** Com a chave já ligada de outra visita, o primeiro toque destrava o áudio; outra aba que troca a chave, esta acompanha. */
export function iniciar(): void {
  for (const tipo of ['pointerdown', 'keydown', 'touchend', 'click']) {
    document.addEventListener(
      tipo,
      () => {
        if (!ligadoAgora) return;
        if (modo === 'webaudio' ? !ctx || ctx.state !== 'running' : !mesa.pronto) destravar();
        if (faltaEscorvar) escorvarTodos();
      },
      { capture: true, passive: true },
    );
  }
  window.addEventListener('storage', (e) => {
    if (e.key !== PREFERENCIAS && e.key !== null) return;
    const sim = lerPreferencias()['som'] === true;
    if (sim === ligadoAgora) return;
    ligadoAgora = sim;
    if (sim) carregar();
    else calar();
    avisar();
  });
  // Ligado de outra visita: os sons descem depois da página (o áudio só destrava no primeiro toque).
  if (ligadoAgora) {
    const depoisDaPagina = (): void => {
      if ('requestIdleCallback' in window) requestIdleCallback(carregar, { timeout: 2000 });
      else setTimeout(carregar, 0);
    };
    if (document.readyState === 'complete') depoisDaPagina();
    else window.addEventListener('load', depoisDaPagina);
  }
}
