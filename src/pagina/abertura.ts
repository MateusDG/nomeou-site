// A 1ª etapa, a abertura: a mesa de estudo que pousa em volta do disco e o sorteio da matéria com a física do
// app (ritmoRoleta.ts). Três jeitos de sortear: o botão, o toque no disco ou o peteleco na caneta. Depois da
// revelação, o botão vira "Responder a questão" (ou "Abrir a convocação"), e só esse segundo toque rola a página.
import { $, $$, anunciar, proximoQuadro } from '../base/dom';
import * as Disco from '../base/disco';
import * as Rabisco from '../gerado/geometria';
import * as Mao from '../base/mao';
import * as Movimento from '../base/movimento';
import { dataDoCarimbo, foto34, selo } from '../base/pecas';
import * as Rodada from '../base/rodada';
import * as Som from '../base/som';
import { roleta } from '../dados';
import type { Materia } from '../tipos';
import * as Cenas from './cenas';

// ------------------------------------------------------------------ A física do sorteio (ritmoRoleta.ts)

const PICO = 1.25;
const ANTECIPACAO = { graus: -6, ms: 90 };
const RAMPA = 60;
const IMPULSO = { primeiro: 250, seguido: 200 };
const FREIO = { primeiro: 1300, seguido: 950 };
const ASSENTAR = 120;
const DESVIO_MAX = 0.25;
const JANELA_SEGUIDO = 45000;
const REPOUSO = -5;
const PRETENSAO = -4;
const TIQUES = 7;

type Ritmo = 'primeiro' | 'seguido';

const mod = (a: number, n: number): number => ((a % n) + n) % n;
const curvaDoFreio = (m: number) => (u: number): number => (m - 2) * u * u * u + (3 - 2 * m) * u * u + m * u;

/** O ângulo do freio: o número de voltas vem da força (do peteleco), dentro da janela do app. */
function thetaDoFreio(delta: number, w: number, Df: number, forca: number): number {
  const minimo = (w * Df) / 3;
  const maximo = (2 * w * Df) / 3;
  const preferido = minimo + forca * (maximo - minimo);
  let melhor = -1;
  for (let k = 0; k < 12; k++) {
    const t = 360 * k + delta;
    if (t >= minimo && t <= maximo && (melhor < 0 || Math.abs(t - preferido) < Math.abs(melhor - preferido))) melhor = t;
  }
  if (melhor >= 0) return melhor;
  return Math.max(delta, 360 * Math.round((preferido - delta) / 360) + delta);
}
function giroDoImpulso(ms: number, w: number): number {
  if (ms <= RAMPA) return (w * ms * ms * ms) / (3 * RAMPA * RAMPA);
  return (w * RAMPA) / 3 + w * (ms - RAMPA);
}

interface Plano {
  parada: number;
  final: number;
  inicioDoFreio: number;
  angulo: (t: number) => number;
}

/** O giro inteiro, do toque à parada: recuo, rampa, impulso e o freio que só desacelera. O peteleco não recua. */
function planoDoGiro(inicio: number, alvo: number, ritmo: Ritmo, forca: number, recuar: boolean): Plano {
  const w = PICO;
  const recuo = recuar ? ANTECIPACAO.ms : 0;
  const graus = recuar ? ANTECIPACAO.graus : 0;
  const inicioDoFreio = recuo + IMPULSO[ritmo];
  const Df = FREIO[ritmo];
  const noImpulso = (t: number): number => {
    if (recuo > 0 && t <= recuo) {
      const u = t / recuo;
      return inicio + graus * (1 - (1 - u) * (1 - u));
    }
    return inicio + graus + giroDoImpulso(t - recuo, w);
  };
  const anguloDoFreio = noImpulso(inicioDoFreio);
  const theta = thetaDoFreio(mod(alvo - anguloDoFreio, 360), w, Df, forca);
  const p = curvaDoFreio((w * Df) / theta);
  const final = anguloDoFreio + theta;
  const parada = inicioDoFreio + Df;
  return {
    parada,
    final,
    inicioDoFreio,
    angulo: (t) => (t <= inicioDoFreio ? noImpulso(t) : t >= parada ? final : anguloDoFreio + theta * p((t - inicioDoFreio) / Df)),
  };
}

