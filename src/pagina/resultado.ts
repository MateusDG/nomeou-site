// A 6ª etapa, o Resultado: a primeira página do Diário do Nomeou com um branco para o nome do visitante. Com 3
// selos, a Edição Extra amarela; sem eles, a mesma página em papel-jornal. É mérito, não isca: aqui não há loja.
import { $, anunciar } from '../base/dom';
import * as Mao from '../base/mao';
import * as Movimento from '../base/movimento';
import { foto34, jornal } from '../base/pecas';
import * as Rodada from '../base/rodada';
import * as Som from '../base/som';
import { materia, roleta } from '../dados';
import * as Cenas from './cenas';

let secao: HTMLElement;
let pagina: HTMLElement;
let viva: HTMLElement | null;
let extraTocada = false;
let extraAnunciada = false;
/** O 3º selo acabou de sair e a Extra espera aparecer (quandoVisivel): uma chamada parada não a gasta. */
let extraPendente = false;

const calmo = (): boolean => Movimento.perfil() === 'calmo';
const ehExtra = (): boolean => Rodada.estado.selos.length >= 3;

function montar(): void {
  const estado = Rodada.estado;
  const selos = estado.selos.map((s) => ({ m: materia(s.d), data: s.data }));
  const pendentes = roleta(estado.area).filter((m) => !Rodada.temSelo(m.id));
  pagina.classList.toggle('is-extra', ehExtra());
  pagina.innerHTML = jornal({ extra: ehExtra(), selos, pendentes, respostas: estado.respostas.length, hoje: Rodada.hoje() });
  ligarNome();
  Cenas.trocouManchete(secao);
}

/** O branco da manchete vira um campo: Gloock no corpo da manchete, o fio de preencher como borda de baixo. */
function ligarNome(): void {
  const branco = $('[data-branco]', pagina);
  const rotulo = $('[data-rotulo-nome]', pagina);
  if (!branco || !rotulo) return;
  const label = document.createElement('label');
  label.className = rotulo.className;
  label.htmlFor = 'nome-visitante';
  label.textContent = rotulo.textContent;
  rotulo.replaceWith(label);
  branco.innerHTML =
    '<input class="jornal__campo" id="nome-visitante" type="text" maxlength="20" autocomplete="given-name" enterkeyhint="done" autocapitalize="words" spellcheck="false">' +
    '<span class="jornal__espelho" aria-hidden="true"></span>';
  const campo = $<HTMLInputElement>('.jornal__campo', branco)!;
  const espelho = $('.jornal__espelho', branco)!;
  campo.value = Rodada.estado.nome;
  let espera = 0;
  let inicialAntes = '';
  const medir = (): void => {
    espelho.textContent = campo.value || '    ';
    branco.style.setProperty('--largura', `${Math.max(espelho.offsetWidth + 6, 0)}px`);
  };
  const aplicar = (): void => {
    const nome = campo.value.trim();
    const linha = $('[data-linha-nome]', pagina);
    if (linha) {
      linha.textContent = `${nome || 'Você'} · 3 selos`;
      Mao.apagar(linha.parentElement!, '.grifo');
      Mao.grifar(linha, { conteiner: linha.parentElement! });
      if ($('.jornal__eu', pagina)) setaDoEu(false);
    }
    const inicial = nome ? nome[0]!.toLocaleUpperCase('pt-BR') : '';
    if (inicial !== inicialAntes) {
      inicialAntes = inicial;
      const foto = $('[data-foto-visitante]', pagina);
      if (foto) {
        foto.innerHTML = foto34({ visitante: true, inicial });
        if (inicial) Som.tocar('grampo');
      }
    }
  };
  campo.addEventListener('input', () => {
    // Só letras (com acento), espaço, hífen e apóstrofo; o resto cai na digitação.
    const limpo = campo.value.replace(/[^\p{L}\s'’-]/gu, '');
    if (limpo !== campo.value) campo.value = limpo;
    Rodada.estado.nome = campo.value;
    medir();
    clearTimeout(espera);
    espera = window.setTimeout(aplicar, 400);
  });
  // Remontado (um selo novo), o jornal recebe de volta o nome já digitado.
  const jaDigitado = campo.value.trim();
  if (jaDigitado) {
    inicialAntes = jaDigitado[0]!.toLocaleUpperCase('pt-BR');
    const foto = $('[data-foto-visitante]', pagina);
    if (foto) foto.innerHTML = foto34({ visitante: true, inicial: inicialAntes });
    const linha = $('[data-linha-nome]', pagina);
    if (linha) linha.textContent = `${jaDigitado} · 3 selos`;
  }
  campo.addEventListener('focus', () => {
    // Quando o teclado sobe, a manchete fica no terço de cima.
    setTimeout(() => {
      const r = campo.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.4) window.scrollBy({ top: r.top - window.innerHeight * 0.25, behavior: calmo() ? 'auto' : 'smooth' });
    }, 300);
  });
  requestAnimationFrame(medir);
}

/** A entrada em papel-jornal: a página assenta, a manchete se compõe, o fio de preencher se traça, a 3×4 pousa. */
function entrarJornal(animar: boolean): void {
  if (!animar) return;
  void Movimento.animar(pagina, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duracao: 300, curva: 'assenta' });
  const manchete = $('.jornal__manchete', pagina);
  if (manchete) Movimento.compor(manchete, { atraso: 200 });
  const fio = $('.jornal__fio', pagina) ?? $('.jornal__campo', pagina);
  if (fio) void Movimento.animar(fio, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duracao: 220, atraso: 500, curva: 'fioAnda', fill: 'both' });
  const foto = $('[data-foto-visitante]', pagina);
  if (foto) void Movimento.pousar(foto, { material: 'papel', atraso: 600 });
}

