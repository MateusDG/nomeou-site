// A 5ª etapa, o Diário: a grade para mandar no grupo, montada com as respostas do próprio visitante na página. O
// texto leva nomeou.app de volta para esta rodada. Sem nenhuma resposta, a página mostra o Diário do dia, de exemplo.
import { $ } from '../base/dom';
import * as Mao from '../base/mao';
import * as Movimento from '../base/movimento';
import { grade, textoDaGrade, type RespostaDaGrade } from '../base/pecas';
import * as Rodada from '../base/rodada';
import { conteudo } from '../dados';
import * as Cenas from './cenas';

let secao: HTMLElement;
let figura: HTMLElement;

function respostas(): RespostaDaGrade[] {
  return Rodada.estado.respostas.slice(0, 5).map((r) => ({ certa: r.certa, d: r.d }));
}

function montar(): void {
  figura.innerHTML = grade(respostas(), conteudo.diarios[Rodada.estado.area], conteudo);
  const botao = $<HTMLButtonElement>('[data-mandar]', secao);
  if (botao) botao.hidden = respostas().length === 0;
}

/** Os quadrados caem um depois do outro (CSS); o total sobe da máscara aos 600 ms e a caneta o circula aos 1.120. */
function circular(animar: boolean): void {
  const total = $('[data-total]', figura);
  const numero = total?.querySelector('.m > span');
  if (!total || !numero) return;
  Mao.apagar(total);
  if (animar) Cenas.agendar(secao, 1120, () => Mao.circular(numero, total, { semente: '4/5' }));
  else Mao.circular(numero, total, { semente: '4/5', animar: false });
}

/** "Mandar o resultado": o compartilhar do aparelho; sem ele, copia e diz "Copiado." por 2 s. */
async function mandar(): Promise<void> {
  const texto = textoDaGrade(respostas(), conteudo);
  const aviso = $('[data-copiado]', secao);
  if (navigator.share) {
    try {
      await navigator.share({ text: texto });
      return;
    } catch (erro) {
      if ((erro as Error).name === 'AbortError') return;
    }
  }
  let copiou = false;
  try {
    await navigator.clipboard.writeText(texto);
    copiou = true;
  } catch {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    copiou = document.execCommand('copy');
    area.remove();
  }
  if (aviso && copiou) {
    aviso.textContent = 'Copiado.';
    setTimeout(() => (aviso.textContent = ''), 2000);
  }
}

export function iniciar(): void {
  secao = $('[data-cena="diario"]')!;
  figura = $('[data-grade]', secao)!;
  montar();
  Cenas.registrar('diario', {
    objeto: (_c, animar) => circular(animar),
    apagar: () => {
      const total = $('[data-total]', figura);
      if (total) Mao.apagar(total);
    },
  });
  $('[data-mandar]', secao)?.addEventListener('click', () => void mandar());
  // Uma resposta nova: o quadrado novo cai na próxima vez que o Diário aparecer, e o círculo se refaz.
  Rodada.on('resposta', () => {
    if (Rodada.estado.respostas.length > 5) return;
    Cenas.quandoVisivel(figura, () => {
      montar();
      const animar = Movimento.perfil() !== 'calmo';
      if (animar) {
        const ultimo = figura.querySelectorAll('.grade__q:not(.grade__q--falta)');
        const novo = ultimo[ultimo.length - 1] as HTMLElement | undefined;
        if (novo) void Movimento.animar(novo, [{ opacity: 0, transform: 'translateY(-2px)' }, { opacity: 1, transform: 'none' }], { duracao: 160, curva: 'assenta' });
      }
      circular(false);
    });
  });
  Rodada.on('area', () => {
    montar();
    if (secao.classList.contains('is-objeto')) circular(false);
  });
}
