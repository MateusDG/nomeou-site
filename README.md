# nomeou-site

O site de divulgação do **Nomeou** (o app de `turno-concurso`), para `https://nomeou.app`. Recebe quem chega pelo link do Diário ou do convite ("Será que você gabarita? nomeou.app") e leva para as lojas.

A página é uma **rodada de amostra**: em vez de telas do app, a pessoa joga uma rodada curta feita com as peças do próprio app (o disco do sorteio, a folha de questão, o ofício de convocação, a Errata, o Diário, o edital verticalizado e a primeira página do jornal). Tudo segue o sistema **"Anotado à margem"** (`turno-concurso/docs/DESIGN.md`): papel, tinta, a mão que risca, grifa e carimba, sombras só duras, nenhum personagem e nada em laço. Os objetos da papelaria (a Bic, o carimbo datador, o marca-texto, a xícara, os selos) fazem o papel que o mascote faz em sites como o do Duolingo.

## A rodada

| Bloco | O que acontece |
|---|---|
| Sorteio (`#sorteio`) | "Concurso é jogo." e o disco da roleta da área, com a física do app: um toque (ou um peteleco na caneta) sorteia a matéria com as chances reais (15% cada matéria, 10% a convocação). Os objetos da mesa também respondem ao toque: o datador bate a data de novo e a 3×4 da rival troca de inicial |
| Matérias (`#materias`) | A cartela com os selos das 14 matérias em 3 áreas. A pessoa escolhe a área (Conhecimentos gerais, Saúde, TI) e o disco troca as casas |
| Questão (`#questao`) | Uma questão real do banco numa folha. A caneta corrige como no app: o risco na errada, o grifo na certa, a nota a lápis, o carimbo. Três acertos abrem a convocação |
| Convocação (`#convocacao`) | O envelope lacrado. Romper o lacre abre o ofício com três selos; a Questão do selo decide. Acertou, o carimbo postal bate e o selo voa para o álbum do cabeçalho |
| Errata (`#errata`) | A questão que a pessoa errou volta, com a marcada riscada. Refeita certa, as folhinhas do calendário (amanhã, 1, 3, 7 e 15 dias) são arrancadas uma a uma até o SANADA |
| Diário (`#diario`) | A grade das respostas da pessoa, no formato de compartilhar do app, e o botão de mandar o resultado |
| Edital (`#edital`) | Os cargos do catálogo, as fichas de três cargos de exemplo e o edital verticalizado com o peso de cada matéria |
| Resultado (`#resultado`) | A primeira página do Diário do Nomeou com o nome que a pessoa digita na manchete. Com os 3 selos, sai a Edição Extra |
| Fecho (`#baixar`) | "O jogo é grátis." sobre a mesa de objetos, as lojas e o que o PRO faz |
| Rodapé | O Expediente (o elenco de objetos e o que cada um faz), os avisos, as preferências de som e movimento e o contato |

**A cor é conquistada.** O selo só ganha cor e carimbo postal quando a pessoa acerta a Questão do selo. Os que faltam ficam em contorno, no álbum do cabeçalho e na primeira página.

O estado da rodada fica em `sessionStorage` (some ao fechar a aba). As preferências (som, movimento, área) ficam em `localStorage`.

### O movimento

Cada bloco é uma cena que toca uma vez, em dois tempos (`src/pagina/cenas.ts`): quando a manchete entra, as palavras sobem da máscara. Quando o objeto do bloco aparece, ele pousa e a mão anota. Os objetos pousam pelo material (papel, carta, plástico, madeira, cera, impresso), com as molas do app convertidas para CSS (`linear()`), e só a rolagem mexe as duas mesas (paralaxe em CSS, `animation-timeline: view()`). O que ninguém viu entra parado: rolagem rápida, âncora, recarga no meio, foco pelo teclado.

