// Gera o que o site diz a partir do app (turno-concurso), para o site dizer o que o app tem:
// - src/gerado/: o conteúdo (as matérias, as roletas, os números, o Diário, os cargos) e as questões da página em
//   TypeScript, as cópias da geometria dos gestos e da mesa de som do app, as molas e os volumes;
// - assets/sons: os .wav do app que o site toca;
// - assets/css/site.css: as molas entre os marcadores;
// - index.html: o sprite (a marca, o selo do app e o elenco de assets/img/elenco-simbolos.svg) e, entre os
//   marcadores, o estado sem JavaScript (a rodada já resolvida), impresso com as mesmas peças do site (src/base/);
// - por último, o build (assets/js/site.js).
// Tudo é conferido antes de gravar: se o app mudar algo que o site usa, o script para e diz o quê.
//
// Uso: node scripts/dados-do-app.mjs [pasta do app] [data do Diário, AAAA-MM-DD] [--aceitar-desenho]
// --aceitar-desenho: o app mudou o carimbo postal, o lacre ou o selo, e o site já foi atualizado à mão (ver o passo 1).
// Sem a data, vale o Diário de hoje (horário de Brasília).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argumentos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const aceitarDesenho = process.argv.includes('--aceitar-desenho');
const APP = path.resolve(argumentos[0] ?? path.join(RAIZ, '..', 'turno-concurso'));
register('./lib/hooks-do-app.mjs', import.meta.url, { data: { app: APP } });

const { dadosDaRodada } = await import('./lib/rodada-do-app.mjs');
const { prepararSom } = await import('./lib/som-do-app.mjs');
const { gerarMolas, trocarEntreMarcadores } = await import('./lib/molas.mjs');
const { QUESTOES } = await import('@/data/questoes');
const { ROLETAS } = await import('@/data/disciplinas');
const { CONCURSOS } = await import('@/data/concursos');
const { chancesDoSorteio, textoDasChances } = await import('@/game/sorteio');

const hojeEmBrasilia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const dataDoDiario = argumentos[1] ?? hojeEmBrasilia;
const ler = (...p) => readFileSync(path.join(...p), 'utf8');
const json = (v) => JSON.stringify(v, null, 1);

// ------------------------------------------------------------------ 1. O que o app tem (tudo conferido aqui)

const rodada = await dadosDaRodada({ APP, hoje: hojeEmBrasilia, dataDoDiario });
for (const aviso of rodada.avisos) console.warn(`aviso: ${aviso}`);
const som = await prepararSom({ APP, RAIZ });
const molas = gerarMolas(APP);

// O catálogo que o app oferece hoje: a regra de situacaoHoje e escolhivel (src/game/concursos.ts), copiada aqui porque
// aquele módulo puxa o React Native. O concurso com a prova já feita sai, menos o de longo prazo.
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

// As chances: o disco (src/base/disco.ts) desenha as casas do tamanho delas e as diz no rótulo; se o app mudar, avisa.
const CHANCES_DO_DISCO = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.1];
if (JSON.stringify(chancesDoSorteio(6)) !== JSON.stringify(CHANCES_DO_DISCO)) {
  throw new Error('As chances do app mudaram: atualize CHANCES e o rótulo do disco em src/base/disco.ts.');
}

// A mesa de som, copiada sem mudança (só a importação do teto vira o valor lido do app).
const fonteDaMesa = ler(APP, 'src', 'game', 'mesaDeSom.ts');
const importacaoDoTeto = "import { TETO_DE_SONS } from './duelo';";
if (!fonteDaMesa.includes(importacaoDoTeto)) throw new Error('A mesa de som do app mudou a importação do teto (src/game/mesaDeSom.ts).');
const { TETO_DE_SONS } = await import('@/game/duelo');

