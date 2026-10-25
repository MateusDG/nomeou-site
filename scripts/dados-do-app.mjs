// Gera o que o site diz a partir do app (turno-concurso), para o site dizer o que o app tem:
// - assets/js/conteudo.js: as matérias do disco (a roleta geral) e os números do banco;
// - assets/js/rabisco.js: a gramática da margem (src/components/rabisco/geometria.ts), como script
//   clássico (o site abre também direto do disco, onde módulos ES não carregam);
// - no index.html, entre os marcadores: a marca, o disco já revelado em PT (o estado parado, sem
//   script), a grade do Diário de hoje, o 212 dos cargos e os números.
//
// Uso: node scripts/dados-do-app.mjs [pasta do app] [data do Diário, AAAA-MM-DD]
// Sem a data, vale o Diário de hoje (horário de Brasília).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire, register } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP = path.resolve(process.argv[2] ?? path.join(RAIZ, '..', 'turno-concurso'));
register('./lib/hooks-do-app.mjs', import.meta.url, { data: { app: APP } });

const { QUESTOES } = await import('@/data/questoes');
const { DISC, ROLETAS } = await import('@/data/disciplinas');
const { questoesDoDiario } = await import('@/game/selecao');
const { edicaoDiario } = await import('@/game/datas');
const { CONCURSOS } = await import('@/data/concursos');
const { chancesDoSorteio, textoDasChances } = await import('@/game/sorteio');

const hojeEmBrasilia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const dataDoDiario = process.argv[3] ?? hojeEmBrasilia;

const materia = (id) => ({ id, sigla: DISC[id].sigla, nome: DISC[id].nome, curto: DISC[id].curto, chapa: DISC[id].chapa });
const roleta = ROLETAS.geral.materias.map(materia);
if (roleta.length !== 6) throw new Error('A roleta geral precisa de 6 matérias (o disco tem 6 casas e a Convocação).');

// O catálogo que o app oferece hoje: a regra de situacaoHoje e escolhivel (src/game/concursos.ts), copiada
// aqui porque aquele módulo puxa o React Native. O concurso com a prova já feita sai, menos o de longo prazo.
const situacaoHoje = (c, dia) =>
  c.dataProva && dia > c.dataProva ? 'prova-realizada' : c.situacao === 'aberto' ? (c.inscricoesAte && dia > c.inscricoesAte ? 'encerrado' : 'aberto') : c.situacao;
const oferecidos = CONCURSOS.filter((c) => situacaoHoje(c, hojeEmBrasilia) !== 'prova-realizada' || c.longoPrazo);
const abertosHoje = oferecidos.filter((c) => situacaoHoje(c, hojeEmBrasilia) === 'aberto').length;
const numeros = {
  questoes: QUESTOES.length,
  materias: new Set(QUESTOES.map((q) => q.disciplina)).size,
  concursos: oferecidos.length,
  cargos: oferecidos.reduce((n, c) => n + (c.cargos?.length ?? 0), 0),
};

writeFileSync(
  path.join(RAIZ, 'assets', 'js', 'conteudo.js'),
  '// Gerado por scripts/dados-do-app.mjs a partir do app (turno-concurso). Não edite à mão.\n' +
    `window.NOMEOU_CONTEUDO = ${JSON.stringify({ geradoEm: hojeEmBrasilia, roleta, numeros }, null, 1)};\n`,
);

// A gramática da margem, do TypeScript do app para um script clássico (window.Rabisco).
const ts = createRequire(path.join(APP, 'package.json'))('typescript');
const fonte = readFileSync(path.join(APP, 'src', 'components', 'rabisco', 'geometria.ts'), 'utf8');
const js = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const nomes = [...js.matchAll(/^export (?:function|const) (\w+)/gm)].map((m) => m[1]);
const rabiscoJs =
  '// A gramática da margem do app (turno-concurso/src/components/rabisco/geometria.ts), transpilada por\n' +
  '// scripts/dados-do-app.mjs sem mudança de comportamento: mesma semente, mesmo traço. Não edite à mão.\n' +
  `(function () {\n${js.replace(/^export /gm, '')}\nwindow.Rabisco = { ${nomes.join(', ')} };\n})();\n`;
writeFileSync(path.join(RAIZ, 'assets', 'js', 'rabisco.js'), rabiscoJs);

// ---------------------------------------------------------------------------
// O index.html: o que dá para mostrar sem script sai impresso entre os marcadores.

const caixa = { window: {} };
caixa.globalThis = caixa.window;
vm.runInNewContext(rabiscoJs, caixa);
vm.runInNewContext(readFileSync(path.join(RAIZ, 'assets', 'js', 'disco.js'), 'utf8'), caixa);
const { Rabisco, Disco } = caixa.window;

