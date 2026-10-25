// A 2ª etapa, a questão: uma questão real do banco, respondida num toque e corrigida à mão. Antes de qualquer
// sorteio, a folha já se responde (pt-193); depois, cada sorteio põe na folha a próxima questão da matéria, que
// vira à vista quando a folha aparece. O acerto sobe a escalada da convocação (o erro não zera); o erro vai para a Errata.
import { $, $$ } from '../base/dom';
import * as Folha from '../base/folha';
import * as Mao from '../base/mao';
import * as Movimento from '../base/movimento';
import { certaDe, folha as montarFolha, folhaAcabou } from '../base/pecas';
import * as Rodada from '../base/rodada';
import * as Som from '../base/som';
import { conteudo, daFolha, item as itemDe, materia, proximaDaMateria, questoes, totalDaFolha } from '../dados';
import type { Escolha, Item } from '../tipos';
import * as Abertura from './abertura';
import * as Cenas from './cenas';

let secao: HTMLElement;
let folhaEl: HTMLElement;
let destravar: () => void = () => undefined;
let itemAtual: Item | null = null;

function total(): number {
  return totalDaFolha(Rodada.estado.area);
}

/** Monta a folha de um item (ou o aviso de fim) e liga os toques. */
function montar(item: Item | null, fim?: string): void {
  const estado = Rodada.estado;
  itemAtual = item;
  if (!item) {
    folhaEl.innerHTML = folhaAcabou(fim ?? '', estado.folha.n, total());
    return;
  }
  folhaEl.innerHTML = montarFolha(item, materia(item.d), { n: estado.folha.n, total: total() });
  destravar();
}

/** O que a folha mostra depois de um sorteio: a próxima da matéria, ou o aviso de fim. */
function proximaFolha(d: string): { item: Item | null; fim?: string } {
  const estado = Rodada.estado;
  const daPagina = conteudo.roletas[estado.area].flatMap((m) => daFolha(m).map((q) => q.id));
  if (daPagina.every((id) => estado.vistas.includes(id))) {
    return { item: null, fim: `As ${daPagina.length} questões da página acabaram. No app, são ${conteudo.numeros.questoes.toLocaleString('pt-BR')}.` };
  }
  const item = proximaDaMateria(d, estado.vistas);
  if (!item) {
    const m = materia(d);
    return { item: null, fim: `As ${daFolha(d).length} questões de ${m.curto} desta página acabaram. No app, são ${m.banco.toLocaleString('pt-BR')}.` };
  }
  return { item };
}

/** Uma folha nova: o conteúdo troca por baixo e a folha em branco encolhe (som virar), à vista. */
function virarPara(item: Item | null, fim?: string): void {
  const estado = Rodada.estado;
  if (item) {
    estado.vistas.push(item.id);
    estado.folha = { id: item.id, n: estado.folha.n + 1, respondida: false };
  } else estado.folha.n += 1;
  Rodada.salvar();
  Cenas.quandoVisivel(folhaEl, () => {
    montar(item, fim);
    Folha.travar(folhaEl);
    if (Movimento.perfil() !== 'calmo') Som.tocar('virar');
    void Movimento.virarFolha(folhaEl);
  });
}

function desenharEscalada(animarNumero = false): void {
  const n = Rodada.estado.escalada;
  const caixas = $$('[data-caixinha]', secao);
  caixas.forEach((c, i) => {
    if (i < n && !c.querySelector('.rabisco')) Mao.visto(c, { animar: false, tamanho: 22, semente: `cx${i}` });
    if (i >= n) Mao.apagar(c);
  });
  const numero = $('[data-escalada-n]', secao);
  if (numero) {
    if (animarNumero) Movimento.contar(numero, n);
    else numero.textContent = String(n);
  }
}

function desenharBotao(): void {
  const b = $<HTMLButtonElement>('[data-ir-sortear]', secao);
  if (!b) return;
  b.hidden = false;
  b.textContent = Rodada.estado.escalada >= 3 ? 'Abrir a convocação' : Rodada.estado.sorteio ? 'Sortear de novo' : 'Sortear a matéria';
}

function responder(escolha: Escolha): void {
  const item = itemAtual;
  if (!item) return;
  const estado = Rodada.estado;
  const certa = escolha === certaDe(item);
  const escaladaDepois = certa ? Math.min(3, estado.escalada + 1) : estado.escalada;
  const aviso = certa ? (escaladaDepois >= 3 ? 'Convocação aberta.' : `${escaladaDepois} de 3 para a convocação.`) : 'Volta amanhã na Errata.';
  const miolo = $('.folha__miolo', folhaEl) ?? folhaEl;
  const { fim } = Folha.responder(miolo, item, escolha, { aviso });
  // O visto na próxima caixinha aos 450 ms; o número rola aos 1.000.
  if (certa) {
    const caixa = $$('[data-caixinha]', secao)[estado.escalada];
    if (caixa) setTimeout(() => Mao.visto(caixa, { tamanho: 22, semente: `cx${estado.escalada}` }), 450);
  }
  Rodada.registrarResposta(item, escolha, certa, 'folha');
  setTimeout(() => desenharEscalada(true), 1000);
  void fim.then(desenharBotao);
}

export function iniciar(): void {
  secao = $('[data-cena="questao"]')!;
  folhaEl = $('[data-folha]', secao)!;
  const estado = Rodada.estado;

  // A folha da rodada: a que estava (recarga na mesma aba) ou a primeira, já respondível sem sortear.
  const id = estado.folha.id ?? questoes.primeira;
  if (!estado.folha.id) {
    estado.folha = { id, n: 1, respondida: false };
    if (!estado.vistas.includes(id)) estado.vistas.push(id);
  }
  const anterior = estado.respostas.filter((r) => r.origem === 'folha' && r.id === id).pop();
  const item = itemDe(id);
  itemAtual = item;
  folhaEl.innerHTML = montarFolha(item, materia(item.d), { n: estado.folha.n, total: total(), ...(anterior ? { marcada: anterior.escolha } : {}) });
  destravar = Folha.aoEscolher(folhaEl, (escolha) => responder(escolha));
  desenharEscalada();
  desenharBotao();

  Cenas.registrar('questao', {
    objeto: (_c, animar) => {
      if (!animar) return;
      const pilha = $('.pilha', secao);
      if (pilha) void Movimento.pousar(pilha, { material: 'papel' }).then(() => Movimento.virarFolha(folhaEl));
    },
  });
  $('[data-ir-sortear]', secao)?.addEventListener('click', () => {
    if (Rodada.estado.escalada >= 3) void Movimento.rolarAte($('#convocacao')!, { focar: true });
    else void Abertura.irSortear();
  });
  Rodada.on<{ d: string | null }>('sorteio', (s) => {
    desenharBotao();
    if (!s.d) return;
    const { item: proxima, fim } = proximaFolha(s.d);
    virarPara(proxima, fim);
  });
  Rodada.on('area', () => {
    const primeira = conteudo.roletas[Rodada.estado.area].map((d) => proximaDaMateria(d, Rodada.estado.vistas)).find(Boolean) ?? null;
    virarPara(primeira);
  });
  Rodada.on('convocacao', () => {
    desenharEscalada();
    desenharBotao();
  });
}
