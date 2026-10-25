// A 3ª etapa, a convocação: o envelope pardo com lacre, o ofício, a escolha da matéria e a Questão do selo. Quem
// acerta ganha o selo carimbado, que voa para o álbum do cabeçalho. A meta da página é a do treino do app: 3 selos.
import { CONFIG } from '../config';
import { $, $$, anunciar } from '../base/dom';
import * as Folha from '../base/folha';
import * as Mao from '../base/mao';
import * as Movimento from '../base/movimento';
import { envelope, oficio, questaoDoSelo, selo } from '../base/pecas';
import * as Rodada from '../base/rodada';
import * as Som from '../base/som';
import { doSelo, materia, roleta } from '../dados';
import type { Escolha, Materia } from '../tipos';
import { casaDoAlbum } from './cabecalho';
import * as Cenas from './cenas';

let secao: HTMLElement;
let mesa: HTMLElement;
let botao: HTMLButtonElement | null;
let aviso: HTMLElement | null;
let viva: HTMLElement | null;
let aberto = false;
/** A Questão do selo do ofício aberto já foi respondida (e fechar() já disse o que vem). */
let respondida = false;

const calmo = (): boolean => Movimento.perfil() === 'calmo';
const depois = (ms: number, fn: () => void): number => window.setTimeout(fn, calmo() ? Math.min(ms, 60) : ms);

/** As matérias que o ofício oferece: as da área que o visitante não tem nem errou, a sorteada por último primeiro. */
function aOferecer(): Materia[] {
  const estado = Rodada.estado;
  if (estado.selos.length >= 3) return [];
  const ultima = estado.sorteio?.d;
  return roleta(estado.area)
    .filter((m) => !Rodada.temSelo(m.id) && !estado.falhas.includes(m.id) && !!doSelo(m.id))
    .sort((a, b) => (a.id === ultima ? -1 : b.id === ultima ? 1 : 0))
    .slice(0, 3);
}

/** Pode abrir: a amostra abre livre (CONFIG), ou com 3 acertos na 2ª etapa, ou com o disco na Convocação. */
function podeAbrir(): boolean {
  return CONFIG.convocacaoLivre || Rodada.estado.convocacao.origem === 'treino';
}

function desenharBotao(): void {
  if (!botao) return;
  const fim = aOferecer().length === 0;
  botao.hidden = aberto || fim;
  const pode = podeAbrir();
  botao.setAttribute('aria-disabled', String(!pode));
  if (aviso) {
    aviso.hidden = pode && !fim;
    const completou = Rodada.estado.selos.length >= 3;
    aviso.textContent = completou
      ? '3 de 3 selos. A Edição Extra sai no fim da página.'
      : fim
        ? 'As convocações da página acabaram. No app, cada duelo tem as suas.'
        : pode
          ? ''
          : 'Três acertos na 2ª etapa abrem o envelope.';
  }
  const remetente = $('[data-remetente]', mesa);
  if (remetente) remetente.textContent = `OFÍCIO DE CONVOCAÇÃO · ${Rodada.estado.convocacao.origem === 'treino' ? 'DUELO DE TREINO' : 'AMOSTRA'}`;
}

/** Um envelope lacrado novo na mesa (o antigo sai em 200 ms). `focar`: veio de um botão que vai sumir. */
function novoEnvelope(animar: boolean, focar = false): void {
  aberto = false;
  respondida = false;
  const montar = (): void => {
    mesa.innerHTML = envelope({ origem: Rodada.estado.convocacao.origem }) + oficio(aOferecer());
    $('[data-oficio]', mesa)!.hidden = true;
    $('[data-toque-lacre]', mesa)?.addEventListener('click', romper);
    desenharBotao();
    if (animar) pousarEnvelope();
    if (focar) {
      const alvo = botao && !botao.hidden ? botao : aviso && !aviso.hidden ? aviso : $<HTMLElement>('#convocacao-titulo');
      if (alvo === aviso) aviso!.tabIndex = -1;
      alvo?.focus({ preventScroll: true });
    }
  };
  const antigo = mesa.firstElementChild as HTMLElement | null;
  if (antigo && animar && !calmo()) void Movimento.animar(mesa, [{ opacity: 1 }, { opacity: 0 }], { duracao: 200, curva: 'linear' }).then(() => {
    montar();
    mesa.style.opacity = '';
  });
  else montar();
}

