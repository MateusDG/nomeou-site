// O que o dono do site muda à mão.
export const CONFIG = {
  /** Os links das lojas. Só valem os que começam com https://apps.apple.com/ e https://play.google.com/. */
  lojas: {
    ios: '', // https://apps.apple.com/br/app/...
    android: '', // https://play.google.com/store/apps/details?id=...
  },
  /** true: o envelope de amostra abre sem 3 acertos. false: só com 3 acertos na 2ª etapa. */
  convocacaoLivre: true,
  /** true: a faixa deixa escolher a área (Conhecimentos gerais, Saúde, TI). */
  areas: true,
};
