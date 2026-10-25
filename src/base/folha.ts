// A correção à mão, com as linhas do tempo do app (DESIGN.md, 8.3), para as três questões da página: a folha
// da 2ª etapa, a Questão do selo e a Errata. Um toque responde, sem confirmar; o impresso muda, depois a mão,
// depois o carimbo, por fim a nota.
//
//   ACERTO (ms desde o toque): bolha 0 · grifo na certa 80–300 · ACERTOU cai 300 e encosta 410 (som acerto)
//          · nota 500 · comentário 900
//   ERRO:   bolha 0 · risco na marcada 80–260 (som caneta 80) e ERROU · grifo na certa 260–480
//          · ondulado na pegadinha 480 · nota vermelha 600 · comentário 900
import type { Escolha, Item } from '../tipos';
import * as Mao from './mao';
import * as Movimento from './movimento';
import { LETRAS, certaDe } from './pecas';
import * as Som from './som';

const calmo = (): boolean => Movimento.perfil() === 'calmo';
/**
 * A mão grifa e risca o texto só com a classe .js. No modo tarde (a rede de segurança do <head> tirou o .js), o CSS
 * do impresso já grifa a certa e risca a errada pelas classes is-certa e is-errada: a mão não desenha por cima.
 */
export const maoNoTexto = (): boolean => document.documentElement.classList.contains('js');

/** O que o leitor de tela ouve de uma escolha respondida: "B: texto, marcada, certa". */
export function rotular(botao: HTMLElement, partes: string[]): void {
  if (!partes.length) return;
  const base = botao.dataset['rotulo'] ?? botao.getAttribute('aria-label') ?? botao.textContent?.trim() ?? '';
  botao.dataset['rotulo'] = base;
  botao.setAttribute('aria-label', `${base}, ${partes.join(', ')}`);
}
const depois = (ms: number, fn: () => void): number => window.setTimeout(fn, calmo() ? Math.min(ms, 60) : ms);

function aparecer(el: HTMLElement | null | undefined, ms = 400): void {
  if (!el) return;
  el.hidden = false;
  if (calmo()) return;
  el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: ms, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
}

/** O alvo do grifo e do risco numa escolha: o texto da alternativa ou o rótulo do Certo/Errado. */
function textoDa(botao: HTMLElement): HTMLElement {
  return botao.querySelector<HTMLElement>('.alternativa__texto, .ce__rotulo') ?? botao;
}

export function botoesDe(raiz: ParentNode): HTMLButtonElement[] {
  return Array.from(raiz.querySelectorAll<HTMLButtonElement>('.alternativa, .ce__botao'));
}
export function valorDe(botao: HTMLElement): Escolha {
  const ce = botao.getAttribute('data-ce');
  return ce !== null ? ce === 'true' : Number(botao.getAttribute('data-i'));
}
function botaoDoValor(raiz: ParentNode, valor: Escolha): HTMLButtonElement | undefined {
  return botoesDe(raiz).find((b) => valorDe(b) === valor);
}

export interface OpcoesDaResposta {
  /** A linha do que vem ("Volta amanhã na Errata.", "1 de 3 para a convocação."). */
  aviso?: string;
  /** O botão escolhido leva o visto no acerto (a Questão do selo). */
  visto?: boolean;
  /** O ACERTOU encostou no papel. */
  aoContato?: () => void;
  /** Leva o foco à linha de resultado (padrão: sim), para o teclado e o leitor de tela seguirem a correção. */
  focar?: boolean;
  /** O que o leitor ouve depois de "Resposta certa." (a Errata: "Recuperada."). */
  aposAcerto?: string;
}

