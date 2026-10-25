// Ganchos do carregador do Node para importar o TypeScript do app (turno-concurso) direto, sem build:
// '@/' vira src/, o import sem extensão acha o .ts e o TypeScript do próprio app transpila cada
// arquivo. O carregador nativo do texto das questões (banco/carregar.ts) vira um stub, porque os
// scripts leem o texto em src/data/questoes.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let APP = '';
let SRC = '';
let ts = null;

const STUB = 'data:text/javascript,' + encodeURIComponent(
  'export const carregarTexto=()=>{};export const textoDaMateria=()=>undefined;export const textoFalhou=()=>false;' +
    'export const textoPronto=()=>false;export const assinarTextos=()=>()=>{};export const marcaDasFalhas=()=>0;',
);

export function initialize(dados) {
  APP = path.resolve(dados.app);
  SRC = path.join(APP, 'src');
  ts = createRequire(path.join(APP, 'package.json'))('typescript');
}

const ehArquivo = (p) => existsSync(p) && statSync(p).isFile();

export async function resolve(especificador, contexto, proximo) {
  let p = null;
  if (especificador.startsWith('@/')) p = path.join(SRC, especificador.slice(2));
  else if (/^\.\.?\//.test(especificador) && contexto.parentURL?.startsWith('file:')) {
    const pai = fileURLToPath(contexto.parentURL);
    if (pai.startsWith(SRC)) p = fileURLToPath(new URL(especificador, contexto.parentURL));
  }
  if (!p) return proximo(especificador, contexto);
  if (/[\\/]banco[\\/]carregar(\.ts)?$/.test(p)) return { url: STUB, shortCircuit: true };
  for (const c of [p, `${p}.ts`, path.join(p, 'index.ts')]) if (ehArquivo(c)) return { url: pathToFileURL(c).href, shortCircuit: true };
  return proximo(especificador, contexto);
}

export async function load(url, contexto, proximo) {
  if (url.startsWith('file:') && url.endsWith('.ts')) {
    const fonte = readFileSync(fileURLToPath(url), 'utf8');
    const { outputText } = ts.transpileModule(fonte, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, isolatedModules: true },
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  }
  return proximo(url, contexto);
}
