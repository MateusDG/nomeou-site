// Os dados da rodada de amostra, lidos do app (turno-concurso): as 14 matérias com os selos, as 3
// roletas, as questões da página, o Diário por área, os cargos do edital e o desenho do selo e do
// lacre. Só lê e confere; quem grava é scripts/dados-do-app.mjs (tudo em memória até o fim). O carimbo
// postal, a gravura, a sigla e o lacre foram copiados à mão para o site: o gerador os compara com o
// retrato de scripts/lib/desenho-conferido.json e para se o app mudar.
//
// Quem chama já registrou os ganchos (lib/hooks-do-app.mjs): aqui o '@/' já resolve para o src/ do app.
// Desenho que mora em componente React Native (o carimbo postal em Selo.tsx, o lacre em Envelope.tsx)
// é lido do fonte por expressão regular; se o app mudar o jeito de escrever, o script para e avisa.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';

// A geral da página, curada (seção 4.2, item 3). As 2 múltiplas de cada matéria, na ordem da folha,
// e o Certo ou Errado da Questão do selo com o gabarito que a página espera (3 Errado, 3 Certo).
const MULTIPLAS_DA_GERAL = {
  portugues: ['pt-193', 'pt-160'],
  rlm: ['rlm-022', 'rlm-098'],
  informatica: ['inf-027', 'inf-026'],
  constitucional: ['dc-014', 'dc-009'],
  administrativo: ['da-024', 'da-002'],
  penal: ['dp-036', 'dp-032'],
};
const CERTO_OU_ERRADO_DA_GERAL = {
  portugues: ['pt-021', 'E'],
  rlm: ['rlm-004', 'C'],
  informatica: ['inf-014', 'E'],
  constitucional: ['dc-044', 'C'],
  administrativo: ['da-001', 'E'],
  penal: ['dp-012', 'C'],
};
const PRIMEIRA = 'pt-193';
// O erro de exemplo da Errata: a B da pt-005 ("Podem haver falhas no sistema de inscrição."). A margem dela
// ("haver = existir: auxiliar também no singular") explica justamente a marcada, sem entregar a letra certa.
const EXEMPLO_DA_ERRATA = { id: 'pt-005', marcada: 1 };

// A voz do site (seção 3.1, item 3). O banco é do app: aqui só se avisa, nunca se troca o texto.
const PALAVRAS_PROIBIDAS = ['roleta', 'gire', 'sorte', 'partida', 'perdeu', 'aprovação'];

// O lacre no envelope do site (7.10): a ponta da aba em (260, 190), raio 26.
const LACRE = { cx: 260, cy: 190, r: 26 };