/** Responde: marca a escolha e corre a correção. `fim` resolve quando a correção termina. */
export function responder(raiz: HTMLElement, item: Item, escolha: Escolha, opcoes: OpcoesDaResposta = {}): { certa: boolean; fim: Promise<void> } {
  const certaValor = certaDe(item);
  const certa = escolha === certaValor;
  const marcado = botaoDoValor(raiz, escolha);
  const botaoCerto = botaoDoValor(raiz, certaValor);
  const lugarDoCarimbo = raiz.querySelector<HTMLElement>('[data-carimbo]');
  const errou = raiz.querySelector<HTMLElement>('[data-errou]');
  const depoisEl = raiz.querySelector<HTMLElement>('[data-depois]');
  const nota = depoisEl?.querySelector<HTMLElement>('[data-nota]');
  const aviso = depoisEl?.querySelector<HTMLElement>('[data-aviso]') ?? raiz.querySelector<HTMLElement>('[data-aviso]');
  const pegadinha = raiz.querySelector<HTMLElement>('[data-pegadinha]');

  for (const b of botoesDe(raiz)) {
    b.disabled = true;
    b.classList.add('is-respondida');
    const v = valorDe(b);
    rotular(b, [...(v === escolha ? ['marcada'] : []), ...(v === certaValor ? ['certa'] : v === escolha ? ['errada'] : [])]);
  }
  // A linha de resultado diz em texto o que o carimbo diz no desenho e recebe o foco: o leitor de tela ouve a correção
  // dali, uma vez só (sem região viva repetindo).
  const linha = raiz.querySelector<HTMLElement>('[data-resultado-linha]');
  const dito = linha?.querySelector<HTMLElement>('[data-resultado-sr]');
  if (dito) {
    dito.textContent = certa
      ? `Resposta certa.${opcoes.aposAcerto ? ` ${opcoes.aposAcerto}` : ''}`
      : `Resposta errada. ${item.tipo === 'ce' ? `O item é ${item.gabarito ? 'certo' : 'errado'}.` : `A certa é a ${LETRAS[item.correta]}.`}`;
  }
  if (opcoes.focar !== false) linha?.focus({ preventScroll: true });
  const mao = maoNoTexto();
  // 0 ms: a bolha enche de caneta (o anel em 80 ms, o miolo em 170).
  if (marcado) {
    marcado.classList.add('is-marcada');
    marcado.querySelector('.bolha')?.classList.add('is-marcada');
  }
  Som.tocar('bolha');

  const mostrarDepois = (): void => {
    if (depoisEl) depoisEl.hidden = false;
    if (nota) {
      nota.classList.toggle('nota--erro', !certa);
      Mao.escrever(nota, 0);
    }
    if (aviso) aviso.textContent = opcoes.aviso ?? '';
  };

  const fim = new Promise<void>((ok) => {
    if (certa) {
      depois(80, () => {
        if (botaoCerto) {
          botaoCerto.classList.add('is-certa');
          if (mao) Mao.grifar(textoDa(botaoCerto), { conteiner: botaoCerto });
        }
        if (opcoes.visto && marcado) Mao.visto(textoDa(marcado), { tamanho: 22, semente: item.id });
      });
      depois(300, () => {
        if (lugarDoCarimbo) {
          void Mao.bater(lugarDoCarimbo, 'Acertou', Mao.COR.verde, {
            aoContato: () => {
              Som.tocar('acerto');
              opcoes.aoContato?.();
            },
          });
        }
      });
      depois(500, mostrarDepois);
    } else {
      depois(80, () => {
        if (marcado) {
          marcado.classList.add('is-errada');
          if (mao) Mao.riscar(textoDa(marcado), { conteiner: marcado });
        }
        Som.tocar('caneta');
        aparecer(errou, 120);
      });
      depois(260, () => {
        if (!botaoCerto) return;
        botaoCerto.classList.add('is-certa');
        if (mao) Mao.grifar(textoDa(botaoCerto), { conteiner: botaoCerto });
      });
      depois(480, () => {
        if (pegadinha?.parentElement) Mao.ondular(pegadinha, { conteiner: pegadinha.parentElement });
      });
      depois(600, mostrarDepois);
    }
    depois(900, () => {
      aparecer(depoisEl?.querySelector<HTMLElement>('.comentario'));
      if (aviso?.textContent) aparecer(aviso);
    });
    depois(1300, ok);
  });
  return { certa, fim };
}

/** Liga os toques numa folha: o primeiro toque numa escolha responde. Devolve como destravar para a próxima. */
export function aoEscolher(raiz: HTMLElement, fn: (escolha: Escolha, botao: HTMLButtonElement) => void): () => void {
  let travada = false;
  raiz.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('.alternativa, .ce__botao');
    if (!b || b.disabled || travada || !raiz.contains(b)) return;
    if (Number(raiz.dataset['travadaAte'] ?? 0) > performance.now()) return;
    travada = true;
    fn(valorDe(b), b);
  });
  return () => {
    travada = false;
  };
}

/** A trava de 600 ms depois de a folha virar: um toque que veio para a folha antiga não responde a nova. */
export function travar(raiz: HTMLElement, ms = 600): void {
  raiz.dataset['travadaAte'] = String(performance.now() + ms);
}