const marca = ler(APP, 'assets', 'marca', 'nomeou.svg').match(/<path fill="#16161B" d="([^"]+)"/)?.[1];
if (!marca) throw new Error('Não achei o desenho da marca em assets/marca/nomeou.svg do app.');

// O desenho copiado à mão do app (o carimbo postal e a sigla do selo em src/base/pecas.ts, a gravura do selo, o lacre em
// assets/img/elenco-simbolos.svg) é conferido contra o retrato de quando foi copiado. Se o app mudou, o script para:
// atualize o site à mão e rode de novo com --aceitar-desenho, que grava o retrato novo no fim.
const RETRATO_DO_DESENHO = path.join(RAIZ, 'scripts', 'lib', 'desenho-conferido.json');
const { data: _dataDoPostal, ...postalSemData } = rodada.carimboPostal;
const desenho = { carimboPostal: postalSemData, lacre: rodada.lacre, gravuraDoSelo: rodada.gravuraDoSelo, siglaDoSelo: rodada.siglaDoSelo };
if (!aceitarDesenho) {
  if (!existsSync(RETRATO_DO_DESENHO)) throw new Error('Falta scripts/lib/desenho-conferido.json: rode com --aceitar-desenho depois de conferir o desenho do selo e do lacre.');
  const retrato = JSON.parse(readFileSync(RETRATO_DO_DESENHO, 'utf8'));
  const mudou = Object.keys(desenho).filter((k) => JSON.stringify(desenho[k]) !== JSON.stringify(retrato[k]));
  if (mudou.length) {
    throw new Error(
      `O app mudou o desenho de ${mudou.join(', ')}. Atualize à mão src/base/pecas.ts (carimbo postal, sigla, gravura) ou ` +
        'assets/img/elenco-simbolos.svg (lacre) e rode de novo com --aceitar-desenho.',
    );
  }
}

// ------------------------------------------------------------------ 2. Os módulos de src/gerado/

const CABECALHO = '// Gerado por scripts/dados-do-app.mjs a partir do app (turno-concurso). Não edite à mão.\n';
const copia = (de) => `// Cópia de turno-concurso/${de}, feita por scripts/dados-do-app.mjs sem mudança de comportamento. Não edite à mão.\n`;

const rotulos = { geral: ROLETAS.geral.nome, saude: ROLETAS.saude.nome, ti: ROLETAS.ti.nome };
const materias = Object.fromEntries(
  rodada.materias.map((m) => [m.id, { id: m.id, sigla: m.sigla, nome: m.nome, curto: m.curto, chapa: m.chapa, selo: m.selo, banco: m.banco }]),
);
const conteudo = {
  geradoEm: hojeEmBrasilia,
  materias,
  roletas: rodada.roletas,
  rotulos,
  numeros,
  diarios: rodada.diarios,
  // Sem matéria do banco, a barra do edital fica no fio.
  cargos: rodada.cargos.map((c) => ({ ...c, materias: c.materias.map((mm) => ({ ...mm, chapa: mm.chapa ?? 'rgba(22,22,27,0.32)' })) })),
};

// As questões: o gabarito do Certo ou Errado vira booleano (true: Certo), como o tipo do site.
const paraOSite = (q) => (q.tipo === 'ce' ? { ...q, gabarito: q.gabarito === 'C' || q.gabarito === true } : q);
const itens = {};
const porMateria = {};
for (const [d, lista] of Object.entries(rodada.questoes.porMateria)) {
  porMateria[d] = lista.map((q) => q.id);
  for (const q of lista) itens[q.id] = paraOSite(q);
}
const exemplo = rodada.questoes.exemploErrata;
itens[exemplo.id] = paraOSite(exemplo.item);
const questoes = { primeira: rodada.questoes.primeira, exemploErrata: { id: exemplo.id, marcada: exemplo.marcada }, porMateria, itens };

