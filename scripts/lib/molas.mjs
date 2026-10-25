// As molas do app (molaToque e molaCarimbo, em turno-concurso/src/theme/tokens.ts) viram curvas linear() para
// o site: a mesma física do withSpring do Reanimated, amostrada. O site não inventa mola; se o app mudar os
// números, o gerador regrava o CSS e o movimento.js com a curva nova.
//
// Uso no gerador:  const { css, js, valores } = gerarMolas(APP);
//                  texto = trocarEntreMarcadores(texto, '/* molas:inicio */', '/* molas:fim */', css);
// Sozinho (só imprime, não grava nada):  node scripts/lib/molas.mjs [pasta do app]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Passo da simulação: 0,1 ms. */
const PASSO = 1e-4;
/** Quanto simular: as molas do app assentam em menos de meio segundo; 3 s sobram. */
const DURACAO = 3;
/** "Assentou" é ficar a menos de 0,1% de 1 para sempre. */
const TOLERANCIA = 0.001;
/** 25 pontos: o bastante para a ultrapassagem e a volta, curto no CSS. */
const PONTOS = 25;

const MOLAS = [
  { token: 'molaToque', nome: 'toque' },
  { token: 'molaCarimbo', nome: 'carimbo' },
];

/** Lê { damping, stiffness, mass } de um token no texto de tokens.ts; para com erro se faltar algum. */
function lerMola(fonte, token) {
  const m = fonte.match(new RegExp(`\\b${token}\\s*:\\s*\\{([^}]*)\\}`));
  if (!m) throw new Error(`molas: ${token} não encontrado em src/theme/tokens.ts.`);
  const campo = (nome) => {
    const c = m[1].match(new RegExp(`\\b${nome}\\s*:\\s*(\\d+(?:\\.\\d+)?)`));
    if (!c) throw new Error(`molas: ${token} sem ${nome} em src/theme/tokens.ts.`);
    return Number(c[1]);
  };
  return { amortecimento: campo('damping'), rigidez: campo('stiffness'), massa: campo('mass') };
}

/** Simula a mola de 0 a 1, parada no começo, com Euler semi-implícito a cada 0,1 ms. */
function simular({ amortecimento: c, rigidez: k, massa: m }) {
  const n = Math.round(DURACAO / PASSO);
  const x = new Float64Array(n + 1);
  let pos = 0;
  let vel = 0;
  for (let i = 1; i <= n; i++) {
    vel += ((-k * (pos - 1) - c * vel) / m) * PASSO;
    pos += vel * PASSO;
    x[i] = pos;
  }
  return x;
}

const arredondar = (v) => Number(v.toFixed(3));

function medir(token, params, x) {
  // O último instante fora da faixa de 0,1%: dali em diante, fica dentro para sempre.
  let ultimoFora = 0;
  for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - 1) > TOLERANCIA) ultimoFora = i;
  if (ultimoFora >= x.length - 1) throw new Error(`molas: ${token} não assenta em ${DURACAO} s.`);
  const ms = Math.ceil(ultimoFora * PASSO * 1000);
  // A ultrapassagem e a segunda oscilação (a volta abaixo de 1): o "pop" e o quique que não pode aparecer.
  let pico = 0;
  let iPico = 0;
  for (let i = 0; i < x.length; i++) if (x[i] > pico) (pico = x[i]), (iPico = i);
  let vale = 1;
  for (let i = iPico; i < x.length; i++) if (x[i] < vale) vale = x[i];
  const amostras = [];
  for (let i = 0; i < PONTOS; i++) {
    if (i === 0) amostras.push(0);
    else if (i === PONTOS - 1) amostras.push(1);
    else amostras.push(arredondar(x[Math.min(x.length - 1, Math.ceil((((i / (PONTOS - 1)) * ms) / 1000 - 1e-9) / PASSO))]));
  }
  return {
    ...params,
    zeta: params.amortecimento / (2 * Math.sqrt(params.rigidez * params.massa)),
    ultrapassagem: (pico - 1) * 100,
    segunda: (1 - vale) * 100,
    ms,
    amostras,
    curva: `linear(${amostras.join(', ')})`,
  };
}

const virgula = (n) => String(n).replace('.', ',');

