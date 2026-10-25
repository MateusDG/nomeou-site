// O disco do sorteio da matéria, desenhado como no app (turno-concurso/src/components/Roleta.tsx e
// ritmoRoleta.ts): a rosca impressa e PARADA, a chapa de cada matéria só na coroa, a sigla de pé, a
// Convocação em papel com hachura (a casa menor, 10%) e a caneta azul presa no pivô pela bolinha da
// marca. Só a caneta gira. Script clássico: roda no navegador (window.Disco) e no Node (globalThis).
(function (raiz) {
  'use strict';

  var CORES = {
    folha: '#FAF8F3',
    tinta: '#16161B',
    caneta: '#2346C8',
    canetaFundo: '#1A3596',
    sombra: 'rgba(22,22,27,0.14)',
    miolo: 'rgba(22,22,27,0.16)',
    hachura: 'rgba(22,22,27,0.22)',
    aro: 'rgba(22,22,27,0.42)',
    sombraDaCaneta: 'rgba(22,22,27,0.22)',
    luzDoPivo: 'rgba(250,248,243,0.35)',
  };

  /** Medidas em fração do raio R (ou do diâmetro D, onde diz), as mesmas do app (GEOMETRIA). */
  var G = {
    coroa: 0.64,
    miolo: 0.16,
    sigla: 0.82,
    corpoDaSigla: 0.1,
    pivo: 0.065,
    bolinha: 0.024,
    apagar: 0.075,
    larguraDaCaneta: 0.052,
    cone: 0.47,
    ponta: 0.6,
    cauda: 0.2,
  };

  /** As chances do sorteio (game/sorteio.ts): 6 matérias de 15% e a Convocação, a menor, de 10%. */
  var CHANCES = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.1];
  var D = 300;
  var R = D / 2;
  var C = R;
  var CONVOCACAO = 6;

  var P = function (n) {
    return Math.round(n * 10) / 10;
  };

  /** O ponto no raio r e no ângulo a (0 no alto, sentido horário). */
  function polar(r, a) {
    var t = (a * Math.PI) / 180;
    return [C + r * Math.sin(t), C - r * Math.cos(t)];
  }

  /** O setor de anel entre os raios r1 < r2 e os ângulos a1 < a2. */
  function arcoAnel(r1, r2, a1, a2) {
    var p1 = polar(r2, a1);
    var p2 = polar(r2, a2);
    var p3 = polar(r1, a2);
    var p4 = polar(r1, a1);
    var g = a2 - a1 > 180 ? 1 : 0;
    return (
      'M' + P(p1[0]) + ',' + P(p1[1]) + ' A' + P(r2) + ',' + P(r2) + ' 0 ' + g + ' 1 ' + P(p2[0]) + ',' + P(p2[1]) +
      ' L' + P(p3[0]) + ',' + P(p3[1]) + ' A' + P(r1) + ',' + P(r1) + ' 0 ' + g + ' 0 ' + P(p4[0]) + ',' + P(p4[1]) + 'Z'
    );
  }

  /** As casas, cada uma do tamanho da sua chance, com a 1ª centrada no alto (casasDoDisco). */
  var CASAS = (function () {
    var inicio = -180 * CHANCES[0];
    return CHANCES.map(function (p) {
      var fim = inicio + 360 * p;
      var casa = { inicio: inicio, fim: fim, centro: (inicio + fim) / 2 };
      inicio = fim;
      return casa;
    });
  })();

  function hachura() {
    var d = '';
    for (var t = -D; t <= D; t += 5.5) d += 'M' + t.toFixed(1) + ',0 L' + (t + D).toFixed(1) + ',' + D + ' ';
    return d;
  }

  /** O envelope da Convocação, em traço de tinta (o ícone de carta do app), centrado em (x, y). */
  function envelope(x, y) {
    var w = 22;
    var h = 15;
    var x0 = P(x - w / 2);
    var y0 = P(y - h / 2);
    return (
      '<g class="disco__casa disco__envelope" style="--i:6" fill="' + CORES.folha + '" stroke="' + CORES.tinta + '" stroke-width="1.6" stroke-linejoin="round">' +
      '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="1"/>' +
      '<path fill="none" d="M' + x0 + ',' + y0 + ' L' + P(x) + ',' + P(y + 1.5) + ' L' + P(x0 + w) + ',' + y0 + '"/></g>'
    );
  }

  /** A caneta azul do app apontando para o alto (CanetaDesenhada), com a sombra em tinta a 22%. */
  function caneta(sombra) {
    var w = G.larguraDaCaneta * D;
    var ponta = G.ponta * R;
    var cone = G.cone * R;
    var cauda = G.cauda * R;
    var corpo = sombra ? CORES.sombraDaCaneta : CORES.caneta;
    var bico = sombra ? CORES.sombraDaCaneta : CORES.tinta;
    var s =
      '<rect x="' + P(C - w / 2) + '" y="' + P(C - cone) + '" width="' + P(w) + '" height="' + P(cone + cauda) + '" rx="' + P(w / 2.4) + '" fill="' + corpo + '"/>' +
      '<path d="M' + P(C - w / 2) + ',' + P(C - cone + 1) + ' L' + P(C - 1.4) + ',' + P(C - ponta + 2) + ' L' + P(C + 1.4) + ',' + P(C - ponta + 2) + ' L' + P(C + w / 2) + ',' + P(C - cone + 1) + 'Z" fill="' + bico + '"/>';
    if (!sombra) {
      s +=
        '<circle cx="' + C + '" cy="' + P(C - ponta + 1.6) + '" r="1.7" fill="' + CORES.tinta + '"/>' +
        '<rect x="' + P(C - w / 2) + '" y="' + P(C + cauda - 6) + '" width="' + P(w) + '" height="7" rx="' + P(w / 2.4) + '" fill="' + CORES.canetaFundo + '"/>' +
        '<rect x="' + P(C + w * 0.12) + '" y="' + P(C - cone * 0.55) + '" width="1.6" height="' + P(cone * 0.55 + cauda - 9) + '" rx="0.8" fill="' + CORES.folha + '" opacity="0.55"/>' +
        '<circle cx="' + C + '" cy="' + C + '" r="' + P(G.bolinha * D) + '" fill="' + CORES.caneta + '" stroke="' + CORES.tinta + '" stroke-width="2"/>';
    }
    return s;
  }

  /**
   * A caixa em volta da sigla (ou do envelope) da casa `i`, onde a caneta circula: o círculo à mão
   * (rabisco.circular) nasce nesta caixa, com a origem no canto de cima à esquerda.
   */
  function caixaDaCasa(i, materias) {
    var centro = polar(G.sigla * R, CASAS[i].centro);
    var largura = i === CONVOCACAO ? 34 : Math.max(30, materias[i].sigla.length * 13 + 12);
    var altura = i === CONVOCACAO ? 26 : 36;
    return { x: centro[0] - largura / 2, y: centro[1] - altura / 2 - (i === CONVOCACAO ? 0 : 1), largura: largura, altura: altura };
  }

  /**
   * As camadas da revelação da casa `i`: a casa que se pinta inteira (do miolo à borda; a Convocação
   * continua papel com hachura), o véu de folha sobre as outras e o círculo de caneta (`gesto`, de
   * rabisco.circular, com pathLength 1 para o traço correr por strokeDashoffset).
   */
  function camadas(i, materias, gesto) {
    var r1 = G.apagar * D;
    var pintar = i === CONVOCACAO ? '' : '<path d="' + arcoAnel(r1, R, CASAS[i].inicio, CASAS[i].fim) + '" fill="' + materias[i].chapa + '"/>';
    var apagar = CASAS.map(function (c, j) {
      return j === i ? '' : '<path d="' + arcoAnel(r1, R, c.inicio, c.fim) + '"/>';
    }).join('');
    var caixa = caixaDaCasa(i, materias);
    var circulo = gesto
      ? gesto.tracos
          .map(function (d) {
            return '<path d="' + d + '" pathLength="1" stroke-width="2.4"/>';
          })
          .join('')
      : '';
    return { pintar: pintar, apagar: apagar, circulo: circulo, transform: 'translate(' + P(caixa.x) + ' ' + P(caixa.y) + ')' };
  }

  /**
   * O disco inteiro, em SVG. `materias`: as 6 da roleta, na ordem do disco ({ sigla, nome, chapa }).
   * Com `opcoes.revelada` (o índice da casa) e `opcoes.gesto` (o círculo), já sai revelado: é o
   * estado parado que a página mostra sem script e com "reduzir movimento".
   * Classes que o site anima: .disco__base, .disco__casa (com --i, em sentido horário a partir de PT),
   * .disco__pintar, .disco__apagar, .disco__circulo, .disco__caneta e .disco__sombra.
   */
  function svg(materias, opcoes) {
    opcoes = opcoes || {};
    var id = opcoes.id || 'disco';
    var angulo = typeof opcoes.angulo === 'number' ? opcoes.angulo : 0.5 * 360 * CHANCES[0];
    var coroa = G.coroa * R;
    var corpo = G.corpoDaSigla * D;
    var conv = CASAS[CONVOCACAO];
    var revelada = typeof opcoes.revelada === 'number' ? camadas(opcoes.revelada, materias, opcoes.gesto) : null;
    var nomes = materias
      .map(function (m) {
        return m.nome;
      })
      .join(', ');
    var s =
      '<svg class="disco" viewBox="-3 -3 307 307" role="img" aria-label="Sorteio da matéria. Sete casas: ' + nomes +
      ' e a Convocação. Cada matéria vale 15%; a convocação, 10%.">' +
      '<defs><clipPath id="' + id + '-conv"><path d="' + arcoAnel(coroa, R, conv.inicio, conv.fim) + '"/></clipPath></defs>' +
      '<g class="disco__base">' +
      '<circle cx="' + (C + 1.5) + '" cy="' + (C + 2) + '" r="' + R + '" fill="' + CORES.sombra + '"/>' +
      '<circle cx="' + C + '" cy="' + C + '" r="' + R + '" fill="' + CORES.folha + '"/></g>';
    // A coroa: a chapa de cada matéria, que se imprime casa por casa.
    materias.forEach(function (m, i) {
      s += '<path class="disco__casa" style="--i:' + i + '" d="' + arcoAnel(coroa, R, CASAS[i].inicio, CASAS[i].fim) + '" fill="' + m.chapa + '"/>';
    });
    // A Convocação: papel com hachura de 45°, sem amarelo, kraft ou dourado.
    s += '<g class="disco__casa" style="--i:6" clip-path="url(#' + id + '-conv)"><path d="' + hachura() + '" stroke="' + CORES.hachura + '" stroke-width="0.8"/></g>';
    s += '<g class="disco__pintar">' + (revelada ? revelada.pintar : '') + '</g>';
    // As divisórias: o vão de papel entre as chapas e o fio fino do miolo.
    s += '<g class="disco__base">';
    CASAS.forEach(function (casa) {
      var a = casa.fim;
      var p0 = polar(G.miolo * R, a);
      var p1 = polar(coroa, a);
      var p2 = polar(R, a);
      s +=
        '<line x1="' + P(p1[0]) + '" y1="' + P(p1[1]) + '" x2="' + P(p2[0]) + '" y2="' + P(p2[1]) + '" stroke="' + CORES.folha + '" stroke-width="2.6"/>' +
        '<line x1="' + P(p0[0]) + '" y1="' + P(p0[1]) + '" x2="' + P(p1[0]) + '" y2="' + P(p1[1]) + '" stroke="' + CORES.miolo + '" stroke-width="1"/>';
    });
    s +=
      '<circle cx="' + C + '" cy="' + C + '" r="' + P(coroa) + '" fill="none" stroke="' + CORES.aro + '" stroke-width="1"/>' +
      '<circle cx="' + C + '" cy="' + C + '" r="' + (R - 1) + '" fill="none" stroke="' + CORES.tinta + '" stroke-width="2"/></g>';
    // As siglas, de pé, em tinta (o papel não gira).
    materias.forEach(function (m, i) {
      var p = polar(G.sigla * R, CASAS[i].centro);
      s +=
        '<text class="disco__casa disco__sigla" style="--i:' + i + '" x="' + P(p[0]) + '" y="' + P(p[1] + corpo * 0.36) +
        '" text-anchor="middle" font-family="League Gothic, \'Arial Narrow\', sans-serif" font-size="' + corpo + '" letter-spacing="0.5" fill="' + CORES.tinta + '">' + m.sigla + '</text>';
    });
    var pe = polar(G.sigla * R, conv.centro);
    s += envelope(pe[0], pe[1]);
    s += '<g class="disco__apagar" fill="' + CORES.folha + '" opacity="' + (revelada ? '0.6' : '0') + '">' + (revelada ? revelada.apagar : '') + '</g>';
    s +=
      '<g class="disco__circulo" fill="none" stroke="' + CORES.caneta + '" stroke-linecap="round" stroke-linejoin="round"' +
      (revelada ? ' transform="' + revelada.transform + '"' : '') + '>' + (revelada ? revelada.circulo : '') + '</g>';
    // O pivô: o disco de tinta e a bolinha da marca.
    s +=
      '<g class="disco__base"><circle cx="' + C + '" cy="' + C + '" r="' + P(G.pivo * D) + '" fill="' + CORES.tinta + '"/>' +
      '<circle cx="' + C + '" cy="' + C + '" r="' + P(G.pivo * D - 3) + '" fill="none" stroke="' + CORES.luzDoPivo + '" stroke-width="1"/></g>';
    s += '<g class="disco__sombra" transform="translate(1.5 2) rotate(' + P(angulo) + ' ' + C + ' ' + C + ')">' + caneta(true) + '</g>';
    s += '<g class="disco__caneta" transform="rotate(' + P(angulo) + ' ' + C + ' ' + C + ')">' + caneta(false) + '</g>';
    s += '</svg>';
    return s;
  }

  raiz.Disco = {
    svg: svg,
    camadas: camadas,
    caixaDaCasa: caixaDaCasa,
    CASAS: CASAS,
    CHANCES: CHANCES,
    CONVOCACAO: CONVOCACAO,
    G: G,
    D: D,
    R: R,
    polar: polar,
    arcoAnel: arcoAnel,
  };
})(typeof window !== 'undefined' ? window : globalThis);
