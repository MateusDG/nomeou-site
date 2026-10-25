// O ponto de entrada do site. Liga as partes na ordem certa: o perfil de movimento e o som, as lojas, as etapas da
// rodada (cada uma registra as suas cenas) e, por último, o motor das cenas. Se algo essencial falta, a página fica
// como sem script, que já é completa (o risco e o grifo em CSS, os carimbos impressos, o disco parado).
import * as Movimento from './base/movimento';
import * as Som from './base/som';
import * as Abertura from './pagina/abertura';
import * as Cabecalho from './pagina/cabecalho';
import * as Cenas from './pagina/cenas';
import * as Convocacao from './pagina/convocacao';
import * as Diario from './pagina/diario';
import * as Edital from './pagina/edital';
import * as Errata from './pagina/errata';
import * as Faixa from './pagina/faixa';
import * as Fecho from './pagina/fecho';
import * as Lojas from './pagina/lojas';
import * as Preferencias from './pagina/preferencias';
import * as Questao from './pagina/questao';
import * as Resultado from './pagina/resultado';

declare global {
  interface Window {
    __nomeouPronto?: boolean;
  }
}

function tentar(nome: string, fn: () => void): void {
  try {
    fn();
  } catch (erro) {
    console.error(`[nomeou] ${nome}:`, erro);
  }
}

function iniciar(): void {
  const raiz = document.documentElement;
  // A rede de segurança do <head> já tirou a classe .js (o script chegou depois de 3 s): a página segue como sem
  // script, com o risco e o grifo do CSS, e só as interações ganham vida.
  const tarde = !raiz.classList.contains('js');
  Movimento.iniciar();
  Som.iniciar();
  tentar('lojas', Lojas.iniciar);
  tentar('cabeçalho', Cabecalho.iniciar);
  tentar('preferências', Preferencias.iniciar);
  tentar('abertura', Abertura.iniciar);
  tentar('faixa', Faixa.iniciar);
  tentar('questão', Questao.iniciar);
  tentar('convocação', Convocacao.iniciar);
  tentar('errata', Errata.iniciar);
  tentar('diário', Diario.iniciar);
  tentar('edital', Edital.iniciar);
  tentar('resultado', Resultado.iniciar);
  tentar('fecho', Fecho.iniciar);
  try {
    Cenas.iniciar({ tarde });
  } catch (erro) {
    console.error('[nomeou] cenas:', erro);
    document.querySelectorAll('.cena').forEach((c) => c.classList.add('is-pronta', 'is-in', 'is-objeto'));
  }
  window.__nomeouPronto = true;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
else iniciar();
