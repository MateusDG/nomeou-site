// O som do site, a partir do app (turno-concurso), para o gerador (scripts/dados-do-app.mjs):
// - a mesa de som (src/game/mesaDeSom.ts) como script clássico (window.MesaDeSom), transpilada sem
//   mudança de comportamento: o site decide o que toca, quando e qual variante como o app decide;
// - o teto (TETO_DE_SONS) lido do próprio src/game/duelo.ts, no lugar da importação;
// - os volumes (o literal VOLUME de src/services/som.ts, por expressão regular: aquele arquivo puxa o
//   expo-audio e não roda no Node);
// - a lista dos .wav que o site usa, para copiar para assets/sons (sem a fanfarra: vitoria não vem).
//
// Não grava nada: devolve o texto e a lista, e quem chama grava no fim, depois de todas as conferências.
// Quem chama já registrou os ganchos de hooks-do-app.mjs (o '@/game/duelo' vem por eles).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire, register } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';

/** Os arquivos do site (seção 10 da especificação), sem extensão. Cada um precisa existir no app. */
export const ARQUIVOS_DO_SITE = [
  'acerto', 'bolha', 'bolha2', 'bolha3', 'caneta', 'caneta2', 'caneta3', 'carimbo', 'clique1', 'clique2', 'clique3',
  'grampo', 'picote', 'pires', 'rotativa', 'selo', 'tique1', 'tique2', 'tique3', 'toc', 'virar', 'virar2', 'virar3',
];

// O duelo.ts chega ao src/services/monetizacao.ts, que importa o Platform do react-native (o pacote não
// carrega no Node). Para ler o teto basta um Platform de mentira: este gancho só troca o 'react-native'.
const GANCHO_DO_REACT_NATIVE =
  'data:text/javascript,' +
  encodeURIComponent(
    "const RN='data:text/javascript,'+encodeURIComponent(\"export const Platform={OS:'web',select:(o)=>('web' in o?o.web:o.default)};export default {};\");" +
      "export async function resolve(e,c,p){return e==='react-native'?{url:RN,shortCircuit:true}:p(e,c);}",
  );
let ganchoRegistrado = false;

const erro = (msg) => {
  throw new Error(`Som: ${msg}`);
};

/** O literal `{ chave: número, … }` de uma constante de src/services/som.ts. */
function lerNumeros(fonte, nome) {
  const m = fonte.match(new RegExp(`(?:export )?const ${nome}\\b[^=]*=\\s*\\{([^}]*)\\}`));
  if (!m) erro(`não achei o literal ${nome} em src/services/som.ts.`);
  const pares = [...m[1].matchAll(/^\s*(\w+)\s*:\s*([\d.]+)\s*,?\s*$/gm)].map((p) => [p[1], Number(p[2])]);
  if (!pares.length || pares.some(([, v]) => !Number.isFinite(v))) erro(`o literal ${nome} de src/services/som.ts mudou de forma.`);
  return Object.fromEntries(pares);
}

/** A lista `['a', 'b']` de uma constante de src/services/som.ts. */
function lerLista(fonte, nome) {
  const m = fonte.match(new RegExp(`(?:export )?const ${nome}\\b[^=]*=\\s*\\[([^\\]]*)\\]`));
  if (!m) erro(`não achei a lista ${nome} em src/services/som.ts.`);
  return [...m[1].matchAll(/'(\w+)'/g)].map((p) => p[1]);
}

/**
 * Prepara o som do site a partir do app. Devolve:
 * - mesaDeSomJs: o texto de assets/js/mesa-de-som.js (window.MesaDeSom e window.VOLUMES_DO_SOM);
 * - volumes: { som: volume } só dos sons que o site toca (os mesmos de window.VOLUMES_DO_SOM);
 * - arquivos: [{ de, para }] dos .wav a copiar (caminhos absolutos).
 */