function sortearCasa(): number {
  const r = Math.random();
  let acumulado = 0;
  for (let i = 0; i < Disco.CHANCES.length; i++) {
    acumulado += Disco.CHANCES[i]!;
    if (r < acumulado) return i;
  }
  return Disco.CHANCES.length - 1;
}

// ------------------------------------------------------------------ O estado da abertura

type ModoDoBotao = 'sortear' | 'responder' | 'convocacao';

let secao: HTMLElement;
let roda: HTMLElement;
let botao: HTMLButtonElement | null;
let viva: HTMLElement | null;
const sorteio = { estado: 'parado' as 'parado' | 'girando', angulo: REPOUSO, visivel: REPOUSO, ultimo: -Infinity, movimento: 0, modo: 'sortear' as ModoDoBotao };
let materiasDoDisco: Materia[] = [];

const calmo = (): boolean => Movimento.perfil() === 'calmo';

function poerCaneta(a: number): void {
  sorteio.visivel = a;
  const t = `rotate(${a.toFixed(2)} 150 150)`;
  $('.disco__caneta', roda)?.setAttribute('transform', t);
  $('.disco__sombra', roda)?.setAttribute('transform', `translate(1.5 2) ${t}`);
}

/** Leva a caneta de um ângulo a outro (saída cúbica). Um movimento novo cancela o anterior. */
function levarCaneta(para: number, ms: number): void {
  const de = sorteio.visivel;
  const este = ++sorteio.movimento;
  let inicio: number | null = null;
  const quadro = (t: number): void => {
    if (sorteio.movimento !== este) return;
    inicio ??= t;
    const u = Math.min(1, (t - inicio) / ms);
    poerCaneta(de + (para - de) * (1 - Math.pow(1 - u, 3)));
    if (u < 1) requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

function rotulo(modo: ModoDoBotao): string {
  return modo === 'responder' ? 'Responder a questão' : modo === 'convocacao' ? 'Abrir a convocação' : 'Sortear a matéria';
}
function definirModo(modo: ModoDoBotao): void {
  sorteio.modo = modo;
  if (!botao) return;
  botao.textContent = rotulo(modo);
  botao.setAttribute('aria-busy', 'false');
  botao.setAttribute('aria-disabled', 'false');
}
function botaoOcupado(): void {
  if (!botao) return;
  botao.textContent = 'Sorteando…';
  botao.setAttribute('aria-busy', 'true');
  botao.setAttribute('aria-disabled', 'true');
}

// ------------------------------------------------------------------ A revelação

/** Antes de girar: o círculo some, a casa e o véu voltam, o carimbo sai. A linha reservada fica até a nova. */
function limparRevelacao(): void {
  const svg = $('.disco', roda)!;
  const pares: [string, number][] = [
    ['.disco__circulo', 120],
    ['.disco__pintar', 200],
    ['.disco__apagar', 200],
  ];
  for (const [seletor, ms] of pares) {
    const el = $<SVGGElement>(seletor, svg);
    if (!el) continue;
    el.style.transition = `opacity ${ms}ms linear`;
    el.style.opacity = '0';
  }
}

/** O nome na linha reservada troca pela máscara: o antigo sai para cima inteiro, o novo sobe de baixo. */
function trocarPelaMascara(alvo: HTMLElement, texto: string): void {
  if (calmo() || !alvo.textContent) {
    alvo.textContent = texto;
    return;
  }
  alvo.style.transition = 'transform 240ms cubic-bezier(.55,0,1,.45)';
  alvo.style.transform = 'translateY(-140%)';
  setTimeout(() => {
    alvo.textContent = texto;
    alvo.style.transition = 'none';
    alvo.style.transform = 'translateY(140%)';
    proximoQuadro(() => {
      alvo.style.transition = 'transform 520ms cubic-bezier(.22,1,.36,1)';
      alvo.style.transform = 'none';
    });
  }, 240);
}

/** O selo em jogo da mesa troca para o da sorteada, endireita e chega 8 px para o disco. */
function trocarSeloEmJogo(m: Materia): void {
  const corpo = $('[data-selo-jogo]', secao);
  const ator = corpo?.closest<HTMLElement>('.ator');
  if (!corpo || !ator) return;
  const trocar = (): void => {
    corpo.innerHTML = selo(m);
  };
  if (calmo()) {
    trocar();
    ator.classList.add('is-em-jogo');
    return;
  }
  void Movimento.animar(corpo, [{ opacity: 1 }, { opacity: 0 }], { duracao: 80, curva: 'linear' }).then(() => {
    trocar();
    void Movimento.animar(corpo, [{ opacity: 0 }, { opacity: 1 }], { duracao: 80, curva: 'linear' });
  });
  ator.classList.add('is-em-jogo');
}

function revelar(i: number, animar: boolean): void {
  const svg = $('.disco', roda)!;
  const caixa = Disco.caixaDaCasa(i, materiasDoDisco);
  const convocacao = i === Disco.CONVOCACAO;
  const semente = Rabisco.sementeDoTexto(`${convocacao ? 'conv' : materiasDoDisco[i]!.sigla}${Math.round(performance.now())}`);
  const camadas = Disco.camadas(i, materiasDoDisco, Rabisco.circular(caixa.largura, caixa.altura, semente));
  const circulo = $<SVGGElement>('.disco__circulo', svg)!;
  const pintar = $<SVGGElement>('.disco__pintar', svg)!;
  const apagar = $<SVGGElement>('.disco__apagar', svg)!;

  pintar.innerHTML = camadas.pintar;
  pintar.style.transition = animar ? 'opacity 160ms linear' : 'none';
  apagar.innerHTML = camadas.apagar;
  apagar.style.transition = animar ? 'opacity 200ms linear' : 'none';
  circulo.setAttribute('transform', camadas.transform);
  circulo.innerHTML = camadas.circulo;
  circulo.style.transition = 'none';
  circulo.style.opacity = '1';
  const tracos = $$<SVGPathElement>('path', circulo);
  for (const p of tracos) {
    p.style.strokeDasharray = '1';
    p.style.strokeDashoffset = animar ? '1' : '0';
    p.style.transition = animar ? 'stroke-dashoffset 280ms linear' : 'none';
  }
  proximoQuadro(() => {
    pintar.style.opacity = '1';
    apagar.style.opacity = '0.6';
    for (const p of tracos) p.style.strokeDashoffset = '0';
  });

  // A linha reservada: a fonte dá lugar à sorteada (o nome, ou o carimbo CONVOCAÇÃO, e a linha do selo).
  const fonte = $('[data-fonte]', secao);
  const sorteada = $('[data-sorteada]', secao);
  const nome = $('[data-sorteada-nome]', secao);
  const lugarDoCarimbo = $('[data-sorteada-carimbo]', secao);
  const linha = $('[data-sorteada-linha]', secao);
  if (fonte) fonte.hidden = true;
  if (sorteada) sorteada.hidden = false;
  if (convocacao) {
    if (nome) {
      nome.textContent = '';
      nome.parentElement!.hidden = true;
    }
    if (linha) linha.textContent = 'Selo em jogo.';
    if (lugarDoCarimbo) {
      setTimeout(
        () => void Mao.bater(lugarDoCarimbo, 'Convocação', Mao.COR.tinta, { animar, aoContato: () => Som.tocar('carimbo') }),
        animar ? 280 : 0,
      );
    }
  } else {
    const m = materiasDoDisco[i]!;
    if (lugarDoCarimbo) lugarDoCarimbo.innerHTML = '';
    if (nome) {
      nome.parentElement!.hidden = false;
      setTimeout(() => trocarPelaMascara(nome, m.curto), animar ? 40 : 0);
    }
    if (linha) linha.textContent = Rodada.temSelo(m.id) ? `O selo de ${m.sigla} já é seu.` : `O selo de ${m.sigla} ainda falta.`;
    trocarSeloEmJogo(m);
  }
  anunciar(viva, `Sorteada: ${convocacao ? 'Convocação. Selo em jogo' : materiasDoDisco[i]!.nome}.`);

  Rodada.estado.sorteio = { i, d: convocacao ? null : materiasDoDisco[i]!.id };
  if (convocacao) Rodada.estado.convocacao.origem = 'treino';
  Rodada.emitir('sorteio', Rodada.estado.sorteio);
  setTimeout(
    () => {
      sorteio.estado = 'parado';
      definirModo(convocacao ? 'convocacao' : 'responder');
    },
    animar ? 800 - ASSENTAR : 300,
  );
}

/** O sorteio. `forca` (0 a 1) escolhe só quantas voltas; o peteleco parte de onde o dedo deixou a caneta. */
export function sortear(forca = 0.5, peteleco = false): void {
  if (sorteio.estado !== 'parado') return;
  Cenas.pronta(secao);
  sorteio.estado = 'girando';
  sorteio.movimento++;
  botaoOcupado();
  limparRevelacao();
  const ritmo: Ritmo = performance.now() - sorteio.ultimo < JANELA_SEGUIDO ? 'seguido' : 'primeiro';
  const i = sortearCasa();
  const casa = Disco.CASAS[i]!;
  const alvo = casa.centro + (2 * Math.random() - 1) * DESVIO_MAX * (casa.fim - casa.inicio);

  if (calmo()) {
    sorteio.angulo = mod(alvo, 360);
    poerCaneta(sorteio.angulo);
    sorteio.ultimo = performance.now();
    Som.tocar('toc');
    setTimeout(() => revelar(i, false), 150);
    return;
  }

  const plano = planoDoGiro(sorteio.visivel, alvo, ritmo, forca, !peteleco);
  // Os tiques: as divisórias que a caneta cruza no freio, as últimas 7 antes do toc.
  const divisorias = Disco.CASAS.map((c) => c.fim);
  const cruzamentos: number[] = [];
  for (let t = plano.inicioDoFreio, antes = plano.angulo(t); t <= plano.parada; t += 8) {
    const agora = plano.angulo(t);
    for (const d of divisorias) {
      const voltas = Math.floor((agora - d) / 360) - Math.floor((antes - d) / 360);
      if (voltas > 0) cruzamentos.push(t);
    }
    antes = agora;
  }
  const tiques = cruzamentos.slice(-TIQUES);
  let proximoTique = 0;
  const t0 = performance.now();
  const quadro = (t: number): void => {
    const dt = t - t0;
    while (proximoTique < tiques.length && dt >= tiques[proximoTique]!) {
      Som.tocar('tique');
      proximoTique++;
    }
    if (dt >= plano.parada) {
      sorteio.angulo = mod(plano.final, 360);
      poerCaneta(sorteio.angulo);
      sorteio.ultimo = performance.now();
      Som.tocar('toc');
      setTimeout(() => revelar(i, true), ASSENTAR);
      return;
    }
    poerCaneta(plano.angulo(dt));
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

/** "Sortear de novo", da 2ª etapa: rola até o disco e, chegando, sorteia no ritmo dos seguidos. */
export async function irSortear(): Promise<void> {
  const chegou = await Movimento.rolarAte(secao, { focar: botao ?? true });
  if (chegou) sortear(0.5, false);
}

// ------------------------------------------------------------------ A mesa: a entrada e os brinquedos

function atores(): HTMLElement[] {
  return $$<HTMLElement>('.ator', secao).filter((a) => a.offsetParent !== null);
}

/** A marca da data de hoje, batida ao lado do datador (outra semente de tinta falhada a cada batida). */
function baterData(animar: boolean, semente?: number, giro?: number): Promise<void> {
  const lugar = $('[data-marca-data]', secao);
  if (!lugar) return Promise.resolve();
  return Mao.bater(lugar, dataDoCarimbo(Rodada.hoje()), Mao.COR.tinta, {
    animar,
    ...(semente !== undefined ? { semente } : {}),
    giro: giro ?? -4,
    aoContato: () => {
      if (semente !== undefined) Som.tocar('carimbo');
    },
  });
}

function entrar(animar: boolean): void {
  secao.classList.add('is-mesa');
  // O disco: a caneta aparece 30° antes de PT aos 640 ms e assenta até PT aos 700 (420 ms), sem toc.
  if (animar && sorteio.estado === 'parado') {
    poerCaneta(REPOUSO - 30);
    Cenas.agendar(secao, 700, () => {
      if (sorteio.estado === 'parado' && secao.dataset['estado'] !== 'pronta') levarCaneta(REPOUSO, 420);
    });
  }
  for (const ator of atores()) {
    const corpo = $('.ator__corpo', ator);
    const sombra = $('.ator__sombra', ator);
    const material = (ator.dataset['material'] ?? 'papel') as Movimento.Material | 'impresso';
    const ordem = Number(getComputedStyle(ator).getPropertyValue('--ordem')) || 0;
    if (!corpo) continue;
    if (material === 'impresso') {
      if (animar) Cenas.agendar(secao, ordem, () => void baterData(true));
      else void baterData(false);
      continue;
    }
    if (!animar) continue;
    void Movimento.pousar(corpo, { material, atraso: ordem, ...(sombra ? { sombra } : {}) });
  }
}

/** O datador bate de novo: antecipa, cai, achata e volta; a marca nova sai com outra semente. */
function ligarDatador(): void {
  const datador = $<HTMLButtonElement>('[data-datador]', secao);
  if (!datador) return;
  let andando = false;
  datador.addEventListener('click', () => {
    if (andando) return;
    andando = true;
    const corpo = $('.ator__corpo', datador)!;
    const semente = Math.floor(Math.random() * 1e6);
    const giro = -6 + Math.random() * 8;
    void Movimento.carimbar(corpo, { aoContato: () => void baterData(true, semente, giro) }).then(() => {
      andando = false;
    });
  });
}

/** A 3×4 da rival troca: sai para o lado, entra a próxima inicial, pousa e é grampeada de novo. */
function ligarRival(): void {
  const rival = $<HTMLButtonElement>('[data-rival]', secao);
  if (!rival) return;
  const RIVAIS = [
    { inicial: 'S', chapa: '#4DC3B5' },
    { inicial: 'I', chapa: '#EF86A9' },
    { inicial: 'L', chapa: '#F4A05A' },
  ];
  let vez = 0;
  let andando = false;
  rival.addEventListener('click', () => {
    if (andando) return;
    andando = true;
    vez = (vez + 1) % RIVAIS.length;
    const r = RIVAIS[vez]!;
    const corpo = $('.ator__corpo', rival)!;
    const sombra = $('.ator__sombra', rival);
    void Movimento.animar(corpo, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(12px)', opacity: 0 }], { duracao: calmo() ? 120 : 180, curva: 'sai', fill: 'both' }).then(() => {
      corpo.innerHTML = foto34({ inicial: r.inicial, chapa: r.chapa });
      rival.style.setProperty('--chapa', r.chapa);
      void Movimento.pousar(corpo, { material: 'papel', ...(sombra ? { sombra } : {}) }).then(() => {
        Som.tocar('grampo');
        andando = false;
      });
    });
  });
}

// ------------------------------------------------------------------ O toque e o peteleco no disco

function ligarDisco(): void {
  roda.classList.add('is-ativo');
  // O toque simples sorteia pelo click, que o navegador não manda quando o toque só freou a rolagem; o peteleco
  // sorteia no pointerup. O arrasto vertical rola a página (pan-y) e a pinça amplia: os dois viram pointercancel.
  let gesto: { id: number; x: number; y: number; varrido: number; ultimoA: number; ultimoT: number; vel: number } | null = null;
  let cliqueDoArrasto = false;
  const anguloDoPonteiro = (e: PointerEvent): number => {
    const r = roda.getBoundingClientRect();
    return (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
  };
  const voltarCaneta = (): void => {
    if (sorteio.estado === 'parado' && !calmo()) levarCaneta(sorteio.angulo, 180);
  };
  roda.addEventListener('pointerdown', (e) => {
    if (gesto || sorteio.estado !== 'parado' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    Cenas.pronta(secao);
    cliqueDoArrasto = false;
    const a = anguloDoPonteiro(e);
    gesto = { id: e.pointerId, x: e.clientX, y: e.clientY, varrido: 0, ultimoA: a, ultimoT: performance.now(), vel: 0 };
    try {
      roda.setPointerCapture(e.pointerId);
    } catch {
      // Sem captura, o pointercancel ou o próximo toque resolvem.
    }
    // A caneta pré-tensiona sob o dedo, como no app.
    if (!calmo()) levarCaneta(sorteio.angulo + PRETENSAO, 100);
  });
  roda.addEventListener('pointermove', (e) => {
    if (!gesto || e.pointerId !== gesto.id) return;
    const a = anguloDoPonteiro(e);
    let d = a - gesto.ultimoA;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    const agora = performance.now();
    gesto.varrido += d;
    gesto.vel = Math.abs(d) / Math.max(1, agora - gesto.ultimoT);
    gesto.ultimoA = a;
    gesto.ultimoT = agora;
    // No arrasto, a caneta acompanha o dedo.
    if (!calmo() && Math.abs(gesto.varrido) > 2) {
      sorteio.movimento++;
      poerCaneta(sorteio.angulo + PRETENSAO + gesto.varrido);
    }
  });
  roda.addEventListener('pointerup', (e) => {
    if (!gesto || e.pointerId !== gesto.id) return;
    const g = gesto;
    gesto = null;
    const movido = Math.hypot(e.clientX - g.x, e.clientY - g.y);
    cliqueDoArrasto = movido >= 10;
    if (movido >= 10 && (Math.abs(g.varrido) >= 45 || g.vel >= 0.35)) {
      sortear(Math.min(1, Math.max(0, (g.vel - 0.35) / 0.9)), true);
      return;
    }
    // Sem sorteio (o toque que freou a rolagem, o arrasto curto), a caneta volta ao repouso.
    setTimeout(voltarCaneta, 80);
  });
  const desistir = (e: PointerEvent): void => {
    if (!gesto || e.pointerId !== gesto.id) return;
    gesto = null;
    voltarCaneta();
  };
  roda.addEventListener('pointercancel', desistir);
  roda.addEventListener('lostpointercapture', desistir);
  roda.addEventListener('click', () => {
    if (cliqueDoArrasto) {
      cliqueDoArrasto = false;
      return;
    }
    sortear(0.5, false);
  });
}

/** Troca a área: o disco redesenha as casas (fade de 200 ms) e volta sem revelação. */
export function mudarArea(): void {
  materiasDoDisco = roleta(Rodada.estado.area);
  const svg = Disco.svg(materiasDoDisco, { id: 'disco', angulo: sorteio.angulo });
  const trocar = (): void => {
    roda.innerHTML = svg;
    const fonte = $('[data-fonte]', secao);
    const sorteada = $('[data-sorteada]', secao);
    if (fonte) fonte.hidden = false;
    if (sorteada) sorteada.hidden = true;
    poerCaneta(sorteio.angulo);
  };
  if (calmo()) trocar();
  else void Movimento.animar(roda, [{ opacity: 1 }, { opacity: 0 }], { duracao: 100, curva: 'linear' }).then(() => {
    trocar();
    void Movimento.animar(roda, [{ opacity: 0 }, { opacity: 1 }], { duracao: 100, curva: 'linear' });
  });
  definirModo('sortear');
}

export function iniciar(): void {
  secao = $('[data-cena="abertura"]')!;
  roda = $('[data-roda]', secao)!;
  botao = $<HTMLButtonElement>('[data-sortear]', secao);
  viva = $('[data-viva]', secao);
  materiasDoDisco = roleta(Rodada.estado.area);
  // Com script, o disco espera o toque: nenhuma casa revelada (a revelação em PT é do estado sem JavaScript).
  roda.innerHTML = Disco.svg(materiasDoDisco, { id: 'disco', angulo: REPOUSO });

  Cenas.registrar('abertura', {
    cena: (_c, animar) => entrar(animar),
    apagar: () => undefined,
  });

  if (botao) {
    botao.hidden = false;
    botao.addEventListener('click', () => {
      if (botao!.getAttribute('aria-disabled') === 'true') return;
      if (sorteio.modo === 'responder') void Movimento.rolarAte($('#questao')!, { focar: true });
      else if (sorteio.modo === 'convocacao') void Movimento.rolarAte($('#convocacao')!, { focar: true });
      else sortear(0.5, false);
    });
  }
  // A folha respondida devolve o botão ao sorteio.
  Rodada.on<{ origem: string }>('resposta', (dados) => {
    if (dados.origem === 'folha' && sorteio.estado === 'parado') definirModo('sortear');
  });
  ligarDisco();
  ligarDatador();
  ligarRival();
}
