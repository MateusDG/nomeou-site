// As peças impressas da rodada, em texto (HTML e SVG): o selo, a foto 3×4, a folha de prova, o envelope e o
// ofício, a Errata, a grade do Diário, o edital, a primeira página e as mesas. São funções puras, sem DOM: o
// navegador monta e remonta com elas, e o gerador (scripts/dados-do-app.mjs) usa as mesmas para imprimir o
// estado sem JavaScript entre os marcadores do index.html.
import type { AreaId, Cargo, Escolha, Item, Materia, MateriaId } from '../tipos';

export const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const;
/** Os intervalos da Errata (src/game/selecao.ts): o erro volta amanhã, e cada acerto empurra 1, 3, 7 e 15 dias. */
export const INTERVALOS = [1, 1, 3, 7, 15] as const;

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const MESES_POR_EXTENSO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];

export function esc(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const dataDe = (aaaammdd: string): Date => new Date(`${aaaammdd.slice(0, 10)}T12:00:00`);
const somarDias = (data: Date, n: number): Date => {
  const d = new Date(data.getTime());
  d.setDate(d.getDate() + n);
  return d;
};
const doisDigitos = (n: number): string => String(n).padStart(2, '0');

/** "25 OUT", como o carimbo postal do app (dataDoCarimboPostal). */
export function dataPostal(aaaammdd: string): string {
  const d = dataDe(aaaammdd);
  return `${doisDigitos(d.getDate())} ${MESES[d.getMonth()]}`;
}
/** "25 OUT 2026", a fita do datador. */
export function dataDoCarimbo(aaaammdd: string): string {
  const d = dataDe(aaaammdd);
  return `${doisDigitos(d.getDate())} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
/** "DOMINGO, 25 DE OUTUBRO DE 2026", a linha de data do jornal. */
export function dataDoJornal(aaaammdd: string): string {
  const d = dataDe(aaaammdd);
  return `${DIAS[d.getDay()]}, ${d.getDate()} DE ${MESES_POR_EXTENSO[d.getMonth()]!.toUpperCase()} DE ${d.getFullYear()}`;
}

// ------------------------------------------------------------------ O selo postal (Selo.tsx)

export type EstadoDoSelo = 'emblema' | 'pendente' | 'carimbado';
export interface OpcoesDoSelo {
  estado?: EstadoDoSelo;
  /** O lado na tela, em px: a legenda "NOMEOU" e a data só a partir de 44. */
  lado?: number;
  legenda?: boolean;
  /** A data do carimbo postal (AAAA-MM-DD). */
  data?: string;
  classe?: string;
}

/** A sigla dentro da gravura (siglaDoSelo do app): 3 letras pedem corpo menor; a legenda sobe a sigla. */
function siglaDoSelo(sigla: string, comLegenda: boolean): { tamanho: number; y: number } {
  const longa = sigla.length >= 3;
  if (comLegenda) return longa ? { tamanho: 34, y: 62.5 } : { tamanho: 40, y: 64.5 };
  return longa ? { tamanho: 40, y: 66.5 } : { tamanho: 46, y: 69 };
}

/** O selo de uma matéria em SVG (viewBox 100): emblema, pendente (tracejado, sigla a lápis) ou carimbado. */
export function selo(m: Materia, opcoes: OpcoesDoSelo = {}): string {
  const estado = opcoes.estado ?? 'emblema';
  const legenda = opcoes.legenda !== false && (opcoes.lado ?? 88) >= 44;
  const s = siglaDoSelo(m.sigla, legenda && estado !== 'pendente');
  const classe = `selo selo--${estado}${opcoes.classe ? ` ${opcoes.classe}` : ''}`;
  const partes = [`<svg class="${classe}" viewBox="0 0 100 100" aria-hidden="true" style="--chapa:${esc(m.chapa)}">`];
  if (estado === 'pendente') {
    partes.push('<use href="#o-selo-picote"/>');
    partes.push(`<text x="50" y="${s.y}" text-anchor="middle" class="selo__sigla selo__sigla--lapis" font-size="${s.tamanho}">${esc(m.sigla)}</text>`);
  } else {
    partes.push('<use href="#o-selo-papel"/>');
    partes.push('<rect x="17" y="9" width="66" height="82" fill="var(--chapa)"/>');
    partes.push(`<text x="50" y="${s.y}" text-anchor="middle" class="selo__sigla" font-size="${s.tamanho}">${esc(m.sigla)}</text>`);
    if (legenda) partes.push('<text x="50" y="86" text-anchor="middle" class="selo__legenda">NOMEOU</text>');
    if (estado === 'carimbado') {
      // A data fica fora do símbolo (muda a cada dia), com o mesmo giro e a mesma tinta falhada do carimbo postal.
      const data =
        legenda && opcoes.data
          ? `<g transform="rotate(-9 74 23)" opacity=".78" mask="url(#falhas-postal)"><text x="74" y="24.8" text-anchor="middle" class="selo__data">${esc(dataPostal(opcoes.data))}</text></g>`
          : '';
      partes.push(`<g class="selo__postal" data-postal><use href="#o-carimbo-postal"/>${data}</g>`);
    }
  }
  partes.push('</svg>');
  return partes.join('');
}

// ------------------------------------------------------------------ A foto 3×4 com grampo (Foto34)

export function foto34(opcoes: { inicial?: string; chapa?: string; visitante?: boolean } = {}): string {
  const visitante = !!opcoes.visitante;
  const chapa = visitante ? '#FAF8F3' : opcoes.chapa ?? '#4DC3B5';
  return (
    `<svg class="foto34${visitante ? ' foto34--visitante' : ''}" viewBox="0 0 60 86" aria-hidden="true" style="--chapa:${esc(chapa)}">` +
    `<use href="#o-34"/><text class="foto34__inicial" x="30" y="58" text-anchor="middle" data-inicial>${esc(opcoes.inicial ?? '')}</text></svg>`
  );
}

// ------------------------------------------------------------------ A folha de prova (a questão)

/** A resposta certa de um item: o índice da alternativa, ou true/false no Certo ou Errado. */
export function certaDe(item: Item): Escolha {
  return item.tipo === 'ce' ? item.gabarito : item.correta;
}

/** O enunciado com o trecho da pegadinha marcado (o ondulado vermelho entra nele depois do erro). */
export function enunciado(item: Item): string {
  const texto = item.enunciado;
  const i = item.pegadinha ? texto.indexOf(item.pegadinha) : -1;
  if (!item.pegadinha || i < 0) return esc(texto);
  return `${esc(texto.slice(0, i))}<span class="pegadinha" data-pegadinha>${esc(item.pegadinha)}</span>${esc(texto.slice(i + item.pegadinha.length))}`;
}

export interface OpcoesDaFolha {
  /** A escolha já feita (estado respondido, sem JS). */
  marcada?: Escolha;
  /** Alternativas já descartadas (a errada, na Errata). */
  desabilitar?: Escolha[];
  n?: number;
  total?: number;
  aviso?: string;
}

/** As alternativas (ou Certo e Errado). Respondida: a marcada a caneta, a certa grifada e a errada riscada em CSS. */
export function alternativas(item: Item, opcoes: OpcoesDaFolha = {}): string {
  const respondida = opcoes.marcada !== undefined;
  const certa = certaDe(item);
  // O que o leitor de tela ouve além do nome: ", marcada, certa", ", certa" ou ", marcada, errada".
  const ditoDe = (valor: Escolha): string => {
    const partes: string[] = [];
    if (respondida && opcoes.marcada === valor) partes.push('marcada');
    if (respondida && certa === valor) partes.push('certa');
    else if ((respondida && opcoes.marcada === valor) || opcoes.desabilitar?.includes(valor)) partes.push(opcoes.desabilitar?.includes(valor) ? 'marcada antes, errada' : 'errada');
    return partes.length ? `, ${partes.join(', ')}` : '';
  };
  const classesDe = (valor: Escolha, base: string[]): string[] => {
    const c = [...base];
    if (respondida && opcoes.marcada === valor) c.push('is-marcada');
    if (respondida && certa === valor) c.push('is-certa');
    if ((respondida && opcoes.marcada === valor && certa !== valor) || opcoes.desabilitar?.includes(valor)) c.push('is-errada');
    return c;
  };
  if (item.tipo === 'ce') {
    const botoes = [true, false]
      .map((v) => {
        const classes = classesDe(v, ['botao', 'botao--contorno', 'ce__botao']);
        const dito = ditoDe(v);
        const rotulo = dito ? ` aria-label="${v ? 'Certo' : 'Errado'}${dito}"` : '';
        return `<button class="${classes.join(' ')}" type="button" data-ce="${v}"${rotulo}${respondida ? ' disabled' : ''}><span class="ce__rotulo">${v ? 'Certo' : 'Errado'}</span></button>`;
      })
      .join('');
    return `<div class="ce" role="group" aria-label="Certo ou Errado">${botoes}</div>`;
  }
  const linhas = item.alternativas
    .map((texto, i) => {
      const classes = classesDe(i, ['alternativa']);
      const desabilitada = respondida || !!opcoes.desabilitar?.includes(i);
      const bolha = `<span class="bolha${respondida && opcoes.marcada === i ? ' is-marcada' : ''}" aria-hidden="true">${LETRAS[i]}</span>`;
      return (
        `<li><button class="${classes.join(' ')}" type="button" data-i="${i}" aria-label="${LETRAS[i]}: ${esc(texto)}${ditoDe(i)}"${desabilitada ? ' disabled' : ''}>` +
        `${bolha}<span class="alternativa__texto" aria-hidden="true">${esc(texto)}</span></button></li>`
      );
    })
    .join('');
  return `<ol class="alternativas">${linhas}</ol>`;
}

/** A linha de resultado (46 px reservados): o carimbo ACERTOU ou o ERROU impresso. */
export function linhaDeResultado(certa: boolean | null): string {
  return (
    '<div class="resultado-linha" tabindex="-1" data-resultado-linha>' +
    `<span class="resultado-linha__carimbo" data-carimbo>${certa === true ? '<span class="carimbo-estatico">Acertou</span>' : ''}</span>` +
    `<span class="resultado-linha__errou" data-errou${certa === false ? '' : ' hidden'}>Errou</span>` +
    '<span class="sr" data-resultado-sr></span>' +
    '</div>'
  );
}

/** O depois da resposta: a regra à mão, o comentário com o fim de matéria e a linha do que vem. */
export function depois(item: Item, certa: boolean | null, aviso = ''): string {
  const aberto = certa !== null;
  const nota = item.margem
    ? `<p class="nota${certa === false ? ' nota--erro' : ''}${aberto ? ' is-escrita' : ''}" data-nota>${esc(item.margem)}</p>`
    : '';
  return (
    `<div class="folha__depois" data-depois${aberto ? '' : ' hidden'}>${nota}` +
    `<p class="comentario">${esc(item.explicacao)}<span class="fim-de-materia" aria-hidden="true"></span></p>` +
    `<p class="folha__aviso" data-aviso>${esc(aviso)}</p></div>`
  );
}

/** A folha de prova inteira, aberta para responder ou já respondida. */
export function folha(item: Item, m: Materia, opcoes: OpcoesDaFolha = {}): string {
  const certa = opcoes.marcada !== undefined ? opcoes.marcada === certaDe(item) : null;
  const estilo = [item.estilo, item.nivel].filter(Boolean).join(' · ');
  return (
    `<div class="folha__tira" aria-hidden="true">AMOSTRA · QUESTÃO <span data-folha-n>${opcoes.n ?? 1}</span> DE ${opcoes.total ?? 12}</div>` +
    '<div class="folha__miolo">' +
    `<header class="folha__cabeca">${selo(m, { lado: 32, legenda: false, classe: 'folha__selo' })}` +
    `<span class="folha__materia">${esc(m.nome)}</span><span class="folha__estilo">${esc(estilo)}</span></header>` +
    `<p class="folha__enunciado" id="folha-enunciado">${enunciado(item)}</p>` +
    alternativas(item, opcoes) +
    linhaDeResultado(certa) +
    depois(item, certa, opcoes.aviso) +
    '</div>'
  );
}

/** O aviso de fim (sem questão nova da matéria, ou sem nenhuma na página). */
export function folhaAcabou(texto: string, n: number, total: number): string {
  return (
    `<div class="folha__tira" aria-hidden="true">AMOSTRA · QUESTÃO <span data-folha-n>${n}</span> DE ${total}</div>` +
    `<div class="folha__miolo folha__miolo--fim"><p class="folha__fim">${esc(texto)}</p></div>`
  );
}

// ------------------------------------------------------------------ O envelope pardo e o ofício (Envelope.tsx)

export type OrigemDaConvocacao = 'amostra' | 'treino';

export function envelope(opcoes: { origem?: OrigemDaConvocacao; aberto?: boolean } = {}): string {
  const remetente = `OFÍCIO DE CONVOCAÇÃO · ${opcoes.origem === 'treino' ? 'DUELO DE TREINO' : 'AMOSTRA'}`;
  return (
    `<div class="envelope${opcoes.aberto ? ' is-aberto' : ''}" data-envelope>` +
    '<svg class="envelope__sombra" viewBox="0 0 520 340" aria-hidden="true"><use href="#o-envelope-sombra"/></svg>' +
    '<div class="envelope__corpo"><svg viewBox="0 0 520 340" aria-hidden="true"><use href="#o-envelope-corpo"/></svg>' +
    `<p class="envelope__remetente" aria-hidden="true" data-remetente>${remetente}</p></div>` +
    '<div class="envelope__aba" data-aba><svg viewBox="0 0 520 340" aria-hidden="true">' +
    '<use class="envelope__frente" href="#o-envelope-aba"/><use class="envelope__avesso" href="#o-envelope-aba-avesso"/></svg></div>' +
    // As metades do lacre ocupam o envelope inteiro (o desenho mora nas coordenadas dele); o toque é só no lacre.
    '<span class="envelope__lacre" data-lacre aria-hidden="true">' +
    '<svg class="lacre lacre--e" viewBox="0 0 520 340"><use href="#o-lacre-esquerda"/></svg>' +
    '<svg class="lacre lacre--d" viewBox="0 0 520 340"><use href="#o-lacre-direita"/></svg></span>' +
    '<span class="envelope__toque" data-toque-lacre aria-hidden="true"></span>' +
    '</div>'
  );
}

/** O ofício: o fio duplo, a tarja CONVOCAÇÃO, a escolha dos selos e o lugar da Questão do selo. */
export function oficio(aOferecer: Materia[], questao = ''): string {
  const escolha = aOferecer
    .map(
      (m) =>
        `<li><button class="oficio__selo" type="button" data-materia="${esc(m.id)}" aria-label="${esc(`${m.selo}, ${m.nome}`)}">` +
        `<span class="oficio__selo-papel">${selo(m, { lado: 120 })}</span><span class="oficio__selo-nome" aria-hidden="true">${esc(m.selo)}</span></button></li>`,
    )
    .join('');
  return (
    '<div class="oficio" data-oficio>' +
    '<div class="oficio__fio" aria-hidden="true"></div>' +
    '<p class="oficio__tarja" aria-hidden="true" data-tarja>CONVOCAÇÃO</p>' +
    `<div class="oficio__escolha" data-escolha${questao ? ' hidden' : ''}><p class="sub oficio__titulo" tabindex="-1" data-titulo-escolha>Escolha a matéria.</p>` +
    `<ol class="oficio__selos">${escolha}</ol></div>` +
    `<div class="oficio__questao" data-questao-selo${questao ? '' : ' hidden'}>${questao}</div>` +
    '</div>'
  );
}

/** A Questão do selo: o chapéu, o item de Certo ou Errado, a linha de resultado e o selo em jogo. */
export function questaoDoSelo(item: Item, m: Materia, opcoes: { marcada?: Escolha; data?: string } = {}): string {
  const certa = opcoes.marcada !== undefined ? opcoes.marcada === certaDe(item) : null;
  const estado: EstadoDoSelo = certa === true ? 'carimbado' : certa === false ? 'pendente' : 'emblema';
  const legenda = certa === true ? `${esc(m.selo)}.` : certa === false ? 'O selo fica para a próxima convocação.' : '';
  return (
    `<p class="chapeu" tabindex="-1" data-titulo-questao>Questão do selo · ${esc(m.nome)}</p>` +
    '<div class="oficio__item">' +
    `<span class="oficio__em-jogo" data-selo-em-jogo>${selo(m, { lado: 72, estado, ...(opcoes.data ? { data: opcoes.data } : {}) })}</span>` +
    `<p class="oficio__enunciado">${enunciado(item)}</p></div>` +
    alternativas(item, opcoes.marcada !== undefined ? { marcada: opcoes.marcada } : {}) +
    linhaDeResultado(certa) +
    `<p class="oficio__legenda" data-legenda>${legenda}</p>` +
    '<button class="botao botao--texto oficio__outra" type="button" data-outra hidden>Outra convocação</button>'
  );
}

// ------------------------------------------------------------------ A Errata

/** As folhinhas de parede, com as datas contadas de hoje, e o SANADA depois da última. */
export function folhinhas(hoje: string): string {
  const base = dataDe(hoje);
  const rotulos = ['amanhã', '1 dia', '3 dias', '7 dias', '15 dias'];
  let dia = 0;
  const itens = INTERVALOS.map((n, i) => {
    dia += n;
    const d = somarDias(base, dia);
    return (
      `<li class="folhinha" style="--vao:${i === 0 ? 0 : n}" data-folhinha>` +
      '<span class="folhinha__bloco" aria-hidden="true"><svg class="folhinha__costura" viewBox="0 0 64 10"><use href="#o-costura"/></svg>' +
      '<span class="folhinha__pagina folhinha__pagina--baixo"><span class="folhinha__visto" data-visto-folhinha></span></span>' +
      `<span class="folhinha__pagina" data-pagina><span class="folhinha__mes">${MESES[d.getMonth()]}</span><span class="folhinha__dia">${d.getDate()}</span></span></span>` +
      `<span class="folhinha__rotulo">${rotulos[i]}</span><span class="sr">, ${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}</span></li>`
    );
  }).join('');
  return (
    '<ol class="folhinhas" data-folhinhas aria-label="Quando a questão errada volta: amanhã e, depois de cada acerto, 1, 3, 7 e 15 dias.">' +
    itens +
    '<li class="folhinhas__sanada"><span class="folhinhas__carimbo" data-carimbo-sanada><span class="carimbo-estatico">Sanada</span></span><span class="sr">Depois, sai sanada.</span></li>' +
    '</ol>'
  );
}

/** O recorte da Errata: a questão errada com a marcada riscada e a regra à mão, e as folhinhas. */
export function errata(item: Item, m: Materia, marcada: Escolha, hoje: string): string {
  const textoMarcado = item.tipo === 'ce' ? (marcada ? 'Certo' : 'Errado') : item.alternativas[marcada as number];
  const letra = item.tipo === 'ce' ? (marcada ? 'C' : 'E') : LETRAS[marcada as number];
  return (
    '<div class="recorte errata__folha" data-recorte-errata>' +
    `<p class="chapeu">Errata · ${esc(m.nome)}</p>` +
    `<p class="recorte__enunciado">${enunciado(item)}</p>` +
    `<p class="errata__marcada"><span class="bolha is-marcada" aria-hidden="true">${letra}</span><span class="sr">Marcada antes, errada: </span>` +
    `<s class="errata__riscada" data-risco-errata>${esc(textoMarcado)}</s></p>` +
    (item.margem ? `<p class="nota nota--erro is-escrita" data-nota-errata>${esc(item.margem)}</p>` : '') +
    '<div class="errata__refazer" data-refazer hidden></div>' +
    '<p class="errata__aviso" data-errata-aviso></p>' +
    '<button class="botao botao--cheio errata__botao" type="button" data-responder-de-novo hidden>Responder de novo</button>' +
    '</div>' +
    folhinhas(hoje)
  );
}

// ------------------------------------------------------------------ A grade do Diário

export interface RespostaDaGrade {
  certa: boolean;
  d: MateriaId;
}

/** O que a grade precisa saber das matérias para escrever a linha do Diário. */
export interface DadosDoDiario {
  materias: Record<MateriaId, Materia>;
  roletas: Record<AreaId, MateriaId[]>;
}

/** O nome da área no Diário do app (DIARIO_DA_ROLETA): só a Saúde e a TI têm. */
const DIARIO_DA_AREA: Partial<Record<AreaId, string>> = { saude: 'Saúde', ti: 'TI' };

/**
 * A linha das matérias do Diário, na regra do compartilhar do app (roletaDasMaterias e textoDiario): matérias todas
 * de uma roleta própria, com ao menos uma fora da geral, saem pelo nome curto, sem repetir, juntas com " · ", e a área
 * vai no título ("a sigla de Vigilância ou Governança não diz nada fora do app"). Se não, as siglas com espaço.
 */
export function linhaDoDiario(ds: MateriaId[], dados: DadosDoDiario): { area: string | null; materias: string } {
  const propria = (['saude', 'ti'] as const).find(
    (r) => ds.length > 0 && ds.every((d) => dados.roletas[r].includes(d)) && ds.some((d) => !dados.roletas.geral.includes(d)),
  );
  const area = propria ? (DIARIO_DA_AREA[propria] ?? null) : null;
  const materias = area ? [...new Set(ds)].map((d) => dados.materias[d]!.curto).join(' · ') : ds.map((d) => dados.materias[d]!.sigla).join(' ');
  return { area, materias };
}

/** A grade de compartilhar: os quadrados (tracejados os que faltam), o total circulado, as siglas e o convite. */
export function grade(respostas: RespostaDaGrade[], exemplo: { numero: number; materias: MateriaId[] }, dados: DadosDoDiario): string {
  const ehExemplo = respostas.length === 0;
  const lista = ehExemplo ? exemplo.materias.map((d, i) => ({ certa: i !== 2, d })) : respostas.slice(0, 5);
  const linha = linhaDoDiario(lista.map((r) => r.d), dados);
  const certas = lista.filter((r) => r.certa).length;
  const quadrados = [0, 1, 2, 3, 4]
    .map((i) => {
      const r = lista[i];
      const tipo = r ? (r.certa ? 'certo' : 'errado') : 'falta';
      return `<span class="grade__q grade__q--${tipo}" style="--q:${i}"></span>`;
    })
    .join('');
  const titulo = (ehExemplo ? `Diário do Nomeou nº ${String(exemplo.numero).padStart(3, '0')}` : 'Nomeou · rodada de amostra') + (linha.area ? ` · ${linha.area}` : '');
  return (
    `<p class="grade__titulo">${esc(titulo)}</p>` +
    `<p class="grade__fileira"><span class="grade__quadrados" role="img" aria-label="${certas} de ${lista.length} certas">${quadrados}</span>` +
    `<span class="grade__total" data-total aria-hidden="true"><span class="m m--dado" style="--d:600ms"><span>${certas}/${lista.length}</span></span></span></p>` +
    `<p class="grade__siglas assenta" style="--d:1100ms">${esc(linha.materias)}</p>` +
    '<p class="grade__convite assenta" style="--d:1100ms">Será que você gabarita? nomeou.app</p>'
  );
}

/** O texto para mandar no grupo, no formato do compartilhar do app (os quadrados coloridos só no texto). */
export function textoDaGrade(respostas: RespostaDaGrade[], dados: DadosDoDiario): string {
  const lista = respostas.slice(0, 5);
  const certas = lista.filter((r) => r.certa).length;
  const linha = linhaDoDiario(lista.map((r) => r.d), dados);
  return [
    `Nomeou · rodada de amostra${linha.area ? ` · ${linha.area}` : ''}`,
    `${lista.map((r) => (r.certa ? '\u{1F7E9}' : '\u{1F7E5}')).join('')}  ${certas}/${lista.length}`,
    linha.materias,
    'Será que você gabarita? https://nomeou.app',
  ].join('\n');
}

// ------------------------------------------------------------------ O edital verticalizado

export function edital(cargos: Cargo[], marcado = 0): string {
  const c = cargos[marcado];
  if (!c) return '';
  const fichas = cargos
    .map(
      (g, i) =>
        `<button class="botao botao--contorno botao--baixo ficha" type="button" role="radio" aria-checked="${i === marcado}" data-cargo="${i}">${esc(`${g.sigla} · ${g.cargo} · ${g.banca}`)}</button>`,
    )
    .join('');
  // Como o app (linhaSemQuestoes, que nunca encurta): as matérias do edital que o banco ainda não cobre.
  const sem = c.materias.filter((mm) => mm.semQuestoes).map((mm) => mm.nome);
  const listaDe = (nomes: string[]): string => (nomes.length === 1 ? nomes[0]! : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`);
  const linhas = c.materias
    .map(
      (mm, i) =>
        `<li class="verticalizado__linha" style="--chapa:${esc(mm.chapa)}; --pct:${(mm.pct / 100).toFixed(3)}; --i:${i}">` +
        `<span class="verticalizado__nome">${esc(mm.nome)}</span><span class="verticalizado__barra" aria-hidden="true"><span></span></span>` +
        `<span class="verticalizado__pct">${mm.pct}%</span></li>`,
    )
    .join('');
  return (
    `<div class="fichas" role="radiogroup" aria-label="Cargos de exemplo" data-fichas>${fichas}</div>` +
    `<p class="edital__formato" data-formato><span class="m"><span>${esc(c.formato)}</span></span></p>` +
    `<ol class="verticalizado" data-verticalizado aria-label="As matérias da prova e o peso de cada uma">${linhas}</ol>` +
    (sem.length ? `<p class="edital__sem" data-sem>Ainda sem questões no Nomeou: ${esc(listaDe(sem))}.</p>` : '') +
    `<p class="nota" data-nota${c.nota ? '' : ' hidden'}>${esc(c.nota ?? '')}</p>`
  );
}

