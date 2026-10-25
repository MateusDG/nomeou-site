// O edital (fora da rodada): o treino pelo edital do cargo. Um toque numa ficha troca o cargo e redesenha o edital
// verticalizado, com a barra do peso de cada matéria; a nota a lápis diz a regra que muda o jogo (o desconto do
// Cebraspe, a prova de A a D), e uma linha diz o que o Nomeou ainda não cobre.
import { $, $$ } from '../base/dom';
import * as Mao from '../base/mao';
import * as Movimento from '../base/movimento';
import { edital } from '../base/pecas';
import { conteudo } from '../dados';
import * as Cenas from './cenas';

let secao: HTMLElement;
let corpo: HTMLElement;

function crescerBarras(): void {
  if (Movimento.perfil() === 'calmo') return;
  $$('.verticalizado__barra > span', corpo).forEach((barra, i) => {
    void Movimento.animar(barra, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duracao: 400, atraso: i * 60, curva: 'assenta', fill: 'both' });
  });
}

function escreverNota(): void {
  const nota = $('[data-nota]', corpo);
  if (nota && !nota.hidden) Mao.escrever(nota, 0);
}

function trocar(i: number): void {
  corpo.innerHTML = edital(conteudo.cargos, i);
  ligarFichas();
  crescerBarras();
  escreverNota();
  $<HTMLButtonElement>(`[data-cargo="${i}"]`, corpo)?.focus({ preventScroll: true });
}

function ligarFichas(): void {
  const fichas = $('[data-fichas]', corpo);
  if (!fichas) return;
  fichas.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-cargo]');
    if (b && b.getAttribute('aria-checked') !== 'true') trocar(Number(b.dataset['cargo']));
  });
  fichas.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const atual = Number($('[aria-checked="true"]', fichas)?.dataset['cargo'] ?? 0);
    const n = conteudo.cargos.length;
    trocar((atual + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + n) % n);
    e.preventDefault();
  });
  for (const b of $$<HTMLButtonElement>('[data-cargo]', fichas)) b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
}

export function iniciar(): void {
  secao = $('[data-cena="edital"]')!;
  corpo = $('.edital__corpo', secao)!;
  if (conteudo.cargos.length) {
    corpo.innerHTML = edital(conteudo.cargos, 0);
    ligarFichas();
  }
  Cenas.registrar('edital', {
    cena: (_c, animar) => {
      const alvo = $('[data-grifo]', secao);
      if (alvo) Mao.grifar(alvo, { atraso: animar ? 900 : 0, animar });
    },
    objeto: (_c, animar) => {
      if (!animar) {
        $('[data-nota]', corpo)?.classList.add('is-escrita');
        return;
      }
      crescerBarras();
      const nota = $('[data-nota]', corpo);
      if (nota && !nota.hidden) Cenas.agendar(secao, 700, () => Mao.escrever(nota, 0));
    },
    apagar: (_c, fase) => {
      if (fase !== 'objeto') Mao.apagar(secao, '.edital__titulo .grifo');
    },
  });
}