const gerados = {
  'conteudo.ts': `${CABECALHO}import type { Conteudo } from '../tipos';\n\nexport const CONTEUDO: Conteudo = ${json(conteudo)};\n`,
  'questoes.ts': `${CABECALHO}import type { Questoes } from '../tipos';\n\nexport const QUESTOES: Questoes = ${json(questoes)};\n`,
  'geometria.ts': copia('src/components/rabisco/geometria.ts') + ler(APP, 'src', 'components', 'rabisco', 'geometria.ts'),
  'mesaDeSom.ts':
    `${copia('src/game/mesaDeSom.ts').trimEnd()}\n// (só a importação do teto vira o valor). Não edite à mão.\n` +
    fonteDaMesa.replace(importacaoDoTeto, `/** O teto de turno-concurso/src/game/duelo.ts, lido pelo gerador. */\nconst TETO_DE_SONS = ${JSON.stringify(TETO_DE_SONS)};`),
  'molas.ts':
    `${CABECALHO}// (molaToque e molaCarimbo de turno-concurso/src/theme/tokens.ts)\nexport const MOLAS = {\n` +
    `  toque: { curva: '${molas.valores.toque.curva}', ms: ${molas.valores.toque.ms} },\n` +
    `  carimbo: { curva: '${molas.valores.carimbo.curva}', ms: ${molas.valores.carimbo.ms} },\n} as const;\n`,
  'volumes.ts': `${CABECALHO}// (o literal VOLUME de turno-concurso/src/services/som.ts)\nexport const VOLUMES: Record<string, number> = ${JSON.stringify(som.volumes)};\n`,
};

// ------------------------------------------------------------------ 3. As peças do site, compiladas para imprimir o estado sem JS

// Os módulos de src/gerado/ ainda estão só em memória: o esbuild os lê daqui, não do disco.
const geradoNaMemoria = {
  name: 'gerado-na-memoria',
  setup(build) {
    build.onResolve({ filter: /gerado[\\/]\w+$/ }, (a) => ({ path: `${path.basename(a.path)}.ts`, namespace: 'gerado' }));
    build.onLoad({ filter: /.*/, namespace: 'gerado' }, (a) => {
      const contents = gerados[a.path];
      if (contents === undefined) throw new Error(`src/gerado/${a.path} não é gerado aqui.`);
      return { contents, loader: 'ts', resolveDir: path.join(RAIZ, 'src', 'gerado') };
    });
  },
};