- Com "reduzir movimento" no sistema, ou "Movimento: Reduzido" no rodapé, tudo aparece no estado final, sem travessias.
- Em aparelho com pouca memória ou com economia de dados, só o objeto principal de cada cena anima, e as mesas não acompanham a rolagem.
- Sem JavaScript, a página é completa: a rodada aparece já resolvida, com o risco e o grifo em CSS e os carimbos impressos.
- Se o script demorar mais de 3 s (rede ruim), a página segue como sem JavaScript e só as interações ganham vida.

### O som

Desligado por padrão. A chave "Som" fica no cabeçalho e no rodapé. São os 23 sons do app (`assets/sons`) com a mesa de som dele (no máximo 2 eventos em 1,6 s, por categoria). Aberto direto do disco (`file://`), o som vai por `<audio>`.

## Rodando

O código é TypeScript (`src/`), juntado pelo esbuild num script só, `assets/js/site.js`, que também abre direto do disco. Todo build carimba no `index.html` a versão do CSS e do JS (`?v=` e um pedaço do hash do conteúdo), para quem volta depois de uma publicação não juntar um arquivo velho do cache com a página nova.

```bash
npm install
```

```bash
npm run build
```

Depois, sirva a pasta com qualquer servidor estático e abra `http://localhost:8830`:

```bash
python -m http.server 8830
```

Os outros comandos:

| Comando | O que faz |
|---|---|
| `npm run dev` | Refaz o `site.js` a cada mudança em `src/` (sem minificar) |
| `npm run check` | Confere os tipos (`tsc --noEmit`) |
| `npm run dados` | Gera de novo o conteúdo a partir do app (veja abaixo) e faz o build |

## Publicando

O `assets/js/site.js` gerado vai para o repositório, então a pasta já é o site: suba-a inteira numa hospedagem estática (Cloudflare Pages, Netlify, Vercel ou GitHub Pages), com a raiz como pasta pública e sem comando de build. Se preferir que a hospedagem faça o build, use `npm ci && npm run build`. Não publique `node_modules/`, `src/`, `scripts/` nem `.taste-skill/` se a hospedagem deixar escolher (eles não fazem mal, mas não são o site).

## Configuração

Em `src/config.ts` (depois de mudar, rode `npm run build`):

| Chave | O que faz |
|---|---|
| `lojas.ios`, `lojas.android` | Os links das lojas. Só valem os que começam com `https://apps.apple.com/` e `https://play.google.com/` |
| `convocacaoLivre` | `true`: o envelope abre sem os 3 acertos (bom para a amostra). `false`: só abre com 3 acertos na questão |
| `areas` | `true`: a faixa deixa escolher a área. `false`: fica a roleta geral |

### As lojas

| Situação | Celular | Computador |
|---|---|---|
| Sem links | "Em breve no iPhone e no Android." na abertura e no fecho | O mesmo |
| Com a loja do aparelho | A loja vira o botão cheio da abertura e do fecho; "Sortear a matéria" vira botão de texto logo abaixo. A barra "Baixar o app" aparece embaixo quando a abertura sai da tela | Abertura: as duas lojas em contorno (o sorteio continua sendo o botão cheio). Fecho: a App Store cheia e o Google Play em contorno |
| Sem a loja do aparelho | "iPhone em breve." ou "Android em breve." | A loja que falta diz "em breve" |

Com qualquer link, o "Baixar o app" do cabeçalho (do tablet para cima) aparece quando os botões de loja saem da tela, e o JSON-LD ganha `installUrl` e o preço zero. Os botões são de texto ("Baixar na App Store", "Baixar no Google Play"); para usar os selos oficiais, troque `botaoDaLoja()` em `src/pagina/lojas.ts`, respeitando o tamanho mínimo e o respiro que as guias da Apple e do Google pedem. O rodapé já traz a linha de marcas da Apple e do Google.

Quando o app estiver na App Store, descomente no `<head>` o `<meta name="apple-itunes-app">` com o id do app.

## Atualizando o conteúdo a partir do app

As matérias, as roletas, as questões da página, o Diário, os números, os cargos, os sons e as molas saem do código do app:

```bash
npm run dados
```

Para o Diário de outro dia (sem data, vale o de hoje no horário de Brasília):

```bash
node scripts/dados-do-app.mjs ../turno-concurso 2026-11-03
```

