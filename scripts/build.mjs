// O build do site: junta o TypeScript de src/ num script clássico só (assets/js/site.js), que abre também
// direto do disco (file://), onde módulo ES não carrega. Uso: node scripts/build.mjs [--observar]
import * as esbuild from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const observar = process.argv.includes('--observar');

/**
 * Carimba no index.html a versão de cada arquivo (?v= e 8 letras do sha1 do conteúdo): quem volta depois de uma
 * publicação não junta o site.js ou o CSS velho do cache com a página nova. A query vale também em file://.
 */
function carimbar() {
  const html = path.join(RAIZ, 'index.html');
  const antes = readFileSync(html, 'utf8');
  const depois = antes.replace(/(assets\/(?:css\/site\.css|css\/elenco\.css|js\/site\.js))(?:\?v=[0-9a-f]+)?"/g, (todo, arquivo) => {
    const versao = createHash('sha1').update(readFileSync(path.join(RAIZ, arquivo))).digest('hex').slice(0, 8);
    return `${arquivo}?v=${versao}"`;
  });
  if (depois !== antes) writeFileSync(html, depois);
}

const opcoes = {
  entryPoints: [path.join(RAIZ, 'src', 'main.ts')],
  outfile: path.join(RAIZ, 'assets', 'js', 'site.js'),
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  minify: !observar,
  sourcemap: 'linked',
  legalComments: 'none',
  charset: 'utf8',
  logLevel: 'info',
  banner: { js: '// O site do Nomeou. Gerado por scripts/build.mjs a partir de src/ (TypeScript). Não edite à mão.' },
  plugins: [
    {
      name: 'carimbo',
      setup(build) {
        build.onEnd((resultado) => {
          if (!resultado.errors.length) carimbar();
        });
      },
    },
  ],
};

if (observar) {
  const contexto = await esbuild.context(opcoes);
  await contexto.watch();
  console.log('Observando src/ (Ctrl+C para sair).');
} else {
  await esbuild.build(opcoes);
}