/** O envelope pousa com peso de carta e o lacre encosta 110 ms depois do pouso. */
function pousarEnvelope(): void {
  const env = $('[data-envelope]', mesa);
  const lacre = $('[data-lacre]', mesa);
  if (!env) return;
  void Movimento.pousar(env, { material: 'carta' });
  if (lacre) void Movimento.bater(lacre, { de: 1.15, atraso: 330 });
}

/** Romper o lacre: as metades se afastam, a aba vira, o ofício sobe e os selos são dados como cartas. */
function romper(): void {
  if (aberto || !podeAbrir() || aOferecer().length === 0) return;
  aberto = true;
  Cenas.pronta(secao);
  const env = $('[data-envelope]', mesa)!;
  const of = $('[data-oficio]', mesa)!;
  Som.tocar('carimbo');
  if (Rodada.estado.escalada >= 3) Rodada.estado.escalada = 0;
  Rodada.estado.convocacao.origem = 'amostra';
  Rodada.emitir('convocacao', { aberta: true });
  if (botao) botao.hidden = true;
  env.classList.add('is-rompendo');
  void Movimento.abrirEnvelope(env, of).then(() => {
    env.classList.add('is-aberto');
  });
  depois(780, () => {
    const tarja = $('[data-tarja]', of);
    if (tarja) Movimento.registro(tarja);
  });
  const selos = $$('.oficio__selo', of);
  selos.forEach((s, i) => depois(1000 + i * 60, () => void Movimento.darCarta(s)));
  ligarEscolha(of);
  $<HTMLElement>('[data-titulo-escolha]', of)?.focus({ preventScroll: true });
}

function ligarEscolha(of: HTMLElement): void {
  const escolha = $('[data-escolha]', of)!;
  let escolhido = false;
  escolha.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('.oficio__selo');
    if (!b || escolhido) return;
    escolhido = true;
    const d = b.dataset['materia']!;
    Som.tocar('bolha');
    for (const outro of $$<HTMLButtonElement>('.oficio__selo', of)) {
      outro.disabled = true;
      if (outro !== b) void Movimento.animar(outro, [{ opacity: 1 }, { opacity: 0.4 }], { duracao: 200, curva: 'linear', fill: 'both' });
    }
    Mao.circular($('.oficio__selo-papel', b) ?? b, b, { semente: d, espessura: 2.6 });
    depois(480, () => abrirQuestao(of, materia(d)));
  });
}

/** O ofício vira para a Questão do selo (a folha em branco, som virar). */
function abrirQuestao(of: HTMLElement, m: Materia): void {
  const item = doSelo(m.id);
  if (!item) return;
  const escolha = $('[data-escolha]', of)!;
  const lugar = $('[data-questao-selo]', of)!;
  lugar.innerHTML = questaoDoSelo(item, m);
  escolha.hidden = true;
  lugar.hidden = false;
  $<HTMLElement>('[data-titulo-questao]', lugar)?.focus({ preventScroll: true });
  Som.tocar('virar');
  void Movimento.virarFolha(of);
  Folha.travar(lugar);
  Folha.aoEscolher(lugar, (e) => responder(lugar, m, e));
}