/**
 * Lê as duas molas do app e devolve:
 * - css: as quatro variáveis (--mola-toque, --mola-toque-ms, --mola-carimbo, --mola-carimbo-ms), uma por linha;
 * - js: a constante MOLAS do movimento.js ({ toque: { curva, ms }, carimbo: { curva, ms } });
 * - valores: { toque, carimbo }, cada um com os parâmetros, zeta, ultrapassagem e segunda (em %), ms e amostras.
 * Nenhum dos blocos leva os marcadores (trocarEntreMarcadores põe o miolo entre eles).
 */
export function gerarMolas(appDir) {
  const arquivo = path.join(path.resolve(appDir), 'src', 'theme', 'tokens.ts');
  const fonte = readFileSync(arquivo, 'utf8');
  const valores = {};
  for (const { token, nome } of MOLAS) {
    const params = lerMola(fonte, token);
    valores[nome] = medir(token, params, simular(params));
  }
  const css = MOLAS.flatMap(({ nome }) => [
    `--mola-${nome}: ${valores[nome].curva};`,
    `--mola-${nome}-ms: ${valores[nome].ms}ms;`,
  ]).join('\n');
  const origem = MOLAS.map(({ token, nome }) => {
    const v = valores[nome];
    return `${token}: amortecimento ${virgula(v.amortecimento)}, rigidez ${virgula(v.rigidez)}, massa ${virgula(v.massa)}`;
  }).join('; ');
  const js = [
    '// Gerado por scripts/lib/molas.mjs a partir de turno-concurso/src/theme/tokens.ts. Não edite à mão.',
    `// (${origem})`,
    'var MOLAS = {',
    ...MOLAS.map(({ nome }, i) => `  ${nome}: { curva: '${valores[nome].curva}', ms: ${valores[nome].ms} }${i < MOLAS.length - 1 ? ',' : ''}`),
    '};',
  ].join('\n');
  return { css, js, valores };
}

/**
 * Troca o que há entre os marcadores `inicio` e `fim` (que ficam) por `miolo`. O miolo vai em linhas próprias,
 * com o recuo da linha do marcador de início, e o fim volta para a linha de baixo com o mesmo recuo: rodar
 * de novo dá o mesmo texto. Para com erro se faltar um marcador, se houver mais de um par ou se o fim vier antes.
 */
export function trocarEntreMarcadores(texto, inicio, fim, miolo) {
  const a = texto.indexOf(inicio);
  if (a < 0) throw new Error(`Marcador ${inicio} não encontrado.`);
  if (texto.indexOf(inicio, a + inicio.length) >= 0) throw new Error(`Marcador ${inicio} aparece mais de uma vez.`);
  const b = texto.indexOf(fim, a + inicio.length);
  if (b < 0) throw new Error(`Marcador ${fim} não encontrado depois de ${inicio}.`);
  if (texto.indexOf(fim, b + fim.length) >= 0 || texto.lastIndexOf(fim, a) >= 0) throw new Error(`Marcador ${fim} aparece mais de uma vez.`);
  // O fim de linha do arquivo vale para o miolo (um checkout no Windows pode vir com CRLF).
  const quebra = texto.includes('\r\n') ? '\r\n' : '\n';
  const comecoDaLinha = texto.lastIndexOf('\n', a - 1) + 1;
  const recuo = (texto.slice(comecoDaLinha, a).match(/^[ \t]*/) || [''])[0];
  const linhas = String(miolo).replace(/\s+$/, '').split(/\r?\n/).map((l) => (l ? recuo + l : l));
  return texto.slice(0, a + inicio.length) + quebra + linhas.join(quebra) + quebra + recuo + texto.slice(b);
}

// Rodado direto: imprime os dois blocos e os números, sem gravar nada.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const app = path.resolve(process.argv[2] ?? path.join(raiz, '..', 'turno-concurso'));
  const { css, js, valores } = gerarMolas(app);
  for (const [nome, v] of Object.entries(valores)) {
    console.log(
      `${nome}: ζ ${v.zeta.toFixed(3)} · ultrapassagem ${v.ultrapassagem.toFixed(1)}% · segunda ${v.segunda.toFixed(2)}% · assenta em ${v.ms} ms`,
    );
  }
  console.log('\n/* css */\n' + css + '\n\n/* js */\n' + js);
}
