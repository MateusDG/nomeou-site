// Gerado por scripts/dados-do-app.mjs a partir do app (turno-concurso). Não edite à mão.
import type { Conteudo } from '../tipos';

export const CONTEUDO: Conteudo = {
 "geradoEm": "2026-10-25",
 "materias": {
  "portugues": {
   "id": "portugues",
   "sigla": "PT",
   "nome": "Língua Portuguesa",
   "curto": "Português",
   "chapa": "#EF86A9",
   "selo": "Selo da Norma Culta",
   "banco": 216
  },
  "rlm": {
   "id": "rlm",
   "sigla": "RL",
   "nome": "Raciocínio Lógico",
   "curto": "Lógica",
   "chapa": "#A68CEA",
   "selo": "Selo do Silogismo",
   "banco": 137
  },
  "informatica": {
   "id": "informatica",
   "sigla": "IN",
   "nome": "Informática",
   "curto": "Informática",
   "chapa": "#7FA6F2",
   "selo": "Selo do Byte",
   "banco": 100
  },
  "constitucional": {
   "id": "constitucional",
   "sigla": "CF",
   "nome": "Direito Constitucional",
   "curto": "Constitucional",
   "chapa": "#4DC3B5",
   "selo": "Selo da Carta Magna",
   "banco": 136
  },
  "administrativo": {
   "id": "administrativo",
   "sigla": "AD",
   "nome": "Direito Administrativo",
   "curto": "Administrativo",
   "chapa": "#9BCB62",
   "selo": "Selo do LIMPE",
   "banco": 136
  },
  "penal": {
   "id": "penal",
   "sigla": "CP",
   "nome": "Direito Penal",
   "curto": "Penal",
   "chapa": "#F4A05A",
   "selo": "Selo do Código",
   "banco": 100
  },
  "sus": {
   "id": "sus",
   "sigla": "SUS",
   "nome": "Legislação do SUS",
   "curto": "SUS",
   "chapa": "#5ECB98",
   "selo": "Selo da Universalidade",
   "banco": 200
  },
  "vigilancia": {
   "id": "vigilancia",
   "sigla": "VS",
   "nome": "Vigilância em Saúde",
   "curto": "Vigilância",
   "chapa": "#C2C451",
   "selo": "Selo da Notificação",
   "banco": 200
  },
  "enfermagem": {
   "id": "enfermagem",
   "sigla": "ENF",
   "nome": "Enfermagem",
   "curto": "Enfermagem",
   "chapa": "#F59C80",
   "selo": "Selo da SAE",
   "banco": 200
  },
  "dados": {
   "id": "dados",
   "sigla": "BD",
   "nome": "Banco de Dados e BI",
   "curto": "Banco de Dados",
   "chapa": "#C493E6",
   "selo": "Selo da Chave Primária",
   "banco": 200
  },
  "desenvolvimento": {
   "id": "desenvolvimento",
   "sigla": "DEV",
   "nome": "Desenvolvimento de Software",
   "curto": "Desenvolvimento",
   "chapa": "#8F9CF4",
   "selo": "Selo do Commit",
   "banco": 200
  },
  "redes": {
   "id": "redes",
   "sigla": "RD",
   "nome": "Redes e Infraestrutura",
   "curto": "Redes",
   "chapa": "#45BCCB",
   "selo": "Selo do Protocolo",
   "banco": 200
  },
  "seguranca": {
   "id": "seguranca",
   "sigla": "SI",
   "nome": "Segurança da Informação",
   "curto": "Segurança",
   "chapa": "#86CC6A",
   "selo": "Selo do Hash",
   "banco": 200
  },
  "governanca": {
   "id": "governanca",
   "sigla": "GOV",
   "nome": "Governança de TI",
   "curto": "Governança",
   "chapa": "#F0A94E",
   "selo": "Selo do SLA",
   "banco": 200
  }
 },
 "roletas": {
  "geral": [
   "portugues",
   "rlm",
   "informatica",
   "constitucional",
   "administrativo",
   "penal"
  ],
  "saude": [
   "portugues",
   "rlm",
   "informatica",
   "sus",
   "vigilancia",
   "enfermagem"
  ],
  "ti": [
   "portugues",
   "dados",
   "desenvolvimento",
   "redes",
   "seguranca",
   "governanca"
  ]
 },
 "rotulos": {
  "geral": "Conhecimentos gerais",
  "saude": "Saúde",
  "ti": "Tecnologia da Informação"
 },
 "numeros": {
  "questoes": 2425,
  "materias": 14,
  "concursos": 65,
  "cargos": 212
 },
 "diarios": {
  "geral": {
   "numero": 25,
   "materias": [
    "rlm",
    "constitucional",
    "penal",
    "administrativo",
    "portugues"
   ]
  },
  "saude": {
   "numero": 25,
   "materias": [
    "rlm",
    "vigilancia",
    "informatica",
    "enfermagem",
    "portugues"
   ]
  },
  "ti": {
   "numero": 25,
   "materias": [
    "redes",
    "seguranca",
    "governanca",
    "portugues",
    "desenvolvimento"
   ]
  }
 },
 "cargos": [
  {
   "sigla": "BCB",
   "cargo": "Auditor do BCB, Economia e Finanças",
   "banca": "Cebraspe",
   "formato": "120 itens de Certo ou Errado",
   "nota": "no Cebraspe, um item errado anula um certo.",
   "materias": [
    {
     "nome": "Língua Portuguesa",
     "chapa": "#EF86A9",
     "semQuestoes": false,
     "itens": 25,
     "pct": 21
    },
    {
     "nome": "Noções de Lógica e Estatística",
     "chapa": "#A68CEA",
     "semQuestoes": false,
     "itens": 10,
     "pct": 8
    },
    {
     "nome": "Direito Administrativo",
     "chapa": "#9BCB62",
     "semQuestoes": false,
     "itens": 5,
     "pct": 4
    },
    {
     "nome": "Fundamentos de Macroeconomia e Microeconomia",
     "chapa": "rgba(22,22,27,0.32)",
     "semQuestoes": true,
     "itens": 10,
     "pct": 8
    },
    {
     "nome": "Macroeconomia",
     "chapa": "rgba(22,22,27,0.32)",
     "semQuestoes": true,
     "itens": 18,
     "pct": 15
    },
    {
     "nome": "Microeconomia",
     "chapa": "rgba(22,22,27,0.32)",
     "semQuestoes": true,
     "itens": 10,
     "pct": 8
    },
    {
     "nome": "Finanças",
     "chapa": "rgba(22,22,27,0.32)",
     "semQuestoes": true,
     "itens": 18,
     "pct": 15
    },
    {
     "nome": "Estatística e Econometria",
     "chapa": "rgba(22,22,27,0.32)",
     "semQuestoes": true,
     "itens": 12,
     "pct": 10
    },
    {
     "nome": "Contabilidade de Instituições Financeiras (COSIF)",
     "chapa": "rgba(22,22,27,0.32)",
     "semQuestoes": true,
     "itens": 12,
     "pct": 10
    }
   ]
  },
  {
   "sigla": "IBGE",
   "cargo": "Agente de Pesquisas e Mapeamento (PSS 2025)",
   "banca": "FGV",
   "formato": "60 questões de A a E",
   "nota": null,
   "materias": [
    {
     "nome": "Língua Portuguesa",
     "chapa": "#EF86A9",
     "semQuestoes": false,
     "itens": 20,
     "pct": 33
    },
    {
     "nome": "Geografia",
     "chapa": "rgba(22,22,27,0.32)",
     "semQuestoes": true,
     "itens": 15,
     "pct": 25
    },
    {
     "nome": "Raciocínio Lógico Matemático",
     "chapa": "#A68CEA",
     "semQuestoes": false,
     "itens": 15,
     "pct": 25
    },
    {
     "nome": "Noções de Informática",
     "chapa": "#7FA6F2",
     "semQuestoes": false,
     "itens": 5,
     "pct": 8
    },
    {
     "nome": "Ética no Serviço Público",
     "chapa": "rgba(22,22,27,0.32)",
     "semQuestoes": true,
     "itens": 5,
     "pct": 8
    }
   ]
  },
  {
   "sigla": "CIAAR",
   "cargo": "CAMAR, CADAR e CAFAR, Médicos, Dentistas e Farmacêuticos (1º Tenente)",
   "banca": "Aeronáutica",
   "formato": "60 questões de A a D",
   "nota": "o treino usa as de A a E do Nomeou.",
   "materias": [
    {
     "nome": "Gramática e Interpretação de Texto",
     "chapa": "#EF86A9",
     "semQuestoes": false,
     "itens": 30,
     "pct": 50
    },
    {
     "nome": "Conhecimentos Especializados da especialidade",
     "chapa": "rgba(22,22,27,0.32)",
     "semQuestoes": true,
     "itens": 30,
     "pct": 50
    }
   ]
  }
 ]
};
