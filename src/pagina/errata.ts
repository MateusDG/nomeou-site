// A 4ª etapa, a Errata: a questão que o visitante errou na página volta, e pode ser refeita. O acerto arranca as
// folhinhas do calendário, uma a uma, até o SANADA. Quem não errou nada vê a pt-005, com a B marcada e riscada.
import { $, $$ } from '../base/dom';
import * as Folha from '../base/folha';
import * as Mao from '../base/mao';
import * as Movimento from '../base/movimento';
import { alternativas, errata as montarErrata, linhaDeResultado } from '../base/pecas';
import * as Rodada from '../base/rodada';
import * as Som from '../base/som';
import { item as itemDe, materia, questoes } from '../dados';
import type { Escolha, Item } from '../tipos';
import * as Cenas from './cenas';

let secao: HTMLElement;
let lugar: HTMLElement;
let atual: { item: Item; marcada: Escolha } | null = null;
let respondida = false;

const calmo = (): boolean => Movimento.perfil() === 'calmo';
const depois = (ms: number, fn: () => void): number => window.setTimeout(fn, calmo() ? Math.min(ms, 60) : ms);

/** A questão da Errata: o primeiro erro da página ainda não sanado, ou o exemplo. */
function daVez(): { item: Item; marcada: Escolha } {
  const estado = Rodada.estado;
  const id = estado.erros.find((e) => !estado.sanadas.includes(e));
  if (id) {
    const resposta = estado.respostas.filter((r) => r.id === id && r.origem === 'folha').pop();
    if (resposta) return { item: itemDe(id), marcada: resposta.escolha };
  }
  return { item: itemDe(questoes.exemploErrata.id), marcada: questoes.exemploErrata.marcada };
}

function montar(): void {
  atual = daVez();
  respondida = false;
  lugar.innerHTML = montarErrata(atual.item, materia(atual.item.d), atual.marcada, Rodada.hoje());
  const botao = $<HTMLButtonElement>('[data-responder-de-novo]', lugar);
  if (botao) {
    botao.hidden = false;
    botao.addEventListener('click', abrirRefazer, { once: true });
  }
}

/** A entrada: o recorte pousa; aos 700 ms o risco na marcada, aos 900 a nota; as folhinhas se imprimem. */
function entrar(animar: boolean): void {
  const risco = $('[data-risco-errata]', lugar);
  const nota = $('[data-nota-errata]', lugar);
  const recorte = $('[data-recorte-errata]', lugar);
  // Só o risco do recorte: o que a correção desenhou no refazer fica onde está.
  Mao.apagar(lugar, '.errata__marcada .rabisco');
  if (!animar) {
    if (risco) Mao.riscar(risco, { animar: false });
    return;
  }
  if (recorte) void Movimento.pousar(recorte, { material: 'papel' });
  Cenas.agendar(secao, 700, () => risco && Mao.riscar(risco));
  if (nota) Cenas.agendar(secao, 900, () => Mao.escrever(nota, 0));
  $$('[data-folhinha]', lugar).forEach((f, i) => {
    void Movimento.animar(f, [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duracao: 300, atraso: 300 + i * 60, curva: 'assenta', fill: 'both' });
  });
}

/** "Responder de novo" abre as alternativas dentro do recorte, com a errada riscada e desabilitada. */
function abrirRefazer(): void {
  if (!atual || respondida) return;
  const refazer = $('[data-refazer]', lugar)!;
  const botao = $<HTMLButtonElement>('[data-responder-de-novo]', lugar);
  refazer.innerHTML = alternativas(atual.item, { desabilitar: [atual.marcada] }) + linhaDeResultado(null);
  refazer.hidden = false;
  if (botao) botao.hidden = true;
  if (!calmo()) void Movimento.animar(refazer, [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duracao: 300, curva: 'assenta' });
  // A errada já vem riscada, à mão.
  const errada = Folha.botoesDe(refazer).find((b) => Folha.valorDe(b) === atual!.marcada);
  if (errada && Folha.maoNoTexto()) Mao.riscar(errada.querySelector<HTMLElement>('.alternativa__texto, .ce__rotulo') ?? errada, { conteiner: errada, animar: false });
  Folha.travar(refazer);
  Folha.aoEscolher(refazer, (e) => responder(refazer, e));
  // O botão acionado sumiu: o foco vai para a primeira escolha que ainda vale (a trava de 600 ms segura o Enter repetido).
  Folha.botoesDe(refazer).find((b) => !b.disabled)?.focus({ preventScroll: true });
}

function responder(refazer: HTMLElement, escolha: Escolha): void {
  if (!atual) return;
  respondida = true;
  const item = atual.item;
  const aviso = $('[data-errata-aviso]', lugar);
  const { certa } = Folha.responder(refazer, item, escolha, { aposAcerto: 'Recuperada.' });
  Rodada.registrarResposta(item, escolha, certa, 'errata');
  if (!certa) {
    depois(600, () => aviso && (aviso.textContent = 'Volta amanhã na Errata.'));
    return;
  }
  depois(300, () => aviso && (aviso.textContent = 'Recuperada.'));
  // As folhinhas arrancam pela costura, uma a uma, com um tique cada, e revelam o visto.
  $$('[data-folhinha]', lugar).forEach((f, i) => {
    depois(500 + i * 200, () => {
      Som.tocar('tique');
      const pagina = $('[data-pagina]', f);
      const visto = $('[data-visto-folhinha]', f);
      if (pagina) void Movimento.arrancar(pagina);
      if (visto) depois(220, () => Mao.visto(visto, { tamanho: 26, semente: `folhinha${i}` }));
    });
  });
  depois(1900, () => {
    const lugarDoCarimbo = $('[data-carimbo-sanada]', lugar);
    if (lugarDoCarimbo) void Mao.bater(lugarDoCarimbo, 'Sanada', Mao.COR.verde, { aoContato: () => Som.tocar('carimbo') });
  });
  depois(2200, () => aviso && (aviso.textContent = 'No app, cada volta tem a sua data.'));
}

export function iniciar(): void {
  secao = $('[data-cena="errata"]')!;
  lugar = $('.errata__recorte', secao)!;
  montar();
  Cenas.registrar('errata', {
    objeto: (_c, animar) => entrar(animar),
    apagar: () => Mao.apagar(lugar, '.errata__marcada .rabisco'),
  });
  // Um erro novo na folha troca a questão da Errata na hora. Se a cena ainda não entrou, a troca entra com ela;
  // se já entrou, o recorte pousa de novo na próxima vez que a Errata aparecer.
  Rodada.on<{ certa: boolean; origem: string }>('resposta', (r) => {
    // Com o refazer já aberto, a questão da vez não troca debaixo da mão de quem responde.
    if (r.origem !== 'folha' || r.certa || respondida || !$('[data-refazer]', lugar)?.hidden) return;
    const proxima = daVez();
    if (proxima.item.id === atual?.item.id) return;
    montar();
    if (!secao.classList.contains('is-objeto')) return;
    entrar(false);
    Cenas.quandoVisivel(lugar, () => {
      if (!respondida && $('[data-refazer]', lugar)?.hidden) entrar(!calmo());
    });
  });
}
