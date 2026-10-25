# nomeou-site

O site de divulgação do **Nomeou** (o app de `turno-concurso`), para `https://nomeou.app`. É a página que recebe quem chega pelo link do Diário ou do convite ("Será que você gabarita? nomeou.app") e a que leva para as lojas.

O site segue o sistema do app, **"Anotado à margem"** (`turno-concurso/docs/DESIGN.md`), enxuto: uma manchete por tela, muito papel e a mão do app anotando a tipografia. Não há telas do app na página: o que se mostra é desenhado com a tipografia, as cores e os gestos do próprio app (o disco do sorteio, a grade do Diário, o risco vermelho, o grifo amarelo, a nota a lápis e os carimbos).

## O que tem na página

| Bloco | O que mostra |
|---|---|
| Abertura | "Concurso é jogo." em corpo de cartaz, a linha do que é o app e as lojas |
| Duelo 1×1 | O disco do sorteio da roleta geral, com a física do app: um toque (ou um peteleco na caneta) sorteia a matéria, com as chances reais (15% cada matéria, 10% a convocação). Uma linha avisa que Saúde e TI têm as matérias da área |
| 5 questões por dia | O Diário do Nomeou: a grade de compartilhar da edição do dia, com o 4/5 circulado a caneta |
| O erro volta | A Errata: a frase errada riscada e os intervalos (amanhã, 1, 3, 7 e 15 dias) até o carimbo SANADA |
| O edital do seu cargo | "seu cargo" grifado, os cargos e concursos do catálogo e a regra a lápis |
| O jogo é grátis | O que é grátis, o que o PRO faz e as lojas, na tinta |
| Rodapé | Os avisos (jogo de estudo, questões autorais, rival simulado) e o contato |

### As animações

Cada bloco é uma cena que toca uma vez, em dois tempos. Quando a manchete entra na tela, a palavra sobe da máscara e o texto assenta. Quando o objeto do bloco aparece (o disco, a grade do Diário, a linha da Errata, o 212, as lojas do fim), ele se imprime e a mão anota: risco, grifo, círculo, nota e, por último, o carimbo. Os atrasos do objeto contam a partir dele, para tudo acontecer com a pessoa olhando. O que ninguém viu entra parado: se a página abre no meio, a pessoa rola depressa ou pula por um link, a cena aparece pronta; quem chega pelo teclado também não espera a entrada. Nada fica em laço, nada segue a rolagem e o disco só gira quando alguém toca (a caneta pré-tensiona e acompanha o dedo, como no app).

Com "reduzir movimento" ligado no sistema, tudo aparece no estado final e o sorteio para direto na casa. Sem JavaScript, o texto inteiro aparece, com o risco e o grifo feitos em CSS e o disco parado em Português.

## Rodando

Não há build: são arquivos estáticos. Qualquer servidor serve.

```bash
python -m http.server 8830
```

Depois, abra `http://localhost:8830`. O `index.html` também abre direto do disco.

## Publicando

Suba a pasta inteira em qualquer hospedagem estática (Cloudflare Pages, Netlify, Vercel ou GitHub Pages), sem comando de build e com a raiz do repositório como pasta pública.

## As lojas

No alto de `assets/js/site.js`, o objeto `CONFIG`:

```js
lojas: {
  ios: '',     // https://apps.apple.com/br/app/...
  android: '', // https://play.google.com/store/apps/details?id=...
},
```

- **Sem links**, a abertura e o fim da página dizem "Em breve no iPhone e no Android."
- **Com um link**, aparece o botão daquela loja e a linha "Android em breve." (ou "iPhone em breve.").
- **Com os dois**, aparecem os dois botões: no Android, o Google Play vem primeiro; no iPhone e no desktop, a App Store.
- **Com um ou dois links**, o "Baixar o app" do topo aparece e, no celular, leva à loja do aparelho (ou ao fim da página, se a dele ainda não tem link). O JSON-LD da página ganha `installUrl` e o preço zero.

Só valem links que começam com `https://apps.apple.com/` e `https://play.google.com/`; outro endereço é ignorado.

