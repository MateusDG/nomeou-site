// A faixa das matérias, na base da abertura: a folha de selos das 14 matérias (as bandeiras do Duolingo viram selos
// dos Correios). Tocar num selo destaca e mostra o nome comemorativo e quantas questões a matéria tem no app; a
// escolha da área troca as casas do disco e as questões da página.
import { CONFIG } from '../config';
import { $, $$, anunciar, esc } from '../base/dom';
import * as Movimento from '../base/movimento';
import { linhaDaFaixa, selo } from '../base/pecas';
import * as Rodada from '../base/rodada';
import * as Som from '../base/som';
import { conteudo, materia, roleta } from '../dados';
import type { AreaId } from '../tipos';
import * as Abertura from './abertura';
import * as Cenas from './cenas';

let secao: HTMLElement;
let linha: HTMLElement | null;

/** A linha do selo tocado troca pela máscara. */
function trocarLinha(html: string): void {
  if (!linha) return;
  if (Movimento.perfil() === 'calmo' || !linha.textContent) {
    linha.innerHTML = html;
    return;
  }
  void Movimento.animar(linha, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duracao: 120, curva: 'sai' }).then(() => {
    linha!.innerHTML = html;
    void Movimento.animar(linha!, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duracao: 240, curva: 'assenta' });
  });
}

/** Os selos ganhos na convocação aparecem carimbados aqui (o carimbo postal bate à vista uma vez). */
function carimbarGanhos(animar: boolean): void {
  for (const s of Rodada.estado.selos) {
    const botao = $<HTMLButtonElement>(`.tira__selo[data-materia="${s.d}"]`, secao);
    if (!botao || botao.dataset['carimbado']) continue;
    botao.dataset['carimbado'] = '1';
    botao.innerHTML = selo(materia(s.d), { estado: 'carimbado', data: s.data });
    const postal = $<SVGGElement>('[data-postal]', botao);
    if (animar && postal) void Movimento.bater(postal, { aoContato: () => Som.tocar('selo') });
  }
}

function ligarSelos(): void {
  const tira = $('[data-tira]', secao);
  if (!tira) return;
  tira.addEventListener('click', (e) => {
    const botao = (e.target as Element).closest<HTMLButtonElement>('.tira__selo');
    if (!botao) return;
    for (const b of $$('.tira__selo', tira)) b.setAttribute('aria-pressed', String(b === botao));
    const html = linhaDaFaixa(materia(botao.dataset['materia']!));
    trocarLinha(html);
    const texto = document.createElement('template');
    texto.innerHTML = html;
    anunciar($('[data-viva]'), texto.content.textContent ?? '');
  });
}

function ligarAreas(): void {
  const grupo = $('[data-areas]', secao);
  if (!grupo || !CONFIG.areas) return;
  const areas: AreaId[] = ['geral', 'saude', 'ti'];
  grupo.innerHTML = areas
    .map(
      (a) =>
        `<button class="opcao" type="button" role="radio" aria-checked="${a === Rodada.estado.area}" tabindex="${a === Rodada.estado.area ? 0 : -1}" data-area="${a}">` +
        `<span class="bolha bolha--pequena" aria-hidden="true"></span>${esc(conteudo.rotulos[a])}</button>`,
    )
    .join('');
  grupo.hidden = false;
  const desenhar = (): void => {
    for (const b of $$<HTMLButtonElement>('[data-area]', grupo)) {
      const sim = b.dataset['area'] === Rodada.estado.area;
      b.setAttribute('aria-checked', String(sim));
      b.tabIndex = sim ? 0 : -1;
    }
    const daArea = conteudo.roletas[Rodada.estado.area];
    for (const b of $$<HTMLElement>('.tira__selo', secao)) b.classList.toggle('is-fora-da-area', !daArea.includes(b.dataset['materia']!));
  };
  desenhar();
  const escolher = (area: AreaId): void => {
    if (area === Rodada.estado.area) return;
    Rodada.estado.area = area;
    Rodada.preferencia('area', area);
    Som.tocar('bolha');
    desenhar();
    Abertura.mudarArea();
    Rodada.emitir('area', area);
    const nomes = roleta(area).map((m) => m.curto);
    anunciar($('[data-viva]'), `Área: ${conteudo.rotulos[area]}. O disco sorteia ${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}.`);
  };
  grupo.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-area]');
    if (b) escolher(b.dataset['area'] as AreaId);
  });
  grupo.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const i = areas.indexOf(Rodada.estado.area);
    const proxima = areas[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + areas.length) % areas.length]!;
    escolher(proxima);
    $<HTMLButtonElement>(`[data-area="${proxima}"]`, grupo)?.focus();
    e.preventDefault();
  });
}

export function iniciar(): void {
  secao = $('[data-cena="faixa"]')!;
  linha = $('[data-faixa-linha]', secao);
  Cenas.registrar('faixa', {
    objeto: (_c, animar) => carimbarGanhos(animar),
  });
  ligarSelos();
  ligarAreas();
  // O selo ganho é carimbado à vista, na primeira vez que a faixa volta à tela.
  Rodada.on('selo', () => Cenas.quandoVisivel($('[data-tira]', secao) ?? secao, () => carimbarGanhos(true)));
  carimbarGanhos(false);
}