const milhar = (n) => n.toLocaleString('pt-BR');
const pad = (n) => String(n).padStart(3, '0');

function trocar(html, nome, miolo) {
  const re = new RegExp(`(<!-- ${nome}:inicio -->)[\\s\\S]*?(<!-- ${nome}:fim -->)`);
  if (!re.test(html)) throw new Error(`Marcador ${nome} não encontrado no index.html.`);
  return html.replace(re, (todo, a, b) => a + miolo + b);
}

// O disco parado: a caneta a −5°, dentro da casa de PT, a casa pintada e o círculo de caneta nela.
const caixaPT = Disco.caixaDaCasa(0, roleta);
const circuloPT = Rabisco.circular(caixaPT.largura, caixaPT.altura, Rabisco.sementeDoTexto('PT'));
const disco = Disco.svg(roleta, { id: 'disco', angulo: -5, revelada: 0, gesto: circuloPT });

// A grade do Diário: a edição do dia e as siglas dela, com um resultado de exemplo (4 de 5).
const edicao = questoesDoDiario(dataDoDiario, 'geral');
const siglas = edicao.map((id) => DISC[QUESTOES.find((q) => q.id === id).disciplina].sigla);
const exemplo = [true, true, false, true, true];
const quadrados = exemplo.map((c, i) => `<span class="grade__q grade__q--${c ? 'certo' : 'errado'}" style="--q:${i}"></span>`).join('');
// Os tempos contam de quando a grade aparece: os quadrados (no CSS), o 4/5, e as linhas depois do círculo.
const grade =
  `\n        <p class="grade__fileira"><span class="grade__quadrados" role="img" aria-label="4 de 5 certas">${quadrados}</span>` +
  `<span class="grade__total" data-total aria-hidden="true"><span class="m m--dado" style="--d:600ms"><span>4/5</span></span></span></p>` +
  `\n        <p class="grade__edicao assenta" style="--d:1100ms">Diário do Nomeou nº ${pad(edicaoDiario(dataDoDiario))}</p>` +
  `\n        <p class="grade__siglas assenta" style="--d:1100ms">${siglas.join(' ')}</p>` +
  `\n        <p class="grade__convite assenta" style="--d:1100ms">Será que você gabarita? nomeou.app</p>\n        `;

// O 212: um algarismo por célula, cada um na sua máscara (o NumeroRolante do app); o leitor de tela lê o número.
const cargos = String(numeros.cargos)
  .split('')
  .map((d, i) => `<span class="m m--dado" style="--d:${i * 60}ms"><span>${d}</span></span>`)
  .join('');

// As chances: o disco (disco.js) desenha as casas do tamanho delas e as diz no rótulo; se o app mudar, avisa.
if (JSON.stringify(chancesDoSorteio(roleta.length)) !== JSON.stringify(Disco.CHANCES)) {
  throw new Error('As chances do app mudaram: atualize CHANCES e o rótulo do disco em assets/js/disco.js.');
}

const marca = readFileSync(path.join(APP, 'assets', 'marca', 'nomeou.svg'), 'utf8').match(/<path fill="#16161B" d="([^"]+)"/)?.[1];
if (!marca) throw new Error('Não achei o desenho da marca em assets/marca/nomeou.svg do app.');

let html = readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const simbolo = /(<symbol id="marca"[^>]*>\s*<g transform="translate\(8 8\)"><path fill="currentColor" d=")[^"]*(")/;
if (!simbolo.test(html)) throw new Error('Não achei o <symbol id="marca"> no index.html.');
html = html.replace(simbolo, (todo, a, b) => a + marca + b);
html = trocar(html, 'disco', `\n        ${disco}\n        `);
html = trocar(html, 'diario', grade);
html = trocar(html, 'cargos', `<span class="numero"><span class="sr">${numeros.cargos}</span><span aria-hidden="true">${cargos}</span></span>`);
html = trocar(html, 'situacao', abertosHoje ? 'pelo último edital ou com inscrições abertas.' : 'pelo último edital.');
html = trocar(html, 'fonte', `Fonte: sorteio do Nomeou. ${textoDasChances(roleta.length)}`);
html = html.replace(/<!-- numeros:(\w+) -->[^<]*<!-- \/numeros -->/g, (todo, nome) => `<!-- numeros:${nome} -->${milhar(numeros[nome])}<!-- /numeros -->`);
writeFileSync(path.join(RAIZ, 'index.html'), html);

console.log(`conteudo.js: roleta geral e números (${numeros.questoes} questões, ${numeros.concursos} concursos, ${numeros.cargos} cargos).`);
console.log(`rabisco.js: ${nomes.length} exportações.`);
console.log(`index.html: marca, disco revelado em PT, Diário nº ${pad(edicaoDiario(dataDoDiario))} (${dataDoDiario}: ${siglas.join(' ')}), cargos e números.`);