// ------------------------------------------------------------------ A primeira página (o Resultado)

export interface SeloGanho {
  m: Materia;
  data: string;
}

export function jornal(opcoes: { extra: boolean; selos: SeloGanho[]; pendentes: Materia[]; respostas: number; hoje: string }): string {
  const { extra, selos } = opcoes;
  const recorte = [0, 1, 2]
    .map((i) => {
      const s = selos[i];
      const m = s ? s.m : (opcoes.pendentes[i - selos.length] ?? opcoes.pendentes[0]!);
      const desenho = s ? selo(m, { lado: 96, estado: 'carimbado', data: s.data }) : selo(m, { lado: 96, estado: 'pendente' });
      return `<li class="jornal__selo">${desenho}<span class="sr">${esc(m.selo)}, ${s ? 'ganho' : 'pendente'}.</span></li>`;
    })
    .join('');
  const nomes = selos.map((s) => s.m.selo.replace(/^Selo d[oa] /, ''));
  const nomesFrase = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}.` : nomes.length ? `${nomes[0]}.` : '';
  const cabeca = extra
    ? '<div class="jornal__tarja" aria-hidden="true" data-tarja><svg class="jornal__registro" viewBox="0 0 20 20"><use href="#o-registro"/></svg>' +
      '<span class="jornal__tarja-texto">EDIÇÃO EXTRA</span><svg class="jornal__registro" viewBox="0 0 20 20"><use href="#o-registro"/></svg></div>' +
      '<p class="jornal__data jornal__data--extra">DIÁRIO DO NOMEOU · JOGO DE ESTUDO</p>'
    : `<header class="jornal__cabeca"><p class="jornal__nome">Diário do Nomeou</p><p class="jornal__data">JOGO DE ESTUDO · ${esc(dataDoJornal(opcoes.hoje))} · Nº 001</p></header>`;
  return (
    cabeca +
    '<h2 class="jornal__manchete" id="resultado-titulo" tabindex="-1">' +
    '<span class="jornal__branco" data-branco><span class="jornal__fio" aria-hidden="true"></span><span class="sr">Seu nome</span></span> ' +
    `<span data-manchete-resto>${extra ? 'vence o duelo de treino.' : 'se inscreve no Nomeou.'}</span></h2>` +
    '<p class="jornal__rotulo" data-rotulo-nome>Seu nome na manchete. Fica só nesta página.</p>' +
    '<div class="jornal__corpo">' +
    `<div class="jornal__retrato"><span class="jornal__foto" data-foto-visitante>${foto34({ visitante: true })}</span>` +
    `<p class="jornal__fina">${extra ? `3 selos em ${opcoes.respostas} questões.` : 'Duelo de treino · Uns 6 minutos.'}</p></div>` +
    `<div class="recorte jornal__recorte"><ol class="jornal__selos">${recorte}</ol>` +
    (nomesFrase ? `<p class="jornal__nomes" aria-hidden="true">${esc(nomesFrase)}</p>` : '') +
    '<p class="jornal__regra">No duelo, leva quem junta 6 selos primeiro.</p>' +
    (extra ? '<p class="jornal__linha-nome"><span data-linha-nome>Você · 3 selos</span></p>' : '') +
    '<span class="jornal__carimbo" data-carimbo-publicado></span></div></div>' +
    (extra ? '<div class="jornal__cmyk" aria-hidden="true"><svg viewBox="0 0 36 9"><use href="#o-cmyk"/></svg></div>' : '')
  );
}

// ------------------------------------------------------------------ A faixa das matérias

export function faixa(materias: Record<MateriaId, Materia>, roletas: Record<'geral' | 'saude' | 'ti', MateriaId[]>, rotulos: Record<'geral' | 'saude' | 'ti', string>): string {
  const fora = (ids: MateriaId[]): MateriaId[] => ids.filter((id) => !roletas.geral.includes(id));
  const grupos = [
    { rotulo: rotulos.geral, ids: roletas.geral },
    { rotulo: rotulos.saude, ids: fora(roletas.saude) },
    { rotulo: rotulos.ti, ids: fora(roletas.ti) },
  ];
  return grupos
    .map(
      (g, i) =>
        `<div class="tira__grupo" role="group" aria-labelledby="tira-rotulo-${i}"><p class="tira__rotulo" id="tira-rotulo-${i}">${esc(g.rotulo)}</p><div class="tira__selos">` +
        g.ids
          .map((id) => {
            const m = materias[id]!;
            return `<button class="tira__selo" type="button" data-materia="${esc(id)}" aria-pressed="${id === g.ids[0] && g === grupos[0]}" aria-label="${esc(`${m.selo}, ${m.nome}`)}">${selo(m)}</button>`;
          })
          .join('') +
        '</div></div>',
    )
    .join('');
}

export function linhaDaFaixa(m: Materia): string {
  return esc(`${m.selo} · ${m.nome} · ${m.banco.toLocaleString('pt-BR')} questões no app.`);
}

// ------------------------------------------------------------------ As mesas (atores parados; o movimento vem de pagina/)

interface OpcoesDoAtor {
  material: 'papel' | 'plastico' | 'madeira' | 'impresso';
  classe?: string;
  vars: Record<string, string | number>;
}
function ator(opcoes: OpcoesDoAtor, corpo: string, sombra = ''): string {
  const estilo = Object.entries(opcoes.vars)
    .map(([k, v]) => `--${k}:${v}`)
    .join('; ');
  return (
    `<div class="ator${opcoes.classe ? ` ${opcoes.classe}` : ''}" data-material="${opcoes.material}" style="${estilo}">` +
    `<div class="ator__pose">${sombra}<div class="ator__corpo">${corpo}</div></div></div>`
  );
}
function usar(id: string, viewBox: string, classe = ''): string {
  return `<svg class="${classe}" viewBox="${viewBox}" aria-hidden="true"><use href="#${id}"/></svg>`;
}

/** A folhinha da mesa do fecho, desenhada como os outros objetos: a página de amanhã, o dia em que o erro volta. */
function folhinhaDaMesa(hoje: string): string {
  const d = somarDias(dataDe(hoje), 1);
  return (
    '<svg class="folhinha-da-mesa" viewBox="0 0 66 77" aria-hidden="true">' +
    '<rect x="1" y="11" width="64" height="66" fill="var(--sombra)"/>' +
    '<rect x="0.5" y="10.5" width="64" height="65" fill="var(--folha)" stroke="var(--fio-forte)"/>' +
    '<use href="#o-costura" width="64" height="10"/>' +
    `<text class="folhinha-da-mesa__mes" x="32.5" y="32" text-anchor="middle">${MESES[d.getMonth()]}</text>` +
    `<text class="folhinha-da-mesa__dia" x="32.5" y="66" text-anchor="middle">${d.getDate()}</text></svg>`
  );
}

/** A mesa do fecho: a papelaria espalhada em volta da manchete (posições em % da faixa). */
export function mesaFecho(materias: Record<MateriaId, Materia>, selos: SeloGanho[], hoje: string): string {
  const primeiro = selos[0] ? selo(selos[0].m, { estado: 'carimbado', data: selos[0].data }) : selo(materias['portugues']!);
  const segundo = selos[1] ? selo(selos[1].m, { estado: 'carimbado', data: selos[1].data }) : selo(materias['constitucional']!);
  const sombraDoSelo = usar('o-selo-sombra', '0 0 100 100', 'ator__sombra');
  return [
    ator({ material: 'plastico', classe: 'ator--bic', vars: { px: '78%', py: '16%', w: '240px', wc: '168px', r: '28deg', k: 80, g: 3, ordem: 1340 } }, usar('o-bic', '0 0 240 28'), usar('o-bic-sombra', '0 0 240 28', 'ator__sombra')),
    ator({ material: 'papel', vars: { px: '62%', py: '12%', w: '96px', wc: '72px', r: '0deg', k: 35, g: 1, ordem: 160 } }, usar('o-xicara', '0 0 96 64'), usar('o-xicara-sombra', '0 0 96 64', 'ator__sombra')),
    ator({ material: 'papel', classe: 'ator--tablet', vars: { px: '32%', py: '10%', w: '64px', wc: '64px', r: '4deg', k: 50, g: 2, ordem: 320 } }, folhinhaDaMesa(hoje)),
    ator({ material: 'papel', vars: { px: '14%', py: '22%', w: '110px', wc: '76px', r: '-9deg', k: 60, g: 3, ordem: 0 } }, primeiro, sombraDoSelo),
    ator({ material: 'papel', classe: 'ator--largo', vars: { px: '8%', py: '56%', w: '96px', wc: '76px', r: '7deg', k: 40, g: 2, ordem: 640 } }, segundo, sombraDoSelo),
    ator({ material: 'papel', vars: { px: '18%', py: '82%', w: '84px', wc: '64px', r: '-5deg', k: 30, g: 2, ordem: 480 } }, foto34({ visitante: true }), usar('o-34-sombra', '0 0 60 86', 'ator__sombra')),
    ator({ material: 'papel', classe: 'ator--tablet', vars: { px: '64%', py: '88%', w: '140px', wc: '140px', r: '-3deg', k: 25, g: 1, ordem: 800 } }, usar('o-folha-dobrada', '0 0 140 100'), usar('o-folha-dobrada-sombra', '0 0 140 100', 'ator__sombra')),
    ator({ material: 'plastico', vars: { px: '84%', py: '80%', w: '180px', wc: '120px', r: '-14deg', k: 70, g: 2, ordem: 960 } }, usar('o-marca-texto', '0 0 150 40'), usar('o-marca-texto-sombra', '0 0 150 40', 'ator__sombra')),
    ator({ material: 'madeira', classe: 'ator--largo', vars: { px: '90%', py: '48%', w: '96px', wc: '72px', r: '0deg', k: 20, g: 1, ordem: 1120 } }, usar('o-datador', '0 0 100 130'), usar('o-datador-sombra', '0 0 100 130', 'ator__sombra')),
  ].join('');
}