export async function prepararSom({ APP, RAIZ }) {
  if (!APP || !RAIZ) erro('prepararSom precisa de { APP, RAIZ }.');
  const ts = createRequire(path.join(APP, 'package.json'))('typescript');

  // O teto, do próprio módulo do app (nunca copiado à mão).
  if (!ganchoRegistrado) {
    register(GANCHO_DO_REACT_NATIVE);
    ganchoRegistrado = true;
  }
  const { TETO_DE_SONS } = await import('@/game/duelo');
  if (!TETO_DE_SONS || !Number.isFinite(TETO_DE_SONS.sons) || !Number.isFinite(TETO_DE_SONS.janela)) erro('TETO_DE_SONS sumiu de src/game/duelo.ts.');

  // A mesa: a única importação de valor é o teto; a linha troca pelo valor lido.
  const caminhoDaMesa = path.join(APP, 'src', 'game', 'mesaDeSom.ts');
  const fonteDaMesa = readFileSync(caminhoDaMesa, 'utf8');
  const IMPORTACAO = /^import \{ TETO_DE_SONS \} from '\.\/duelo';\r?$/m;
  if (!IMPORTACAO.test(fonteDaMesa)) erro("a linha import { TETO_DE_SONS } from './duelo' sumiu de src/game/mesaDeSom.ts.");
  const semImportacao = fonteDaMesa.replace(
    IMPORTACAO,
    `const TETO_DE_SONS = { sons: ${TETO_DE_SONS.sons}, janela: ${TETO_DE_SONS.janela} }; // de src/game/duelo.ts`,
  );
  const js = ts
    .transpileModule(semImportacao, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } })
    .outputText.replace(/\r\n/g, '\n');
  if (/^\s*import\b|\brequire\(|^\s*export \{/m.test(js)) erro('a mesa de som ganhou outra importação ou exportação; o script clássico não a resolve.');
  const nomes = [...js.matchAll(/^export (?:function|const) (\w+)/gm)].map((m) => m[1]);
  if (!nomes.includes('passoDaMesa') || !nomes.includes('MESA_NOVA')) erro('passoDaMesa ou MESA_NOVA sumiu de src/game/mesaDeSom.ts.');

  // O serviço de som: os volumes e a ordem dos tiques.
  const fonteDoSom = readFileSync(path.join(APP, 'src', 'services', 'som.ts'), 'utf8');
  const VOLUME = lerNumeros(fonteDoSom, 'VOLUME');
  const SONS_DO_TIQUE = lerLista(fonteDoSom, 'SONS_DO_TIQUE');

  // Roda a mesa transpilada uma vez, para conferir contra os arquivos do site.
  const caixa = { window: {} };
  vm.runInNewContext(`(function () {\n${js.replace(/^export /gm, '')}\nwindow.MesaDeSom = { ${nomes.join(', ')} };\n})();`, caixa);
  const Mesa = caixa.window.MesaDeSom;
  const naLista = new Set(ARQUIVOS_DO_SITE);
  // O som é do site quando todos os arquivos dele vêm; e todo arquivo da lista é de algum som.
  const sons = Object.keys(Mesa.CATEGORIA_DO_SOM).filter((s) => Mesa.arquivosDoSom(s).every((a) => naLista.has(a)));
  const usados = new Set(sons.flatMap((s) => Mesa.arquivosDoSom(s)));
  const soltos = ARQUIVOS_DO_SITE.filter((a) => !usados.has(a));
  if (soltos.length) erro(`arquivos sem som na mesa: ${soltos.join(', ')}.`);
  if (sons.includes('vitoria')) erro('a fanfarra (vitoria) não entra no site.');
  const tiquesDaMesa = Object.keys(Mesa.CATEGORIA_DO_SOM).filter((s) => Mesa.CATEGORIA_DO_SOM[s] === 'tique');
  if (tiquesDaMesa.join() !== SONS_DO_TIQUE.join()) erro(`os tiques da mesa (${tiquesDaMesa}) não batem com SONS_DO_TIQUE (${SONS_DO_TIQUE}).`);
  const semVolume = sons.filter((s) => !(s in VOLUME));
  if (semVolume.length) erro(`sem volume em src/services/som.ts: ${semVolume.join(', ')}.`);
  const volumes = Object.fromEntries(sons.map((s) => [s, VOLUME[s]]));

  // Os arquivos: confere os nomes reais na pasta do app (e que cada um é um WAV de verdade).
  const pastaDoApp = path.join(APP, 'assets', 'sons');
  const presentes = existsSync(pastaDoApp) ? new Set(readdirSync(pastaDoApp)) : new Set();
  const faltam = ARQUIVOS_DO_SITE.filter((a) => !presentes.has(`${a}.wav`));
  if (faltam.length) erro(`faltam em ${pastaDoApp}: ${faltam.map((a) => `${a}.wav`).join(', ')}.`);
  const arquivos = ARQUIVOS_DO_SITE.map((a) => ({ de: path.join(pastaDoApp, `${a}.wav`), para: path.join(RAIZ, 'assets', 'sons', `${a}.wav`) }));
  for (const { de } of arquivos) {
    const cabeca = readFileSync(de).subarray(0, 12).toString('latin1');
    if (!cabeca.startsWith('RIFF') || cabeca.slice(8) !== 'WAVE') erro(`${de} não é um WAV.`);
  }

  const mesaDeSomJs =
    '// A mesa de som do app (turno-concurso/src/game/mesaDeSom.ts), transpilada por scripts/dados-do-app.mjs\n' +
    '// sem mudança de comportamento: o site decide o que toca, quando e qual variante como o app. O teto vem\n' +
    '// de src/game/duelo.ts e os volumes, de src/services/som.ts (só os sons que o site toca). Não edite à mão.\n' +
    `(function () {\n${js.replace(/^export /gm, '').trimEnd()}\n\n` +
    `window.MesaDeSom = { TETO_DE_SONS, ${nomes.join(', ')} };\n` +
    `window.VOLUMES_DO_SOM = ${JSON.stringify(volumes)};\n})();\n`;

  return { mesaDeSomJs, volumes, arquivos };
}