const pacote = await esbuild.build({
  stdin: {
    contents: "export * as Pecas from './src/base/pecas'; export * as Disco from './src/base/disco'; export * as Rabisco from './src/gerado/geometria';",
    resolveDir: RAIZ,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  logLevel: 'silent',
  plugins: [geradoNaMemoria],
});
// O site inteiro compila com os gerados novos (o build de verdade fica para depois de gravar tudo).
await esbuild.build({ entryPoints: [path.join(RAIZ, 'src', 'main.ts')], bundle: true, format: 'iife', target: ['es2020'], write: false, logLevel: 'silent', plugins: [geradoNaMemoria] });
const { Pecas, Disco, Rabisco } = await import(`data:text/javascript;base64,${Buffer.from(pacote.outputFiles[0].text).toString('base64')}`);

const m = (id) => materias[id];
const geral = rodada.roletas.geral.map(m);
const item = (id) => itens[id];

// O disco parado: a caneta a −5°, dentro da casa de PT, a casa pintada e o círculo de caneta nela.
const caixaPT = Disco.caixaDaCasa(0, geral);
const disco = Disco.svg(geral, { id: 'disco', angulo: -5, revelada: 0, gesto: Rabisco.circular(caixaPT.largura, caixaPT.altura, Rabisco.sementeDoTexto('PT')) });

// A folha respondida (a B certa), o ofício aberto com a pt-021 respondida e o selo do PT carimbado, a Errata.
const primeira = item(questoes.primeira);
const folha = Pecas.folha(primeira, m(primeira.d), { n: 1, total: 12, marcada: Pecas.certaDe(primeira), aviso: '1 de 3 para a convocação.' });
const doSeloPT = item(porMateria[geral[0].id].find((id) => itens[id].tipo === 'ce'));
const oficio =
  Pecas.envelope({ aberto: true }) + Pecas.oficio([], Pecas.questaoDoSelo(doSeloPT, m(doSeloPT.d), { marcada: Pecas.certaDe(doSeloPT), data: hojeEmBrasilia }));
const errata = Pecas.errata(item(exemplo.id), m(item(exemplo.id).d), exemplo.marcada, hojeEmBrasilia);
const grade = Pecas.grade([], rodada.diarios.geral, { materias, roletas: rodada.roletas });
const edital = Pecas.edital(conteudo.cargos, 0);
// O selo de PT que o ofício impresso dá aparece ganho também no jornal e na mesa do fecho.
const seloImpresso = [{ m: geral[0], data: hojeEmBrasilia }];
const resultado = Pecas.jornal({ extra: false, selos: seloImpresso, pendentes: geral.slice(1), respostas: 0, hoje: hojeEmBrasilia });
const fecho = Pecas.mesaFecho(materias, seloImpresso, hojeEmBrasilia);

// A escalada impressa conta o acerto da folha impressa: "1 de 3", com o visto a caneta na 1ª caixinha (o traço de
// Mao.visto, parado). Com script, a página zera e apaga na carga.
const vistoImpresso = (() => {
  const tamanho = 22;
  const g = Rabisco.visto(tamanho, Rabisco.sementeDoTexto('cx0'));
  const l = g.limites;
  const caminhos = g.tracos
    .map((d) =>
      [true, false]
        .map((eco) => {
          const largura = eco ? Rabisco.ESPESSURAS.visto * Rabisco.ECO.espessura : Rabisco.ESPESSURAS.visto;
          const extra = eco ? ` opacity="${Rabisco.ECO.opacidade}" transform="translate(${Rabisco.ECO.dx} ${Rabisco.ECO.dy})"` : '';
          return `<path d="${d}" fill="none" stroke="#2346C8" stroke-linecap="round" stroke-linejoin="round" stroke-width="${largura}"${extra}/>`;
        })
        .join(''),
    )
    .join('');
  return `<svg class="rabisco" viewBox="${l.x} ${l.y} ${l.largura} ${l.altura}" width="${l.largura}" height="${l.altura}" aria-hidden="true" style="left:${tamanho * -0.05 + l.x}px;top:${tamanho * -0.25 + l.y}px">${caminhos}</svg>`;
})();
const escalada =
  `<span class="escalada__caixas" aria-hidden="true"><span class="caixinha" data-caixinha>${vistoImpresso}</span><span class="caixinha" data-caixinha></span><span class="caixinha" data-caixinha></span></span>\n` +
  '          <p class="escalada__texto"><span class="numero-pequeno" data-escalada-n>1</span> de 3 para a convocação.</p>';

// O 212: um algarismo por célula, cada um na sua máscara (o NumeroRolante do app); o leitor de tela lê o número.
const cargos = String(numeros.cargos)
  .split('')
  .map((d, i) => `<span class="m m--dado" style="--d:${i * 60}ms"><span>${d}</span></span>`)
  .join('');

// O sprite: o selo do app (o papel picotado, a sombra e o picote do selo pendente) e o elenco.
const picote =
  `<symbol id="o-selo-picote" viewBox="0 0 100 100"><path d="${rodada.contornoDoSelo}" fill="none" stroke="rgba(22,22,27,0.32)" ` +
  'stroke-width="1" stroke-dasharray="2.5 2" vector-effect="non-scaling-stroke"/></symbol>';
const elenco = ler(RAIZ, 'assets', 'img', 'elenco-simbolos.svg')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\n\s*\n/g, '\n')
  .trim();

// ------------------------------------------------------------------ 4. O index.html, o CSS e os sons

