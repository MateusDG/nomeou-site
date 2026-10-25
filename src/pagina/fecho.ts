// O fecho: as lojas e a honestidade do PRO, sobre a mesa de estudo (a nuvem de objetos do Duolingo, feita de
// papelaria). Os objetos pousam pelo material, de fora para dentro, e a Bic entra rolando sobre as faces; depois,
// só a rolagem os mexe (CSS, nas duas mesas). A xícara tilinta.
import { $, $$ } from '../base/dom';
import * as Movimento from '../base/movimento';
import { mesaFecho } from '../base/pecas';
import * as Rodada from '../base/rodada';
import * as Som from '../base/som';
import { conteudo, materia } from '../dados';
import * as Cenas from './cenas';

let secao: HTMLElement;
let mesa: HTMLElement;

function montar(): void {
  const selos = Rodada.estado.selos.map((s) => ({ m: materia(s.d), data: s.data }));
  mesa.innerHTML = mesaFecho(conteudo.materias, selos, Rodada.hoje());
  ligarXicara();
}

function ligarXicara(): void {
  const xicara = $$<HTMLElement>('.ator', mesa).find((a) => a.querySelector('use[href="#o-xicara"]'));
  if (!xicara) return;
  xicara.classList.add('ator--toque');
  xicara.addEventListener('click', () => {
    Som.tocar('pires');
    const corpo = $('.ator__corpo', xicara);
    if (corpo) void Movimento.tilintar(corpo);
  });
}

function entrar(animar: boolean): void {
  if (!animar) return;
  for (const ator of $$<HTMLElement>('.ator', mesa)) {
    if (ator.offsetParent === null) continue;
    const corpo = $('.ator__corpo', ator);
    const sombra = $('.ator__sombra', ator);
    if (!corpo) continue;
    const ordem = Number(getComputedStyle(ator).getPropertyValue('--ordem')) || 0;
    if (ator.classList.contains('ator--bic')) {
      void Movimento.rolarBic(ator, { atraso: ordem });
      continue;
    }
    const material = (ator.dataset['material'] ?? 'papel') as Movimento.Material;
    void Movimento.pousar(corpo, { material, atraso: ordem, ...(sombra ? { sombra } : {}) });
  }
}

export function iniciar(): void {
  secao = $('[data-cena="fecho"]')!;
  mesa = $('[data-mesa-fecho]', secao)!;
  montar();
  Cenas.registrar('fecho', { objeto: (_c, animar) => entrar(animar) });
  // Os selos ganhos entram na mesa (o primeiro e o segundo, carimbados), parados.
  Rodada.on('selo', montar);
}