const falhar = (msg) => {
  throw new Error(msg);
};
const ehData = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
// O tamanho que conta para a folha caber na tela: o enunciado e as alternativas.
const tamanho = (q) => q.enunciado.length + (q.alternativas ?? []).reduce((s, a) => s + a.length, 0);
const porTamanhoEId = (a, b) => tamanho(a) - tamanho(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export async function dadosDaRodada({ APP, hoje, dataDoDiario, cargosCurados } = {}) {
  if (!APP) falhar('dadosDaRodada: falta a pasta do app (APP).');
  if (!ehData(hoje)) falhar(`dadosDaRodada: "hoje" precisa ser AAAA-MM-DD (veio ${hoje}).`);
  if (!ehData(dataDoDiario)) falhar(`dadosDaRodada: "dataDoDiario" precisa ser AAAA-MM-DD (veio ${dataDoDiario}).`);

  const { POR_ID, POR_DISCIPLINA } = await import('@/data/questoes');
  const { DISCIPLINAS, DISC, ROLETAS, ESTILOS, DIFICULDADES } = await import('@/data/disciplinas');
  const { NOME_DO_SELO, contornoPerfurado, dataDoCarimboPostal, PAPEL_DO_SELO, PICOTE, GRAVURA, siglaDoSelo } = await import('@/theme/selo');
  const { questoesDoDiario } = await import('@/game/selecao');
  const { edicaoDiario } = await import('@/game/datas');
  const { CONCURSOS, BANCAS } = await import('@/data/concursos');
  const { falhasDaTinta } = await import('@/components/rabisco/geometria');

  const avisos = [];

  // ---------------------------------------------------------------- 1. matérias

  const materias = DISCIPLINAS.map((d) => {
    if (!NOME_DO_SELO[d.id]) falhar(`A matéria ${d.id} não tem nome de selo em src/theme/selo.ts.`);
    const banco = POR_DISCIPLINA[d.id]?.length ?? 0;
    if (!banco) falhar(`A matéria ${d.id} não tem questões no app.`);
    return { id: d.id, sigla: d.sigla, nome: d.nome, curto: d.curto, chapa: d.chapa, cor: d.cor, selo: NOME_DO_SELO[d.id], banco };
  });
  if (materias.length !== 14) avisos.push(`O app tem ${materias.length} matérias; a faixa foi desenhada para 14.`);

  // ---------------------------------------------------------------- 2. roletas

  // O disco tem 6 casas e a Convocação: roleta com outro número quebraria o desenho e as chances.
  const roletas = {};
  for (const area of ['geral', 'saude', 'ti']) {
    const lista = ROLETAS[area]?.materias;
    if (!lista || lista.length !== 6) falhar(`A roleta ${area} precisa de 6 matérias (tem ${lista?.length ?? 0}).`);
    for (const id of lista) if (!DISC[id]) falhar(`A roleta ${area} cita a matéria ${id}, que não existe.`);
    roletas[area] = [...lista];
  }

  // ---------------------------------------------------------------- 3. questões da página

  const item = (q) => {
    if (q.pegadinha && !q.enunciado.includes(q.pegadinha)) {
      falhar(`${q.id}: a pegadinha "${q.pegadinha}" não é trecho exato do enunciado (o ondulado cairia no vazio).`);
    }
    const base = {
      id: q.id,
      d: q.disciplina,
      tipo: q.tipo,
      estilo: ESTILOS[q.estilo] ?? falhar(`${q.id}: estilo ${q.estilo} sem rótulo em ESTILOS.`),
      nivel: (DIFICULDADES[q.dificuldade] ?? falhar(`${q.id}: dificuldade ${q.dificuldade} sem rótulo.`)).toLocaleLowerCase('pt-BR'),
      assunto: q.assunto,
      enunciado: q.enunciado,
    };
    if (q.tipo === 'multipla') {
      if (q.alternativas?.length !== 5 || !(q.correta >= 0 && q.correta <= 4)) falhar(`${q.id}: múltipla sem 5 alternativas ou sem a correta.`);
      Object.assign(base, { alternativas: [...q.alternativas], correta: q.correta });
    } else if (q.tipo === 'ce') {
      base.gabarito = q.gabarito ? 'C' : 'E';
    } else falhar(`${q.id}: tipo ${q.tipo} desconhecido.`);
    // Sem margem ou sem pegadinha, o campo fica fora (a folha não escreve nota genérica no lugar).
    if (q.margem) base.margem = q.margem;
    if (q.pegadinha) base.pegadinha = q.pegadinha;
    base.explicacao = q.explicacao;
    return base;
  };

  const curada = (id, disciplina, tipo) => {
    const q = POR_ID[id];
    if (!q) falhar(`A questão curada ${id} sumiu do banco do app.`);
    if (q.disciplina !== disciplina) falhar(`A questão curada ${id} mudou de matéria (era ${disciplina}, agora ${q.disciplina}).`);
    if (q.tipo !== tipo) falhar(`A questão curada ${id} mudou de tipo (era ${tipo}, agora ${q.tipo}).`);
    return q;
  };

  const porMateria = {};
  for (const [d, ids] of Object.entries(MULTIPLAS_DA_GERAL)) {
    const [id, esperado] = CERTO_OU_ERRADO_DA_GERAL[d];
    const ce = curada(id, d, 'ce');
    // A página conta com 3 Errado e 3 Certo, e o estado sem JS mostra a pt-021 com Errado: o gabarito também é curado.
    if ((ce.gabarito ? 'C' : 'E') !== esperado) falhar(`A questão curada ${id} mudou de gabarito (era ${esperado}).`);
    porMateria[d] = [...ids.map((i) => curada(i, d, 'multipla')), ce];
  }

  // As outras 8, por regra estável (4.2, item 3). Múltipla: com margem, pegadinha e até 280 caracteres;
  // se faltar, com margem e até 320; por tamanho e depois por id.
  const multiplas = (d) => {
    const qs = POR_DISCIPLINA[d].filter((q) => q.tipo === 'multipla' && q.margem);
    const primeiras = qs.filter((q) => q.pegadinha && tamanho(q) <= 280).sort(porTamanhoEId);
    const reserva = qs.filter((q) => tamanho(q) <= 320 && !primeiras.includes(q)).sort(porTamanhoEId);
    const escolha = [...primeiras, ...reserva].slice(0, 2);
    if (escolha.length < 2) falhar(`A matéria ${d} tem menos de 2 múltiplas que caibam na folha (com margem e até 320 caracteres).`);
    return escolha;
  };
  // Certo ou Errado: com margem e até 180 caracteres. Na ordem da roleta, a vez é de quem está em falta
  // nela (no empate, alterna pela casa: par Errado, ímpar Certo, como a geral); quando a matéria não tem
  // o que a vez pede, leva o outro e a próxima compensa. Assim cada roleta fecha com 3 e 3, se der.
  const certoOuErrado = (d, contagem, casa) => {
    const qs = POR_DISCIPLINA[d].filter((q) => q.tipo === 'ce' && q.margem && q.enunciado.length <= 180).sort(porTamanhoEId);
    if (!qs.length) falhar(`A matéria ${d} não tem Certo ou Errado que caiba na folha (com margem e até 180 caracteres).`);
    const pedeErrado = contagem.C === contagem.E ? casa % 2 === 0 : contagem.E < contagem.C;
    return qs.find((q) => q.gabarito === !pedeErrado) ?? qs[0];
  };
  for (const area of ['saude', 'ti']) {
    const contagem = { C: 0, E: 0 };
    roletas[area].forEach((d, casa) => {
      if (!porMateria[d]) {
        const ce = certoOuErrado(d, contagem, casa);
        porMateria[d] = [...multiplas(d), ce];
      }
      contagem[porMateria[d][2].gabarito ? 'C' : 'E']++;
    });
    if (contagem.C !== 3) avisos.push(`A roleta ${area} ficou com ${contagem.C} Certo e ${contagem.E} Errado na Questão do selo.`);
  }
  for (const d of DISCIPLINAS.map((x) => x.id)) if (!porMateria[d]) falhar(`A matéria ${d} não está em nenhuma roleta: ficou sem questões na página.`);

  const exemplo = POR_ID[EXEMPLO_DA_ERRATA.id];
  if (!exemplo || exemplo.tipo !== 'multipla' || exemplo.disciplina !== 'portugues') falhar(`O exemplo da Errata (${EXEMPLO_DA_ERRATA.id}) sumiu ou mudou de matéria ou de tipo.`);
  if (exemplo.correta === EXEMPLO_DA_ERRATA.marcada || !/^Podem haver/.test(exemplo.alternativas[EXEMPLO_DA_ERRATA.marcada] ?? '') || !/auxiliar/.test(exemplo.margem ?? '')) {
    falhar(`A alternativa marcada do exemplo da Errata (${EXEMPLO_DA_ERRATA.id}, B) ou a margem dela mudou: confira o texto antes de gerar.`);
  }

  const questoes = {
    primeira: PRIMEIRA,
    exemploErrata: { ...EXEMPLO_DA_ERRATA, item: item(exemplo) },
    porMateria: Object.fromEntries(DISCIPLINAS.map((d) => [d.id, porMateria[d.id].map(item)])),
  };
  if (questoes.porMateria.portugues[0].id !== PRIMEIRA) falhar(`A primeira folha (${PRIMEIRA}) precisa ser a primeira de Português.`);

  // A voz do site vale também para o que a página mostra do banco: só avisa (quem corrige é o app).
  const proibida = new RegExp(`(?<!\\p{L})(${PALAVRAS_PROIBIDAS.join('|')})(?!\\p{L})`, 'iu');
  const conferirVoz = (q) => {
    for (const campo of ['assunto', 'enunciado', 'alternativas', 'margem', 'pegadinha', 'explicacao']) {
      const textos = [].concat(q[campo] ?? []);
      for (const t of textos) {
        // Fatorial ("3!") e erro de planilha ("#DIV/0!") não são exclamação: o "!" depois de algarismo ou de parêntese não conta.
        if (/(?<![\d)])!/u.test(t)) avisos.push(`${q.id}: "!" em ${campo}.`);
        const m = t.match(proibida);
        if (m) avisos.push(`${q.id}: a palavra "${m[1]}" em ${campo}.`);
      }
    }
  };
  [...Object.values(questoes.porMateria).flat(), questoes.exemploErrata.item].forEach(conferirVoz);

  // ---------------------------------------------------------------- 4. Diário por área

  const numero = edicaoDiario(dataDoDiario);
  const diarios = {};
  for (const area of ['geral', 'saude', 'ti']) {
    const edicao = questoesDoDiario(dataDoDiario, area);
    if (edicao.length !== 5) falhar(`O Diário ${area} de ${dataDoDiario} saiu com ${edicao.length} questões (o app manda 5).`);
    diarios[area] = { numero, materias: edicao.map((id) => (POR_ID[id] ?? falhar(`O Diário cita ${id}, que não existe.`)).disciplina) };
  }

  // ---------------------------------------------------------------- 5. cargos do edital

  // A situação de hoje, escolhivel e somaFecha de src/game/concursos.ts, copiadas aqui porque aquele
  // módulo não carrega fora do app (puxa o banco e o React Native).
  const situacaoHoje = (c) =>
    c.dataProva && hoje > c.dataProva ? 'prova-realizada' : c.situacao === 'aberto' ? (c.inscricoesAte && hoje > c.inscricoesAte ? 'encerrado' : 'aberto') : c.situacao;
  const escolhivel = (c) => situacaoHoje(c) !== 'prova-realizada' || !!c.longoPrazo;
  const itensDe = (c, g) => g.itens ?? c.itens;
  const materiasDoCargo = (c, g) => g.materias.map((i) => c.materias[i]).filter(Boolean);
  const somaFecha = (c, g) => {
    const total = itensDe(c, g);
    const ms = materiasDoCargo(c, g);
    if (!total || !ms.length || !ms.every((m) => (m.itens ?? 0) > 0)) return false;
    return ms.reduce((s, m) => s + m.itens, 0) === total;
  };
  const FRASE_DO_FORMATO = {
    multipla5: (n) => `${n} questões de A a E`,
    multipla4: (n) => `${n} questões de A a D`,
    ce: (n) => `${n} itens de Certo ou Errado`,
    'ce-desconto': (n) => `${n} itens de Certo ou Errado`,
  };

  // Os candidatos na ordem do catálogo, com aberto e previsto na frente (o sort do Node é estável). Além
  // da soma que fecha, de 2 a 10 matérias: uma barra só, de 100%, não mostra peso nenhum (os Distritos
  // Navais, só Português), e mais de 10 linhas não cabem em 1,2 tela a 390 px (seção 1.3).
  const todos = CONCURSOS.filter(escolhivel).flatMap((c) =>
    c.cargos.map((g) => ({ c, g, formato: g.formato ?? c.formato, banca: g.banca ?? c.banca, cedo: ['aberto', 'previsto'].includes(situacaoHoje(c)) ? 0 : 1 })),
  );
  const serve = (x) => FRASE_DO_FORMATO[x.formato] && somaFecha(x.c, x.g);
  const candidatos = todos
    .filter((x) => serve(x) && materiasDoCargo(x.c, x.g).length >= 2 && materiasDoCargo(x.c, x.g).length <= 10)
    .sort((a, b) => a.cedo - b.cedo);
  const escolhidos = [];
  if (cargosCurados?.length) {
    // A escolha à mão ("BCB · Auditor do BCB, Tecnologia da Informação") vence a regra; para se sumir ou não fechar.
    for (const nome of cargosCurados) {
      const x = todos.find((y) => `${y.c.sigla} · ${y.g.nome}` === nome) ?? falhar(`O cargo curado "${nome}" não está no catálogo de hoje.`);
      if (!serve(x)) falhar(`O cargo curado "${nome}" não tem formato de prova objetiva ou a soma dos itens não fecha.`);
      escolhidos.push(x);
    }
  } else {
    const regras = [
      (x) => x.formato === 'ce-desconto' && x.banca === 'cebraspe',
      (x) => x.formato === 'multipla5',
      (x) => x.g.area === 'saude',
    ];
    for (const regra of regras) {
      const livres = candidatos.filter((x) => regra(x) && !escolhidos.includes(x));
      // Prefere um concurso que ainda não está nas fichas: três cargos do mesmo órgão diriam menos.
      const x = livres.find((y) => !escolhidos.some((e) => e.c === y.c)) ?? livres[0];
      if (x) escolhidos.push(x);
    }
  }
  const cargos = escolhidos.map(({ c, g, formato, banca }) => {
    const total = itensDe(c, g);
    return {
      sigla: c.sigla,
      cargo: g.nome,
      banca: BANCAS[banca]?.nome ?? falhar(`O cargo ${c.sigla} · ${g.nome} cita a banca ${banca}, que não está em BANCAS.`),
      formato: FRASE_DO_FORMATO[formato](total),
      // A regra que muda o jogo, a lápis (linhaDoFormato do app): o desconto, ou a prova de A a D que o treino não imita.
      nota:
        formato === 'ce-desconto'
          ? `${banca === 'cebraspe' ? 'no Cebraspe, ' : ''}um item errado anula um certo.`
          : formato === 'multipla4'
            ? 'o treino usa as de A a E do Nomeou.'
            : null,
      // Sem matéria do banco, a barra fica sem chapa (null): quem desenha usa o fio.
      materias: materiasDoCargo(c, g).map((m) => ({
        // O catálogo às vezes repete os itens no nome ("Língua Portuguesa (20)"); a barra já diz o peso.
        nome: m.nome.replace(/\s*\((\d+)\)$/, (todo, n) => (Number(n) === m.itens ? '' : todo)),
        chapa: m.disciplina ? DISC[m.disciplina].chapa : null,
        semQuestoes: !m.disciplina,
        itens: m.itens,
        pct: Math.round((m.itens / total) * 100),
      })),
    };
  });

  // ---------------------------------------------------------------- 6. o selo, o carimbo postal e o lacre

  const confere = (nome, real, esperado) => {
    if (JSON.stringify(real) !== JSON.stringify(esperado)) avisos.push(`${nome} no app é ${JSON.stringify(real)}; a especificação diz ${JSON.stringify(esperado)}.`);
  };
  confere('PAPEL_DO_SELO', { ...PAPEL_DO_SELO }, { x: 10, y: 2, largura: 80, altura: 96 });
  confere('PICOTE', { ...PICOTE }, { raio: 3, furosNaLargura: 8, furosNaAltura: 10 });
  const contorno = contornoPerfurado();
  // O fio do app é 0,8 px de verdade em qualquer tamanho (0,8 × 100 / lado, no viewBox): o
  // non-scaling-stroke faz o mesmo no navegador, do álbum de 26 px ao ofício de 120.
  const simbolosDoSelo =
    `<symbol id="o-selo-papel" viewBox="0 0 100 100"><path d="${contorno}" fill="#FAF8F3" stroke="rgba(22,22,27,.35)" stroke-width=".8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></symbol>` +
    `<symbol id="o-selo-sombra" viewBox="0 0 100 100"><path d="${contorno}" fill="currentColor"/></symbol>`;

  // O carimbo postal, lido de src/components/Selo.tsx (as constantes não são exportadas).
  const fonteDoSelo = readFileSync(path.join(APP, 'src', 'components', 'Selo.tsx'), 'utf8');
  const ler = (re, oQue) => fonteDoSelo.match(re) ?? falhar(`Não achei ${oQue} em src/components/Selo.tsx do app.`);
  const [, cx, cy, raio] = ler(/const POSTAL = \{ cx: ([\d.]+), cy: ([\d.]+), raio: ([\d.]+) \}/, 'o centro e o raio do carimbo postal (POSTAL)').map(Number);
  const [, ysDasOndas, molde] = ler(/const ONDAS = \[([\d.,\s]+)\]\.map\(\(y\) => `([^`]+)`\)/, 'as ondas do carimbo postal (ONDAS)');
  const argsDasFalhas = ler(/const FALHAS_DO_POSTAL = falhasDaTinta\(([^)]+)\)/, 'as falhas da tinta do carimbo postal')[1].split(',').map(Number);
  const [, fx, fy] = ler(/<G transform="translate\(([\d.]+) ([\d.]+)\)">/, 'o deslocamento da máscara do carimbo postal').map(Number);
  const [, opacidade, giro] = ler(/opacity=\{([\d.]+)\} transform=\{`rotate\((-?[\d.]+) \$\{POSTAL\.cx\}/, 'a opacidade e o giro do carimbo postal').map(Number);
  const recuo = Number(ler(/r=\{POSTAL\.raio - ([\d.]+)\}/, 'o aro interno do carimbo postal')[1]);
  const fundo = Number(ler(/fill=\{cores\.folha\} fillOpacity=\{([\d.]+)\}/, 'o fundo do aro do carimbo postal')[1]);
  const tracos = [...fonteDoSelo.matchAll(/strokeWidth=\{Math\.max\(([\d.]+), (?:([\d.]+) \* )?px\)\}/g)].map((m) => ({ minimo: Number(m[1]), porPx: m[2] ? Number(m[2]) : 1 }));
  if (tracos.length !== 3) falhar(`Esperava 3 traços no carimbo postal de Selo.tsx (ondas, aro, aro interno); achei ${tracos.length}.`);
  const [, subida] = ler(/y=\{POSTAL\.cy \+ ([\d.]+)\}/, 'a linha de base da data do carimbo postal');
  const [, corpoComData, corpoSemData] = ler(/fontSize=\{dataPostal \? ([\d.]+) : ([\d.]+)\}/, 'o corpo da data do carimbo postal');
  const [, espacamento] = ler(/fontSize=\{dataPostal[^}]*\}\s*letterSpacing=\{([\d.]+)\}/, 'o espaçamento da data do carimbo postal');
  const falhas = falhasDaTinta(...argsDasFalhas);
  const carimboPostal = {
    cx,
    cy,
    raio,
    raioInterno: raio - recuo,
    giro,
    opacidade,
    ondas: ysDasOndas.split(',').map((y) => molde.replace('${y}', y.trim())),
    // Em unidades do viewBox; o app nunca deixa o traço abaixo de porPx px de verdade (porPx × 100 / lado).
    traco: { ondas: tracos[0], aro: tracos[1], aroInterno: tracos[2] },
    fundoDoAro: { cor: '#FAF8F3', opacidade: fundo },
    data: dataDoCarimboPostal(hoje),
    texto: { x: cx, y: Math.round((cy + Number(subida)) * 100) / 100, corpo: Number(corpoComData), corpoSemData: Number(corpoSemData), espacamento: Number(espacamento), fonte: 'Archivo 700', ladoMinimo: 44 },
    falhas: { argumentos: argsDasFalhas, x: fx, y: fy, buracos: falhas.buracos, meios: falhas.meios, opacidadeDosMeios: 0.55 },
  };
  if (!carimboPostal.data) falhar(`A data do carimbo postal saiu vazia para ${hoje}.`);

  // O lacre: a borda de bordaDoLacre() de src/components/duelo/Envelope.tsx, transpilada e rodada aqui
  // (o arquivo puxa o React Native, então só a função sai dele).
  const fonteDoEnvelope = readFileSync(path.join(APP, 'src', 'components', 'duelo', 'Envelope.tsx'), 'utf8');
  const fonteDaBorda = fonteDoEnvelope.match(/export function bordaDoLacre\([\s\S]*?\n\}\n/)?.[0] ?? falhar('Não achei bordaDoLacre() em src/components/duelo/Envelope.tsx do app.');
  const ts = createRequire(path.join(APP, 'package.json'))('typescript');
  const jsDaBorda = ts.transpileModule(fonteDaBorda.replace(/^export /, ''), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const caixa = {};
  vm.runInNewContext(`${jsDaBorda}\nthis.bordaDoLacre = bordaDoLacre;`, caixa);
  const corDoLacre = readFileSync(path.join(APP, 'src', 'theme', 'tokens.ts'), 'utf8').match(/lacre: '(#[0-9A-Fa-f]{6})'/)?.[1] ?? falhar('Não achei a cor do lacre em src/theme/tokens.ts.');
  const { cx: lx, cy: ly, r } = LACRE;
  const borda = caixa.bordaDoLacre(r, lx, ly);
  const arred = (n) => Math.round(n * 100) / 100;
  const lacre = {
    cx: lx,
    cy: ly,
    r,
    cor: corDoLacre,
    d: borda,
    pontos: [...borda.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]),
    anel: { r: arred(r * 0.62), traco: 1.6, cor: 'rgba(22,22,27,.30)' },
    letra: { texto: 'N', x: lx, y: arred(ly + r * 0.3), corpo: arred(r * 0.82), fonte: 'Gloock', cor: 'rgba(250,248,243,.62)' },
    // As metades do lacre partido: o corte é a vertical do centro. A caixa passa um pouco do raio (a beira
    // irregular chega a 1,02 r); a origem do giro é a do app, embaixo, no corte.
    metades: {
      esquerda: { recorte: `M${arred(lx - r * 1.2)} ${arred(ly - r * 1.2)}H${lx}V${arred(ly + r * 1.2)}H${arred(lx - r * 1.2)}Z`, origem: [lx, ly + r], fim: { x: -5, y: 3, giro: -14 } },
      direita: { recorte: `M${lx} ${arred(ly - r * 1.2)}H${arred(lx + r * 1.2)}V${arred(ly + r * 1.2)}H${lx}Z`, origem: [lx, ly + r], fim: { x: 5, y: 4, giro: 11 } },
    },
  };
  if (lacre.pontos.length !== 40) avisos.push(`A borda do lacre saiu com ${lacre.pontos.length} pontos (a especificação fala em 40).`);

  return {
    materias,
    roletas,
    questoes,
    diarios,
    cargos,
    simbolosDoSelo,
    contornoDoSelo: contorno,
    gravuraDoSelo: { ...GRAVURA },
    siglaDoSelo: {
      curta: { comLegenda: siglaDoSelo('PT', true), semLegenda: siglaDoSelo('PT', false) },
      longa: { comLegenda: siglaDoSelo('SUS', true), semLegenda: siglaDoSelo('SUS', false) },
    },
    carimboPostal,
    lacre,
    avisos,
  };
}