O script importa o TypeScript do app direto (sem build e sem mexer em nada lá) e:

- grava `src/gerado/` (conteúdo, questões, a geometria dos gestos, a mesa de som, as molas e os volumes);
- copia os `.wav` do app para `assets/sons/`;
- grava as molas entre os marcadores do `assets/css/site.css`;
- reescreve no `index.html` o sprite (a marca, o selo e o elenco de `assets/img/elenco-simbolos.svg`) e, entre os marcadores `<!-- …:inicio -->` e `<!-- …:fim -->`, o estado sem JavaScript, impresso com as mesmas peças do site (`src/base/pecas.ts`);
- faz o build.

Ele confere tudo antes de gravar e para com uma mensagem se o app mudar algo que o site usa (as chances do sorteio, a mesa de som, a marca, um marcador que sumiu). O desenho que foi copiado à mão (o carimbo postal, a sigla e a gravura do selo, o lacre) é comparado com o retrato de `scripts/lib/desenho-conferido.json`: se o app mudou, atualize `src/base/pecas.ts` ou `assets/img/elenco-simbolos.svg` e rode de novo com `--aceitar-desenho`, que grava o retrato novo.

## Estrutura

```
index.html                    a página (com os marcadores do estado sem JavaScript)
src/main.ts                   liga tudo, na ordem
src/config.ts                 o que o dono muda à mão (lojas, convocação livre, áreas)
src/base/                     as peças: pecas.ts (HTML/SVG das peças), disco.ts, mao.ts (risco, grifo, carimbo),
                              movimento.ts (o motor das entradas), som.ts, rodada.ts (o estado), folha.ts, dom.ts
src/pagina/                   um módulo por bloco e cenas.ts, o motor das cenas
src/gerado/                   o que sai do app (gerado, não edite)
assets/js/site.js             o build (gerado, vai para o repositório) e o site.js.map
assets/css/site.css           os tokens do app, o cabeçalho, as cenas e cada bloco
assets/css/elenco.css         as mesas, os objetos e as peças de papel
assets/img/elenco-simbolos.svg  os desenhos dos objetos
assets/img/marca/             a marca, o ícone e os favicons
assets/img/compartilhar.png   a prévia do link (1200 × 630)
assets/fonts/                 Gloock, League Gothic, Newsreader, Archivo e a Mynerve do app, em WOFF2, com as licenças OFL
assets/sons/                  os sons do app (gerado)
scripts/build.mjs             o build (esbuild)
scripts/dados-do-app.mjs      o gerador (com scripts/lib/)
```

## Antes de publicar

- **Lojas:** preencha `CONFIG.lojas` e o `apple-itunes-app` quando o app sair.
- **Domínio e e-mail:** `nomeou.app` e `contato@nomeou.app` ainda não estão confirmados (`docs/LIGA.md` do app, pendência 4). O site usa os dois.
- **Termos, privacidade e responsáveis:** as lojas pedem um endereço de política de privacidade (e o Google Play, um de exclusão de conta). `URLS_LEGAIS` no app aponta para `nomeou.app/termos`, `nomeou.app/privacidade` e `nomeou.app/responsaveis`, que ainda não existem neste site. O corpo de cada uma sai de `turno-concurso/dist/legal/<doc>.html` (`npm run legal` no app). Os links do rodapé entram junto com as páginas, nunca antes.
- **Quem publica:** o app mostra o expediente legal (razão social e CNPJ) por causa do Decreto 7.962/2013. Se o site também for vender o PRO ou falar dele como hoje, vale repetir esses dados no rodapé; fica para o dono decidir, junto com a revisão jurídica.
- **O Diário** mostrado é o nº 025 (25/10/2026). Rode `npm run dados` perto do lançamento.
- **Os números** (2.425 questões, 65 concursos e 212 cargos) são os do app em 25/10/2026. Rodando de novo, eles mudam (concurso com prova feita sai do catálogo).
- **A prévia do link** (`assets/img/compartilhar.png`) mostra a abertura com o disco; refaça-a se a abertura mudar.