O rodapé já traz a linha de marcas que a Apple pede a quem cita iPhone e App Store (e a do Google). Os botões são de texto, nas cores da marca ("Baixar na App Store", "Baixar no Google Play"). Se preferir os selos oficiais, baixe-os nas páginas de marketing da Apple (App Store Marketing Guidelines) e do Google Play (Google Play badges) e troque o HTML gerado em `iniciarLojas()`, respeitando o tamanho mínimo e a área de respiro que cada guia pede.

Quando o app estiver na App Store, descomente no `<head>` o `<meta name="apple-itunes-app">` com o id do app: o Safari do iPhone mostra a faixa de abrir ou baixar.

## Atualizando o conteúdo a partir do app

As matérias do disco, a edição do Diário, os números do banco, a marca e a gramática da margem saem do código do app:

```bash
node scripts/dados-do-app.mjs ../turno-concurso
```

Sem data, vale o Diário de hoje (horário de Brasília). Para outro dia:

```bash
node scripts/dados-do-app.mjs ../turno-concurso 2026-11-03
```

O script importa o TypeScript do app direto (com o `typescript` do próprio app, sem build) e:

- grava `assets/js/conteudo.js` (as matérias da roleta geral e os números do dia: os concursos contam pela regra do app, que tira os de prova já feita);
- grava `assets/js/rabisco.js`, a gramática da margem (`src/components/rabisco/geometria.ts`) transpilada sem mudança;
- reescreve no `index.html` o que sai impresso entre os marcadores `<!-- …:inicio -->` e `<!-- …:fim -->`: a marca, o disco parado em Português, a linha "Fonte:" das chances, a grade do Diário, os 212 cargos, o "com inscrições abertas" (só quando há concurso aberto) e os números;
- para com erro se a roleta geral deixar de ter 6 matérias ou se as chances do app mudarem (o disco desenha as casas do tamanho delas, em `assets/js/disco.js`).

## Estrutura

```
index.html                   a página
assets/css/site.css          os tokens do app, as cenas e cada bloco
assets/js/site.js            as cenas, os gestos da mão, o sorteio e as lojas
assets/js/disco.js           o disco do sorteio (a geometria de Roleta.tsx)
assets/js/rabisco.js         a gramática da margem (gerado)
assets/js/conteudo.js        o conteúdo do app (gerado)
assets/fonts/                Gloock, League Gothic, Newsreader, Archivo e a Mynerve congelada do app, em WOFF2, com as licenças OFL
assets/img/marca/            a marca, o ícone Nº e os favicons
assets/img/compartilhar.png  a prévia do link (1200 × 630): a marca, a manchete e o disco
scripts/dados-do-app.mjs     o gerador do conteúdo
```

## Antes de publicar

- **Lojas:** preencha `CONFIG.lojas` e o `apple-itunes-app` quando o app sair.
- **Domínio e e-mail:** `nomeou.app` e `contato@nomeou.app` ainda não estão confirmados (`docs/LIGA.md`, pendência 4). O site usa os dois.
- **Termos, privacidade e responsáveis:** as lojas pedem um endereço de política de privacidade (e o Google Play, um de exclusão de conta). `URLS_LEGAIS` no app aponta para `nomeou.app/termos`, `nomeou.app/privacidade` e `nomeou.app/responsaveis`, que ainda não existem neste site. O corpo de cada uma sai de `turno-concurso/dist/legal/<doc>.html` (`npm run legal` no app). Os links do rodapé entram junto com as páginas, nunca antes.
- **Quem publica:** o app mostra o Expediente (razão social e CNPJ) por causa do Decreto 7.962/2013. Se o site também for vender o PRO ou falar dele como hoje, vale repetir o Expediente no rodapé; fica para o dono decidir, junto com a revisão jurídica.
- **O Diário** mostrado é o nº 024 (24/10/2026). Rode o script perto do lançamento.
- **Os números** (2.425 questões, 65 concursos e 212 cargos) são os do app em 24/10/2026, no dia em que o script rodou; rodando de novo, eles mudam (concurso com prova feita sai do catálogo).