function responder(lugar: HTMLElement, m: Materia, escolha: Escolha): void {
  const item = doSelo(m.id)!;
  const { certa } = Folha.responder(lugar, item, escolha, { visto: true });
  Rodada.registrarResposta(item, escolha, certa, 'selo');
  const emJogo = $('[data-selo-em-jogo]', lugar)!;
  const legenda = $('[data-legenda]', lugar);
  const outra = $<HTMLButtonElement>('[data-outra]', lugar);
  const fechar = (): void => {
    const completou = Rodada.estado.selos.length >= 3;
    if (completou && legenda) legenda.textContent = '3 de 3 selos. A Edição Extra sai no fim da página.';
    else if (outra && aOferecer().length > 0) {
      outra.hidden = false;
      void Movimento.animar(outra, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duracao: 400, curva: 'assenta' });
      outra.addEventListener('click', () => novoEnvelope(true, true), { once: true });
    } else if (legenda && aOferecer().length === 0) legenda.textContent = 'As convocações da página acabaram. No app, cada duelo tem as suas.';
    respondida = true;
  };
  if (certa) {
    // O carimbo postal bate no selo em jogo (som selo), o selo se destaca e voa até o álbum.
    depois(900, () => {
      emJogo.innerHTML = selo(m, { lado: 72, estado: 'carimbado', data: Rodada.hoje() });
      const postal = $<SVGGElement>('[data-postal]', emJogo);
      if (postal) void Movimento.bater(postal, { aoContato: () => Som.tocar('selo') });
    });
    depois(1250, () => {
      Som.tocar('picote');
      void Movimento.destacar(emJogo);
    });
    depois(1370, () => {
      if (legenda) legenda.textContent = `${m.selo}.`;
      const destino = casaDoAlbum();
      const ganhar = (): void => {
        if (Rodada.ganharSelo(m.id)) anunciar(viva, `${m.selo} no álbum: ${Rodada.estado.selos.length} de 3.`);
        fechar();
      };
      if (destino) void Movimento.voar(emJogo, destino, { aoChegar: ganhar });
      else ganhar();
    });
  } else {
    Rodada.falharSelo(m.id);
    depois(600, () => {
      void Movimento.animar(emJogo, [{ opacity: 1 }, { opacity: 0 }], { duracao: 100, curva: 'linear' }).then(() => {
        emJogo.innerHTML = selo(m, { lado: 72, estado: 'pendente' });
        void Movimento.animar(emJogo, [{ opacity: 0 }, { opacity: 1 }], { duracao: 100, curva: 'linear' });
      });
    });
    anunciar(viva, 'O selo fica para a próxima convocação.');
    depois(700, () => {
      if (legenda) legenda.textContent = 'O selo fica para a próxima convocação.';
      fechar();
    });
  }
}

/** O envelope lacrado oferece de novo (o sorteio põe a matéria sorteada na frente; a área troca as matérias). */
function refazerOficio(): void {
  if (aberto && respondida && aOferecer().length > 0 && $('[data-outra]', mesa)?.hidden !== false) {
    novoEnvelope(false);
    return;
  }
  desenharBotao();
  if (aberto) return;
  const of = $('[data-oficio]', mesa);
  if (of) of.outerHTML = oficio(aOferecer());
  $('[data-oficio]', mesa)!.hidden = true;
}

export function iniciar(): void {
  secao = $('[data-cena="convocacao"]')!;
  mesa = $('.convocacao__mesa', secao)!;
  botao = $<HTMLButtonElement>('[data-romper]', secao);
  aviso = $('[data-convocacao-aviso]', secao);
  viva = $('[data-viva-convocacao]', secao);
  novoEnvelope(false);
  botao?.addEventListener('click', () => {
    if (botao!.getAttribute('aria-disabled') === 'true') return;
    romper();
  });
  Cenas.registrar('convocacao', {
    objeto: (_c, animar) => {
      if (animar && !aberto) pousarEnvelope();
    },
  });
  Rodada.on('resposta', desenharBotao);
  Rodada.on('sorteio', refazerOficio);
  Rodada.on('area', refazerOficio);
}
