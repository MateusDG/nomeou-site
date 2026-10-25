// As preferências do rodapé, em bolhas do cartão-resposta: "Som: Sim · Não" e "Movimento: Completo · Reduzido".
// O Som daqui e o do cabeçalho são a mesma chave; o Movimento reduzido leva a página ao estado parado.
import { $, $$ } from '../base/dom';
import * as Movimento from '../base/movimento';
import * as Som from '../base/som';

export function iniciar(): void {
  const caixa = $('[data-preferencias]');
  if (!caixa) return;
  caixa.hidden = false;
  const marcar = (botoes: HTMLElement[], valor: string, atributo: string): void => {
    for (const b of botoes) {
      const sim = b.getAttribute(atributo) === valor;
      b.setAttribute('aria-checked', String(sim));
      b.tabIndex = sim ? 0 : -1;
    }
  };
  const som = $$('[data-pref-som]', caixa);
  const mov = $$('[data-pref-mov]', caixa);
  const desenharSom = (): void => marcar(som, Som.ligado() ? 'sim' : 'nao', 'data-pref-som');
  const notaDoSistema = $('[data-pref-mov-sistema]', caixa);
  const desenharMovimento = (): void => {
    marcar(mov, Movimento.perfil() === 'calmo' ? 'reduzido' : 'completo', 'data-pref-mov');
    const sistema = Movimento.sistemaReduz();
    for (const b of mov) {
      if (b.getAttribute('data-pref-mov') === 'completo') b.setAttribute('aria-disabled', String(sistema));
    }
    if (notaDoSistema) notaDoSistema.hidden = !sistema;
    const grupo = mov[0]?.closest('[role="radiogroup"]');
    if (sistema) grupo?.setAttribute('aria-describedby', 'pref-mov-sistema');
    else grupo?.removeAttribute('aria-describedby');
  };
  desenharSom();
  desenharMovimento();
  Som.aoMudar(desenharSom);
  Movimento.aoMudarPerfil(desenharMovimento);
  // O sistema pode mudar sem o perfil mudar (a escolha do rodapé segura o calmo): redesenha assim mesmo.
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', desenharMovimento);
  for (const b of som) b.addEventListener('click', () => Som.ligar(b.getAttribute('data-pref-som') === 'sim'));
  for (const b of mov) {
    b.addEventListener('click', () => {
      if (b.getAttribute('aria-disabled') === 'true') return;
      Movimento.definirMovimento(b.getAttribute('data-pref-mov') === 'reduzido' ? 'reduzido' : 'completo');
    });
  }
  // As setas andam dentro de cada grupo de rádio.
  for (const grupo of $$('[role="radiogroup"]', caixa)) {
    grupo.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const botoes = $$<HTMLButtonElement>('[role="radio"]:not([aria-disabled="true"])', grupo);
      const i = botoes.indexOf(document.activeElement as HTMLButtonElement);
      const proximo = botoes[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + botoes.length) % botoes.length];
      // Com uma opção só habilitada, a seta não "escolhe" de novo a que já está marcada.
      if (proximo && proximo !== document.activeElement) {
        proximo.focus();
        proximo.click();
      }
      e.preventDefault();
    });
  }
}