function trocar(html, nome, miolo) {
  const re = new RegExp(`(<!-- ${nome}:inicio -->)[\\s\\S]*?(<!-- ${nome}:fim -->)`);
  if (!re.test(html)) throw new Error(`Marcador ${nome} não encontrado no index.html.`);
  return html.replace(re, (todo, a, b) => a + miolo + b);
}

let html = ler(RAIZ, 'index.html');
const simbolo = /(<symbol id="marca"[^>]*>\s*<g transform="translate\(8 8\)"><path fill="currentColor" d=")[^"]*(")/;
if (!simbolo.test(html)) throw new Error('Não achei o <symbol id="marca"> no index.html.');
html = html.replace(simbolo, (todo, a, b) => a + marca + b);
const trocas = {
  'selo:simbolos': rodada.simbolosDoSelo + picote,
  elenco,
  disco: `\n            ${disco}\n            `,
  fonte: `Fonte: sorteio do Nomeou. ${textoDasChances(6)}`,
  'selo-jogo': Pecas.selo(geral[0]),
  'selo-cf': Pecas.selo(m('constitucional')),
  data: `<span class="carimbo-estatico carimbo-estatico--tinta">${Pecas.dataDoCarimbo(hojeEmBrasilia)}</span>`,
  faixa: Pecas.faixa(materias, rodada.roletas, rotulos),
  'faixa-linha': Pecas.linhaDaFaixa(geral[0]),
  folha,
  escalada,
  oficio,
  errata,
  diario: grade,
  edital,
  resultado,
  fecho,
  cargos: `<span class="numero"><span class="sr">${numeros.cargos}</span><span aria-hidden="true">${cargos}</span></span>`,
  situacao: abertosHoje ? 'pelo último edital ou com inscrições abertas.' : 'pelo último edital.',
};
for (const [nome, miolo] of Object.entries(trocas)) html = trocar(html, nome, miolo);
html = html.replace(/<!-- numeros:(\w+) -->[^<]*<!-- \/numeros -->/g, (todo, nome) => `<!-- numeros:${nome} -->${numeros[nome].toLocaleString('pt-BR')}<!-- /numeros -->`);

const css = trocarEntreMarcadores(ler(RAIZ, 'assets', 'css', 'site.css'), '/* molas:inicio */', '/* molas:fim */', molas.css);

// Tudo conferido: só agora grava (os gerados, a página, o CSS e os sons) e faz o build.
mkdirSync(path.join(RAIZ, 'src', 'gerado'), { recursive: true });
for (const [arquivo, texto] of Object.entries(gerados)) writeFileSync(path.join(RAIZ, 'src', 'gerado', arquivo), texto);
if (aceitarDesenho) writeFileSync(RETRATO_DO_DESENHO, `${JSON.stringify(desenho, null, 1)}\n`);
writeFileSync(path.join(RAIZ, 'index.html'), html);
writeFileSync(path.join(RAIZ, 'assets', 'css', 'site.css'), css);
mkdirSync(path.join(RAIZ, 'assets', 'sons'), { recursive: true });
for (const { de, para } of som.arquivos) copyFileSync(de, para);

// ------------------------------------------------------------------ 5. O build

await import(pathToFileURL(path.join(RAIZ, 'scripts', 'build.mjs')).href);

console.log(`src/gerado/: ${Object.keys(materias).length} matérias, ${Object.keys(itens).length} questões, ${numeros.questoes} no banco, ${numeros.concursos} concursos, ${numeros.cargos} cargos.`);
console.log(`index.html: Diário nº ${String(rodada.diarios.geral.numero).padStart(3, '0')} (${dataDoDiario}: ${rodada.diarios.geral.materias.map((d) => materias[d].sigla).join(' ')}), ${conteudo.cargos.length} cargos no edital.`);
console.log(`assets/sons: ${som.arquivos.length} arquivos.`);
