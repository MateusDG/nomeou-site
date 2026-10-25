// Gerado por scripts/dados-do-app.mjs a partir do app (turno-concurso). Não edite à mão.
import type { Questoes } from '../tipos';

export const QUESTOES: Questoes = {
 "primeira": "pt-193",
 "exemploErrata": {
  "id": "pt-005",
  "marcada": 1
 },
 "porMateria": {
  "portugues": [
   "pt-193",
   "pt-160",
   "pt-021"
  ],
  "rlm": [
   "rlm-022",
   "rlm-098",
   "rlm-004"
  ],
  "informatica": [
   "inf-027",
   "inf-026",
   "inf-014"
  ],
  "constitucional": [
   "dc-014",
   "dc-009",
   "dc-044"
  ],
  "administrativo": [
   "da-024",
   "da-002",
   "da-001"
  ],
  "penal": [
   "dp-036",
   "dp-032",
   "dp-012"
  ],
  "sus": [
   "sus-038",
   "sus-042",
   "sus-003"
  ],
  "vigilancia": [
   "vs-011",
   "vs-020",
   "vs-024"
  ],
  "enfermagem": [
   "enf-086",
   "enf-027",
   "enf-001"
  ],
  "dados": [
   "bd-185",
   "bd-072",
   "bd-183"
  ],
  "desenvolvimento": [
   "dev-013",
   "dev-011",
   "dev-015"
  ],
  "redes": [
   "red-069",
   "red-024",
   "red-022"
  ],
  "seguranca": [
   "seg-051",
   "seg-042",
   "seg-023"
  ],
  "governanca": [
   "gov-036",
   "gov-073",
   "gov-022"
  ]
 },
 "itens": {
  "pt-193": {
   "id": "pt-193",
   "d": "portugues",
   "tipo": "multipla",
   "estilo": "Estilo Marinha",
   "nivel": "fácil",
   "assunto": "Relações lexicais",
   "enunciado": "Assinale a opção em que o primeiro termo é hiperônimo do segundo.",
   "alternativas": [
    "fragata — embarcação",
    "embarcação — fragata",
    "convés — navio",
    "marinheiro — marujo",
    "proa — popa"
   ],
   "correta": 1,
   "margem": "hiperônimo: o geral que abrange o específico",
   "pegadinha": "o primeiro termo",
   "explicacao": "Hiperônimo é o termo de sentido mais geral, que abrange outros: toda fragata é uma embarcação, mas nem toda embarcação é fragata. Na ordem inversa, “fragata” é hipônimo; convés e navio formam relação de parte e todo; marinheiro e marujo são sinônimos; proa e popa são extremidades opostas do navio."
  },
  "pt-160": {
   "id": "pt-160",
   "d": "portugues",
   "tipo": "multipla",
   "estilo": "Estilo Marinha",
   "nivel": "média",
   "assunto": "Tipos e gêneros textuais",
   "enunciado": "Assinale a opção que apresenta apenas gêneros textuais.",
   "alternativas": [
    "narração, descrição e dissertação",
    "argumentação, notícia e injunção",
    "ofício, crônica e bula de remédio",
    "exposição, receita e narração",
    "descrição, edital e conto"
   ],
   "correta": 2,
   "margem": "tipo é sequência; gênero é o texto que circula",
   "pegadinha": "apenas",
   "explicacao": "Gêneros são as formas concretas de texto que circulam na sociedade, em número aberto: ofício, crônica, bula, notícia, receita, edital, conto. Tipos são as poucas sequências que compõem esses textos: narração, descrição, exposição, argumentação e injunção. As demais opções misturam tipos e gêneros ou trazem só tipos."
  },
  "pt-021": {
   "id": "pt-021",
   "d": "portugues",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "Ortografia",
   "enunciado": "Na frase “Daqui há dois meses sairá o edital”, o emprego de “há” está correto, pois a expressão indica tempo.",
   "gabarito": false,
   "margem": "há = passado; daqui a = futuro",
   "pegadinha": "Daqui há",
   "explicacao": "“Há” (verbo haver) indica tempo decorrido, no passado: “Há dois meses saiu o edital”. Para tempo futuro ou distância, usa-se a preposição “a”: “Daqui a dois meses sairá o edital”."
  },
  "rlm-022": {
   "id": "rlm-022",
   "d": "rlm",
   "tipo": "multipla",
   "estilo": "Estilo Vunesp",
   "nivel": "difícil",
   "assunto": "Análise combinatória",
   "enunciado": "Quantos anagramas distintos podem ser formados com as letras da palavra BANANA?",
   "alternativas": [
    "30",
    "60",
    "120",
    "360",
    "720"
   ],
   "correta": 1,
   "margem": "letras repetidas: 6! ÷ (3! × 2!) = 60",
   "pegadinha": "distintos",
   "explicacao": "BANANA tem 6 letras, com o “A” repetido 3 vezes e o “N” repetido 2 vezes. Pela permutação com repetição: 6! ÷ (3! × 2!) = 720 ÷ 12 = 60. O valor 720 ignora as repetições, e 120 ou 360 descontam apenas uma delas."
  },
  "rlm-098": {
   "id": "rlm-098",
   "d": "rlm",
   "tipo": "multipla",
   "estilo": "Estilo Vunesp",
   "nivel": "média",
   "assunto": "Equações e problemas",
   "enunciado": "Em um estacionamento há apenas carros e motos, num total de 30 veículos e 100 rodas. Quantas motos há no estacionamento?",
   "alternativas": [
    "10",
    "12",
    "15",
    "18",
    "20"
   ],
   "correta": 0,
   "margem": "tudo moto: 60 rodas; cada carro põe 2 a mais",
   "pegadinha": "Quantas motos",
   "explicacao": "Se os 30 veículos fossem motos, haveria 60 rodas. As 40 rodas a mais vêm dos carros, cada um com 2 rodas a mais que uma moto: 40 ÷ 2 = 20 carros. Logo, há 30 − 20 = 10 motos. O valor 20 é o número de carros."
  },
  "rlm-004": {
   "id": "rlm-004",
   "d": "rlm",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "Tabela-verdade",
   "enunciado": "A tabela-verdade de uma proposição composta formada por 4 proposições simples distintas possui 16 linhas.",
   "gabarito": true,
   "margem": "n proposições simples: 2 elevado a n linhas",
   "explicacao": "Cada proposição simples pode ser V ou F, e cada nova proposição dobra as combinações possíveis: 2 × 2 × 2 × 2 = 16 linhas. Em geral, n proposições simples geram 2 elevado a n linhas."
  },
  "inf-027": {
   "id": "inf-027",
   "d": "informatica",
   "tipo": "multipla",
   "estilo": "Estilo Cesgranrio",
   "nivel": "média",
   "assunto": "Planilhas (Excel/Calc)",
   "enunciado": "No Excel, o intervalo A1:A6 contém os valores 4, 7, 5, 9, 2 e 10. O resultado da fórmula =CONT.SE(A1:A6;\">5\") é",
   "alternativas": [
    "2",
    "3",
    "4",
    "26",
    "5"
   ],
   "correta": 1,
   "margem": "\">5\" não inclui o 5; CONT.SE conta, não soma",
   "pegadinha": "\">5\"",
   "explicacao": "CONT.SE conta quantas células atendem ao critério. Maiores que 5 são 7, 9 e 10, totalizando 3. O 5 não entra, pois o critério é “maior que”, e não “maior ou igual”. O valor 26 seria a soma desses números, obtida com SOMASE."
  },
  "inf-026": {
   "id": "inf-026",
   "d": "informatica",
   "tipo": "multipla",
   "estilo": "Estilo FCC",
   "nivel": "difícil",
   "assunto": "Planilhas (Excel/Calc)",
   "enunciado": "Em uma planilha do Excel, as células A1, A3 e A4 contêm, respectivamente, 10, 20 e 30, e a célula A2 está vazia. O resultado da fórmula =MÉDIA(A1:A4) será",
   "alternativas": [
    "15",
    "0",
    "#DIV/0!",
    "60",
    "20"
   ],
   "correta": 4,
   "margem": "MÉDIA ignora célula vazia (zero conta)",
   "pegadinha": "a célula A2 está vazia",
   "explicacao": "A função MÉDIA ignora células vazias (e também textos e valores lógicos dentro de intervalos). Assim, calcula (10 + 20 + 30) / 3 = 20. Quem divide a soma por 4 chega a 15, erro comum de quem considera a célula vazia como zero."
  },
  "inf-014": {
   "id": "inf-014",
   "d": "informatica",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "média",
   "assunto": "Redes e internet",
   "enunciado": "O DNS é o serviço responsável por atribuir automaticamente endereços IP aos computadores que se conectam a uma rede local.",
   "gabarito": false,
   "margem": "DNS traduz nome em IP; DHCP distribui IP",
   "pegadinha": "atribuir automaticamente endereços IP",
   "explicacao": "Errado. A atribuição automática de endereços IP é função do DHCP. O DNS (Domain Name System) traduz nomes de domínio, como www.exemplo.gov.br, em endereços IP, funcionando como uma “agenda” da internet."
  },
  "dc-014": {
   "id": "dc-014",
   "d": "constitucional",
   "tipo": "multipla",
   "estilo": "Estilo Vunesp",
   "nivel": "fácil",
   "assunto": "Direitos sociais",
   "enunciado": "Assinale a alternativa que NÃO apresenta um direito social expressamente previsto no art. 6º da CF/88.",
   "alternativas": [
    "Transporte.",
    "Alimentação.",
    "Moradia.",
    "Propriedade.",
    "Lazer."
   ],
   "correta": 3,
   "margem": "propriedade é direito individual (art. 5º)",
   "pegadinha": "NÃO",
   "explicacao": "O art. 6º lista como direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, o transporte, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância e a assistência aos desamparados. O direito de propriedade é direito individual, garantido no art. 5º, caput e inciso XXII."
  },
  "dc-009": {
   "id": "dc-009",
   "d": "constitucional",
   "tipo": "multipla",
   "estilo": "Estilo FCC",
   "nivel": "fácil",
   "assunto": "Remédios constitucionais",
   "enunciado": "Para assegurar o conhecimento de informações relativas à sua pessoa, constantes de registros ou bancos de dados de entidades governamentais, o cidadão deve utilizar:",
   "alternativas": [
    "habeas corpus.",
    "habeas data.",
    "mandado de segurança.",
    "mandado de injunção.",
    "ação popular."
   ],
   "correta": 1,
   "margem": "dados da própria pessoa: habeas data",
   "explicacao": "O habeas data assegura o conhecimento de informações relativas à pessoa do impetrante, constantes de registros ou bancos de dados de entidades governamentais ou de caráter público, e permite a retificação de dados. O mandado de segurança é residual: só cabe quando o direito não for amparado por habeas corpus ou habeas data."
  },
  "dc-044": {
   "id": "dc-044",
   "d": "constitucional",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "Funções essenciais à Justiça",
   "enunciado": "São princípios institucionais do Ministério Público a unidade, a indivisibilidade e a independência funcional.",
   "gabarito": true,
   "margem": "MP: unidade, indivisibilidade, independência",
   "explicacao": "O art. 127, §1º, da CF/88 enumera exatamente esses três princípios institucionais. A unidade indica que os membros integram um só órgão, sob a mesma chefia; a indivisibilidade permite que se substituam uns aos outros sem prejuízo da atuação; e a independência funcional garante que atuem conforme sua convicção e a lei, sem subordinação intelectual."
  },
  "da-024": {
   "id": "da-024",
   "d": "administrativo",
   "tipo": "multipla",
   "estilo": "Estilo Vunesp",
   "nivel": "fácil",
   "assunto": "Licitações e contratos (Lei 14.133/2021)",
   "enunciado": "Assinale a alternativa que NÃO corresponde a uma modalidade de licitação prevista na Lei 14.133/2021.",
   "alternativas": [
    "Pregão.",
    "Concorrência.",
    "Leilão.",
    "Tomada de preços.",
    "Diálogo competitivo."
   ],
   "correta": 3,
   "margem": "14.133: sem tomada de preços nem convite",
   "pegadinha": "NÃO corresponde",
   "explicacao": "A Lei 14.133/2021 prevê cinco modalidades: pregão, concorrência, concurso, leilão e diálogo competitivo. A tomada de preços e o convite, que existiam na revogada Lei 8.666/1993, foram extintos. O diálogo competitivo é a novidade da nova lei."
  },
  "da-002": {
   "id": "da-002",
   "d": "administrativo",
   "tipo": "multipla",
   "estilo": "Estilo FCC",
   "nivel": "fácil",
   "assunto": "Princípios administrativos",
   "enunciado": "O princípio que exige atuação administrativa sem favorecimentos nem perseguições, voltada apenas ao interesse público, e que veda a promoção pessoal de autoridades na publicidade oficial é o da:",
   "alternativas": [
    "legalidade.",
    "impessoalidade.",
    "publicidade.",
    "eficiência.",
    "continuidade do serviço público."
   ],
   "correta": 1,
   "margem": "promoção pessoal na publicidade = impessoalidade",
   "pegadinha": "publicidade oficial",
   "explicacao": "A impessoalidade impõe tratamento isonômico aos administrados e atuação voltada à finalidade pública. O art. 37, §1º, concretiza esse princípio ao proibir nomes, símbolos ou imagens que caracterizem promoção pessoal de autoridades ou servidores na publicidade oficial. O distrator “publicidade” engana justamente por mencionar a divulgação."
  },
  "da-001": {
   "id": "da-001",
   "d": "administrativo",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "Princípios administrativos",
   "enunciado": "Em razão do princípio da legalidade, o administrador público pode fazer tudo aquilo que a lei não proíbe.",
   "gabarito": false,
   "margem": "Administração só faz o que a lei autoriza",
   "pegadinha": "tudo aquilo que a lei não proíbe",
   "explicacao": "Para a Administração Pública, a legalidade é estrita: o administrador só pode agir quando e como a lei autoriza. A ideia de poder fazer tudo o que a lei não proíbe corresponde à legalidade aplicada aos particulares (autonomia da vontade), extraída do art. 5º, II, da CF/88."
  },
  "dp-036": {
   "id": "dp-036",
   "d": "penal",
   "tipo": "multipla",
   "estilo": "Estilo FCC",
   "nivel": "média",
   "assunto": "Penas",
   "enunciado": "Nos termos do Código Penal, NÃO é espécie de pena restritiva de direitos a",
   "alternativas": [
    "prestação pecuniária.",
    "perda de bens e valores.",
    "limitação de fim de semana.",
    "interdição temporária de direitos.",
    "multa."
   ],
   "correta": 4,
   "margem": "multa é espécie autônoma, não restritiva",
   "pegadinha": "NÃO",
   "explicacao": "O art. 32 do CP prevê três espécies de pena: privativas de liberdade, restritivas de direitos e multa. As restritivas de direitos estão no art. 43: prestação pecuniária, perda de bens e valores, limitação de fim de semana, prestação de serviço à comunidade ou a entidades públicas e interdição temporária de direitos. A multa é espécie autônoma e não se confunde com a prestação pecuniária, paga em regra à vítima, a seus dependentes ou a entidade com destinação social."
  },
  "dp-032": {
   "id": "dp-032",
   "d": "penal",
   "tipo": "multipla",
   "estilo": "Estilo Vunesp",
   "nivel": "média",
   "assunto": "Crimes contra a Administração Pública",
   "enunciado": "Um servidor deixou de aplicar multa devida a um vizinho apenas por amizade, sem receber nem pedir vantagem e sem que ninguém lhe pedisse. Essa conduta configura",
   "alternativas": [
    "prevaricação.",
    "corrupção passiva privilegiada.",
    "concussão.",
    "condescendência criminosa.",
    "corrupção passiva própria."
   ],
   "correta": 0,
   "margem": "interesse ou sentimento pessoal: prevaricação",
   "pegadinha": "sem que ninguém lhe pedisse",
   "explicacao": "Prevaricação (art. 319) é retardar ou deixar de praticar ato de ofício, ou praticá-lo contra lei, para satisfazer interesse ou sentimento pessoal, como a amizade. Se o servidor cedesse a pedido ou influência de outrem, sem vantagem, haveria corrupção passiva privilegiada (art. 317, § 2º). Havendo solicitação ou recebimento de vantagem, corrupção passiva (art. 317, caput)."
  },
  "dp-012": {
   "id": "dp-012",
   "d": "penal",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "Fato típico, dolo e culpa",
   "enunciado": "Salvo os casos expressos em lei, ninguém pode ser punido por fato previsto como crime senão quando o pratica dolosamente.",
   "gabarito": true,
   "margem": "culpa só é punida se a lei prevê expressamente",
   "explicacao": "Certo. É o princípio da excepcionalidade do crime culposo (CP, art. 18, parágrafo único). A modalidade culposa só é punida quando a lei a prevê expressamente; no silêncio do tipo, apenas a conduta dolosa é crime. Por isso não existe, por exemplo, furto culposo."
  },
  "sus-038": {
   "id": "sus-038",
   "d": "sus",
   "tipo": "multipla",
   "estilo": "Estilo FCC",
   "nivel": "fácil",
   "assunto": "Decreto 7.508/2011",
   "enunciado": "A relação que compreende todas as ações e serviços que o SUS oferece ao usuário para atendimento da integralidade da assistência à saúde, nos termos do Decreto 7.508/2011, é a:",
   "alternativas": [
    "Rename.",
    "Formulário Terapêutico Nacional.",
    "Programação Pactuada e Integrada.",
    "Renases.",
    "Tabela de Procedimentos do SUS."
   ],
   "correta": 3,
   "margem": "Renases: serviços; Rename: medicamentos",
   "explicacao": "A Renases (Relação Nacional de Ações e Serviços de Saúde) reúne todas as ações e serviços oferecidos pelo SUS, conforme o art. 21 do Decreto 7.508/2011. A Rename é a seleção e a padronização de medicamentos, acompanhada do Formulário Terapêutico Nacional, que subsidia a prescrição, a dispensação e o uso desses medicamentos."
  },
  "sus-042": {
   "id": "sus-042",
   "d": "sus",
   "tipo": "multipla",
   "estilo": "Estilo IBFC",
   "nivel": "fácil",
   "assunto": "Financiamento do SUS",
   "enunciado": "De acordo com a Lei Complementar 141/2012, os Estados e os Municípios devem aplicar anualmente em ações e serviços públicos de saúde, no mínimo, os seguintes percentuais da arrecadação de impostos e transferências definidas na lei, respectivamente:",
   "alternativas": [
    "12% e 15%.",
    "15% e 12%.",
    "10% e 15%.",
    "15% e 15%.",
    "12% e 18%."
   ],
   "correta": 0,
   "margem": "Estados 12%, Municípios 15%, União 15% da RCL",
   "explicacao": "Os arts. 6º e 7º da LC 141/2012 fixam 12% para os Estados e 15% para os Municípios, calculados sobre a arrecadação de impostos e as transferências constitucionais indicadas na lei; no caso dos Estados, deduzem-se as parcelas transferidas aos Municípios. A LC 227/2026 manteve os percentuais e só incluiu na base a parcela do IBS de cada ente. A troca entre os dois percentuais é o erro mais comum."
  },
  "sus-003": {
   "id": "sus-003",
   "d": "sus",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "média",
   "assunto": "Saúde na Constituição Federal",
   "enunciado": "Entre as diretrizes constitucionais do SUS está o atendimento integral, com prioridade para os serviços assistenciais, sem prejuízo das atividades preventivas.",
   "gabarito": false,
   "margem": "prioridade é das atividades preventivas",
   "pegadinha": "com prioridade para os serviços assistenciais",
   "explicacao": "Errado. O art. 198, II, da CF/88 traz a ordem inversa: o atendimento integral deve ter prioridade para as atividades preventivas, sem prejuízo dos serviços assistenciais. A troca dos termos é uma das formas mais frequentes de cobrança desse dispositivo."
  },
  "vs-011": {
   "id": "vs-011",
   "d": "vigilancia",
   "tipo": "multipla",
   "estilo": "Estilo IBFC",
   "nivel": "média",
   "assunto": "Indicadores de saúde",
   "enunciado": "Em 2025, um município de 200.000 habitantes confirmou 400 casos de dengue, com 8 óbitos pela doença. A letalidade da dengue nesse município foi de:",
   "alternativas": [
    "0,004%.",
    "0,2%.",
    "2%.",
    "4%.",
    "20%."
   ],
   "correta": 2,
   "margem": "letalidade = óbitos / casos da doença",
   "pegadinha": "200.000 habitantes",
   "explicacao": "Letalidade é o número de óbitos pela doença dividido pelo número de casos da doença: 8 ÷ 400 = 0,02, ou 2%. O valor 0,004% corresponde à mortalidade (8 óbitos em 200.000 habitantes), e 0,2% é a incidência (400 casos em 200.000). A letalidade mede a gravidade da doença entre os doentes, não o risco na população."
  },
  "vs-020": {
   "id": "vs-020",
   "d": "vigilancia",
   "tipo": "multipla",
   "estilo": "Estilo FGV",
   "nivel": "difícil",
   "assunto": "Estudos epidemiológicos",
   "enunciado": "Uma coorte acompanhou, por 5 anos, 1.000 trabalhadores expostos a um solvente e 2.000 não expostos. Surgiram 30 casos de doença hepática entre os expostos e 20 entre os não expostos. O risco relativo associado à exposição é:",
   "alternativas": [
    "0,02.",
    "1,5.",
    "3.",
    "0,33.",
    "10."
   ],
   "correta": 2,
   "margem": "RR = incidência expostos / não expostos",
   "pegadinha": "2.000 não expostos",
   "explicacao": "O risco relativo é a incidência entre expostos dividida pela incidência entre não expostos: (30 ÷ 1.000) ÷ (20 ÷ 2.000) = 0,03 ÷ 0,01 = 3. O valor 1,5 surge de dividir os casos sem considerar o tamanho dos grupos, e 0,02 é a diferença de riscos (risco atribuível). Os expostos tiveram risco três vezes maior."
  },
  "vs-024": {
   "id": "vs-024",
   "d": "vigilancia",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "difícil",
   "assunto": "Testes diagnósticos",
   "enunciado": "Mantidas a sensibilidade e a especificidade, o valor preditivo positivo de um teste diagnóstico aumenta quando ele é aplicado em população com maior prevalência da doença.",
   "gabarito": true,
   "margem": "mais prevalência, maior VPP; S e E não mudam",
   "explicacao": "Certo. Os valores preditivos dependem da prevalência: quanto mais frequente a doença na população testada, maior a probabilidade de um resultado positivo ser verdadeiro, e o valor preditivo positivo sobe. O valor preditivo negativo se comporta ao contrário. Já sensibilidade e especificidade são propriedades do teste e não variam com a prevalência."
  },
  "enf-086": {
   "id": "enf-086",
   "d": "enfermagem",
   "tipo": "multipla",
   "estilo": "Estilo IBFC",
   "nivel": "média",
   "assunto": "Cálculo de medicação",
   "enunciado": "Foi prescrita penicilina G potássica cristalina, 1.500.000 UI, por via intravenosa. O frasco contém 5.000.000 UI e será diluído em 8 mL de água para injetáveis, sabendo-se que o pó ocupa 2 mL. Deve-se aspirar:",
   "alternativas": [
    "0,3 mL.",
    "1,5 mL.",
    "2,4 mL.",
    "3 mL.",
    "6 mL."
   ],
   "correta": 3,
   "margem": "reconstituído: volume final = diluente + pó",
   "pegadinha": "o pó ocupa 2 mL",
   "explicacao": "Com 8 mL de diluente e 2 mL ocupados pelo pó, o volume final é de 10 mL, ou seja, 500.000 UI/mL; para 1.500.000 UI, aspiram-se 1.500.000 ÷ 500.000 = 3 mL. O valor 2,4 mL resulta de esquecer o volume do pó e dividir as 5.000.000 UI só pelos 8 mL de diluente, e 6 mL corresponderia ao dobro da dose prescrita."
  },
  "enf-027": {
   "id": "enf-027",
   "d": "enfermagem",
   "tipo": "multipla",
   "estilo": "Estilo AOCP",
   "nivel": "média",
   "assunto": "Cálculo de medicação",
   "enunciado": "Prescrição: heparina sódica 5.000 UI por via subcutânea. Disponível: frasco-ampola de 5 mL com 25.000 UI. O volume a ser administrado é de:",
   "alternativas": [
    "0,2 mL.",
    "1 mL.",
    "2 mL.",
    "2,5 mL.",
    "5 mL."
   ],
   "correta": 1,
   "margem": "mL = UI prescritas ÷ UI por mL do frasco",
   "explicacao": "25.000 UI em 5 mL correspondem a 5.000 UI/mL. Logo, 5.000 UI equivalem a 5.000 ÷ 5.000 = 1 mL. A alternativa 0,2 mL resulta de dividir 5.000 por 25.000, esquecendo que essa quantidade está distribuída em 5 mL."
  },
  "enf-001": {
   "id": "enf-001",
   "d": "enfermagem",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "Legislação do exercício profissional",
   "enunciado": "De acordo com a Lei 7.498/1986, a consulta de enfermagem e a prescrição da assistência de enfermagem são atividades privativas do enfermeiro.",
   "gabarito": true,
   "margem": "consulta e prescrição de enfermagem: privativas",
   "explicacao": "Certo. O art. 11, I, da Lei 7.498/1986 lista entre as atividades privativas do enfermeiro a consulta de enfermagem (alínea “i”) e a prescrição da assistência de enfermagem (alínea “j”). Técnicos e auxiliares participam da assistência, mas não podem exercer essas atividades."
  },
  "bd-185": {
   "id": "bd-185",
   "d": "dados",
   "tipo": "multipla",
   "estilo": "Estilo FCC",
   "nivel": "média",
   "assunto": "Python para análise de dados",
   "enunciado": "Seja df um DataFrame do pandas com 10 linhas e o índice padrão, de 0 a 9. As expressões df.loc[2:5] e df.iloc[2:5] retornam, respectivamente, quantas linhas?",
   "alternativas": [
    "3 e 3.",
    "4 e 3.",
    "3 e 4.",
    "4 e 4.",
    "5 e 4."
   ],
   "correta": 1,
   "margem": "loc inclui o fim da fatia; iloc exclui",
   "pegadinha": "respectivamente",
   "explicacao": "O loc seleciona por rótulo e, nas fatias, inclui o rótulo final: linhas 2, 3, 4 e 5. O iloc seleciona por posição e segue a convenção das fatias do Python, que exclui o fim: posições 2, 3 e 4. Com o índice padrão, rótulo e posição coincidem, e só essa regra da fatia faz a diferença."
  },
  "bd-072": {
   "id": "bd-072",
   "d": "dados",
   "tipo": "multipla",
   "estilo": "Estilo FGV",
   "nivel": "média",
   "assunto": "SQL",
   "enunciado": "Em uma linha da tabela folha, salario vale 5000, bonus é nulo e desconto vale 0. As expressões salario + bonus, COALESCE(bonus, 0) e NULLIF(desconto, 0) resultam, respectivamente, em",
   "alternativas": [
    "5000, 0 e 0.",
    "nulo, 0 e nulo.",
    "nulo, 0 e 0.",
    "5000, nulo e nulo.",
    "5000, 0 e nulo."
   ],
   "correta": 1,
   "margem": "conta com nulo dá nulo; NULLIF de iguais, nulo",
   "pegadinha": "salario + bonus",
   "explicacao": "Uma operação aritmética com nulo resulta em nulo, por isso salario + bonus é nulo, e não 5000. COALESCE devolve o primeiro argumento não nulo (0), e NULLIF(a, b) devolve nulo quando os dois argumentos são iguais e, caso contrário, o primeiro; como desconto é 0, sai nulo. Por isso o NULLIF é usado para evitar divisão por zero, como em total / NULLIF(qtd, 0)."
  },
  "bd-183": {
   "id": "bd-183",
   "d": "dados",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "Python para análise de dados",
   "enunciado": "No pandas, sendo df um DataFrame com a coluna salario, a expressão df[\"salario\"] retorna uma Series, enquanto df[[\"salario\"]] retorna um DataFrame com uma única coluna.",
   "gabarito": true,
   "margem": "df[col] dá Series; df[[col]], DataFrame",
   "explicacao": "Certo. Com um rótulo simples, o colchete devolve a coluna como Series, estrutura unidimensional com índice. Com uma lista de rótulos, ainda que de um só elemento, devolve um DataFrame com as colunas pedidas, que mantém a forma bidimensional: shape (n, 1)."
  },
  "dev-013": {
   "id": "dev-013",
   "d": "desenvolvimento",
   "tipo": "multipla",
   "estilo": "Estilo Cesgranrio",
   "nivel": "média",
   "assunto": "Programação (Python e Java)",
   "enunciado": "Considere a linha de código Java int a = 7 / 2; double b = 7 / 2.0; System.out.println(a + b); Ao ser executada, ela exibe",
   "alternativas": [
    "6.5",
    "7.0",
    "6.0",
    "7",
    "3.5"
   ],
   "correta": 0,
   "margem": "Java: int / int descarta a fração (7 / 2 = 3)",
   "pegadinha": "int a = 7 / 2",
   "explicacao": "Em Java, a divisão entre dois inteiros é inteira: 7 / 2 resulta em 3, com descarte da parte fracionária. Já 7 / 2.0 envolve um double e resulta em 3.5. A soma de 3 com 3.5 é promovida a double, e o valor exibido é 6.5."
  },
  "dev-011": {
   "id": "dev-011",
   "d": "desenvolvimento",
   "tipo": "multipla",
   "estilo": "Estilo FGV",
   "nivel": "média",
   "assunto": "Programação (Python e Java)",
   "enunciado": "Em Python 3, a execução da linha x = [1, 2, 3]; y = x; y.append(4); print(len(x)) exibe",
   "alternativas": [
    "3.",
    "4.",
    "7.",
    "[1, 2, 3].",
    "um erro, pois listas são imutáveis."
   ],
   "correta": 1,
   "margem": "y = x não copia: as duas apontam a mesma lista",
   "pegadinha": "y = x",
   "explicacao": "A atribuição y = x não copia a lista: as duas variáveis passam a referenciar o mesmo objeto. Assim, o append feito por meio de y altera a lista que x também referencia, cujo tamanho passa a ser 4. Para obter uma cópia independente, seria preciso usar, por exemplo, y = x.copy() ou y = x[:]."
  },
  "dev-015": {
   "id": "dev-015",
   "d": "desenvolvimento",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "Programação (Python e Java)",
   "enunciado": "Em Python 3, a linha print(10 // 3, 10 % 3, 2 ** 3) exibe 3.3333333333333335 1 8.",
   "gabarito": false,
   "margem": "Python: // é divisão inteira; / dá o real",
   "pegadinha": "3.3333333333333335",
   "explicacao": "Errado. O operador // faz a divisão inteira, com arredondamento para baixo, e resulta em 3; é a divisão comum, com /, que produziria 3.3333333333333335. Os demais valores estão corretos: 10 % 3 é o resto, 1, e 2 ** 3 é a potência, 8. A saída é 3 1 8."
  },
  "red-069": {
   "id": "red-069",
   "d": "redes",
   "tipo": "multipla",
   "estilo": "Estilo Vunesp",
   "nivel": "fácil",
   "assunto": "Comutação e VLANs",
   "enunciado": "Em uma rede Ethernet com MTU padrão e sem etiqueta 802.1Q, o campo de dados (carga útil) de um quadro IEEE 802.3 pode ter de",
   "alternativas": [
    "64 a 1.518 bytes.",
    "42 a 1.500 bytes.",
    "46 a 9.000 bytes.",
    "46 a 1.500 bytes.",
    "20 a 1.480 bytes."
   ],
   "correta": 3,
   "margem": "carga útil 46 a 1.500; quadro inteiro 64 a 1.518",
   "pegadinha": "campo de dados (carga útil)",
   "explicacao": "A carga útil vai de 46 a 1.500 bytes; se os dados forem menores, o quadro recebe enchimento (padding), e o mínimo só cai para 42 bytes quando há etiqueta 802.1Q, ausente no cenário. Somados os MACs de destino e de origem (6 bytes cada), o campo EtherType/tamanho (2) e o FCS (4, com CRC-32), o quadro fica entre 64 e 1.518 bytes, faixa usada como distrator; o preâmbulo e o SFD não entram nessa conta. Os cerca de 9.000 bytes são dos jumbo frames, que não fazem parte do padrão."
  },
  "red-024": {
   "id": "red-024",
   "d": "redes",
   "tipo": "multipla",
   "estilo": "Estilo FCC",
   "nivel": "difícil",
   "assunto": "Endereçamento IPv4 e sub-redes",
   "enunciado": "Um roteador deve anunciar as redes 172.20.0.0/24, 172.20.1.0/24, 172.20.2.0/24 e 172.20.3.0/24 em uma única rota sumarizada, sem abranger nenhum outro endereço. Essa rota é",
   "alternativas": [
    "172.20.0.0/16",
    "172.20.0.0/23",
    "172.20.0.0/22",
    "172.20.4.0/22",
    "172.20.0.0/24"
   ],
   "correta": 2,
   "margem": "4 redes /24 contíguas = 2 bits a menos: /22",
   "pegadinha": "sem abranger nenhum outro endereço",
   "explicacao": "Quatro redes /24 contíguas, começando em um múltiplo de 4 no terceiro octeto, são cobertas por um prefixo dois bits mais curto: /22, que vai de 172.20.0.0 a 172.20.3.255. O /23 cobriria só duas das redes, e o /16 abrangeria endereços que não pertencem ao conjunto."
  },
  "red-022": {
   "id": "red-022",
   "d": "redes",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "Endereçamento IPv4 e sub-redes",
   "enunciado": "Uma sub-rede com prefixo /30 oferece apenas dois endereços utilizáveis por hosts, razão pela qual é usada com frequência em enlaces ponto a ponto entre dois roteadores.",
   "gabarito": true,
   "margem": "/30: 2 hosts, ideal para ponto a ponto",
   "explicacao": "Certo. Com 2 bits de host há 2^2 = 4 endereços: um de rede, um de broadcast e dois para as interfaces. É o tamanho exato de um enlace com duas pontas, sem desperdício de endereços."
  },
  "seg-051": {
   "id": "seg-051",
   "d": "seguranca",
   "tipo": "multipla",
   "estilo": "Estilo FGV",
   "nivel": "difícil",
   "assunto": "Normas ISO/IEC 27001 e 27002",
   "enunciado": "Entre os controles que passaram a constar da ISO/IEC 27002:2022, sem correspondente direto na edição de 2013, encontra-se o controle de",
   "alternativas": [
    "segregação de funções.",
    "cópias de segurança das informações.",
    "inteligência de ameaças.",
    "mesa limpa e tela limpa.",
    "gestão de mudanças."
   ],
   "correta": 2,
   "margem": "nova na 27002:2022: inteligência de ameaças",
   "pegadinha": "sem correspondente direto na edição de 2013",
   "explicacao": "A edição de 2022 trouxe 11 controles novos, entre eles inteligência de ameaças (5.7), segurança da informação no uso de serviços em nuvem (5.23), prontidão de TIC para a continuidade, gestão de configuração, mascaramento de dados, prevenção de vazamento de dados, atividades de monitoramento, filtragem web e codificação segura. Segregação de funções, backup, mesa limpa e gestão de mudanças já existiam em 2013 e foram mantidos, com ajustes de redação e numeração."
  },
  "seg-042": {
   "id": "seg-042",
   "d": "seguranca",
   "tipo": "multipla",
   "estilo": "Estilo FCC",
   "nivel": "média",
   "assunto": "Segurança de aplicações web",
   "enunciado": "Para dificultar que um script injetado por XSS leia o cookie de sessão de um sistema web por meio de document.cookie, o desenvolvedor deve definir nesse cookie o atributo",
   "alternativas": [
    "HttpOnly.",
    "Secure.",
    "SameSite=None.",
    "Expires.",
    "Domain."
   ],
   "correta": 0,
   "margem": "HttpOnly: cookie fora do alcance do JavaScript",
   "explicacao": "O atributo HttpOnly impede que o cookie seja acessado por JavaScript no navegador, reduzindo o roubo de sessão por XSS; o cookie continua sendo enviado normalmente nas requisições. O Secure faz o cookie trafegar apenas por HTTPS, e o SameSite controla seu envio em requisições entre sites, o que ajuda contra CSRF. O ideal é combinar os três."
  },
  "seg-023": {
   "id": "seg-023",
   "d": "seguranca",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "média",
   "assunto": "Segurança de aplicações web",
   "enunciado": "Na edição de 2025 do OWASP Top 10, a injeção (Injection) ocupa a primeira posição da lista, à frente da quebra de controle de acesso (Broken Access Control).",
   "gabarito": false,
   "margem": "OWASP 2025: A01 acesso quebrado; A05 injeção",
   "pegadinha": "ocupa a primeira posição da lista",
   "explicacao": "Errado. No OWASP Top 10:2025, a quebra de controle de acesso se manteve em primeiro lugar (A01), posição que já ocupava em 2021, e passou a incorporar também a falsificação de requisição do lado do servidor (SSRF). A injeção, que liderou as edições de 2010 a 2017, aparece em A05:2025."
  },
  "gov-036": {
   "id": "gov-036",
   "d": "governanca",
   "tipo": "multipla",
   "estilo": "Estilo Cesgranrio",
   "nivel": "fácil",
   "assunto": "Gerenciamento de projetos (PMBOK)",
   "enunciado": "No PMBOK 6ª edição, NÃO é uma área de conhecimento em gerenciamento de projetos:",
   "alternativas": [
    "gerenciamento das partes interessadas.",
    "gerenciamento dos riscos.",
    "gerenciamento das aquisições.",
    "gerenciamento da integração.",
    "monitoramento e controle."
   ],
   "correta": 4,
   "margem": "monitoramento e controle: grupo, não área",
   "pegadinha": "NÃO",
   "explicacao": "A 6ª edição tem dez áreas de conhecimento: integração, escopo, cronograma, custos, qualidade, recursos, comunicações, riscos, aquisições e partes interessadas. Monitoramento e controle é um dos cinco grupos de processos, ao lado de iniciação, planejamento, execução e encerramento."
  },
  "gov-073": {
   "id": "gov-073",
   "d": "governanca",
   "tipo": "multipla",
   "estilo": "Estilo Cesgranrio",
   "nivel": "fácil",
   "assunto": "Gerenciamento de projetos (PMBOK)",
   "enunciado": "A equipe de um projeto, contando com o gerente, tinha 6 pessoas e passou a ter 10. Pela fórmula de canais de comunicação do PMBOK 6ª edição, o número de canais potenciais de comunicação aumentou em:",
   "alternativas": [
    "4 canais.",
    "30 canais.",
    "45 canais.",
    "20 canais.",
    "60 canais."
   ],
   "correta": 1,
   "margem": "canais = n(n-1)/2",
   "pegadinha": "aumentou em",
   "explicacao": "O número de canais é n(n − 1)/2. Com 6 pessoas, 6 × 5/2 = 15; com 10, 10 × 9/2 = 45; o aumento é de 45 − 15 = 30 canais. O valor 45 é o total final, e 60 resulta de esquecer a divisão por 2 (90 − 30). O crescimento mais que proporcional dos canais explica por que equipes maiores exigem planejamento de comunicações mais cuidadoso."
  },
  "gov-022": {
   "id": "gov-022",
   "d": "governanca",
   "tipo": "ce",
   "estilo": "Estilo Cebraspe",
   "nivel": "fácil",
   "assunto": "COBIT 2019",
   "enunciado": "O COBIT 2019 organiza seus 40 objetivos de governança e gestão em cinco domínios: um de governança (EDM) e quatro de gestão (APO, BAI, DSS e MEA).",
   "gabarito": true,
   "margem": "COBIT 2019: EDM (5) + APO, BAI, DSS, MEA (35)",
   "explicacao": "Certo. EDM (Avaliar, Direcionar e Monitorar) reúne os 5 objetivos de governança. Os 35 objetivos de gestão distribuem-se em APO (Alinhar, Planejar e Organizar), BAI (Construir, Adquirir e Implementar), DSS (Entregar, Servir e Suportar) e MEA (Monitorar, Avaliar e Analisar)."
  },
  "pt-005": {
   "id": "pt-005",
   "d": "portugues",
   "tipo": "multipla",
   "estilo": "Estilo Vunesp",
   "nivel": "média",
   "assunto": "Concordância verbal e nominal",
   "enunciado": "Assinale a alternativa em que a concordância verbal está de acordo com a norma-padrão.",
   "alternativas": [
    "Haviam muitos candidatos na sala de espera.",
    "Podem haver falhas no sistema de inscrição.",
    "Devia haver soluções mais simples para o caso.",
    "Existe, no edital, várias regras confusas.",
    "Houveram problemas na aplicação da prova."
   ],
   "correta": 2,
   "margem": "haver = existir: auxiliar também no singular",
   "explicacao": "No sentido de “existir”, o verbo “haver” é impessoal e fica na 3ª pessoa do singular; essa impessoalidade se transmite ao auxiliar da locução: “devia haver”, “pode haver”. Já “existir” é pessoal e concorda com o sujeito: “existem várias regras”."
  }
 }
};