/** O "eu" a caneta ao lado do nome. */
function escreverEu(animar: boolean): void {
  const linha = $('.jornal__linha-nome', pagina);
  if (!linha) return;
  $('.jornal__eu', pagina)?.remove();
  const eu = document.createElement('span');
  eu.className = 'jornal__eu';
  eu.setAttribute('aria-hidden', 'true');
  eu.textContent = 'eu';
  linha.appendChild(eu);
  if (animar) Mao.escrever(eu, 0);
  else eu.classList.add('is-escrita');
}

/** A seta do "eu" até o nome. */
function setaDoEu(animar: boolean): void {
  const linha = $('.jornal__linha-nome', pagina);
  const eu = $('.jornal__eu', pagina);
  if (!linha || !eu) return;
  Mao.apagar(linha, '.rabisco');
  const base = linha.getBoundingClientRect();
  const r = eu.getBoundingClientRect();
  Mao.seta(linha, [r.left - base.left - 4, r.top - base.top + r.height * 0.6], [r.left - base.left - 30, r.top - base.top + r.height * 0.5], { animar });
}

function anunciarExtra(): void {
  if (extraAnunciada) return;
  extraAnunciada = true;
  anunciar(viva, 'Edição Extra: 3 selos. Seu nome na manchete.');
}

/** O estado final da Extra, parado: o grifo, o "eu →", o PUBLICADO e (se pedido) o anúncio. Refazê-lo não duplica nada. */
function extraParada(comAnuncio: boolean): void {
  const linha = $('.jornal__linha-nome', pagina);
  const nome = $('[data-linha-nome]', pagina);
  if (linha && nome) {
    Mao.apagar(linha, '.grifo');
    Mao.grifar(nome, { conteiner: linha, animar: false });
    escreverEu(false);
    setaDoEu(false);
  }
  const lugar = $('[data-carimbo-publicado]', pagina);
  if (lugar && !lugar.firstChild) void Mao.bater(lugar, 'Publicado', Mao.COR.tinta, { animar: false });
  if (comAnuncio) anunciarExtra();
}

/** A Edição Extra, no ritmo do app (RITMO_DA_EDICAO): registro, composição, recorte, grifo, "eu →" e PUBLICADO. */
function entrarExtra(): void {
  if (extraTocada) return;
  extraTocada = true;
  extraPendente = false;
  const animar = !calmo();
  const passo = (ms: number, fn: () => void): void => Cenas.agendar(secao, animar ? ms : 0, fn);
  if (animar) void Movimento.animar(pagina, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duracao: 300, curva: 'assenta' });
  passo(300, () => {
    const tarja = $('[data-tarja]', pagina);
    if (tarja) Movimento.registro(tarja);
    Som.tocar('rotativa');
  });
  passo(480, () => {
    const manchete = $('.jornal__manchete', pagina);
    if (manchete && animar) Movimento.compor(manchete, {});
  });
  passo(700, () => {
    const recorte = $('.jornal__recorte', pagina);
    if (recorte && animar) void Movimento.animar(recorte, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duracao: 400, curva: 'assenta' });
  });
  passo(920, () => {
    const nome = $('[data-linha-nome]', pagina);
    if (!nome) return;
    Mao.apagar(nome.parentElement!, '.grifo');
    Mao.grifar(nome, { conteiner: nome.parentElement!, animar });
  });
  passo(1140, () => escreverEu(animar));
  passo(1240, () => setaDoEu(animar));
  passo(1440, () => {
    const lugar = $('[data-carimbo-publicado]', pagina);
    if (lugar && !lugar.firstChild) void Mao.bater(lugar, 'Publicado', Mao.COR.tinta, { animar, aoContato: () => Som.tocar('carimbo') });
  });
  passo(1600, anunciarExtra);
}

export function iniciar(): void {
  secao = $('[data-cena="resultado"]')!;
  pagina = $('[data-jornal]', secao)!;
  viva = $('[data-viva-resultado]', secao);
  montar();
  Cenas.registrar('resultado', {
    objeto: (_c, animar) => {
      if (!ehExtra()) {
        entrarJornal(animar);
        return;
      }
      if (animar) entrarExtra();
      // Parado (pronta, resize, fontes) com a Extra já tocada: o estado final inteiro, mesmo que os passos tenham
      // sido cancelados no meio, com o anúncio que ainda não saiu.
      else if (extraTocada) extraParada(true);
      // Recarga com os 3 selos (ou a cena que já ia pronta): a Extra entra parada, sem anúncio. Pendente, ela espera
      // o quandoVisivel tocá-la à vista.
      else if (!extraPendente) {
        extraTocada = true;
        extraAnunciada = true;
        extraParada(false);
      }
    },
  });
  // O 3º selo muda o bloco sem ninguém ver; a Edição Extra toca uma vez, quando aparece.
  Rodada.on<{ total: number }>('selo', (s) => {
    montar();
    if (s.total >= 3 && !extraTocada) {
      extraPendente = true;
      Cenas.quandoVisivel(pagina, entrarExtra);
    }
  });
}
